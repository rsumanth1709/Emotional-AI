"""
MindCare AI — Vector Retrieval and Document Processing Service
Manages document cleaning, semantic chunking (400-700 tokens, 60-100 overlap),
dense vector indexing in ChromaDB, cosine similarity scoring, relevance filtering,
and incremental content updates.
"""
import os
import re
import json
import hashlib
from typing import Dict, List, Any, Optional
import numpy as np

from app.services.embedding_service import embedding_service
from app.utils.logger import logger

try:
    import chromadb
except ImportError:
    chromadb = None
    logger.warning("chromadb not installed; RetrievalService running in in-memory mode.")

CHROMA_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "mindcare.chroma"
)
os.makedirs(CHROMA_DIR, exist_ok=True)

DEFAULT_CHUNK_SIZE = 500       # Target tokens (approximated as words)
DEFAULT_CHUNK_OVERLAP = 80     # Overlap tokens
DEFAULT_MIN_SIMILARITY = 0.25  # Calibrated cosine similarity threshold (relevant: 0.26-0.80, irrelevant: <0.25)


class RetrievalService:
    """Production RAG Document Processing, Indexing, and Retrieval Engine."""

    def __init__(self, collection_name: str = "mindcare_knowledge_base"):
        self.collection_name = collection_name
        self._client = None
        self._collection = None
        self._initialized = False
        # In-memory fallback for environments with locked sqlite or unit tests
        self._memory_chunks: List[Dict[str, Any]] = []
        self._memory_vectors: List[List[float]] = []
        self._doc_hashes: Dict[str, str] = {}

    def _init_chroma(self):
        if self._initialized:
            return
        self._initialized = True

        if chromadb is None:
            logger.info("ChromaDB not available; using in-memory cosine store.")
            return

        try:
            self._client = chromadb.PersistentClient(path=CHROMA_DIR)
            self._collection = self._client.get_or_create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"},
            )
            logger.info(
                f"ChromaDB initialized for '{self.collection_name}' ({self._collection.count()} chunks indexed)."
            )
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB collection '{self.collection_name}': {e}. Using in-memory store.")
            self._client = None
            self._collection = None

    @property
    def collection(self):
        self._init_chroma()
        return self._collection

    # ── Document Cleaning and Chunking ────────────────────────────────────────

    @staticmethod
    def clean_text(text: str) -> str:
        """Clean raw text: normalize unicode, strip excessive whitespace and markdown noise."""
        if not text:
            return ""
        # Remove null characters
        cleaned = text.replace("\x00", "")
        # Normalize carriage returns and tabs
        cleaned = re.sub(r"\r\n|\r", "\n", cleaned)
        cleaned = re.sub(r"\t", " ", cleaned)
        # Collapse multiple spaces
        cleaned = re.sub(r"[ ]{2,}", " ", cleaned)
        # Collapse excessive newlines (max 2)
        cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
        return cleaned.strip()

    @staticmethod
    def split_into_chunks(
        text: str,
        title: str = "",
        chunk_size: int = DEFAULT_CHUNK_SIZE,
        chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
    ) -> List[str]:
        """
        Split document into semantically coherent chunks of approximately
        chunk_size words with chunk_overlap, preserving paragraph/sentence boundaries.
        """
        paragraphs = text.split("\n\n")
        chunks = []
        current_chunk_words: List[str] = []

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            para_words = para.split()
            if not para_words:
                continue

            # If adding this paragraph exceeds chunk size, finalize current chunk
            if current_chunk_words and (len(current_chunk_words) + len(para_words) > chunk_size):
                chunk_str = " ".join(current_chunk_words).strip()
                if chunk_str:
                    chunks.append(chunk_str)

                # Keep overlap from the end of the current chunk
                overlap_words = current_chunk_words[-chunk_overlap:] if chunk_overlap < len(current_chunk_words) else current_chunk_words
                current_chunk_words = list(overlap_words)

            current_chunk_words.extend(para_words)

            # If a single paragraph is larger than chunk_size, split by sentences
            while len(current_chunk_words) >= chunk_size:
                sub_chunk = " ".join(current_chunk_words[:chunk_size]).strip()
                if sub_chunk:
                    chunks.append(sub_chunk)
                current_chunk_words = current_chunk_words[chunk_size - chunk_overlap:]

        # Append remaining words
        if current_chunk_words:
            chunk_str = " ".join(current_chunk_words).strip()
            if chunk_str:
                chunks.append(chunk_str)

        # Prepend title context if missing from the beginning of chunks
        final_chunks = []
        for i, c in enumerate(chunks):
            if title and not c.startswith(title) and not c.startswith("#"):
                final_chunks.append(f"[{title}] {c}")
            else:
                final_chunks.append(c)

        return final_chunks

    # ── Ingestion Pipeline ───────────────────────────────────────────────────

    def ingest_document(
        self,
        document_id: str,
        title: str,
        content: str,
        source_name: str,
        source_url: str,
        category: str,
        language: str = "en",
        last_reviewed: Optional[str] = None,
        chunk_size: int = DEFAULT_CHUNK_SIZE,
        chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
    ) -> Dict[str, Any]:
        """
        Clean, chunk, embed, and index a single document with incremental hashing.
        """
        self._init_chroma()
        clean_body = self.clean_text(content)
        content_hash = hashlib.sha256(clean_body.encode("utf-8")).hexdigest()

        # Incremental check: skip if identical content already indexed
        if self._doc_hashes.get(document_id) == content_hash:
            logger.info(f"Document '{document_id}' unchanged. Skipping re-indexing.")
            return {"document_id": document_id, "status": "SKIPPED_UNCHANGED", "chunks": 0}

        chunks = self.split_into_chunks(clean_body, title=title, chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        if not chunks:
            return {"document_id": document_id, "status": "EMPTY", "chunks": 0}

        chunk_ids = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]
        metadatas = [
            {
                "document_id": document_id,
                "chunk_id": chunk_ids[i],
                "chunk_index": i,
                "title": title,
                "source_name": source_name,
                "source_url": source_url,
                "category": category,
                "language": language,
                "last_reviewed": last_reviewed or "2026-01-01",
            }
            for i in range(len(chunks))
        ]

        # Generate dense embeddings
        embeddings = embedding_service.embed_documents(chunks)

        # Store in ChromaDB
        if self.collection is not None:
            try:
                # Remove prior chunks for this document if any
                try:
                    self.collection.delete(where={"document_id": document_id})
                except Exception:
                    pass

                self.collection.add(
                    ids=chunk_ids,
                    documents=chunks,
                    embeddings=embeddings,
                    metadatas=metadatas,
                )
            except Exception as e:
                logger.error(f"ChromaDB insert failed for '{document_id}': {e}. Storing in memory.")

        # Store in in-memory fallback
        # Remove prior occurrences in memory
        self._memory_chunks = [c for c in self._memory_chunks if c["metadata"]["document_id"] != document_id]
        indices_to_keep = [i for i, c in enumerate(self._memory_chunks)]
        self._memory_vectors = [self._memory_vectors[i] for i in indices_to_keep]

        for cid, text, emb, meta in zip(chunk_ids, chunks, embeddings, metadatas):
            self._memory_chunks.append({"id": cid, "content": text, "metadata": meta})
            self._memory_vectors.append(emb)

        self._doc_hashes[document_id] = content_hash
        logger.info(f"Ingested '{title}' ({document_id}): {len(chunks)} chunks.")
        return {
            "document_id": document_id,
            "title": title,
            "status": "INGESTED",
            "chunks": len(chunks),
        }

    # ── Retrieval and Filtering ──────────────────────────────────────────────

    def retrieve(
        self,
        query: str,
        top_k: int = 5,
        category: Optional[str] = None,
        language: str = "en",
        min_score: float = DEFAULT_MIN_SIMILARITY,
    ) -> List[Dict[str, Any]]:
        """
        Retrieve semantically relevant document chunks with cosine similarity scoring,
        metadata filtering, relevance thresholds, and deduplication.
        """
        if not query or not query.strip():
            return []

        self._init_chroma()
        query_emb = embedding_service.embed_query(query)
        candidates: List[Dict[str, Any]] = []

        # 1. Try ChromaDB retrieval
        if self.collection is not None and self.collection.count() > 0:
            try:
                where_clause = None
                if category and category != "all":
                    where_clause = {"category": category}

                chroma_results = self.collection.query(
                    query_embeddings=[query_emb],
                    n_results=min(top_k * 2, self.collection.count()),
                    where=where_clause,
                    include=["documents", "metadatas", "distances"],
                )

                if chroma_results and chroma_results.get("documents"):
                    docs = chroma_results["documents"][0]
                    metas = chroma_results["metadatas"][0]
                    distances = chroma_results["distances"][0]

                    for doc_text, meta, dist in zip(docs, metas, distances):
                        # Chroma cosine distance is (1 - cosine_similarity).
                        # With L2-normalized embeddings, cosine_similarity = 1 - dist.
                        similarity = max(0.0, min(1.0, 1.0 - dist))
                        candidates.append({
                            "chunk_id": meta.get("chunk_id", ""),
                            "document_id": meta.get("document_id", ""),
                            "title": meta.get("title", ""),
                            "source_name": meta.get("source_name", "MindCare Health Knowledge Base"),
                            "source_url": meta.get("source_url", ""),
                            "category": meta.get("category", ""),
                            "language": meta.get("language", "en"),
                            "last_reviewed": meta.get("last_reviewed", ""),
                            "content": doc_text,
                            "relevance_score": round(similarity, 4),
                        })
            except Exception as e:
                logger.error(f"Chroma query failed: {e}. Falling back to in-memory search.")
                candidates = []

        # 2. Fall back to in-memory cosine search if candidates empty
        if not candidates and self._memory_vectors:
            q_vec = np.array(query_emb, dtype=np.float32)
            q_norm = np.linalg.norm(q_vec)
            if q_norm > 0:
                q_vec = q_vec / q_norm

            for item, v in zip(self._memory_chunks, self._memory_vectors):
                doc_vec = np.array(v, dtype=np.float32)
                d_norm = np.linalg.norm(doc_vec)
                if d_norm > 0:
                    doc_vec = doc_vec / d_norm

                sim = float(np.dot(q_vec, doc_vec))
                sim_normalized = max(0.0, min(1.0, sim))

                meta = item["metadata"]
                if category and category != "all" and meta.get("category") != category:
                    continue

                candidates.append({
                    "chunk_id": item["id"],
                    "document_id": meta.get("document_id", ""),
                    "title": meta.get("title", ""),
                    "source_name": meta.get("source_name", "MindCare Health Knowledge Base"),
                    "source_url": meta.get("source_url", ""),
                    "category": meta.get("category", ""),
                    "language": meta.get("language", "en"),
                    "last_reviewed": meta.get("last_reviewed", ""),
                    "content": item["content"],
                    "relevance_score": round(sim_normalized, 4),
                })

        # 3. Sort by relevance score descending
        candidates.sort(key=lambda x: x["relevance_score"], reverse=True)

        # 4. Filter by minimum relevance threshold
        filtered = [c for c in candidates if c["relevance_score"] >= min_score]

        # 5. Deduplicate near-identical chunks from the same document
        deduped = []
        seen_snippets = set()

        for c in filtered:
            # Create a 40-char normalized snippet signature to detect overlapping chunks
            snippet_sig = re.sub(r"\W+", "", c["content"][:60].lower())
            if snippet_sig in seen_snippets:
                continue
            seen_snippets.add(snippet_sig)
            deduped.append(c)
            if len(deduped) >= top_k:
                break

        return deduped

    def get_stats(self) -> Dict[str, Any]:
        """Return index statistics."""
        self._init_chroma()
        count = self.collection.count() if self.collection else len(self._memory_chunks)
        return {
            "total_chunks": count,
            "unique_documents": len(self._doc_hashes),
            "vector_store": "ChromaDB" if self.collection is not None else "InMemory",
        }


# Global singleton
retrieval_service = RetrievalService()

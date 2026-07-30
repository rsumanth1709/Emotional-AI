"""
MindCare AI — Memory Service
Handles long-term context using ChromaDB and SentenceTransformers.
"""
import os
import uuid
from typing import List, Dict, Optional
from datetime import datetime

from app.utils.logger import logger
from app.config import settings

try:
    import chromadb
except ImportError:  # pragma: no cover - optional dependency
    chromadb = None
    logger.warning("chromadb is not installed; memory features will be disabled")

try:
    from sentence_transformers import SentenceTransformer
except ImportError:  # pragma: no cover - optional dependency
    SentenceTransformer = None
    logger.warning("sentence-transformers is not installed; memory features will be disabled")

# Initialize ChromaDB client
# Store data persistently in a directory
CHROMA_DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "mindcare.chroma")
os.makedirs(CHROMA_DB_DIR, exist_ok=True)

class MemoryService:
    def __init__(self):
        self._fallback_memories: List[Dict] = []  # Fallback memory store when chromadb/ST unavailable

        if chromadb is None or SentenceTransformer is None:
            logger.warning("MemoryService running in lightweight fallback mode (in-memory keyword index).")
            self.client = None
            self.collection = None
            self.embedder = None
            return

        try:
            # We use local persistent ChromaDB
            self.client = chromadb.PersistentClient(path=CHROMA_DB_DIR)
            # Create or get a collection for conversation memory
            self.collection = self.client.get_or_create_collection(
                name="user_memory",
                metadata={"hnsw:space": "cosine"}
            )
            # Load the embedding model
            logger.info("Loading SentenceTransformer model for MemoryService...")
            self.embedder = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("MemoryService initialized successfully with ChromaDB + SentenceTransformers.")
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB/SentenceTransformers: {e}. Falling back to in-memory mode.")
            self.client = None
            self.collection = None
            self.embedder = None

    def add_memory(self, user_id: str, session_id: str, role: str, content: str, memory_type: str = "message"):
        """
        Embed and store a piece of context (message or summary) in ChromaDB or fallback store.
        """
        if not content or len(content.strip()) < 2:
            return None

        memory_id = str(uuid.uuid4())
        created_at = datetime.utcnow().isoformat()

        if not self.collection or not self.embedder:
            # Lightweight in-memory fallback
            mem_item = {
                "id": memory_id,
                "user_id": user_id,
                "session_id": session_id,
                "role": role,
                "type": memory_type,
                "content": content,
                "created_at": created_at,
            }
            self._fallback_memories.append(mem_item)
            logger.debug(f"Added fallback memory {memory_id} for user {user_id}")
            return memory_id

        text_to_embed = f"{role}: {content}"
        try:
            embedding = self.embedder.encode(text_to_embed).tolist()
            
            self.collection.add(
                ids=[memory_id],
                embeddings=[embedding],
                metadatas=[{
                    "user_id": user_id,
                    "session_id": session_id,
                    "role": role,
                    "type": memory_type,
                    "created_at": created_at
                }],
                documents=[content]
            )
            logger.debug(f"Added memory {memory_id} for user {user_id}")
            return memory_id
        except Exception as e:
            logger.error(f"Error adding memory for user {user_id}: {e}")
            return None

    def retrieve_relevant_memory(self, user_id: str, query: str, top_k: int = 5) -> List[Dict]:
        """
        Retrieve top_k most relevant past memories for a user given a query.
        """
        if not self.collection or not self.embedder:
            # Fallback keyword overlap retriever
            query_words = set(query.lower().split())
            user_mems = [m for m in self._fallback_memories if m.get("user_id") == user_id]
            
            scored = []
            for m in user_mems:
                doc_words = set(m.get("content", "").lower().split())
                overlap = len(query_words.intersection(doc_words))
                scored.append((overlap, m))
            
            scored.sort(key=lambda x: x[0], reverse=True)
            results = [item[1] for item in scored[:top_k] if item[0] > 0]
            if not results:
                results = user_mems[-top_k:]  # return recent as fallback
            return results

        try:
            query_embedding = self.embedder.encode(query).tolist()
            
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where={"user_id": user_id}
            )
            
            memories = []
            if results["documents"] and results["documents"][0]:
                docs = results["documents"][0]
                metas = results["metadatas"][0]
                ids = results["ids"][0]
                
                for doc, meta, mem_id in zip(docs, metas, ids):
                    memories.append({
                        "id": mem_id,
                        "content": doc,
                        "role": meta.get("role", "unknown"),
                        "type": meta.get("type", "message"),
                        "session_id": meta.get("session_id", ""),
                        "created_at": meta.get("created_at", "")
                    })
                    
            # Sort chronologically by created_at
            memories.sort(key=lambda x: x["created_at"])
            return memories
        except Exception as e:
            logger.error(f"Error retrieving memory for user {user_id}: {e}")
            return []

    def get_all_memories(self, user_id: str) -> List[Dict]:
        """Retrieve all memories for a user, useful for the dashboard."""
        if not self.collection:
            return sorted(
                [m for m in self._fallback_memories if m.get("user_id") == user_id],
                key=lambda x: x["created_at"],
                reverse=True
            )
            
        try:
            results = self.collection.get(
                where={"user_id": user_id}
            )
            memories = []
            if results["documents"]:
                for doc, meta, mem_id in zip(results["documents"], results["metadatas"], results["ids"]):
                    memories.append({
                        "id": mem_id,
                        "content": doc,
                        "role": meta.get("role", "unknown"),
                        "type": meta.get("type", "message"),
                        "session_id": meta.get("session_id", ""),
                        "created_at": meta.get("created_at", "")
                    })
            # Sort newest first for dashboard
            memories.sort(key=lambda x: x["created_at"], reverse=True)
            return memories
        except Exception as e:
            logger.error(f"Error fetching all memories for user {user_id}: {e}")
            return []

    def delete_memory(self, user_id: str, memory_id: Optional[str] = None) -> bool:
        """
        Delete a specific memory or all memories for a user.
        """
        if not self.collection:
            if memory_id:
                self._fallback_memories = [m for m in self._fallback_memories if not (m.get("user_id") == user_id and m.get("id") == memory_id)]
            else:
                self._fallback_memories = [m for m in self._fallback_memories if m.get("user_id") != user_id]
            return True
            
        try:
            where_clause = {"user_id": user_id}
            if memory_id:
                self.collection.delete(
                    ids=[memory_id],
                    where=where_clause
                )
            else:
                self.collection.delete(
                    where=where_clause
                )
            return True
        except Exception as e:
            logger.error(f"Error deleting memory for user {user_id}: {e}")
            return False

# Module-level singleton
memory_service = MemoryService()

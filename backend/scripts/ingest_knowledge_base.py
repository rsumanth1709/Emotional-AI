"""
MindCare AI — Knowledge Base Ingestion Script
Loads approved markdown, text, and PDF documents from backend/data/knowledge_base/,
cleans text, generates semantic chunks with dense embeddings, and stores records
in both SQLite (relational) and ChromaDB (vector store).
"""
import os
import sys
import glob
import re
from datetime import datetime

# Add backend directory to sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.database import SessionLocal, engine, Base
from app.models.rag import TrustedSource, KnowledgeDocument, KnowledgeChunk
from app.services.retrieval_service import retrieval_service
from app.utils.logger import logger

KB_DIR = os.path.join(BACKEND_DIR, "data", "knowledge_base")


def parse_frontmatter(file_content: str):
    """Extract YAML-like frontmatter between --- delimiters."""
    meta = {}
    content = file_content
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", file_content, re.DOTALL)
    if match:
        raw_meta = match.group(1)
        content = match.group(2)
        for line in raw_meta.split("\n"):
            line = line.strip()
            if ":" in line:
                key, val = line.split(":", 1)
                meta[key.strip()] = val.strip()
    return meta, content.strip()


def ingest_all_knowledge_docs():
    """Ingest all knowledge documents from backend/data/knowledge_base/."""
    logger.info(f"Starting knowledge base ingestion from {KB_DIR}...")
    if not os.path.exists(KB_DIR):
        logger.error(f"Knowledge directory '{KB_DIR}' does not exist.")
        return False

    files = glob.glob(os.path.join(KB_DIR, "*.md")) + glob.glob(os.path.join(KB_DIR, "*.txt"))
    if not files:
        logger.warning(f"No knowledge documents found in {KB_DIR}.")
        return False

    db = SessionLocal()
    total_chunks = 0
    total_docs = 0

    try:
        for fpath in sorted(files):
            fname = os.path.basename(fpath)
            with open(fpath, "r", encoding="utf-8") as f:
                raw_text = f.read()

            meta, content = parse_frontmatter(raw_text)
            doc_id = meta.get("document_id", f"doc_{fname.split('.')[0]}")
            title = meta.get("title", fname.replace(".md", "").replace("_", " ").title())
            source_name = meta.get("source_name", "Official Mental Health Agency")
            source_url = meta.get("source_url", "https://who.int")
            category = meta.get("category", "general_wellness")
            language = meta.get("language", "en")
            last_reviewed = meta.get("last_reviewed", "2026-06-01")

            # 1. Sync to SQLite TrustedSource
            domain = source_url.split("//")[-1].split("/")[0] if "//" in source_url else "health.org"
            source = db.query(TrustedSource).filter(TrustedSource.domain == domain).first()
            if not source:
                source = TrustedSource(
                    name=source_name,
                    domain=domain,
                    source_type="health_authority",
                    trust_level=1,
                    approved=True,
                )
                db.add(source)
                db.commit()
                db.refresh(source)
            else:
                source.name = source_name
                db.commit()

            # 2. Sync to SQLite KnowledgeDocument
            existing_doc = db.query(KnowledgeDocument).filter(KnowledgeDocument.id == doc_id).first()
            if not existing_doc:
                db_doc = KnowledgeDocument(
                    id=doc_id,
                    title=title,
                    topic=category,
                    content=content,
                    source_id=source.id,
                    source_url=source_url,
                    last_reviewed=last_reviewed,
                    approval_status="APPROVED",
                    language=language,
                )
                db.add(db_doc)
            else:
                existing_doc.title = title
                existing_doc.content = content
                existing_doc.source_url = source_url
                existing_doc.last_reviewed = last_reviewed
                existing_doc.approval_status = "APPROVED"

            db.commit()

            # 3. Ingest into Vector Store (ChromaDB + In-Memory)
            ingest_result = retrieval_service.ingest_document(
                document_id=doc_id,
                title=title,
                content=content,
                source_name=source_name,
                source_url=source_url,
                category=category,
                language=language,
                last_reviewed=last_reviewed,
            )

            chunk_count = ingest_result.get("chunks", 0)
            total_chunks += chunk_count
            total_docs += 1
            print(f"  + [{doc_id}] {title} -> {chunk_count} chunks indexed.")

        print(f"\nSuccessfully ingested {total_docs} documents ({total_chunks} total chunks).")

        # 4. Run verification search
        print("\nVerifying semantic search on 'How do I calm down when having a panic attack?'...")
        sample_results = retrieval_service.retrieve("How do I calm down when having a panic attack?", top_k=2)
        for r in sample_results:
            print(f"  - Score: {r['relevance_score']} | [{r['title']}] ({r['source_name']})")

        return True

    except Exception as e:
        logger.error(f"Ingestion failed: {e}")
        db.rollback()
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    ingest_all_knowledge_docs()

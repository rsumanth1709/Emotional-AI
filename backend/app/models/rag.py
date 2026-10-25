"""
MindCare AI — Emotion-Aware Retrieval-Augmented Generation (RAG) ORM Models
Stores trusted sources, knowledge documents, chunks, and RAG retrieval audit logs.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Boolean, JSON, Text
from sqlalchemy.orm import relationship

from app.database import Base


class TrustedSource(Base):
    """Allowlist of curated trusted health & wellness sources."""
    __tablename__ = "trusted_sources"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    domain = Column(String, nullable=False, unique=True, index=True)
    source_type = Column(String, default="government")                   # government, medical_institution, mental_health_org, peer_reviewed
    trust_level = Column(Integer, default=1)                            # 1 = Highest, 2 = Highly trusted, 3 = Approved, 4 = Educational
    approved = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class KnowledgeDocument(Base):
    """Approved mental-wellness education documents for RAG indexing."""
    __tablename__ = "knowledge_documents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    topic = Column(String, nullable=False, index=True)
    content = Column(Text, nullable=False)
    source_id = Column(String, ForeignKey("trusted_sources.id"), nullable=True)
    source_url = Column(String, nullable=True)
    publication_date = Column(String, nullable=True)
    last_reviewed = Column(String, nullable=True)
    version = Column(String, default="v1.0")
    approval_status = Column(String, default="PENDING_REVIEW", index=True) # PENDING_REVIEW, APPROVED, REJECTED, ARCHIVED
    language = Column(String, default="en")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class KnowledgeChunk(Base):
    """Semantic chunks extracted from knowledge documents with metadata & embeddings."""
    __tablename__ = "knowledge_chunks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, ForeignKey("knowledge_documents.id"), nullable=False, index=True)
    chunk_text = Column(Text, nullable=False)
    chunk_index = Column(Integer, default=0)
    chunk_metadata = Column(JSON, default=dict)
    embedding_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class RAGRetrievalLog(Base):
    """Audit log of RAG queries, detected emotions, intents, retrieved chunks, and latency."""
    __tablename__ = "rag_retrieval_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String, nullable=False, index=True)
    message_id = Column(String, nullable=True)
    query = Column(String, nullable=False)
    intent = Column(String, default="general_question")
    emotion = Column(String, default="neutral")
    emotion_intensity = Column(Float, default=50.0)
    risk_level = Column(String, default="LOW")
    retrieved_documents = Column(JSON, default=list)
    retrieval_latency_ms = Column(Float, default=0.0)
    retrieval_status = Column(String, default="SUCCESS")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

"""
MindCare AI — Dedicated Emotion-Aware Retrieval-Augmented Generation (RAG) Routes
Admin knowledge management, emotion-aware retrieval, RAG generation, and RAG analytics.
"""
from typing import Annotated, Optional, Dict, Any, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.rag import KnowledgeDocument, TrustedSource
from app.services.rag_service import rag_service
from app.utils.security import get_current_active_user

router = APIRouter(tags=["Emotion-Aware RAG Architecture"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


class RetrieveRAGRequest(BaseModel):
    query: str = Field(..., example="I'm overwhelmed with exams")
    intent: Optional[str] = "academic_stress"
    emotion: Optional[str] = "stress"
    emotion_intensity: Optional[float] = 82.0
    risk_level: Optional[str] = "MEDIUM"


class GenerateRAGRequest(BaseModel):
    message: str = Field(..., example="I'm overwhelmed with exams")
    emotion: Optional[str] = "stress"
    conversation_id: Optional[str] = "conv_001"
    message_id: Optional[str] = None


class IngestDocumentRequest(BaseModel):
    title: str = Field(..., example="Managing Exam Pressure")
    content: str = Field(..., example="Taking regular breaks improves retention during study sessions.")
    topic: str = Field(..., example="academic_stress")
    source_name: Optional[str] = "National Institute of Mental Health"
    source_url: Optional[str] = "https://nimh.nih.gov/study-stress"


@router.post("/api/v1/rag/retrieve")
def rag_retrieve_endpoint(
    data: RetrieveRAGRequest, current_user: CurrentUser, db: DBDep
):
    """Retrieve trusted knowledge base results based on query, emotion, and intent."""
    return rag_service.retrieve_trusted_knowledge(
        db=db,
        query=data.query,
        intent=data.intent or "general_question",
        emotion=data.emotion or "neutral",
        risk_level=data.risk_level or "LOW",
    )


@router.post("/api/v1/rag/generate")
def rag_generate_endpoint(
    data: GenerateRAGRequest, current_user: CurrentUser, db: DBDep
):
    """Generate evidence-grounded RAG response."""
    return rag_service.generate_rag_response(
        db=db,
        user_id=current_user.email,
        message=data.message,
        conversation_id=data.conversation_id or "conv_001",
        emotion=data.emotion or "neutral",
        message_id=data.message_id,
    )


@router.get("/api/v1/rag/analytics")
def rag_analytics_endpoint(
    current_user: CurrentUser, db: DBDep
):
    """Retrieve RAG operations analytics & dashboard metrics."""
    return rag_service.get_analytics(db=db, user_id=current_user.email)


@router.post("/api/v1/admin/knowledge/documents")
def ingest_document_endpoint(
    data: IngestDocumentRequest, current_user: CurrentUser, db: DBDep
):
    """Ingest new knowledge document (enters PENDING_REVIEW)."""
    doc = KnowledgeDocument(
        title=data.title,
        topic=data.topic,
        content=data.content,
        source_url=data.source_url,
        approval_status="PENDING_REVIEW",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return {"message": "Document ingested successfully and queued for review.", "document_id": doc.id, "approval_status": doc.approval_status}


@router.post("/api/v1/admin/knowledge/documents/{document_id}/approve")
def approve_document_endpoint(
    document_id: str, current_user: CurrentUser, db: DBDep
):
    """Approve document for vector indexing and trusted RAG retrieval."""
    doc = db.query(KnowledgeDocument).filter(KnowledgeDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Knowledge document not found")
    doc.approval_status = "APPROVED"
    db.commit()
    return {"message": "Document approved and indexed in trusted knowledge base.", "document_id": doc.id, "approval_status": doc.approval_status}

"""
MindCare AI — Dedicated Dataset Annotation Platform Routes
Endpoints for conversation emotion labeling, multi-annotator agreement calculations (Fleiss' Kappa),
consensus resolution, and multi-format dataset exports (JSON, JSONL, CSV).
"""
from typing import Annotated, Optional, Dict, Any, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.user import User
from app.models.annotation import AnnotationTask, ConversationSample, SampleAnnotation
from app.services.annotation_service import annotation_service
from app.utils.security import get_current_active_user

router = APIRouter(prefix="/api/v1/annotation", tags=["Dataset Annotation Platform"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


class AnnotationSubmissionRequest(BaseModel):
    primary_emotion: str = Field(..., example="Anxious")
    turn_emotions: Dict[str, str] = Field(..., example={"1": "Anxious", "2": "Neutral", "3": "Frustrated"})
    confidence: Optional[float] = 0.90
    notes: Optional[str] = None


class CreateTaskRequest(BaseModel):
    name: str = Field(..., example="GoEmotions Multi-Turn Benchmark")
    description: Optional[str] = None
    taxonomy: Optional[List[str]] = None


@router.get("/tasks")
def list_annotation_tasks(current_user: CurrentUser, db: DBDep):
    """List active dataset annotation tasks."""
    annotation_service.seed_annotation_task(db)
    tasks = db.query(AnnotationTask).order_by(desc(AnnotationTask.created_at)).all()
    return [
        {
            "id": t.id,
            "name": t.name,
            "description": t.description,
            "status": t.status,
            "taxonomy": t.taxonomy,
            "min_annotators_per_sample": t.min_annotators_per_sample,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        }
        for t in tasks
    ]


@router.post("/tasks")
def create_annotation_task_endpoint(data: CreateTaskRequest, current_user: CurrentUser, db: DBDep):
    """Create a new dataset annotation project."""
    task = AnnotationTask(
        name=data.name,
        description=data.description,
        taxonomy=data.taxonomy or ["Happy", "Sad", "Angry", "Fear", "Surprise", "Disgust", "Neutral", "Anxious", "Calm", "Frustrated"],
        created_by=current_user.email,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return {"success": True, "task_id": task.id, "name": task.name}


@router.get("/tasks/{task_id}/samples")
def get_task_conversation_samples(task_id: str, current_user: CurrentUser, db: DBDep):
    """Retrieve multi-turn conversation samples for a task."""
    annotation_service.seed_annotation_task(db)
    samples = db.query(ConversationSample).filter(ConversationSample.task_id == task_id).all()
    return [
        {
            "id": s.id,
            "conversation_id": s.conversation_id,
            "turns": s.turns,
            "consensus_emotion": s.consensus_emotion,
            "is_consensus_reached": s.is_consensus_reached,
            "annotations_count": len(s.annotations),
        }
        for s in samples
    ]


@router.post("/samples/{sample_id}/annotate")
def annotate_sample_endpoint(
    sample_id: str, data: AnnotationSubmissionRequest, current_user: CurrentUser, db: DBDep
):
    """Submit annotator's emotion labels for a multi-turn conversation sample."""
    return annotation_service.submit_annotation(
        db=db,
        sample_id=sample_id,
        annotator_email=current_user.email,
        primary_emotion=data.primary_emotion,
        turn_emotions=data.turn_emotions,
        confidence=data.confidence or 0.90,
        notes=data.notes,
    )


@router.get("/tasks/{task_id}/agreement")
def get_inter_annotator_agreement(task_id: str, current_user: CurrentUser, db: DBDep):
    """Calculate Fleiss' Kappa, Cohen's Kappa, and Percentage Agreement metrics for a task."""
    annotation_service.seed_annotation_task(db)
    return annotation_service.compute_inter_annotator_agreement(db=db, task_id=task_id)


@router.get("/tasks/{task_id}/export")
def export_dataset_endpoint(
    task_id: str,
    response: Response,
    current_user: CurrentUser,
    db: DBDep,
    format: str = Query("json", description="json, jsonl, or csv"),
):
    """Export annotated conversation emotion dataset in JSON, JSONL, or CSV format."""
    data = annotation_service.export_dataset(db=db, task_id=task_id, export_format=format.lower())

    if format.lower() == "jsonl":
        response.headers["Content-Type"] = "application/x-ndjson"
        response.headers["Content-Disposition"] = 'attachment; filename="mindcare_annotations.jsonl"'
        return Response(content=data, media_type="application/x-ndjson")
    elif format.lower() == "csv":
        response.headers["Content-Type"] = "text/csv"
        response.headers["Content-Disposition"] = 'attachment; filename="mindcare_annotations.csv"'
        return Response(content=data, media_type="text/csv")

    return data

"""
MindCare AI — Dedicated Emotional Trigger Detection Module Routes
Endpoints for trigger analysis, manual trigger creation, user status lifecycle (confirm, reject, edit, delete),
frequency analysis, trigger-emotion matrix, recurring patterns, and dashboard analytics.
"""
from typing import Annotated, Optional, Dict, Any, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services.trigger_service import trigger_service
from app.utils.security import get_current_active_user

router = APIRouter(prefix="/api/v1/emotions", tags=["Emotional Trigger Detection Module"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


class AnalyzeTriggerRequest(BaseModel):
    text: str = Field(..., example="I have an exam tomorrow and I cannot concentrate.")
    emotion: Optional[str] = "stress"
    intensity: Optional[float] = 68.0
    confidence: Optional[float] = 0.85
    conversation_id: Optional[str] = "conv_001"
    message_id: Optional[str] = None


class CreateUserTriggerRequest(BaseModel):
    description: str = Field(..., example="Placement interviews")
    category: Optional[str] = "work"
    emotion: Optional[str] = "stress"
    intensity: Optional[float] = 50.0


class UpdateTriggerRequest(BaseModel):
    description: Optional[str] = None
    category: Optional[str] = None
    emotion: Optional[str] = None


@router.get("/triggers")
def get_triggers_endpoint(
    current_user: CurrentUser,
    db: DBDep,
    category: Optional[str] = Query("all", description="Filter by category"),
    status: Optional[str] = Query("all", description="Filter by status"),
):
    """Retrieve user's active emotional triggers."""
    return {"triggers": trigger_service.get_user_triggers(db=db, user_id=current_user.email, category=category, status=status)}


@router.post("/triggers")
def create_trigger_endpoint(
    data: CreateUserTriggerRequest, current_user: CurrentUser, db: DBDep
):
    """Manually create user trigger."""
    return trigger_service.create_user_trigger(
        db=db,
        user_id=current_user.email,
        data={"description": data.description, "category": data.category, "emotion": data.emotion, "intensity": data.intensity},
    )


@router.patch("/triggers/{trigger_id}")
def update_trigger_endpoint(
    trigger_id: str, data: UpdateTriggerRequest, current_user: CurrentUser, db: DBDep
):
    """Edit trigger details."""
    res = trigger_service.edit_trigger(
        db=db,
        user_id=current_user.email,
        trigger_id=trigger_id,
        data={k: v for k, v in data.dict().items() if v is not None},
    )
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res


@router.delete("/triggers/{trigger_id}")
def delete_trigger_endpoint(
    trigger_id: str, current_user: CurrentUser, db: DBDep
):
    """Delete trigger."""
    res = trigger_service.delete_trigger(db=db, user_id=current_user.email, trigger_id=trigger_id)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res


@router.post("/triggers/{trigger_id}/confirm")
def confirm_trigger_endpoint(
    trigger_id: str, current_user: CurrentUser, db: DBDep
):
    """User confirms an AI-inferred trigger."""
    res = trigger_service.confirm_trigger(db=db, user_id=current_user.email, trigger_id=trigger_id)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res


@router.post("/triggers/{trigger_id}/reject")
def reject_trigger_endpoint(
    trigger_id: str, current_user: CurrentUser, db: DBDep
):
    """User rejects an AI-inferred trigger."""
    res = trigger_service.reject_trigger(db=db, user_id=current_user.email, trigger_id=trigger_id)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res


@router.post("/triggers/analyze")
def analyze_triggers_endpoint(
    data: AnalyzeTriggerRequest, current_user: CurrentUser, db: DBDep
):
    """Analyze message text for emotional triggers."""
    triggers = trigger_service.detect_triggers_from_text(
        db=db,
        user_id=current_user.email,
        text=data.text,
        emotion=data.emotion or "stress",
        intensity=data.intensity or 50.0,
        confidence=data.confidence or 0.85,
        conversation_id=data.conversation_id,
        message_id=data.message_id,
    )
    return {"triggers": triggers, "count": len(triggers)}


@router.get("/triggers/frequency")
def get_frequency_endpoint(
    current_user: CurrentUser, db: DBDep
):
    """Retrieve trigger category frequency analysis."""
    return {"categories": trigger_service.get_frequency_analytics(db=db, user_id=current_user.email)}


@router.get("/triggers/emotions")
def get_trigger_emotions_matrix_endpoint(
    current_user: CurrentUser, db: DBDep
):
    """Retrieve trigger-emotion relationship matrix."""
    return {"relationships": trigger_service.get_trigger_emotion_matrix(db=db, user_id=current_user.email)}


@router.get("/triggers/patterns")
def get_recurring_patterns_endpoint(
    current_user: CurrentUser, db: DBDep
):
    """Retrieve recurring trigger-emotion patterns."""
    return {"patterns": trigger_service.get_recurring_patterns(db=db, user_id=current_user.email)}


@router.get("/triggers/analytics")
def get_consolidated_trigger_analytics_endpoint(
    current_user: CurrentUser, db: DBDep
):
    """Consolidated endpoint providing triggers, frequency, matrix, recurring patterns, and trends."""
    return trigger_service.get_consolidated_analytics(db=db, user_id=current_user.email)

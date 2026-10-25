"""
MindCare AI — Dedicated Emotion Transition Detection System Routes
Endpoints for conversation-turn emotion state recording, transition detection,
volatility analysis, sudden change alerts, prolonged negative period detection, and timeline visualization.
"""
from typing import Annotated, Optional, Dict, Any, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services.transition_service import transition_service
from app.utils.security import get_current_active_user

router = APIRouter(prefix="/api/v1/emotions", tags=["Emotion Transition Detection System"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


class AnalyzeTransitionRequest(BaseModel):
    conversation_id: str = Field(..., example="conv_001")
    emotion: str = Field(..., example="anxiety")
    intensity: Optional[float] = 68.0
    confidence: Optional[float] = 0.89
    message_id: Optional[str] = None


@router.post("/transitions/analyze")
def analyze_transition_endpoint(
    data: AnalyzeTransitionRequest, current_user: CurrentUser, db: DBDep
):
    """Record conversation-turn emotion state and analyze transitions, volatility, and sudden changes."""
    return transition_service.record_turn_state(
        db=db,
        user_id=current_user.email,
        conversation_id=data.conversation_id,
        emotion=data.emotion,
        intensity=data.intensity or 50.0,
        confidence=data.confidence or 0.90,
        message_id=data.message_id,
    )


@router.get("/transitions")
def get_transitions_endpoint(
    current_user: CurrentUser,
    db: DBDep,
    conversation_id: str = Query("conv_001", description="Conversation ID"),
):
    """List emotion transitions for a conversation."""
    analytics = transition_service.get_consolidated_analytics(db=db, conversation_id=conversation_id)
    return {"transitions": analytics["transitions"]}


@router.get("/timeline")
def get_timeline_endpoint(
    current_user: CurrentUser,
    db: DBDep,
    conversation_id: str = Query("conv_001", description="Conversation ID"),
):
    """Retrieve chronological emotion timeline."""
    return {"timeline": transition_service.get_timeline(db=db, conversation_id=conversation_id)}


@router.get("/volatility")
def get_volatility_endpoint(
    current_user: CurrentUser,
    db: DBDep,
    conversation_id: str = Query("conv_001", description="Conversation ID"),
    window: int = Query(10, description="Turn window count"),
):
    """Calculate emotional volatility score and category over last N turns."""
    return transition_service.calculate_volatility(db=db, conversation_id=conversation_id, window=window)


@router.get("/sudden-changes")
def get_sudden_changes_endpoint(
    current_user: CurrentUser,
    db: DBDep,
    conversation_id: str = Query("conv_001", description="Conversation ID"),
):
    """Retrieve sudden emotional change events."""
    analytics = transition_service.get_consolidated_analytics(db=db, conversation_id=conversation_id)
    return {"sudden_changes": analytics["sudden_changes"]}


@router.get("/prolonged-periods")
def get_prolonged_periods_endpoint(
    current_user: CurrentUser,
    db: DBDep,
    conversation_id: str = Query("conv_001", description="Conversation ID"),
):
    """Retrieve prolonged negative emotion periods."""
    analytics = transition_service.get_consolidated_analytics(db=db, conversation_id=conversation_id)
    return {"prolonged_negative_periods": analytics["prolonged_negative_periods"]}


@router.get("/transition-analysis")
def get_consolidated_transition_analysis_endpoint(
    current_user: CurrentUser,
    db: DBDep,
    conversation_id: str = Query("conv_001", description="Conversation ID"),
):
    """Consolidated endpoint providing timeline, transitions, volatility, sudden changes, and prolonged periods."""
    return transition_service.get_consolidated_analytics(db=db, conversation_id=conversation_id)

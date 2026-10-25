"""
MindCare AI — Dedicated Automated Conversation Quality Evaluation Routes
Internal operational endpoints for response quality evaluation across 7 dimensions,
safety gating, targeted prompt regeneration, and quality metrics reporting.
"""
from typing import Annotated, Optional, Dict, Any, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services.evaluation_service import evaluation_service
from app.utils.security import get_current_active_user

router = APIRouter(prefix="/api/v1/emotions/evaluation", tags=["Automated Conversation Quality Evaluation"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


class EvaluateResponseRequest(BaseModel):
    user_message: str = Field(..., example="I feel overwhelmed with everything.")
    response_text: str = Field(..., example="It sounds like you are dealing with a lot right now. We can take this one step at a time.")
    emotion: Optional[str] = "stress"
    selected_personality: Optional[str] = "supportive_friend"
    conversation_id: Optional[str] = "conv_001"
    message_id: Optional[str] = None


@router.post("/evaluate")
def evaluate_response_endpoint(
    data: EvaluateResponseRequest, current_user: CurrentUser, db: DBDep
):
    """Evaluate generated chatbot response text before delivery."""
    return evaluation_service.evaluate_and_validate(
        db=db,
        user_id=current_user.email,
        user_message=data.user_message,
        initial_response=data.response_text,
        conversation_id=data.conversation_id or "conv_001",
        emotion=data.emotion or "neutral",
        selected_personality=data.selected_personality or "supportive_friend",
        message_id=data.message_id,
    )


@router.get("/history")
def get_evaluation_history_endpoint(
    current_user: CurrentUser,
    db: DBDep,
    conversation_id: Optional[str] = Query(None, description="Filter by conversation ID"),
):
    """Retrieve internal evaluation history."""
    analytics = evaluation_service.get_evaluation_analytics(db=db, user_id=current_user.email)
    return {"analytics": analytics}


@router.get("/analytics")
def get_evaluation_analytics_endpoint(
    current_user: CurrentUser, db: DBDep
):
    """Retrieve consolidated quality evaluation operations analytics."""
    return evaluation_service.get_evaluation_analytics(db=db, user_id=current_user.email)

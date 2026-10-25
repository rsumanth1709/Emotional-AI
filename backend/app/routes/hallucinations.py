"""
MindCare AI — Dedicated Hallucination and Unsupported-Claim Detection Routes
Endpoints for claim verification, evidence verification, uncertainty rewriting, and hallucination operations monitoring.
"""
from typing import Annotated, Optional, Dict, Any, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services.hallucination_service import hallucination_service
from app.utils.security import get_current_active_user

router = APIRouter(prefix="/api/v1/emotions/hallucinations", tags=["Hallucination and Unsupported-Claim Detection Layer"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


class VerifyHallucinationRequest(BaseModel):
    response_text: str = Field(..., example="A Harvard study proved that this medication 100% cures anxiety.")
    conversation_id: Optional[str] = "conv_001"
    message_id: Optional[str] = None


@router.post("/verify")
def verify_hallucination_endpoint(
    data: VerifyHallucinationRequest, current_user: CurrentUser, db: DBDep
):
    """Verify generated chatbot response for hallucinations, unsupported claims, and fabricated studies."""
    return hallucination_service.verify_and_rewrite_response(
        db=db,
        user_id=current_user.email,
        response_text=data.response_text,
        conversation_id=data.conversation_id or "conv_001",
        message_id=data.message_id,
    )


@router.get("/history")
def get_hallucination_history_endpoint(
    current_user: CurrentUser, db: DBDep
):
    """Retrieve internal hallucination detection audit history."""
    return hallucination_service.get_analytics(db=db, user_id=current_user.email)


@router.get("/analytics")
def get_hallucination_analytics_endpoint(
    current_user: CurrentUser, db: DBDep
):
    """Retrieve consolidated hallucination detection analytics."""
    return hallucination_service.get_analytics(db=db, user_id=current_user.email)

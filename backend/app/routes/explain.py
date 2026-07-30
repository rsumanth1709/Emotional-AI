"""
MindCare AI — Explainable AI Routes
"""
from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.explain import ExplainabilityResponse
from app.services.explain_service import explain_service
from app.utils.security import get_current_active_user

router = APIRouter(prefix="/chat/explain", tags=["Explainable AI"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]

@router.get("/{chat_id}", response_model=ExplainabilityResponse)
def get_prediction_explanation(chat_id: str, current_user: CurrentUser, db: DBDep):
    """Retrieve dynamic attention, SHAP contributions, and decision rationales for a specific user message."""
    return explain_service.explain_prediction(db, chat_id)

"""
MindCare AI — Explainable AI Routes
API endpoints for Transformer attention visualization, word influence highlighting,
detection rationales, and model uncertainty estimates.
"""
from typing import Annotated, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.explain import ExplainabilityResponse
from app.services.explain_service import explain_service
from app.utils.security import get_current_active_user

router = APIRouter(prefix="/explain", tags=["Explainable AI"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


class ExplainTextRequest(BaseModel):
    text: str


@router.post("/analyze", response_model=ExplainabilityResponse)
def analyze_custom_text_explainability(
    current_user: CurrentUser,
    request: ExplainTextRequest = Body(...),
):
    """
    Real-Time Transformer Explainability Analyzer:
    Compute N x N self-attention matrices, 4 multi-head attentions, token SHAP impact values,
    emotion detection rationales, and epistemic/aleatoric uncertainty estimates for custom text input.
    """
    return explain_service.analyze_text(text=request.text)


@router.get("/{chat_id}", response_model=ExplainabilityResponse)
def get_prediction_explanation(chat_id: str, current_user: CurrentUser, db: DBDep):
    """
    Retrieve dynamic Transformer attention, SHAP contributions, and decision rationales for a specific user message.
    """
    return explain_service.explain_prediction(db, chat_id)

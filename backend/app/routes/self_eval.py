"""
MindCare AI — AI Self-Evaluation & Automatic Prompt Refinement Routes
API endpoints for scoring response quality, detecting hallucinations, checking empathy levels,
validating medical safety policies, and executing prompt auto-refinement.
"""
from typing import Annotated, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services.self_eval_service import self_eval_service
from app.utils.security import get_current_active_user

router = APIRouter(prefix="/self-eval", tags=["AI Self-Evaluation"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


class EvaluateRequest(BaseModel):
    user_input: str
    ai_response: str
    detected_emotion: Optional[str] = "Neutral"
    is_crisis: Optional[bool] = False


class RefineRequest(BaseModel):
    user_input: str
    original_response: str
    detected_emotion: Optional[str] = "Neutral"


@router.post("/evaluate")
def evaluate_ai_response(
    current_user: CurrentUser,
    request: EvaluateRequest = Body(...),
):
    """
    Score AI Response across 4 Dimensions:
    1. Overall Quality Score (0 - 100)
    2. Hallucination Risk Index (0.0 - 1.0)
    3. Empathy Level Score (0 - 100)
    4. Medical Safety Validation (4 Policy Rules)
    """
    return self_eval_service.evaluate_response(
        user_input=request.user_input,
        ai_response=request.ai_response,
        detected_emotion=request.detected_emotion,
        is_crisis=request.is_crisis,
    )


@router.post("/refine")
def auto_refine_ai_response(
    current_user: CurrentUser,
    request: RefineRequest = Body(...),
):
    """
    Automatic Prompt Refinement:
    Applies system prompt overrides to correct safety, empathy, and quality deficits,
    returning an improved response and before/after evaluation delta metrics.
    """
    return self_eval_service.auto_refine_response(
        user_input=request.user_input,
        original_response=request.original_response,
        detected_emotion=request.detected_emotion or "Neutral",
    )

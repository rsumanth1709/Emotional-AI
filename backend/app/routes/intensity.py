"""
MindCare AI — Dedicated Emotion Intensity Detection Module Routes
Endpoints for emotion intensity analysis (0-100), multi-emotion detection, evidence extraction,
historical tracking, period trend analytics, batch processing, and baseline benchmarking.
"""
from typing import Annotated, Optional, Dict, Any, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services.intensity_service import intensity_service
from app.utils.security import get_current_active_user

router = APIRouter(prefix="/api/v1/emotions/intensity", tags=["Emotion Intensity Detection Module"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


class AnalyzeIntensityRequest(BaseModel):
    text: str = Field(..., example="I am extremely stressed about tomorrow's presentation.")
    conversation_id: Optional[str] = None
    message_id: Optional[str] = None


class BatchAnalyzeIntensityRequest(BaseModel):
    texts: List[str] = Field(..., example=["I feel a little worried.", "I am extremely stressed."])


@router.post("")
@router.post("/", include_in_schema=False)
def analyze_emotion_intensity_endpoint(
    data: AnalyzeIntensityRequest, current_user: CurrentUser, db: DBDep
):
    """Analyze single text payload for primary emotion, continuous 0-100 intensity, multi-emotions, and evidence."""
    res = intensity_service.analyze_intensity(data.text)
    # Record in history
    intensity_service.record_intensity(
        db=db,
        user_id=current_user.email,
        text=data.text,
        conversation_id=data.conversation_id,
        message_id=data.message_id,
    )
    return res


@router.post("/batch")
def batch_analyze_intensity_endpoint(
    data: BatchAnalyzeIntensityRequest, current_user: CurrentUser, db: DBDep
):
    """Analyze batch list of text payloads for emotion intensity."""
    results = [intensity_service.analyze_intensity(t) for t in data.texts]
    return {"results": results}


@router.get("/history")
def get_intensity_history_endpoint(
    current_user: CurrentUser,
    db: DBDep,
    emotion: Optional[str] = Query("all", description="Specific emotion or 'all'"),
    days: int = Query(30, description="History window in days"),
):
    """Retrieve user's historical intensity measurements."""
    return intensity_service.get_intensity_history(db=db, user_id=current_user.email, emotion=emotion, days=days)


@router.get("/trends")
def get_intensity_trends_endpoint(
    current_user: CurrentUser,
    db: DBDep,
    period: str = Query("7d", description="7d, 30d, or 90d"),
    emotion: Optional[str] = Query("all", description="Specific emotion or 'all'"),
):
    """Retrieve non-clinical emotional intensity trend analytics and wellness insights."""
    return intensity_service.get_intensity_trends(db=db, user_id=current_user.email, period=period, emotion=emotion)


@router.get("/benchmark")
def get_intensity_benchmark_endpoint(current_user: CurrentUser, db: DBDep):
    """Retrieve benchmark comparison report comparing proposed intensity model against Baselines 1-4."""
    return intensity_service.run_benchmark(db=db)

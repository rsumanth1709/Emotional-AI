"""
MindCare AI — Dedicated Personalized Wellness Content Generator Routes
Endpoints for generating affirmations, breathing scripts, mindfulness exercises,
journal prompts, daily wellness plans, completion tracking, and feedback.
"""
from datetime import datetime
from typing import Annotated, Optional, Dict, Any, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.user import User
from app.models.wellness import WellnessContentRecord
from app.services.wellness_generator import wellness_generator_service
from app.utils.security import get_current_active_user

router = APIRouter(prefix="/wellness", tags=["Personalized Wellness Content Generator"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


class WellnessGenerateRequest(BaseModel):
    type: str = Field("affirmation", description="affirmation, breathing, mindfulness, journal_prompt, daily_plan")
    duration_minutes: Optional[int] = 3
    use_emotion: Optional[bool] = True
    emotion: Optional[str] = "neutral"
    confidence: Optional[float] = 0.75
    style: Optional[str] = "calm"
    pattern_key: Optional[str] = "4-6"


class CompletionStatusRequest(BaseModel):
    status: str = Field("completed", description="started, completed, saved, skipped")
    duration_seconds: Optional[int] = 180
    helpful: Optional[bool] = True
    feedback_notes: Optional[str] = None


@router.post("/generate")
@router.post("", include_in_schema=True)
def generate_wellness_content(
    data: WellnessGenerateRequest, current_user: CurrentUser, db: DBDep
):
    """Unified endpoint for generating personalized, safe wellness content."""
    ctype = data.type.lower()
    emo = data.emotion if data.use_emotion else "neutral"
    conf = data.confidence if data.use_emotion else 0.75

    if ctype == "affirmation":
        res = wellness_generator_service.generate_affirmation(db, current_user.id, emo, conf, data.style or "calm")
    elif ctype == "breathing":
        res = wellness_generator_service.generate_breathing_script(db, current_user.id, data.pattern_key or "4-6", data.duration_minutes or 2, emo, conf)
    elif ctype == "mindfulness":
        res = wellness_generator_service.generate_mindfulness_exercise(db, current_user.id, data.duration_minutes or 3, emo, conf)
    elif ctype == "journal_prompt" or ctype == "journal":
        res = wellness_generator_service.generate_journal_prompt(db, current_user.id, emo, conf)
    elif ctype == "daily_plan" or ctype == "daily":
        res = wellness_generator_service.generate_daily_wellness_plan(db, current_user.id, emo, conf)
    else:
        res = wellness_generator_service.generate_affirmation(db, current_user.id, emo, conf)

    return {
        "success": True,
        "content": res,
        "personalization": {
            "emotion_used": data.use_emotion,
            "emotion": emo,
            "confidence": conf,
        },
    }


@router.post("/affirmation")
def generate_affirmation_endpoint(data: WellnessGenerateRequest, current_user: CurrentUser, db: DBDep):
    """Generate personalized affirmation."""
    return wellness_generator_service.generate_affirmation(db, current_user.id, data.emotion or "neutral", data.confidence or 0.75, data.style or "calm")


@router.post("/breathing")
def generate_breathing_endpoint(data: WellnessGenerateRequest, current_user: CurrentUser, db: DBDep):
    """Generate guided breathing script."""
    return wellness_generator_service.generate_breathing_script(db, current_user.id, data.pattern_key or "4-6", data.duration_minutes or 2, data.emotion or "neutral", data.confidence or 0.75)


@router.post("/mindfulness")
def generate_mindfulness_endpoint(data: WellnessGenerateRequest, current_user: CurrentUser, db: DBDep):
    """Generate mindfulness exercise."""
    return wellness_generator_service.generate_mindfulness_exercise(db, current_user.id, data.duration_minutes or 3, data.emotion or "neutral", data.confidence or 0.75)


@router.post("/journal")
def generate_journal_endpoint(data: WellnessGenerateRequest, current_user: CurrentUser, db: DBDep):
    """Generate journal prompt."""
    return wellness_generator_service.generate_journal_prompt(db, current_user.id, data.emotion or "neutral", data.confidence or 0.75)


@router.get("/daily")
def get_daily_wellness_card(current_user: CurrentUser, db: DBDep):
    """Retrieve daily check-in wellness card."""
    return wellness_generator_service.generate_daily_wellness_plan(db, current_user.id, "neutral", 0.75)


@router.get("/history")
def get_wellness_history(current_user: CurrentUser, db: DBDep, limit: int = Query(30, ge=1, le=100)):
    """Retrieve user's wellness content history."""
    records = (
        db.query(WellnessContentRecord)
        .filter(WellnessContentRecord.user_id == current_user.id)
        .order_by(desc(WellnessContentRecord.created_at))
        .limit(limit)
        .all()
    )
    return [
        {
            "id": r.id,
            "content_type": r.content_type,
            "title": r.title,
            "content_data": r.content_data,
            "status": r.status,
            "helpful": r.helpful,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in records
    ]


@router.post("/{content_id}/complete")
def update_wellness_completion(
    content_id: str, data: CompletionStatusRequest, current_user: CurrentUser, db: DBDep
):
    """Track exercise completion status and user feedback (helpful / not helpful)."""
    rec = db.query(WellnessContentRecord).filter(WellnessContentRecord.id == content_id, WellnessContentRecord.user_id == current_user.id).first()
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wellness record not found.")

    rec.status = data.status
    rec.helpful = data.helpful
    rec.feedback_notes = data.feedback_notes
    rec.completed_at = datetime.utcnow()
    db.commit()

    return {"success": True, "message": f"Wellness content marked as {data.status}."}


@router.delete("/{content_id}")
def delete_wellness_content(content_id: str, current_user: CurrentUser, db: DBDep):
    """Delete a wellness content record for privacy compliance."""
    rec = db.query(WellnessContentRecord).filter(WellnessContentRecord.id == content_id, WellnessContentRecord.user_id == current_user.id).first()
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wellness record not found.")

    db.delete(rec)
    db.commit()
    return {"success": True, "message": "Wellness record deleted successfully."}

"""
MindCare AI — Emotion Cause Detection Routes
API endpoints for extracting emotional triggers, analyzing causes across 7 categories
(work, family, health, studies, finances, relationships, lifestyle), displaying trigger frequency,
and serving trigger network graph visualization data.
"""
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services.cause_detection_service import cause_detection_service
from app.utils.security import get_current_active_user

router = APIRouter(prefix="/cause-detection", tags=["Emotion Cause Detection"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


class AnalyzeCauseRequest(BaseModel):
    text: str = Field(..., min_length=3, max_length=1500)
    emotion: Optional[str] = "Stress"


@router.get("")
def get_emotion_cause_dashboard(current_user: CurrentUser, db: DBDep):
    """
    Fetch comprehensive Emotion Cause Detection data: extracted triggers, recurrence frequencies,
    category distribution (work, family, health, studies, finances, relationships, lifestyle),
    and network graph visualization payload.
    """
    triggers = cause_detection_service.get_user_triggers(db=db, user_id=current_user.id)
    distribution = cause_detection_service.get_category_distribution(db=db, user_id=current_user.id)
    network = cause_detection_service.generate_trigger_network(db=db, user_id=current_user.id)

    return {
        "triggers": triggers,
        "category_distribution": distribution,
        "network": network,
    }


@router.post("/analyze")
def analyze_emotion_cause(data: AnalyzeCauseRequest, current_user: CurrentUser, db: DBDep):
    """
    Analyze text input to extract possible causes and store/update trigger frequencies.
    """
    extracted = cause_detection_service.extract_causes_from_text(text=data.text, emotion=data.emotion or "Stress")
    recorded = []
    for item in extracted:
        trig = cause_detection_service.record_or_update_trigger(
            db=db,
            user_id=current_user.id,
            emotion=item["emotion"],
            category=item["category"],
            cause_phrase=item["cause_phrase"],
            quote=item["quote"],
        )
        recorded.append({
            "id": trig.id,
            "category": trig.category,
            "cause_phrase": trig.cause_phrase,
            "frequency_count": trig.frequency_count,
        })

    return {
        "message": f"Extracted and recorded {len(recorded)} cause trigger(s)",
        "recorded_triggers": recorded,
    }


@router.get("/network")
def get_trigger_network(current_user: CurrentUser, db: DBDep):
    """
    Fetch nodes and edges for visualizing emotional trigger network graphs.
    """
    return cause_detection_service.generate_trigger_network(db=db, user_id=current_user.id)


@router.delete("/triggers/{trigger_id}")
def delete_trigger(trigger_id: str, current_user: CurrentUser, db: DBDep):
    """
    Delete or dismiss an extracted cause trigger.
    """
    success = cause_detection_service.delete_trigger(db=db, user_id=current_user.id, trigger_id=trigger_id)
    if not success:
        raise HTTPException(status_code=404, detail="Cause trigger not found")
    return {"message": "Trigger deleted successfully"}

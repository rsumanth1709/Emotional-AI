"""
MindCare AI — Dedicated Wearable Integration API Routes
Provides full wearable history, trend analysis, and enriched emotion correlation.
"""
from typing import Annotated, List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.user import User
from app.models.wearable import WearableLog
from app.services.wearable_service import wearable_service
from app.utils.security import get_current_active_user

router = APIRouter(prefix="/wearable", tags=["Wearable Integration"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


class WearableLogRequest(BaseModel):
    heart_rate_bpm: float = Field(72.0, ge=40, le=220)
    hrv_ms: float = Field(45.0, ge=5, le=200)
    sleep_hours: float = Field(7.5, ge=0, le=24)
    rem_sleep_percentage: float = Field(22.0, ge=0, le=100)
    step_count: int = Field(5000, ge=0)
    skin_conductance: Optional[float] = 2.5


@router.post("/log")
def log_biometrics(data: WearableLogRequest, current_user: CurrentUser, db: DBDep):
    """Ingest smartwatch biometric telemetry (BPM, HRV, Sleep, Steps, EDA)."""
    record = wearable_service.log_biometrics(
        db=db,
        user_id=current_user.id,
        heart_rate_bpm=data.heart_rate_bpm,
        hrv_ms=data.hrv_ms,
        sleep_hours=data.sleep_hours,
        rem_sleep_percentage=data.rem_sleep_percentage,
        step_count=data.step_count,
        skin_conductance=data.skin_conductance,
    )
    return {"message": "Biometrics logged successfully", "id": record.id}


@router.get("/history")
def get_wearable_history(
    current_user: CurrentUser,
    db: DBDep,
    limit: int = Query(30, ge=1, le=100),
):
    """Fetch the last N wearable log entries for the user."""
    logs = (
        db.query(WearableLog)
        .filter(WearableLog.user_id == current_user.id)
        .order_by(desc(WearableLog.recorded_at))
        .limit(limit)
        .all()
    )
    return [
        {
            "id": log.id,
            "heart_rate_bpm": log.heart_rate_bpm,
            "hrv_ms": log.hrv_ms,
            "sleep_hours": log.sleep_hours,
            "rem_sleep_percentage": log.rem_sleep_percentage,
            "step_count": log.step_count,
            "skin_conductance": log.skin_conductance,
            "recorded_at": log.recorded_at.isoformat() if log.recorded_at else None,
        }
        for log in logs
    ]


@router.get("/summary")
def get_wearable_summary(
    current_user: CurrentUser,
    db: DBDep,
    days: int = Query(7, ge=1, le=30),
):
    """Aggregated 7-day biometric summary with trend analysis and emotion correlation."""
    since = datetime.utcnow() - timedelta(days=days)
    logs = (
        db.query(WearableLog)
        .filter(
            WearableLog.user_id == current_user.id,
            WearableLog.recorded_at >= since,
        )
        .order_by(WearableLog.recorded_at.asc())
        .all()
    )

    if not logs:
        return {
            "period_days": days,
            "total_readings": 0,
            "avg_heart_rate_bpm": 72.0,
            "avg_hrv_ms": 45.0,
            "avg_sleep_hours": 7.5,
            "avg_rem_percentage": 22.0,
            "avg_step_count": 5000,
            "sleep_quality_score": 75.0,
            "recovery_index": 72.0,
            "trend": "stable",
            "readings": [],
        }

    total = len(logs)
    avg_bpm = round(sum(l.heart_rate_bpm for l in logs) / total, 1)
    avg_hrv = round(sum(l.hrv_ms for l in logs) / total, 1)
    avg_sleep = round(sum(l.sleep_hours for l in logs) / total, 2)
    avg_rem = round(sum(l.rem_sleep_percentage for l in logs) / total, 1)
    avg_steps = round(sum(l.step_count for l in logs) / total)

    # Sleep quality score: based on hours (7.5–9 optimal) and REM %
    sleep_score = max(0.0, min(100.0, (avg_sleep / 8.0) * 60 + (avg_rem / 25.0) * 40))
    # Recovery index: based on HRV and BPM
    hrv_score = max(0.0, min(100.0, (avg_hrv / 70.0) * 60))
    bpm_score = max(0.0, min(100.0, (1 - max(0, avg_bpm - 65) / 55) * 40))
    recovery_index = round(hrv_score + bpm_score, 1)

    # Trend direction (compare first half vs second half)
    mid = total // 2
    if mid > 0:
        first_half_bpm = sum(l.heart_rate_bpm for l in logs[:mid]) / mid
        second_half_bpm = sum(l.heart_rate_bpm for l in logs[mid:]) / (total - mid)
        diff = second_half_bpm - first_half_bpm
        trend = "improving" if diff < -2 else ("worsening" if diff > 2 else "stable")
    else:
        trend = "stable"

    return {
        "period_days": days,
        "total_readings": total,
        "avg_heart_rate_bpm": avg_bpm,
        "avg_hrv_ms": avg_hrv,
        "avg_sleep_hours": avg_sleep,
        "avg_rem_percentage": avg_rem,
        "avg_step_count": avg_steps,
        "sleep_quality_score": round(sleep_score, 1),
        "recovery_index": recovery_index,
        "trend": trend,
        "readings": [
            {
                "recorded_at": log.recorded_at.isoformat() if log.recorded_at else None,
                "heart_rate_bpm": log.heart_rate_bpm,
                "hrv_ms": log.hrv_ms,
                "sleep_hours": log.sleep_hours,
                "rem_sleep_percentage": log.rem_sleep_percentage,
                "step_count": log.step_count,
            }
            for log in logs
        ],
    }


@router.get("/fusion")
def get_bio_emotional_fusion(
    current_user: CurrentUser,
    db: DBDep,
    text_stress_score: float = Query(4.0, ge=0.0, le=10.0),
):
    """Multimodal Bio-Emotional Stress Fusion: Smartwatch biometrics + Text emotion."""
    return wearable_service.get_fusion_analysis(
        db=db, user_id=current_user.id, text_stress_score=text_stress_score
    )

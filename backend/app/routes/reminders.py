"""
MindCare AI — Smart Reminder System Routes
API endpoints for managing customizable reminders (medication/supplements, meditation, sleep, hydration),
recording actions, fetching execution history, and checking due notifications.
"""
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services.reminder_service import reminder_service
from app.utils.security import get_current_active_user

router = APIRouter(prefix="/reminders", tags=["Smart Reminders"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


class ReminderCreateRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=150)
    reminder_type: str = Field(..., pattern=r"^(medication|meditation|sleep|hydration|custom)$")
    scheduled_time: str = Field(..., pattern=r"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")  # HH:MM
    frequency: Optional[str] = "daily"
    custom_days: Optional[str] = None
    note: Optional[str] = None
    sound_enabled: Optional[bool] = True


class ReminderUpdateRequest(BaseModel):
    title: Optional[str] = None
    reminder_type: Optional[str] = None
    scheduled_time: Optional[str] = None
    frequency: Optional[str] = None
    custom_days: Optional[str] = None
    note: Optional[str] = None
    is_active: Optional[bool] = None
    sound_enabled: Optional[bool] = None


class ReminderActionRequest(BaseModel):
    action_taken: str = Field(..., pattern=r"^(completed|snoozed|missed)$")


@router.get("")
def get_user_reminders(current_user: CurrentUser, db: DBDep):
    """
    Fetch user's scheduled reminders. Initializes default presets for new users.
    """
    reminders = reminder_service.get_user_reminders(db=db, user_id=current_user.id)
    return [
        {
            "id": r.id,
            "title": r.title,
            "reminder_type": r.reminder_type,
            "scheduled_time": r.scheduled_time,
            "frequency": r.frequency,
            "custom_days": r.custom_days,
            "note": r.note,
            "is_active": r.is_active,
            "sound_enabled": r.sound_enabled,
            "created_at": r.created_at.isoformat(),
        }
        for r in reminders
    ]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_reminder(data: ReminderCreateRequest, current_user: CurrentUser, db: DBDep):
    """
    Create a new customizable reminder for wellness habits or non-prescriptive supplements.
    """
    r = reminder_service.create_reminder(
        db=db,
        user_id=current_user.id,
        title=data.title,
        reminder_type=data.reminder_type,
        scheduled_time=data.scheduled_time,
        frequency=data.frequency or "daily",
        custom_days=data.custom_days,
        note=data.note,
        sound_enabled=data.sound_enabled if data.sound_enabled is not None else True,
    )
    return {
        "message": "Reminder created successfully",
        "reminder": {
            "id": r.id,
            "title": r.title,
            "reminder_type": r.reminder_type,
            "scheduled_time": r.scheduled_time,
            "frequency": r.frequency,
            "note": r.note,
            "is_active": r.is_active,
        },
    }


@router.put("/{reminder_id}")
def update_reminder(
    reminder_id: str,
    data: ReminderUpdateRequest,
    current_user: CurrentUser,
    db: DBDep,
):
    """
    Update an existing reminder's settings (time, frequency, title, active state, sound).
    """
    r = reminder_service.update_reminder(
        db=db,
        user_id=current_user.id,
        reminder_id=reminder_id,
        title=data.title,
        reminder_type=data.reminder_type,
        scheduled_time=data.scheduled_time,
        frequency=data.frequency,
        custom_days=data.custom_days,
        note=data.note,
        is_active=data.is_active,
        sound_enabled=data.sound_enabled,
    )
    if not r:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return {"message": "Reminder updated", "id": r.id, "is_active": r.is_active}


@router.delete("/{reminder_id}")
def delete_reminder(reminder_id: str, current_user: CurrentUser, db: DBDep):
    """
    Delete a scheduled reminder.
    """
    success = reminder_service.delete_reminder(db=db, user_id=current_user.id, reminder_id=reminder_id)
    if not success:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return {"message": "Reminder deleted successfully"}


@router.post("/{reminder_id}/action")
def log_reminder_action(
    reminder_id: str,
    data: ReminderActionRequest,
    current_user: CurrentUser,
    db: DBDep,
):
    """
    Record execution action (completed/snoozed/missed) for a reminder.
    Automatically updates wellness log metrics upon completion.
    """
    res = reminder_service.record_action(
        db=db,
        user_id=current_user.id,
        reminder_id=reminder_id,
        action_taken=data.action_taken,
    )
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res


@router.get("/history")
def get_reminder_history(
    current_user: CurrentUser,
    db: DBDep,
    days: int = Query(30, ge=1, le=90),
):
    """
    Fetch reminder execution history logs, completion rates, and breakdown.
    """
    return reminder_service.get_history(db=db, user_id=current_user.id, days=days)


@router.get("/check")
def check_due_reminders(current_user: CurrentUser, db: DBDep):
    """
    Check for active reminders that are due or scheduled for real-time notification triggers.
    """
    return reminder_service.check_due_reminders(db=db, user_id=current_user.id)

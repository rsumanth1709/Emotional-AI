"""
MindCare AI — Journal & Breathing Routes
"""
from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.journal import BreathingSession, JournalEntry
from app.models.user import User
from app.schemas.chat import (
    BreathingSessionCreate, BreathingSessionResponse,
    JournalCreate, JournalResponse,
)
from app.utils.security import get_current_active_user

router = APIRouter(prefix="/journal", tags=["Journal"])
breathing_router = APIRouter(prefix="/breathing", tags=["Breathing"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


# ── Journal Endpoints ──────────────────────────────────────────────────────

@router.get("", response_model=List[JournalResponse])
def list_entries(current_user: CurrentUser, db: DBDep):
    """List all journal entries for the authenticated user."""
    entries = (
        db.query(JournalEntry)
        .filter(JournalEntry.user_id == current_user.id)
        .order_by(JournalEntry.created_at.desc())
        .all()
    )
    return [JournalResponse.model_validate(e) for e in entries]


@router.post("", response_model=JournalResponse, status_code=201)
def create_entry(data: JournalCreate, current_user: CurrentUser, db: DBDep):
    """Create a new journal entry."""
    entry = JournalEntry(
        user_id=current_user.id,
        title=data.title,
        content=data.content,
        emotion_tag=data.emotion_tag,
        mood_score=data.mood_score,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return JournalResponse.model_validate(entry)


@router.delete("/{entry_id}", status_code=200)
def delete_entry(entry_id: str, current_user: CurrentUser, db: DBDep):
    """Delete a journal entry belonging to the authenticated user."""
    entry = (
        db.query(JournalEntry)
        .filter(JournalEntry.id == entry_id, JournalEntry.user_id == current_user.id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    db.delete(entry)
    db.commit()
    return {"message": "Journal entry deleted"}


# ── Breathing Session Endpoints ────────────────────────────────────────────

@breathing_router.post("", response_model=BreathingSessionResponse, status_code=201)
def log_breathing(data: BreathingSessionCreate, current_user: CurrentUser, db: DBDep):
    """Log a completed breathing session."""
    session = BreathingSession(
        user_id=current_user.id,
        duration_seconds=data.duration_seconds,
        technique=data.technique,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return BreathingSessionResponse.model_validate(session)


@breathing_router.get("", response_model=List[BreathingSessionResponse])
def list_breathing_sessions(current_user: CurrentUser, db: DBDep):
    """List all breathing sessions for the authenticated user."""
    sessions = (
        db.query(BreathingSession)
        .filter(BreathingSession.user_id == current_user.id)
        .order_by(BreathingSession.completed_at.desc())
        .limit(50)
        .all()
    )
    return [BreathingSessionResponse.model_validate(s) for s in sessions]

"""
MindCare AI — Journal & Breathing Routes
"""
import json
from datetime import datetime
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.journal import BreathingSession, JournalEntry
from app.models.user import User
from app.schemas.chat import (
    BreathingSessionCreate, BreathingSessionResponse,
    JournalCreate, JournalResponse, JournalUpdate,
    JournalAnalyzeRequest, JournalAnalyzeResponse,
    AIWritingSuggestionRequest, AIWritingSuggestionResponse,
    MonthlyInsightsResponse
)
from app.services.journal_service import journal_service
from app.services.gamification_service import gamification_service
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


@router.get("/search", response_model=List[JournalResponse])
def search_entries(
    current_user: CurrentUser,
    db: DBDep,
    q: Optional[str] = Query(None, description="Search keyword in title, content, or tags"),
    emotion: Optional[str] = Query(None, description="Filter by emotion tag"),
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD")
):
    """Search and filter journal entries."""
    results = journal_service.search_entries(
        db=db,
        user_id=current_user.id,
        query=q,
        emotion=emotion,
        start_date=start_date,
        end_date=end_date
    )
    return [JournalResponse.model_validate(e) for e in results]


@router.get("/monthly-insights", response_model=MonthlyInsightsResponse)
def get_monthly_insights(
    current_user: CurrentUser,
    db: DBDep,
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None)
):
    """Fetch monthly emotion analytics, trends, and AI retrospective."""
    now = datetime.utcnow()
    target_year = year if year else now.year
    target_month = month if month else now.month

    insights = journal_service.get_monthly_insights(
        db=db, user_id=current_user.id, year=target_year, month=target_month
    )
    return MonthlyInsightsResponse(**insights)


@router.post("/analyze", response_model=JournalAnalyzeResponse)
def analyze_journal(data: JournalAnalyzeRequest, current_user: CurrentUser):
    """Analyze journal text for emotion breakdown, sentiment, stress, and summary."""
    result = journal_service.analyze_journal_entry(content=data.content, title=data.title or "")
    return JournalAnalyzeResponse(**result)


@router.post("/suggestions", response_model=AIWritingSuggestionResponse)
def generate_suggestions(data: AIWritingSuggestionRequest, current_user: CurrentUser):
    """Generate AI writing suggestions (continuation, reframe, reflection, prompt)."""
    suggestion = journal_service.generate_writing_suggestions(
        content=data.content, suggestion_type=data.type, title=data.title or ""
    )
    return AIWritingSuggestionResponse(**suggestion)


@router.post("", response_model=JournalResponse, status_code=201)
def create_entry(data: JournalCreate, current_user: CurrentUser, db: DBDep):
    """Create a new journal entry with AI emotion analysis and summary."""
    entry_date = data.entry_date or datetime.utcnow().strftime("%Y-%m-%d")

    # If AI summary or analysis is missing, run auto-analysis
    summary = data.summary
    ai_analysis_str = data.ai_analysis
    emotion_tag = data.emotion_tag
    mood_score = data.mood_score
    tags = data.tags

    if not summary or not ai_analysis_str:
        ai_res = journal_service.analyze_journal_entry(content=data.content, title=data.title)
        if not summary:
            summary = ai_res["summary"]
        if not ai_analysis_str:
            ai_analysis_str = json.dumps(ai_res)
        if not emotion_tag or emotion_tag == "Neutral":
            emotion_tag = ai_res["emotion"]
        if mood_score == 5 and "mood_score" in ai_res:
            mood_score = ai_res["mood_score"]
        if not tags:
            tags = ",".join(ai_res.get("suggested_tags", []))

    entry = JournalEntry(
        user_id=current_user.id,
        title=data.title,
        content=data.content,
        emotion_tag=emotion_tag,
        mood_score=mood_score,
        summary=summary,
        ai_analysis=ai_analysis_str,
        tags=tags,
        entry_date=entry_date,
    )
    db.add(entry)
    db.commit()

    # Award Gamification XP for daily journaling
    try:
        gamification_service.award_xp(db, current_user.id, 30)
        gamification_service.check_and_complete_challenge(db, current_user.id, "journal")
    except Exception:
        pass

    db.refresh(entry)
    return JournalResponse.model_validate(entry)


@router.put("/{entry_id}", response_model=JournalResponse)
def update_entry(entry_id: str, data: JournalUpdate, current_user: CurrentUser, db: DBDep):
    """Update an existing journal entry."""
    entry = (
        db.query(JournalEntry)
        .filter(JournalEntry.id == entry_id, JournalEntry.user_id == current_user.id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")

    if data.title is not None:
        entry.title = data.title
    if data.content is not None:
        entry.content = data.content
    if data.emotion_tag is not None:
        entry.emotion_tag = data.emotion_tag
    if data.mood_score is not None:
        entry.mood_score = data.mood_score
    if data.summary is not None:
        entry.summary = data.summary
    if data.ai_analysis is not None:
        entry.ai_analysis = data.ai_analysis
    if data.tags is not None:
        entry.tags = data.tags
    if data.entry_date is not None:
        entry.entry_date = data.entry_date

    # If content changed and ai_analysis wasn't manually passed, re-run analysis
    if data.content is not None and data.ai_analysis is None:
        ai_res = journal_service.analyze_journal_entry(content=entry.content, title=entry.title)
        entry.summary = ai_res["summary"]
        entry.ai_analysis = json.dumps(ai_res)
        if data.emotion_tag is None:
            entry.emotion_tag = ai_res["emotion"]

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
    
    try:
        gamification_service.award_xp(db, current_user.id, 50)
        gamification_service.check_and_complete_challenge(db, current_user.id, "breath")
    except Exception:
        pass

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

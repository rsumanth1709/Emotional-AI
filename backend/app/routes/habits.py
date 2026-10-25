"""
MindCare AI — AI Habit Tracker Routes
API endpoints for managing healthy habits, toggling completion logs,
viewing streaks, analyzing emotional correlations, and receiving AI habit suggestions.
"""
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services.habit_service import habit_service
from app.utils.security import get_current_active_user

router = APIRouter(prefix="/habits", tags=["AI Habit Tracker"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


class HabitCreateRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=150)
    category: str = Field(..., pattern=r"^(mindfulness|physical|sleep|social|gratitude|custom)$")
    target_emotion: Optional[str] = "Neutral"
    icon_name: Optional[str] = "Sparkles"
    frequency: Optional[str] = "daily"


@router.get("")
def get_user_habits(current_user: CurrentUser, db: DBDep):
    """
    Fetch user's active habits, completion streaks, 7-day log matrix, AI habit suggestions based on mood,
    and emotional correlation analysis.
    """
    habits = habit_service.get_user_habits(db=db, user_id=current_user.id)
    suggestions = habit_service.suggest_habits_from_mood(db=db, user_id=current_user.id)
    correlations = habit_service.correlate_habits_with_emotions(db=db, user_id=current_user.id, days=30)

    return {
        "habits": habits,
        "ai_suggestions": suggestions,
        "correlations": correlations,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def create_habit(data: HabitCreateRequest, current_user: CurrentUser, db: DBDep):
    """
    Create a new healthy habit or adopt an AI mood-based suggestion.
    """
    h = habit_service.create_habit(
        db=db,
        user_id=current_user.id,
        title=data.title,
        category=data.category,
        target_emotion=data.target_emotion,
        icon_name=data.icon_name or "Sparkles",
        frequency=data.frequency or "daily",
    )
    return {
        "message": "Habit created successfully",
        "habit": {
            "id": h.id,
            "title": h.title,
            "category": h.category,
            "target_emotion": h.target_emotion,
            "current_streak": h.current_streak,
        },
    }


@router.post("/{habit_id}/toggle")
def toggle_habit_completion(habit_id: str, current_user: CurrentUser, db: DBDep):
    """
    Toggle daily completion status for a habit and recalculate streak metrics.
    """
    res = habit_service.toggle_habit_completion(db=db, user_id=current_user.id, habit_id=habit_id)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res


@router.delete("/{habit_id}")
def delete_habit(habit_id: str, current_user: CurrentUser, db: DBDep):
    """
    Delete or deactivate a healthy habit.
    """
    success = habit_service.delete_habit(db=db, user_id=current_user.id, habit_id=habit_id)
    if not success:
        raise HTTPException(status_code=404, detail="Habit not found")
    return {"message": "Habit deleted successfully"}


@router.get("/analytics")
def get_habit_analytics(
    current_user: CurrentUser,
    db: DBDep,
    days: int = Query(30, ge=7, le=90),
):
    """
    Fetch detailed emotional trend correlation analytics (Stress Reduction %, Mood Lift score).
    """
    return habit_service.correlate_habits_with_emotions(db=db, user_id=current_user.id, days=days)

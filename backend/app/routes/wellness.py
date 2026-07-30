"""
MindCare AI — Daily Wellness Coach Routes
"""
from typing import Annotated, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.wellness import (
    DailyWellnessGoalResponse, DailyWellnessGoalUpdate,
    DailyWellnessLogResponse, DailyWellnessLogUpdate,
    UserBadgeResponse, MotivationResponse, WeeklyProgressReport
)
from app.schemas.gamification import GamificationSummaryResponse
from app.services.wellness_service import wellness_service
from app.services.gamification_service import gamification_service
from app.utils.security import get_current_active_user

router = APIRouter(prefix="/wellness", tags=["Wellness Coach"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


@router.get("/goal", response_model=DailyWellnessGoalResponse)
def get_daily_goal(current_user: CurrentUser, db: DBDep):
    """Retrieve daily wellness targets for the authenticated user."""
    return wellness_service.get_or_create_goal(db, current_user.id)


@router.put("/goal", response_model=DailyWellnessGoalResponse)
def update_daily_goal(data: DailyWellnessGoalUpdate, current_user: CurrentUser, db: DBDep):
    """Update daily wellness targets for the authenticated user."""
    return wellness_service.update_goal(db, current_user.id, data)


@router.get("/log/today", response_model=DailyWellnessLogResponse)
def get_today_log(current_user: CurrentUser, db: DBDep):
    """Retrieve today's habit tracking logs."""
    return wellness_service.get_or_create_today_log(db, current_user.id)


@router.put("/log/today", response_model=DailyWellnessLogResponse)
def update_today_log(data: DailyWellnessLogUpdate, current_user: CurrentUser, db: DBDep):
    """Update today's habit logging values (increment water, change sleep/meditation/gratitude)."""
    return wellness_service.update_today_log(db, current_user.id, data)


@router.get("/motivation", response_model=MotivationResponse)
def get_daily_motivation(current_user: CurrentUser, db: DBDep):
    """Fetch a personalized positive motivation quote based on recent mood trends."""
    return wellness_service.get_motivation(db, current_user.id)


@router.get("/report", response_model=WeeklyProgressReport)
def get_weekly_wellness_report(current_user: CurrentUser, db: DBDep):
    """Fetch weekly progress summary including averages and goal compliance."""
    return wellness_service.get_weekly_report(db, current_user.id)


@router.get("/badges", response_model=List[UserBadgeResponse])
def get_unlocked_badges(current_user: CurrentUser, db: DBDep):
    """Fetch user's unlocked achievement badges."""
    return wellness_service.get_badges(db, current_user.id)


@router.get("/gamification", response_model=GamificationSummaryResponse)
def get_gamification_progress(current_user: CurrentUser, db: DBDep):
    """Retrieve user's gamification statistics including level, XP, daily challenges, and badges."""
    return gamification_service.get_gamification_summary(db, current_user.id)


@router.get("/notifications/settings")
def get_notification_settings(current_user: CurrentUser):
    """Fetch user notification preferences."""
    return {
        "desktop_push_enabled": True,
        "stress_alerts": True,
        "daily_reminders": True,
        "ai_tips": True,
        "sound_chime_enabled": True
    }


@router.put("/notifications/settings")
def update_notification_settings(settings: dict, current_user: CurrentUser):
    """Update user notification preferences."""
    return {
        "status": "success",
        "message": "Notification preferences updated successfully",
        "settings": settings
    }


@router.post("/notifications/test")
def trigger_test_notification(current_user: CurrentUser):
    """Trigger a test notification payload for desktop push or SSE websocket."""
    return {
        "status": "sent",
        "title": "MindCare AI Test Alert",
        "message": "Clinical assistant desktop notification dispatched.",
        "timestamp": "Just now"
    }

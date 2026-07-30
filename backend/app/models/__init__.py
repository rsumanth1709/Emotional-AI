"""MindCare AI — Models package — imports all models for Alembic discovery."""
from app.models.user import User
from app.models.chat import Chat
from app.models.emotion import EmotionRecord, MoodEntry
from app.models.journal import JournalEntry, BreathingSession, EmergencyAlert
from app.models.wellness import DailyWellnessGoal, DailyWellnessLog, UserBadge
from app.models.wearable import WearableLog
from app.models.feedback import UserFeedback
from app.models.goal import WellnessGoal, GoalMilestone
from app.models.reminder import SmartReminder, ReminderLog

__all__ = [
    "User", "Chat", "EmotionRecord", "MoodEntry",
    "JournalEntry", "BreathingSession", "EmergencyAlert",
    "DailyWellnessGoal", "DailyWellnessLog", "UserBadge",
    "WearableLog", "UserFeedback", "WellnessGoal", "GoalMilestone",
    "SmartReminder", "ReminderLog"
]

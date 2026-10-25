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
from app.models.habit import Habit, HabitLog
from app.models.cause import EmotionCauseTrigger
from app.models.security import AuditLog, ConsentRecord, DataRetentionPolicy, BackupRecord
from app.models.game import GameSession, MoodGardenState
from app.models.rbac import (
    Role, Permission, RolePermission, UserRole,
    ProfessionalProfile, ProfessionalAssignment, ProfessionalNote, RefreshToken
)

__all__ = [
    "User", "Chat", "EmotionRecord", "MoodEntry",
    "JournalEntry", "BreathingSession", "EmergencyAlert",
    "DailyWellnessGoal", "DailyWellnessLog", "UserBadge",
    "WearableLog", "UserFeedback", "WellnessGoal", "GoalMilestone",
    "SmartReminder", "ReminderLog", "Habit", "HabitLog",
    "EmotionCauseTrigger", "AuditLog", "ConsentRecord",
    "DataRetentionPolicy", "BackupRecord", "GameSession", "MoodGardenState",
    "Role", "Permission", "RolePermission", "UserRole",
    "ProfessionalProfile", "ProfessionalAssignment", "ProfessionalNote", "RefreshToken"
]

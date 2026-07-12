"""MindCare AI — Schemas package."""
from app.schemas.auth import UserCreate, UserLogin, UserUpdate, UserResponse, Token, TokenData
from app.schemas.chat import (
    ChatRequest, ChatResponse, EmotionResult, CrisisResource,
    ChatHistoryItem, SessionSummary, JournalCreate, JournalResponse,
    BreathingSessionCreate, BreathingSessionResponse,
)
from app.schemas.dashboard import (
    DashboardStats, EmotionDistribution, WeeklyMood, MonthlyTrend,
    DashboardResponse, AnalyticsResponse, AdminDashboardResponse,
)

__all__ = [
    "UserCreate", "UserLogin", "UserUpdate", "UserResponse", "Token", "TokenData",
    "ChatRequest", "ChatResponse", "EmotionResult", "CrisisResource",
    "ChatHistoryItem", "SessionSummary", "JournalCreate", "JournalResponse",
    "BreathingSessionCreate", "BreathingSessionResponse",
    "DashboardStats", "EmotionDistribution", "WeeklyMood", "MonthlyTrend",
    "DashboardResponse", "AnalyticsResponse", "AdminDashboardResponse",
]

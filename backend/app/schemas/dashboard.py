"""
MindCare AI — Dashboard Pydantic Schemas
"""
from typing import List, Optional
from pydantic import BaseModel

from app.schemas.chat import ChatHistoryItem


class DashboardStats(BaseModel):
    total_chats: int
    avg_mood_score: float          # 0–10
    most_frequent_emotion: str
    current_stress_level: float    # 0–10
    mental_wellness_score: float   # 0–100


class EmotionDistribution(BaseModel):
    emotion: str
    count: int
    percentage: float


class WeeklyMood(BaseModel):
    day: str                       # e.g. "Mon", "Tue"
    mood_score: float
    dominant_emotion: str


class MonthlyTrend(BaseModel):
    date: str                      # ISO date string
    mood_score: float


class DashboardResponse(BaseModel):
    stats: DashboardStats
    today_emotion: Optional[str]
    emotion_distribution: List[EmotionDistribution]
    weekly_mood: List[WeeklyMood]
    monthly_trend: List[MonthlyTrend]
    recent_chats: List[ChatHistoryItem]


class AnalyticsResponse(BaseModel):
    emotion_distribution: List[EmotionDistribution]
    weekly_mood: List[WeeklyMood]
    monthly_trend: List[MonthlyTrend]
    total_sessions: int
    avg_stress: float
    avg_mood: float
    most_frequent_emotion: str


class AdminUserRow(BaseModel):
    id: str
    email: str
    username: str
    full_name: Optional[str]
    is_active: bool
    is_admin: bool
    chat_count: int
    created_at: str


class AdminAlertRow(BaseModel):
    id: str
    user_id: str
    username: str
    trigger_message: str
    flagged_keywords: Optional[str]
    severity: str
    resolved: bool
    created_at: str


class AdminDashboardResponse(BaseModel):
    total_users: int
    total_chats: int
    crisis_alerts_today: int
    users: List[AdminUserRow]
    alerts: List[AdminAlertRow]

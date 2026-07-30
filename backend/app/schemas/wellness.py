"""
MindCare AI — Daily Wellness Pydantic Schemas
"""
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import date, datetime

# ── Goal Schemas ──
class DailyWellnessGoalBase(BaseModel):
    water_target_ml: int = Field(2000, description="Target water intake in ml")
    sleep_target_hours: float = Field(8.0, description="Target sleep in hours")
    exercise_target_mins: int = Field(30, description="Target exercise in minutes")
    meditation_target_mins: int = Field(10, description="Target meditation in minutes")

class DailyWellnessGoalUpdate(BaseModel):
    water_target_ml: Optional[int] = None
    sleep_target_hours: Optional[float] = None
    exercise_target_mins: Optional[int] = None
    meditation_target_mins: Optional[int] = None

class DailyWellnessGoalResponse(DailyWellnessGoalBase):
    id: str
    user_id: str
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Log Schemas ──
class DailyWellnessLogBase(BaseModel):
    water_intake_ml: int = 0
    sleep_hours: float = 0.0
    sleep_quality: Optional[str] = None
    exercise_mins: int = 0
    exercise_type: Optional[str] = None
    meditation_mins: int = 0
    gratitude_1: Optional[str] = None
    gratitude_2: Optional[str] = None
    gratitude_3: Optional[str] = None

class DailyWellnessLogUpdate(BaseModel):
    water_intake_ml: Optional[int] = None
    sleep_hours: Optional[float] = None
    sleep_quality: Optional[str] = None
    exercise_mins: Optional[int] = None
    exercise_type: Optional[str] = None
    meditation_mins: Optional[int] = None
    gratitude_1: Optional[str] = None
    gratitude_2: Optional[str] = None
    gratitude_3: Optional[str] = None

class DailyWellnessLogResponse(DailyWellnessLogBase):
    id: str
    user_id: str
    date: date
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Badge Schemas ──
class UserBadgeResponse(BaseModel):
    id: str
    user_id: str
    badge_name: str
    badge_type: str
    unlocked_at: datetime

    class Config:
        from_attributes = True


# ── Motivation Schemas ──
class MotivationResponse(BaseModel):
    quote: str
    author: str
    category: str


# ── Weekly Report Schemas ──
class WeeklyProgressReport(BaseModel):
    average_water_ml: float
    average_sleep_hours: float
    average_exercise_mins: float
    average_meditation_mins: float
    goals_met_count: int
    total_goals_tracked: int
    compliance_percentage: float
    active_days_count: int
    streak_count: int

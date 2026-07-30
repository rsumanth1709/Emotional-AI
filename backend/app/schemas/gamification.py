"""
MindCare AI — Gamification Schemas
"""
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

class ChallengeItem(BaseModel):
    key: str
    name: str
    description: str
    reward_xp: int
    completed: bool

class BadgeItem(BaseModel):
    badge_name: str
    badge_type: str
    unlocked_at: datetime
    description: str

class GamificationSummaryResponse(BaseModel):
    xp: int
    level: int
    next_level_xp: int
    level_progress_percentage: float
    current_streak: int
    longest_streak: int
    daily_challenges: List[ChallengeItem]
    weekly_reward_completed: bool
    unlocked_badges: List[BadgeItem]

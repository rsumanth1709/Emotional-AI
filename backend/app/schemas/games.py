"""
MindCare AI — Game API Schemas
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class GameSessionCreate(BaseModel):
    game_slug: str = Field(default="emotion-detective")
    score: int = Field(ge=0, description="Final score earned (e.g. 10 points per correct answer)")
    total_questions: int = Field(ge=1, default=10)
    correct_count: int = Field(ge=0, default=0)
    difficulty: str = Field(default="all")
    duration_seconds: Optional[int] = Field(default=0, ge=0)


class GameSessionResponse(BaseModel):
    id: str
    user_id: str
    game_slug: str
    score: int
    total_questions: int
    correct_count: int
    difficulty: str
    duration_seconds: int
    completed_at: datetime
    xp_awarded: int = 0
    new_total_xp: int = 0
    current_level: int = 1

    class Config:
        from_attributes = True


class GameHistoryResponse(BaseModel):
    items: List[GameSessionResponse]
    total_sessions: int
    high_score: int
    total_score: int


class MoodGardenSaveRequest(BaseModel):
    plots: List[dict] = Field(default_factory=list)
    inventory: dict = Field(default_factory=dict)
    activity_history: List[dict] = Field(default_factory=list)
    total_nurtures: int = Field(default=0, ge=0)


class MoodGardenResponse(BaseModel):
    id: str
    user_id: str
    plots: List[dict]
    inventory: dict
    activity_history: List[dict]
    total_nurtures: int
    updated_at: datetime

    class Config:
        from_attributes = True


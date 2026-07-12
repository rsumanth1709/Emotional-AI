"""
MindCare AI — Chat Pydantic Schemas
"""
from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    session_id: Optional[str] = None  # Auto-generated if not provided


class EmotionResult(BaseModel):
    emotion: str                          # e.g. "Anxiety"
    sentiment: str                        # "positive" | "negative" | "neutral"
    stress_score: float                   # 0.0 – 10.0
    confidence: float                     # 0.0 – 1.0
    all_scores: Dict[str, float]          # All emotion → score


class CrisisResource(BaseModel):
    name: str
    number: str
    description: str


class ChatResponse(BaseModel):
    message_id: str
    session_id: str
    response: str
    emotion_result: EmotionResult
    is_crisis: bool = False
    crisis_resources: Optional[List[CrisisResource]] = None
    timestamp: datetime


class ChatHistoryItem(BaseModel):
    id: str
    role: str
    content: str
    emotion: Optional[str]
    sentiment: Optional[str]
    stress_score: Optional[float]
    confidence: Optional[float]
    is_crisis: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class SessionSummary(BaseModel):
    session_id: str
    message_count: int
    last_message: str
    last_emotion: Optional[str]
    last_active: datetime


class JournalCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    emotion_tag: Optional[str] = None
    mood_score: int = Field(5, ge=1, le=10)


class JournalResponse(BaseModel):
    id: str
    title: str
    content: str
    emotion_tag: Optional[str]
    mood_score: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BreathingSessionCreate(BaseModel):
    duration_seconds: int = Field(..., ge=10, le=3600)
    technique: str = Field("deep", pattern=r"^(box|4-7-8|deep)$")


class BreathingSessionResponse(BaseModel):
    id: str
    duration_seconds: int
    technique: str
    completed_at: datetime

    model_config = {"from_attributes": True}

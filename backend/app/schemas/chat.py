"""
MindCare AI — Chat Pydantic Schemas
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    session_id: Optional[str] = None  # Auto-generated if not provided
    persona: Optional[str] = "friendly"


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
    crisis_severity: Optional[str] = None
    crisis_type: Optional[str] = None
    crisis_resources: Optional[List[CrisisResource]] = None
    persona: Optional[str] = "friendly"
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
    persona: Optional[str] = "friendly"
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
    summary: Optional[str] = None
    ai_analysis: Optional[str] = None
    tags: Optional[str] = None
    entry_date: Optional[str] = None


class JournalUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    emotion_tag: Optional[str] = None
    mood_score: Optional[int] = Field(None, ge=1, le=10)
    summary: Optional[str] = None
    ai_analysis: Optional[str] = None
    tags: Optional[str] = None
    entry_date: Optional[str] = None


class JournalResponse(BaseModel):
    id: str
    title: str
    content: str
    emotion_tag: Optional[str]
    mood_score: int
    summary: Optional[str] = None
    ai_analysis: Optional[str] = None
    tags: Optional[str] = None
    entry_date: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class JournalAnalyzeRequest(BaseModel):
    title: Optional[str] = ""
    content: str = Field(..., min_length=1)


class JournalAnalyzeResponse(BaseModel):
    emotion: str
    confidence: float
    sentiment: str
    stress_score: float
    all_scores: Dict[str, float]
    summary: str
    keywords: List[str]
    suggested_tags: List[str]
    mood_score: int


class AIWritingSuggestionRequest(BaseModel):
    title: Optional[str] = ""
    content: str = Field(..., min_length=0)
    type: str = Field("continue", pattern=r"^(continue|reframe|reflect|prompt)$")


class AIWritingSuggestionResponse(BaseModel):
    suggestion_type: str
    title: str
    text: str
    reflection_questions: Optional[List[str]] = None


class DailyMoodTimelineItem(BaseModel):
    date: str
    mood_score: float
    dominant_emotion: str
    entry_count: int


class MonthlyInsightsResponse(BaseModel):
    year: int
    month: int
    total_entries: int
    current_streak: int
    avg_mood_score: float
    dominant_emotion: str
    emotion_distribution: List[Dict[str, Any]]
    daily_timeline: List[DailyMoodTimelineItem]
    ai_retrospective: str
    growth_highlights: List[str]
    self_care_tips: List[str]


class BreathingSessionCreate(BaseModel):
    duration_seconds: int = Field(..., ge=10, le=3600)
    technique: str = Field("deep", pattern=r"^(box|4-7-8|deep)$")


class BreathingSessionResponse(BaseModel):
    id: str
    duration_seconds: int
    technique: str
    completed_at: datetime

    model_config = {"from_attributes": True}


# ── Predictive AI Schemas ──────────────────────────────────────────────────

class TomorrowPrediction(BaseModel):
    predicted_mood: float
    predicted_emotion: str
    stress_probability: float
    stress_risk_level: str
    confidence_min: float
    confidence_max: float
    trend_direction: str


class DayForecastItem(BaseModel):
    date: str
    day_name: str
    predicted_mood: float
    dominant_emotion: str
    stress_probability: float
    confidence_min: float
    confidence_max: float


class PredictiveInsightItem(BaseModel):
    title: str
    description: str
    type: str  # "tip" | "warning" | "insight"


class PredictiveForecastResponse(BaseModel):
    tomorrow: TomorrowPrediction
    weekly_forecast: List[DayForecastItem]
    insights: List[PredictiveInsightItem]
    model_metadata: Dict[str, Any]

    model_config = {"protected_namespaces": ()}

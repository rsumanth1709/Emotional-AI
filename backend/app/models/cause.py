"""
MindCare AI — Emotion Cause Detection ORM Models
Tracks extracted emotional triggers, categories (work, family, health, studies, finances, relationships),
recurrence frequency, and sample conversation excerpts.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, Float, JSON
from sqlalchemy.orm import relationship

from app.database import Base


class EmotionCauseTrigger(Base):
    """Extracted emotional cause/trigger linked to a user."""
    __tablename__ = "emotion_cause_triggers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    emotion = Column(String, nullable=False)  # "Anxiety", "Stress", "Sad", "Angry", "Fear"
    category = Column(String, nullable=False) # "work", "family", "health", "studies", "finances", "relationships", "lifestyle"
    cause_phrase = Column(String, nullable=False)
    confidence_score = Column(Float, default=0.85)
    frequency_count = Column(Integer, default=1)
    last_occurred = Column(DateTime, default=datetime.utcnow)
    sample_quotes = Column(JSON, default=list)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")

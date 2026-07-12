"""
MindCare AI — Emotion & Mood ORM Models
"""
import uuid
from datetime import date, datetime

from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, String
from sqlalchemy.orm import relationship

from app.database import Base


class EmotionRecord(Base):
    """Per-message emotion snapshot saved after every chat interaction."""
    __tablename__ = "emotion_records"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    emotion = Column(String, nullable=False)
    sentiment = Column(String, nullable=False)
    stress_score = Column(Float, nullable=False)   # 0.0 – 10.0
    confidence = Column(Float, nullable=False)     # 0.0 – 1.0
    recorded_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="emotion_records")


class MoodEntry(Base):
    """Daily mood summary — one row per user per day."""
    __tablename__ = "mood_entries"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, default=date.today, index=True)
    dominant_emotion = Column(String, nullable=False)
    avg_stress_score = Column(Float, nullable=False)
    mood_score = Column(Float, nullable=False)     # 0.0 – 10.0 (10 = best)

    user = relationship("User", back_populates="mood_entries")

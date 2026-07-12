"""
MindCare AI — Journal, Breathing, Emergency ORM Models
"""
import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    emotion_tag = Column(String, nullable=True)
    mood_score = Column(Integer, nullable=False, default=5)  # 1–10
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="journal_entries")


class BreathingSession(Base):
    __tablename__ = "breathing_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    duration_seconds = Column(Integer, nullable=False)
    technique = Column(String, nullable=False, default="deep")  # 'box', '4-7-8', 'deep'
    completed_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="breathing_sessions")


class EmergencyAlert(Base):
    """Logged whenever the crisis detector fires for a user message."""
    __tablename__ = "emergency_alerts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    trigger_message = Column(Text, nullable=False)
    flagged_keywords = Column(String, nullable=True)   # comma-separated
    severity = Column(String, nullable=False, default="high")
    resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="emergency_alerts")

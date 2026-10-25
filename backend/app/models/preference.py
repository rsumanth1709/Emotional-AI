"""
MindCare AI — User Response-Preference Learning System ORM Models
Stores key-value user preferences, source tracking, learning confidence, preference audit history, and response feedback.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Boolean, JSON, Text
from sqlalchemy.orm import relationship

from app.database import Base


class UserResponsePreference(Base):
    """User communication and response preferences."""
    __tablename__ = "user_response_preferences"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    preference_key = Column(String, nullable=False, index=True)          # response_length, tone, advice_preference, wellness_activities, language, persona
    preference_value = Column(JSON, nullable=False)                      # String value or JSON list for multi-select
    source = Column(String, default="explicit_setting")                 # explicit_setting, explicit_feedback, learned_feedback, default
    confidence = Column(Float, default=1.0)                             # 0.0 to 1.0
    strength = Column(String, default="strong")                         # weak, moderate, strong
    is_explicit = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class UserPreferenceHistory(Base):
    """Audit log of preference updates and source changes."""
    __tablename__ = "user_preference_history"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    preference_key = Column(String, nullable=False)
    old_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=False)
    change_source = Column(String, default="explicit_setting")
    changed_at = Column(DateTime, default=datetime.utcnow, index=True)


class ResponseFeedback(Base):
    """Structured explicit user feedback submitted for AI responses."""
    __tablename__ = "response_feedback"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    conversation_id = Column(String, nullable=True)
    message_id = Column(String, nullable=True)
    feedback_type = Column(String, nullable=False, index=True)          # response_too_long, response_too_short, tone_preference, advice_preference, language_preference, persona_preference, activity_preference, helpful, not_helpful
    feedback_value = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

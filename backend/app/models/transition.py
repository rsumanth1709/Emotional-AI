"""
MindCare AI — Emotion Transition Detection System ORM Models
Stores conversation-turn emotion states, detected transitions, volatility measurements,
sudden emotional changes, and prolonged negative emotional periods.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Boolean, JSON, Text
from sqlalchemy.orm import relationship

from app.database import Base


class ConversationEmotionState(Base):
    """Emotion state associated with each conversation turn."""
    __tablename__ = "conversation_emotion_states"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    conversation_id = Column(String, nullable=False, index=True)
    message_id = Column(String, nullable=True, index=True)
    turn_number = Column(Integer, nullable=False, index=True)
    emotion = Column(String, nullable=False)                             # e.g. neutral, stress, anxiety, sadness, joy
    intensity = Column(Float, default=50.0)                              # 0 to 100
    confidence = Column(Float, default=0.90)                             # 0.0 to 1.0
    valence = Column(Float, default=0.0)                                 # -1.0 to +1.0
    model_id = Column(String, default="emotion-transition-v1")
    model_version = Column(String, default="1.0")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class EmotionTransitionRecord(Base):
    """Detected transition event between two conversation turns."""
    __tablename__ = "emotion_transition_records"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    conversation_id = Column(String, nullable=False, index=True)
    from_turn = Column(Integer, nullable=False)
    to_turn = Column(Integer, nullable=False)
    from_emotion = Column(String, nullable=False)
    to_emotion = Column(String, nullable=False)
    transition_type = Column(String, default="negative_transition")     # positive_transition, negative_transition, neutral_transition, sudden_transition
    transition_strength = Column(Float, default=0.75)                    # 0.0 to 1.0
    intensity_change = Column(Float, default=15.0)                       # Difference in intensity
    confidence = Column(Float, default=0.88)
    is_sudden_change = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class ProlongedNegativePeriod(Base):
    """Sustained sequence of negative emotional states."""
    __tablename__ = "prolonged_negative_periods"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    conversation_id = Column(String, nullable=False, index=True)
    start_turn = Column(Integer, nullable=False)
    end_turn = Column(Integer, nullable=False)
    turn_count = Column(Integer, nullable=False)
    duration_minutes = Column(Float, default=15.0)
    average_intensity = Column(Float, default=68.0)
    emotions = Column(JSON, default=list)                                # List of emotions in period
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

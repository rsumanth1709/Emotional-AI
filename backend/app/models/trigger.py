"""
MindCare AI — Emotional Trigger Detection Module ORM Models
Stores emotional triggers, occurrences, user status lifecycle (ai_inferred vs user_confirmed vs rejected),
evidence phrases, and recurring trigger-emotion relationships.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Boolean, JSON, Text
from sqlalchemy.orm import relationship

from app.database import Base


class EmotionalTrigger(Base):
    """Core Emotional Trigger Definition Record."""
    __tablename__ = "emotional_triggers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    conversation_id = Column(String, nullable=True, index=True)
    message_id = Column(String, nullable=True, index=True)
    category = Column(String, nullable=False, index=True)               # e.g. academics, work, relationships, family, financial_concerns, etc.
    description = Column(String, nullable=False)                         # e.g. "upcoming exam"
    normalized_description = Column(String, nullable=False, index=True)  # e.g. "upcoming exam"
    emotion = Column(String, nullable=False, index=True)                 # e.g. stress, anxiety, sadness
    emotion_intensity = Column(Float, default=50.0)                      # 0 to 100
    confidence = Column(Float, default=0.85)                             # 0.0 to 1.0
    source = Column(String, default="ai_inferred")                        # ai_inferred, user, user_edited
    status = Column(String, default="unconfirmed", index=True)            # unconfirmed, confirmed_by_user, user_created, user_edited, rejected, deleted
    evidence = Column(JSON, default=dict)                                # e.g. {"text": "exam tomorrow", "message_id": "msg_01"}
    reason = Column(Text, nullable=True)                                 # Explanation for inference
    model_id = Column(String, default="trigger-detector-v1")
    model_version = Column(String, default="1.0")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow)
    confirmed_at = Column(DateTime, nullable=True)
    deleted_at = Column(DateTime, nullable=True)


class EmotionalTriggerOccurrence(Base):
    """Occurrence instance of a trigger per conversation turn."""
    __tablename__ = "emotional_trigger_occurrences"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    trigger_id = Column(String, ForeignKey("emotional_triggers.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, nullable=False, index=True)
    conversation_id = Column(String, nullable=False, index=True)
    message_id = Column(String, nullable=True, index=True)
    emotion = Column(String, nullable=False)
    intensity = Column(Float, default=50.0)
    confidence = Column(Float, default=0.85)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

"""
MindCare AI — Automated Conversation Quality Evaluation System ORM Models
Stores turn-by-turn response quality evaluations across 7 dimensions:
Empathy, Relevance, Helpfulness, Safety, Factual Reliability, Repetition, and Tone Appropriateness.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Boolean, JSON, Text
from sqlalchemy.orm import relationship

from app.database import Base


class ConversationQualityEvaluation(Base):
    """Evaluation record for a generated AI response prior to delivery."""
    __tablename__ = "conversation_quality_evaluations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    conversation_id = Column(String, nullable=False, index=True)
    message_id = Column(String, nullable=True, index=True)
    
    # 7 Core Dimension Scores (0 - 100)
    empathy = Column(Float, default=90.0)
    relevance = Column(Float, default=90.0)
    helpfulness = Column(Float, default=90.0)
    safety = Column(Float, default=98.0)
    factual_reliability = Column(Float, default=90.0)
    repetition = Column(Float, default=95.0)
    tone_appropriateness = Column(Float, default=90.0)
    
    overall_score = Column(Float, default=91.0)
    status = Column(String, default="pass", index=True)                # pass, fail, unsafe
    safety_passed = Column(Boolean, default=True)
    regeneration_count = Column(Integer, default=0)
    used_fallback = Column(Boolean, default=False)
    
    selected_personality = Column(String, default="supportive_friend")
    evaluation_metadata = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

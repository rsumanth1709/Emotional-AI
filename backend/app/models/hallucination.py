"""
MindCare AI — Hallucination and Unsupported-Claim Detection Layer ORM Models
Stores claim extractions, claim classification (medical_claim, statistical_claim, study_claim, conversational),
evidence verification status (supported, unsupported, refuted, uncertain), hallucination score, and rewritten text.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Boolean, JSON, Text
from sqlalchemy.orm import relationship

from app.database import Base


class HallucinationDetectionRecord(Base):
    """Audit record for hallucination and claim verification per generated response."""
    __tablename__ = "hallucination_detection_records"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    conversation_id = Column(String, nullable=False, index=True)
    message_id = Column(String, nullable=True, index=True)
    
    original_text = Column(Text, nullable=False)
    delivered_text = Column(Text, nullable=False)
    claims_detected = Column(JSON, default=list)                         # List of extracted claims with classification & verification status
    hallucination_score = Column(Float, default=0.0)                    # 0.0 (None) to 1.0 (High)
    hallucination_severity = Column(String, default="none", index=True)  # none, low, moderate, high
    has_hallucination = Column(Boolean, default=False)
    was_rewritten = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

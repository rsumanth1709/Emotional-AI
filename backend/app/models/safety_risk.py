"""
MindCare AI — Mental Health Safety Risk Engine ORM Models
Stores safety assessments, risk transitions, audit events, and verified emergency resources.
Does not store raw sensitive conversation text or diagnostic labels.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, Integer, String, Boolean, JSON

from app.database import Base


class SafetyAssessment(Base):
    """Assessment record capturing structured safety risk signals and classification."""
    __tablename__ = "safety_assessments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    pseudonymous_user_id = Column(String, nullable=False, index=True)
    conversation_id = Column(String, nullable=False, index=True)
    risk_level = Column(String, nullable=False, index=True)          # SAFE, CONCERNING, HIGH_RISK, IMMEDIATE_RISK
    confidence = Column(Float, default=1.0)
    risk_score = Column(Float, default=0.0)                          # 0.0 to 100.0
    signals = Column(JSON, default=dict)                             # extracted signal weights
    model_version = Column(String, default="safety-engine-v2.0")
    policy_version = Column(String, default="policy-v2.0")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class SafetyTransition(Base):
    """Tracks transitions in safety risk levels across conversation turns."""
    __tablename__ = "safety_transitions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String, nullable=False, index=True)
    previous_level = Column(String, nullable=False)
    current_level = Column(String, nullable=False)
    transition_type = Column(String, nullable=False, index=True)     # ESCALATION, DEESCALATION, STABLE, RAPID_ESCALATION
    confidence = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)


class SafetyEvent(Base):
    """Immutable audit trail for safety flow activations and policy overrides."""
    __tablename__ = "safety_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String, nullable=False, index=True)
    event_type = Column(String, nullable=False, index=True)          # RISK_ESCALATION, SAFETY_FLOW_ACTIVATED, RESOURCE_PRESENTED
    risk_level = Column(String, nullable=False, index=True)
    action_taken = Column(String, nullable=False)                    # ROUTED_SUPPORTIVE, OVERRODE_NORMAL_CHAT, DISPATCHED_HELPLINE
    model_version = Column(String, default="safety-engine-v2.0")
    policy_version = Column(String, default="policy-v2.0")
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)


class EmergencyResource(Base):
    """Verified regional crisis helplines and emergency resources."""
    __tablename__ = "emergency_resources"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    country = Column(String, nullable=False, index=True)             # US, IN, UK, INTL
    region = Column(String, default="ALL", index=True)
    name = Column(String, nullable=False)
    resource_type = Column(String, default="helpline")               # helpline, text, emergency
    phone = Column(String, nullable=False)
    website = Column(String, nullable=True)
    languages = Column(JSON, default=list)
    source = Column(String, default="official_government")
    verified_at = Column(DateTime, default=datetime.utcnow)
    active = Column(Boolean, default=True, index=True)

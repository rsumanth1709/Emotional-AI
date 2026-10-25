"""
MindCare AI — LLM Security Layer ORM Models
Stores security audit logs, rate limit counters, and abuse risk scores.
No raw user message content or real secrets are stored in these records.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, Integer, String, Boolean, JSON

from app.database import Base


class LLMSecurityEvent(Base):
    """Immutable audit trail for security incidents and LLM threat detections."""
    __tablename__ = "llm_security_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    event_type = Column(String, nullable=False, index=True)          # PROMPT_INJECTION, JAILBREAK, SYSTEM_EXTRACTION, SECRET_LEAK, TOOL_BLOCKED
    severity = Column(String, default="MEDIUM", index=True)          # LOW, MEDIUM, HIGH, CRITICAL
    user_reference = Column(String, nullable=False, index=True)       # Pseudonymous ID or anonymous session
    model_name = Column(String, default="gemini-1.5-pro")
    action_taken = Column(String, default="BLOCKED", index=True)      # BLOCKED, REDACTED, WARNED, REGENERATED
    sanitized_metadata = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class RateLimitRecord(Base):
    """Tracks sliding window rate limits and token usage per user/session."""
    __tablename__ = "rate_limit_records"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    client_identifier = Column(String, nullable=False, index=True)
    endpoint = Column(String, nullable=False, index=True)
    window_start = Column(DateTime, nullable=False, index=True)
    request_count = Column(Integer, default=1)
    token_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class AbuseRiskScore(Base):
    """Tracks cumulative security risk scores and security states (normal, suspicious, restricted, blocked)."""
    __tablename__ = "abuse_risk_scores"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_reference = Column(String, nullable=False, unique=True, index=True)
    risk_score = Column(Float, default=0.0)                          # 0.0 to 100.0
    security_state = Column(String, default="normal", index=True)     # normal, suspicious, restricted, blocked
    incident_count = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

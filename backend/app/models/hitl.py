"""
MindCare AI — Human-in-the-Loop (HITL) Architecture ORM Models
Stores review cases, assignments, decisions, annotations, consent records, and immutable audit logs.
Preserves complete separation between AI assessments and human reviews.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, Integer, String, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class ReviewCase(Base):
    """Review case representing an AI-flagged conversation requiring human oversight."""
    __tablename__ = "review_cases"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String, nullable=False, index=True)
    pseudonymous_user_id = Column(String, nullable=False, index=True)
    trigger = Column(String, nullable=False, index=True)              # HIGH_RISK, LOW_CONFIDENCE, DISAGREEMENT
    priority = Column(String, default="HIGH", index=True)             # CRITICAL, HIGH, MEDIUM, LOW
    ai_risk_level = Column(String, nullable=False)
    ai_confidence = Column(Float, default=1.0)
    consent_status = Column(String, default="GRANTED", index=True)     # GRANTED, DENIED, PENDING, EXPIRED
    status = Column(String, default="PENDING", index=True)            # PENDING, ASSIGNED, IN_REVIEW, COMPLETED, REJECTED, ESCALATED
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    assignments = relationship("ReviewAssignment", back_populates="case", cascade="all, delete-orphan")
    decisions = relationship("ReviewDecision", back_populates="case", cascade="all, delete-orphan")
    annotations = relationship("ReviewAnnotation", back_populates="case", cascade="all, delete-orphan")


class ReviewAssignment(Base):
    """Reviewer assignment to a review case."""
    __tablename__ = "review_assignments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    review_id = Column(String, ForeignKey("review_cases.id"), nullable=False, index=True)
    reviewer_id = Column(String, nullable=False, index=True)
    assigned_by = Column(String, nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    status = Column(String, default="ASSIGNED", index=True)           # ASSIGNED, COMPLETED, REASSIGNED

    case = relationship("ReviewCase", back_populates="assignments")


class ReviewDecision(Base):
    """Human review decision, separate from the original AI prediction."""
    __tablename__ = "review_decisions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    review_id = Column(String, ForeignKey("review_cases.id"), nullable=False, index=True)
    reviewer_id = Column(String, nullable=False, index=True)
    ai_risk_level = Column(String, nullable=False)
    human_risk_level = Column(String, nullable=False)
    decision = Column(String, nullable=False, index=True)             # APPROVE, REJECT, ESCALATE
    reason = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    case = relationship("ReviewCase", back_populates="decisions")


class ReviewAnnotation(Base):
    """Structured notes and annotations added by human reviewers."""
    __tablename__ = "review_annotations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    review_id = Column(String, ForeignKey("review_cases.id"), nullable=False, index=True)
    reviewer_id = Column(String, nullable=False, index=True)
    annotation_type = Column(String, default="risk_context")
    content = Column(String, nullable=False)
    visibility = Column(String, default="internal")                  # internal, senior_only
    created_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("ReviewCase", back_populates="annotations")


class ReviewConsent(Base):
    """Granular user consent record for human review of conversation context."""
    __tablename__ = "review_consents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    consent_type = Column(String, default="human_safety_review", index=True)
    status = Column(String, default="GRANTED", index=True)            # GRANTED, DENIED, REVOKED
    granted_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    revoked_at = Column(DateTime, nullable=True)


class HITLAuditLog(Base):
    """Immutable audit trail of all reviewer access and actions."""
    __tablename__ = "hitl_audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    review_id = Column(String, nullable=False, index=True)
    actor_id = Column(String, nullable=False, index=True)
    actor_role = Column(String, nullable=False)
    action = Column(String, nullable=False, index=True)              # CONTEXT_ACCESSED, APPROVED, REJECTED, ESCALATED
    resource_id = Column(String, nullable=True)
    authorization_result = Column(String, default="ALLOWED")
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

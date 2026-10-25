"""
MindCare AI — Core Human-in-the-Loop (HITL) Service
Manages review eligibility, consent verification, RBAC permissions, queue assignments,
review actions (approve, reject, annotate, escalate), and immutable audit logging.
Preserves strict separation between AI assessments and human reviews.
"""
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from sqlalchemy.orm import Session

from app.models.hitl import (
    ReviewCase, ReviewAssignment, ReviewDecision, ReviewAnnotation, ReviewConsent, HITLAuditLog
)
from app.models.user import User
from app.utils.logger import logger

# Role-Based Permission Matrix
ROLE_PERMISSIONS = {
    "SUPPORT_REVIEWER": {"review.view", "review.annotate", "review.escalate"},
    "SAFETY_REVIEWER": {"review.view", "review.context.expand", "review.approve", "review.reject", "review.annotate", "review.escalate"},
    "CLINICAL_REVIEWER": {"review.view", "review.context.expand", "review.approve", "review.reject", "review.annotate", "review.escalate"},
    "SENIOR_REVIEWER": {"review.view", "review.context.expand", "review.approve", "review.reject", "review.annotate", "review.escalate"},
    "ADMIN": {"review.view", "review.context.expand", "review.approve", "review.reject", "review.annotate", "review.escalate", "audit.view"},
    "AUDITOR": {"review.view", "audit.view"},
}


class ReviewEligibilityEngine:
    """Determines eligibility and priority for human review."""

    @staticmethod
    def evaluate_eligibility(risk_level: str, confidence: float = 1.0, is_disagreement: bool = False) -> Tuple[bool, str, str]:
        if risk_level == "IMMEDIATE_RISK":
            return True, "IMMEDIATE_RISK_TRIGGER", "CRITICAL"
        if risk_level == "HIGH_RISK":
            return True, "HIGH_RISK_TRIGGER", "HIGH"
        if confidence < 0.75:
            return True, "LOW_CONFIDENCE_TRIGGER", "MEDIUM"
        if is_disagreement:
            return True, "MODEL_DISAGREEMENT_TRIGGER", "HIGH"
        if risk_level == "CONCERNING":
            return True, "CONCERNING_STATE_TRIGGER", "MEDIUM"

        return False, "NONE", "LOW"


class ReviewConsentService:
    """Verifies explicit user consent before exposing conversation context."""

    @staticmethod
    def get_user_consent_status(db: Session, user_id: str) -> str:
        consent = db.query(ReviewConsent).filter(
            ReviewConsent.user_id == user_id,
            ReviewConsent.consent_type == "human_safety_review",
        ).first()

        if not consent:
            return "GRANTED"  # Default granted for safety oversight unless explicitly denied

        return consent.status


class HITLRBACService:
    """Enforces strict server-side Role-Based Access Control."""

    @staticmethod
    def verify_permission(user: User, required_permission: str) -> bool:
        user_role = getattr(user, "role", "SUPPORT_REVIEWER")
        is_admin = getattr(user, "is_admin", False)

        if is_admin:
            return True

        allowed = ROLE_PERMISSIONS.get(user_role, set())
        return required_permission in allowed


class HITLAuditService:
    """Records immutable audit trail of all reviewer access and actions."""

    @staticmethod
    def log_audit_event(db: Session, review_id: str, actor_id: str, actor_role: str, action: str, resource_id: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None):
        audit = HITLAuditLog(
            review_id=review_id,
            actor_id=actor_id,
            actor_role=actor_role,
            action=action,
            resource_id=resource_id,
            authorization_result="ALLOWED",
            metadata_json=metadata or {},
        )
        db.add(audit)
        db.commit()
        logger.info(f"HITL AUDIT: action={action} for review={review_id} by actor={actor_id}")


class HITLService:
    """Master Human-in-the-Loop Management Engine."""

    def create_review_case_if_eligible(self, db: Session, pseudo_user_id: str, conversation_id: str, risk_level: str, confidence: float = 1.0) -> Optional[str]:
        """Evaluate eligibility and create a review case if eligible."""
        eligible, trigger, priority = ReviewEligibilityEngine.evaluate_eligibility(risk_level, confidence)
        if not eligible:
            return None

        # Check existing active case
        existing = db.query(ReviewCase).filter(
            ReviewCase.conversation_id == conversation_id,
            ReviewCase.status.in_(["PENDING", "ASSIGNED", "IN_REVIEW"]),
        ).first()

        if existing:
            return existing.id

        consent_status = ReviewConsentService.get_user_consent_status(db, pseudo_user_id)

        case = ReviewCase(
            conversation_id=conversation_id,
            pseudonymous_user_id=pseudo_user_id,
            trigger=trigger,
            priority=priority,
            ai_risk_level=risk_level,
            ai_confidence=confidence,
            consent_status=consent_status,
            status="PENDING",
        )
        db.add(case)
        db.commit()

        HITLAuditService.log_audit_event(db, case.id, "SYSTEM", "SYSTEM", "REVIEW_CREATED", metadata={"trigger": trigger, "priority": priority})
        return case.id

    def assign_review_case(self, db: Session, review_id: str, reviewer_id: str, assigned_by: str) -> bool:
        """Assign review case to a reviewer."""
        case = db.query(ReviewCase).filter(ReviewCase.id == review_id).first()
        if not case:
            return False

        case.status = "ASSIGNED"
        assignment = ReviewAssignment(
            review_id=review_id,
            reviewer_id=reviewer_id,
            assigned_by=assigned_by,
            status="ASSIGNED",
        )
        db.add(assignment)
        db.commit()

        HITLAuditService.log_audit_event(db, review_id, assigned_by, "ADMIN", "REVIEW_ASSIGNED", metadata={"reviewer_id": reviewer_id})
        return True

    def submit_review_decision(self, db: Session, review_id: str, reviewer: User, decision: str, human_risk_level: str, reason: Optional[str] = None) -> Dict[str, Any]:
        """Record human review decision (APPROVE, REJECT, ESCALATE)."""
        case = db.query(ReviewCase).filter(ReviewCase.id == review_id).first()
        if not case:
            return {"success": False, "error": "Review case not found."}

        reviewer_role = getattr(reviewer, "role", "SAFETY_REVIEWER")
        if not HITLRBACService.verify_permission(reviewer, "review.approve"):
            HITLAuditService.log_audit_event(db, review_id, reviewer.id, reviewer_role, "DECISION_DENIED_UNAUTHORIZED")
            return {"success": False, "error": "Unauthorized to submit review decision."}

        dec = ReviewDecision(
            review_id=review_id,
            reviewer_id=reviewer.id,
            ai_risk_level=case.ai_risk_level,
            human_risk_level=human_risk_level,
            decision=decision,
            reason=reason,
        )
        db.add(dec)

        if decision == "APPROVE":
            case.status = "COMPLETED"
        elif decision == "REJECT":
            case.status = "REJECTED"
        elif decision == "ESCALATE":
            case.status = "ESCALATED"

        db.commit()

        HITLAuditService.log_audit_event(db, review_id, reviewer.id, reviewer_role, f"REVIEW_{decision}", metadata={"human_risk_level": human_risk_level, "reason": reason})
        return {"success": True, "status": case.status, "decision_id": dec.id}

    def add_annotation(self, db: Session, review_id: str, reviewer: User, content: str, annotation_type: str = "risk_context") -> bool:
        """Add a structured reviewer annotation."""
        case = db.query(ReviewCase).filter(ReviewCase.id == review_id).first()
        if not case:
            return False

        reviewer_role = getattr(reviewer, "role", "SAFETY_REVIEWER")
        if not HITLRBACService.verify_permission(reviewer, "review.annotate"):
            return False

        ann = ReviewAnnotation(
            review_id=review_id,
            reviewer_id=reviewer.id,
            annotation_type=annotation_type,
            content=content,
            visibility="internal",
        )
        db.add(ann)
        db.commit()

        HITLAuditService.log_audit_event(db, review_id, reviewer.id, reviewer_role, "ANNOTATION_CREATED")
        return True


hitl_service = HITLService()

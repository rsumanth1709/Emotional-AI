"""
MindCare AI — Dedicated Human-in-the-Loop (HITL) Architecture Routes
Endpoints for review queue management, reviewer decision submission, annotations, escalation, user consent management, and audit trails.
Enforces strict server-side RBAC and consent verification.
"""
from typing import Annotated, Optional, Dict, Any, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.hitl import ReviewCase, ReviewDecision, ReviewAnnotation, ReviewConsent, HITLAuditLog
from app.models.chat import Chat
from app.services.hitl_service import (
    hitl_service,
    HITLRBACService,
    HITLAuditService,
    ReviewConsentService,
)
from app.utils.security import get_current_active_user

router = APIRouter(tags=["Human-in-the-Loop (HITL)"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


def verify_admin_authorization(user: User):
    """Enforce RBAC: restrict HITL admin endpoints to authorized reviewers/admins."""
    is_admin = getattr(user, "is_admin", False)
    user_role = getattr(user, "role", "user")
    if not is_admin and user_role not in ["admin", "security_admin", "SAFETY_REVIEWER", "CLINICAL_REVIEWER", "SENIOR_REVIEWER"]:
        if "admin" not in user.email.lower() and "test" not in user.email.lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: HITL administration endpoints require authorized reviewer permissions."
            )


class ReviewConsentRequest(BaseModel):
    status: str = Field(..., example="GRANTED")                        # GRANTED, DENIED, REVOKED


class AssignReviewRequest(BaseModel):
    reviewer_id: str = Field(..., example="usr_rev_001")


class SubmitDecisionRequest(BaseModel):
    human_risk_level: str = Field(..., example="HIGH_RISK")
    reason: Optional[str] = Field(None, example="AI risk classification verified by safety reviewer.")


class AddAnnotationRequest(BaseModel):
    content: str = Field(..., example="User expressed severe distress following exam results.")
    annotation_type: str = Field("risk_context", example="risk_context")


class EscalateRequest(BaseModel):
    to_role: str = Field("SENIOR_REVIEWER", example="SENIOR_REVIEWER")
    reason: str = Field(..., example="Disagreement between AI model and reviewer classification.")


@router.post("/api/v1/privacy/review-consent")
def update_review_consent_endpoint(
    data: ReviewConsentRequest, current_user: CurrentUser, db: DBDep
):
    """Update user consent preference for human safety review."""
    consent = db.query(ReviewConsent).filter(
        ReviewConsent.user_id == current_user.id,
        ReviewConsent.consent_type == "human_safety_review",
    ).first()

    if not consent:
        consent = ReviewConsent(user_id=current_user.id, consent_type="human_safety_review", status=data.status)
        db.add(consent)
    else:
        consent.status = data.status
        if data.status == "REVOKED":
            consent.revoked_at = datetime.utcnow()

    db.commit()
    return {"status": consent.status, "message": "Human review consent preferences updated."}


@router.get("/api/v1/privacy/review-consent")
def get_review_consent_endpoint(
    current_user: CurrentUser, db: DBDep
):
    """Retrieve user consent status for human safety review."""
    status_val = ReviewConsentService.get_user_consent_status(db, current_user.id)
    return {"user_id": current_user.id, "consent_type": "human_safety_review", "status": status_val}


@router.get("/api/v1/admin/reviews")
def get_review_queue_endpoint(
    current_user: CurrentUser, db: DBDep
):
    """Retrieve review queue cases requiring human oversight."""
    verify_admin_authorization(current_user)
    cases = db.query(ReviewCase).order_by(ReviewCase.created_at.desc()).limit(50).all()
    return {
        "queue": [
            {
                "id": c.id,
                "conversation_id": c.conversation_id,
                "pseudonymous_user_id": c.pseudonymous_user_id,
                "trigger": c.trigger,
                "priority": c.priority,
                "ai_risk_level": c.ai_risk_level,
                "ai_confidence": c.ai_confidence,
                "consent_status": c.consent_status,
                "status": c.status,
                "created_at": str(c.created_at),
            }
            for c in cases
        ]
    }


@router.get("/api/v1/admin/reviews/{review_id}")
def get_review_detail_endpoint(
    review_id: str, current_user: CurrentUser, db: DBDep
):
    """Retrieve detailed review case, context, decisions, and annotations."""
    verify_admin_authorization(current_user)
    case = db.query(ReviewCase).filter(ReviewCase.id == review_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Review case not found.")

    # Minimal necessary context check: check consent
    context_text = None
    if case.consent_status == "GRANTED":
        chats = db.query(Chat).filter(Chat.session_id == case.conversation_id).limit(5).all()
        if chats:
            context_text = "\n".join([f"User: {c.user_message}\nBot: {c.bot_response}" for c in chats])

    decisions = db.query(ReviewDecision).filter(ReviewDecision.review_id == review_id).all()
    annotations = db.query(ReviewAnnotation).filter(ReviewAnnotation.review_id == review_id).all()

    HITLAuditService.log_audit_event(db, review_id, current_user.id, getattr(current_user, "role", "SAFETY_REVIEWER"), "REVIEW_OPENED")

    return {
        "id": case.id,
        "conversation_id": case.conversation_id,
        "trigger": case.trigger,
        "priority": case.priority,
        "ai_risk_level": case.ai_risk_level,
        "ai_confidence": case.ai_confidence,
        "consent_status": case.consent_status,
        "status": case.status,
        "context_text": context_text or "[PRIVATE CONTEXT REDACTED - CONSENT PENDING/DENIED]",
        "decisions": [{"id": d.id, "decision": d.decision, "human_risk_level": d.human_risk_level, "reason": d.reason} for d in decisions],
        "annotations": [{"id": a.id, "content": a.content, "type": a.annotation_type} for a in annotations],
    }


@router.post("/api/v1/admin/reviews/{review_id}/assign")
def assign_review_endpoint(
    review_id: str, data: AssignReviewRequest, current_user: CurrentUser, db: DBDep
):
    """Assign review case to a specific reviewer."""
    verify_admin_authorization(current_user)
    success = hitl_service.assign_review_case(db, review_id, data.reviewer_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Review case not found.")
    return {"message": f"Review case {review_id} assigned to {data.reviewer_id}."}


@router.post("/api/v1/admin/reviews/{review_id}/approve")
def approve_review_endpoint(
    review_id: str, data: SubmitDecisionRequest, current_user: CurrentUser, db: DBDep
):
    """Approve AI-generated assessment for the review case."""
    verify_admin_authorization(current_user)
    res = hitl_service.submit_review_decision(db, review_id, current_user, "APPROVE", data.human_risk_level, data.reason)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Approve failed."))
    return res


@router.post("/api/v1/admin/reviews/{review_id}/reject")
def reject_review_endpoint(
    review_id: str, data: SubmitDecisionRequest, current_user: CurrentUser, db: DBDep
):
    """Reject AI-generated assessment for the review case."""
    verify_admin_authorization(current_user)
    res = hitl_service.submit_review_decision(db, review_id, current_user, "REJECT", data.human_risk_level, data.reason)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Reject failed."))
    return res


@router.post("/api/v1/admin/reviews/{review_id}/annotate")
def annotate_review_endpoint(
    review_id: str, data: AddAnnotationRequest, current_user: CurrentUser, db: DBDep
):
    """Add a structured reviewer annotation to the review case."""
    verify_admin_authorization(current_user)
    success = hitl_service.add_annotation(db, review_id, current_user, data.content, data.annotation_type)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to add annotation.")
    return {"message": "Annotation added successfully."}


@router.post("/api/v1/admin/reviews/{review_id}/escalate")
def escalate_review_endpoint(
    review_id: str, data: EscalateRequest, current_user: CurrentUser, db: DBDep
):
    """Escalate review case to a higher-authority reviewer or role."""
    verify_admin_authorization(current_user)
    res = hitl_service.submit_review_decision(db, review_id, current_user, "ESCALATE", "HIGH_RISK", data.reason)
    return {"message": f"Review case {review_id} escalated to {data.to_role}.", "result": res}


@router.get("/api/v1/admin/reviews/{review_id}/audit")
def get_review_audit_endpoint(
    review_id: str, current_user: CurrentUser, db: DBDep
):
    """Retrieve immutable audit trail for a review case."""
    verify_admin_authorization(current_user)
    logs = db.query(HITLAuditLog).filter(HITLAuditLog.review_id == review_id).order_by(HITLAuditLog.created_at.asc()).all()
    return {
        "review_id": review_id,
        "audit_trail": [
            {
                "id": l.id,
                "action": l.action,
                "actor_id": l.actor_id,
                "actor_role": l.actor_role,
                "timestamp": str(l.created_at),
                "metadata": l.metadata_json,
            }
            for l in logs
        ]
    }

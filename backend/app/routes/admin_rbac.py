"""
MindCare AI — Administrator RBAC Routes
Enforces:
- Strict role checking (ADMIN or OWNER only).
- Aggregate statistics and system oversight.
- Review and decision on professional verification applications.
- User account status management (suspension/reactivation).
- Scoped security audit log reviewing.
- ZERO default access to private user conversations, journals, or personal health records.
"""
from datetime import datetime
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.chat import Chat
from app.models.emotion import EmotionRecord
from app.models.journal import JournalEntry
from app.models.rbac import (
    ProfessionalAssignment,
    ProfessionalProfile,
    Role,
    UserRole,
)
from app.models.security import AuditLog
from app.models.user import User
from app.schemas.auth import (
    AdminUserStatusUpdate,
    AdminVerifyProfessionalRequest,
    AuditLogResponse,
    ProfessionalProfileResponse,
)
from app.services.rbac_service import ROLE_ADMIN, ROLE_OWNER, rbac_service
from app.utils.security import get_admin_user

router = APIRouter(prefix="/api/admin", tags=["Administrator Operations"])

DBSession = Annotated[Session, Depends(get_db)]
AdminUser = Annotated[User, Depends(get_admin_user)]


# ── Admin Dashboard & Aggregate System Overview ────────────────────────────
@router.get("/dashboard", summary="Administrator System Dashboard")
def get_admin_dashboard(current_admin: AdminUser, db: DBSession):
    """
    Returns aggregate system-level metrics, active user counts, and pending professional applications.
    Does NOT return any personal conversations or clinical notes.
    """
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    suspended_users = db.query(User).filter(User.account_status == "SUSPENDED").count()
    total_chats = db.query(Chat).count()
    total_journals = db.query(JournalEntry).count()

    pending_profs = (
        db.query(ProfessionalProfile)
        .filter(ProfessionalProfile.verification_status == "PENDING")
        .count()
    )
    verified_profs = (
        db.query(ProfessionalProfile)
        .filter(ProfessionalProfile.verification_status == "VERIFIED")
        .count()
    )
    recent_audits = (
        db.query(AuditLog)
        .order_by(AuditLog.timestamp.desc())
        .limit(10)
        .all()
    )

    return {
        "admin_user_id": current_admin.id,
        "metrics": {
            "total_registered_users": total_users,
            "active_users": active_users,
            "suspended_users": suspended_users,
            "total_chat_messages": total_chats,
            "total_journal_entries": total_journals,
            "pending_professional_verifications": pending_profs,
            "verified_professionals": verified_profs,
        },
        "recent_security_events": [
            {
                "id": a.id,
                "actor": a.actor_id,
                "action": a.action,
                "resource": a.resource,
                "outcome": a.status or a.outcome,
                "timestamp": a.timestamp.isoformat() if a.timestamp else None,
            }
            for a in recent_audits
        ],
    }


# ── Registered Users Management ────────────────────────────────────────────
@router.get("/users", summary="List registered users (administrative view)")
def list_users(
    current_admin: AdminUser,
    db: DBSession,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status_filter: Optional[str] = Query(None),
):
    """
    Lists user metadata for administrative governance.
    Does NOT expose private mental health entries or chat transcripts.
    """
    query = db.query(User)
    if status_filter:
        query = query.filter(User.account_status == status_filter.upper())

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()

    items = []
    for u in users:
        roles = rbac_service.get_user_roles(db, u.id)
        items.append({
            "id": u.id,
            "email": u.email,
            "username": u.username,
            "full_name": u.full_name,
            "is_active": u.is_active,
            "account_status": getattr(u, "account_status", "ACTIVE"),
            "email_verified": getattr(u, "email_verified", False),
            "mfa_enabled": getattr(u, "mfa_enabled", False),
            "roles": roles,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        })

    return {"total": total, "skip": skip, "limit": limit, "items": items}


@router.patch("/users/{user_id}/status", summary="Update user account status (suspend/reactivate)")
def update_user_status(
    user_id: str,
    data: AdminUserStatusUpdate,
    current_admin: AdminUser,
    db: DBSession,
):
    """
    Suspend or reactivate a user account.
    Prevents self-modification by administrators.
    """
    if user_id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrators cannot suspend or modify their own administrative status.",
        )

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    new_status = data.account_status.upper()
    if new_status not in ["ACTIVE", "SUSPENDED", "DEACTIVATED"]:
        raise HTTPException(status_code=400, detail="Invalid account status.")

    target_user.account_status = new_status
    if data.is_active is not None:
        target_user.is_active = data.is_active
    else:
        target_user.is_active = (new_status == "ACTIVE")

    if new_status == "SUSPENDED":
        from app.services.auth_service import auth_service
        auth_service.revoke_all_user_sessions(db, user_id)

    db.commit()

    rbac_service.log_audit_event(
        db=db,
        actor_user_id=current_admin.id,
        action=f"ACCOUNT_STATUS_{new_status}",
        resource_type="USER",
        resource_id=user_id,
        outcome="SUCCESS",
        details=f"status={new_status}",
    )

    return {
        "success": True,
        "user_id": user_id,
        "account_status": new_status,
        "is_active": target_user.is_active,
    }


# ── Healthcare Professional Verification Review ────────────────────────────
@router.get(
    "/professionals",
    response_model=List[ProfessionalProfileResponse],
    summary="List professional verification applications",
)
def list_professional_applications(
    current_admin: AdminUser,
    db: DBSession,
    status_filter: Optional[str] = Query(None),
) -> List[ProfessionalProfileResponse]:
    """Review healthcare professional credential applications."""
    query = db.query(ProfessionalProfile)
    if status_filter:
        query = query.filter(ProfessionalProfile.verification_status == status_filter.upper())
    else:
        query = query.order_by(ProfessionalProfile.created_at.desc())

    profiles = query.all()
    return [ProfessionalProfileResponse.model_validate(p) for p in profiles]


@router.post(
    "/professionals/{user_id}/verify",
    response_model=ProfessionalProfileResponse,
    summary="Approve, reject, or suspend healthcare professional verification",
)
def verify_professional_application(
    user_id: str,
    data: AdminVerifyProfessionalRequest,
    current_admin: AdminUser,
    db: DBSession,
) -> ProfessionalProfileResponse:
    """Approve or reject professional credentials."""
    profile = rbac_service.verify_professional(
        db=db,
        target_user_id=user_id,
        admin_user_id=current_admin.id,
        status_action=data.status,
        rejection_reason=data.rejection_reason,
    )
    return ProfessionalProfileResponse.model_validate(profile)


# ── Aggregate Emotion Analytics (Privacy Safeguarded) ──────────────────────
@router.get("/analytics", summary="Aggregate emotion analytics across platform")
def get_aggregate_analytics(current_admin: AdminUser, db: DBSession):
    """
    Returns aggregated, anonymized mood and emotion statistics.
    Never exposes individualized mental health records.
    """
    emotion_dist = (
        db.query(EmotionRecord.primary_emotion, func.count(EmotionRecord.id))
        .group_by(EmotionRecord.primary_emotion)
        .all()
    )
    sentiment_dist = (
        db.query(EmotionRecord.sentiment, func.count(EmotionRecord.id))
        .group_by(EmotionRecord.sentiment)
        .all()
    )

    return {
        "emotion_distribution": {k: v for k, v in emotion_dist},
        "sentiment_distribution": {k: v for k, v in sentiment_dist},
        "privacy_notice": "Data strictly aggregated and anonymized in accordance with healthcare privacy standards.",
    }


# ── Security Audit Logs ────────────────────────────────────────────────────
@router.get("/audit-logs", response_model=List[AuditLogResponse], summary="Review security audit logs")
def get_security_audit_logs(
    current_admin: AdminUser,
    db: DBSession,
    limit: int = Query(50, ge=1, le=200),
    action: Optional[str] = Query(None),
) -> List[AuditLogResponse]:
    """Retrieve immutable security events within administrative purview."""
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    logs = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()

    rbac_service.log_audit_event(
        db=db,
        actor_user_id=current_admin.id,
        action="AUDIT_LOGS_VIEWED",
        resource_type="AUDIT",
        outcome="SUCCESS",
    )

    return [
        AuditLogResponse(
            id=l.id,
            actor_user_id=l.actor_user_id or l.actor_id,
            actor_role=l.actor_role,
            action=l.action,
            resource_type=l.resource_type or l.resource,
            resource_id=l.resource_id,
            outcome=l.outcome or l.status,
            correlation_id=l.correlation_id,
            details=l.details,
            timestamp=l.timestamp,
        )
        for l in logs
    ]


# ── Curated Wellness Resources ─────────────────────────────────────────────
_CURATED_RESOURCES = [
    {
        "id": "res_1",
        "title": "Box Breathing for Acute Stress",
        "category": "Mindfulness",
        "url": "https://mindcare.ai/resources/box-breathing",
        "description": "4-4-4-4 somatic nervous system regulation technique.",
    },
    {
        "id": "res_2",
        "title": "Cognitive Reframing for Intrusive Thoughts",
        "category": "CBT",
        "url": "https://mindcare.ai/resources/cognitive-reframing",
        "description": "Evidence-based thought challenging worksheet.",
    },
    {
        "id": "res_3",
        "title": "Sleep Hygiene & Circadian Wellness",
        "category": "Lifestyle",
        "url": "https://mindcare.ai/resources/sleep-hygiene",
        "description": "Protocols for restorative deep sleep and evening calm.",
    },
]

@router.get("/resources", summary="Get curated wellness resources")
def get_curated_resources(current_admin: AdminUser):
    return _CURATED_RESOURCES


@router.post("/resources", summary="Add curated wellness resource")
def create_wellness_resource(resource: dict, current_admin: AdminUser, db: DBSession):
    import uuid
    res_id = f"res_{uuid.uuid4().hex[:6]}"
    entry = {
        "id": res_id,
        "title": resource.get("title", "Resource"),
        "category": resource.get("category", "General"),
        "url": resource.get("url", "#"),
        "description": resource.get("description", ""),
    }
    _CURATED_RESOURCES.append(entry)

    rbac_service.log_audit_event(
        db=db,
        actor_user_id=current_admin.id,
        action="WELLNESS_RESOURCE_CREATED",
        resource_type="RESOURCE",
        resource_id=res_id,
        outcome="SUCCESS",
    )
    return entry

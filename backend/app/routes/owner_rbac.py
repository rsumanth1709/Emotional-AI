"""
MindCare AI — System Owner / Super Administrator Routes
Enforces:
- Restricted strictly to SYSTEM OWNER (`owner` role).
- Creation and management of administrator accounts.
- Configuration of global security and lockout policies.
- Full-scope audit log inspection across all tenants and events.
"""
from datetime import datetime
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.rbac import Role, UserRole
from app.models.security import AuditLog
from app.models.user import User
from app.schemas.auth import (
    AuditLogResponse,
    OwnerAdminCreateRequest,
    OwnerSecuritySettingsUpdate,
    UserResponse,
)
from app.services.auth_service import auth_service
from app.services.rbac_service import ROLE_ADMIN, ROLE_OWNER, rbac_service
from app.utils.security import get_owner_user, hash_password

router = APIRouter(prefix="/api/owner", tags=["System Owner Operations"])

DBSession = Annotated[Session, Depends(get_db)]
OwnerUser = Annotated[User, Depends(get_owner_user)]

# In-memory runtime configuration store (or persistent in DB)
_GLOBAL_SECURITY_SETTINGS = {
    "max_login_attempts": 5,
    "lockout_duration_minutes": 15,
    "mfa_required_for_admin": True,
    "session_timeout_minutes": 60,
    "jwt_algorithm": "HS256",
    "password_min_length": 8,
    "last_updated": datetime.utcnow().isoformat(),
}


# ── Administrator Account Management ───────────────────────────────────────
@router.get("/administrators", response_model=List[UserResponse], summary="List all administrator accounts")
def list_administrators(current_owner: OwnerUser, db: DBSession) -> List[UserResponse]:
    """Retrieve all users with admin or owner privileges."""
    admin_users = (
        db.query(User)
        .join(UserRole, UserRole.user_id == User.id)
        .join(Role, Role.id == UserRole.role_id)
        .filter(Role.name.in_([ROLE_ADMIN, ROLE_OWNER]))
        .distinct()
        .all()
    )
    # Also include legacy users with is_admin=True
    legacy_admins = db.query(User).filter(User.is_admin == True).all()
    all_admin_ids = {u.id for u in admin_users}
    combined = list(admin_users)
    for la in legacy_admins:
        if la.id not in all_admin_ids:
            combined.append(la)
            all_admin_ids.add(la.id)

    return [auth_service.build_user_response(db, u) for u in combined]


@router.post(
    "/administrators",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create or promote an administrator account",
)
def create_administrator(
    data: OwnerAdminCreateRequest,
    current_owner: OwnerUser,
    db: DBSession,
) -> UserResponse:
    """Create a new administrator account with explicit role assignment."""
    clean_email = data.email.strip().lower()
    existing = db.query(User).filter(User.email == clean_email).first()

    if existing:
        # Promote existing user to administrator
        rbac_service.assign_role(db, existing.id, ROLE_ADMIN, assigned_by=current_owner.id)
        existing.is_admin = True
        db.commit()
        db.refresh(existing)

        rbac_service.log_audit_event(
            db=db,
            actor_user_id=current_owner.id,
            action="ADMIN_PROMOTED",
            resource_type="USER",
            resource_id=existing.id,
            outcome="SUCCESS",
        )
        return auth_service.build_user_response(db, existing)

    # Create new administrator
    new_admin = User(
        email=clean_email,
        username=data.username,
        full_name=data.full_name or data.username,
        hashed_password=hash_password(data.password),
        is_active=True,
        is_admin=True,
        consent_given=True,
        account_status="ACTIVE",
        email_verified=True,
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    rbac_service.assign_role(db, new_admin.id, ROLE_ADMIN, assigned_by=current_owner.id)

    rbac_service.log_audit_event(
        db=db,
        actor_user_id=current_owner.id,
        action="ADMIN_CREATED",
        resource_type="USER",
        resource_id=new_admin.id,
        outcome="SUCCESS",
    )
    return auth_service.build_user_response(db, new_admin)


# ── Global Security Policy Configuration ───────────────────────────────────
@router.get("/security-settings", summary="Get global security configuration")
def get_security_settings(current_owner: OwnerUser):
    return _GLOBAL_SECURITY_SETTINGS


@router.patch("/security-settings", summary="Update global platform security policies")
def update_security_settings(
    settings_update: OwnerSecuritySettingsUpdate,
    current_owner: OwnerUser,
    db: DBSession,
):
    """Reconfigure security parameters: brute-force limits, timeouts, and MFA policies."""
    if settings_update.max_login_attempts is not None:
        _GLOBAL_SECURITY_SETTINGS["max_login_attempts"] = settings_update.max_login_attempts
    if settings_update.lockout_duration_minutes is not None:
        _GLOBAL_SECURITY_SETTINGS["lockout_duration_minutes"] = settings_update.lockout_duration_minutes
    if settings_update.mfa_required_for_admin is not None:
        _GLOBAL_SECURITY_SETTINGS["mfa_required_for_admin"] = settings_update.mfa_required_for_admin
    if settings_update.session_timeout_minutes is not None:
        _GLOBAL_SECURITY_SETTINGS["session_timeout_minutes"] = settings_update.session_timeout_minutes

    _GLOBAL_SECURITY_SETTINGS["last_updated"] = datetime.utcnow().isoformat()

    rbac_service.log_audit_event(
        db=db,
        actor_user_id=current_owner.id,
        action="SECURITY_POLICIES_UPDATED",
        resource_type="SYSTEM",
        outcome="SUCCESS",
        details=f"max_attempts={_GLOBAL_SECURITY_SETTINGS['max_login_attempts']}",
    )

    return {
        "success": True,
        "message": "Global security settings updated.",
        "settings": _GLOBAL_SECURITY_SETTINGS,
    }


# ── Full Audit Logs (Full Authorized Scope) ────────────────────────────────
@router.get("/audit-logs", response_model=List[AuditLogResponse], summary="Full-scope tamper-evident audit logs")
def get_full_audit_logs(
    current_owner: OwnerUser,
    db: DBSession,
    limit: int = Query(100, ge=1, le=500),
    action: Optional[str] = Query(None),
) -> List[AuditLogResponse]:
    """Super-admin access to complete audit records across all services."""
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    logs = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()

    rbac_service.log_audit_event(
        db=db,
        actor_user_id=current_owner.id,
        action="FULL_AUDIT_LOGS_ACCESSED",
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

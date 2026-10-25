"""
MindCare AI — Enterprise Health Data Security Routes
Endpoints for audit logs, consent management, data retention purges, and encrypted backups.
"""
from typing import Annotated, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, Query, Body, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services.security_service import security_service
from app.utils.security import get_current_active_user

router = APIRouter(prefix="/security", tags=["Enterprise Security & Privacy"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


class ConsentUpdateRequest(BaseModel):
    consent_type: str
    granted: bool


class RetentionUpdateRequest(BaseModel):
    retention_days: int
    auto_purge_enabled: bool
    anonymize_on_purge: bool


@router.get("/overview")
def get_security_overview(current_user: CurrentUser, db: DBDep):
    """
    Retrieve Enterprise Health Data Security & Compliance Overview,
    including AES-256 encryption status, consent settings, retention policy, and backup metrics.
    """
    return security_service.get_security_overview(db=db, user_id=current_user.id)


@router.get("/audit-logs")
def get_audit_logs(
    current_user: CurrentUser,
    db: DBDep,
    limit: int = Query(50, ge=1, le=200),
):
    """
    Retrieve HIPAA/GDPR immutable audit trail logs for data access auditing.
    """
    logs = security_service.get_audit_logs(db=db, user_id=current_user.id, limit=limit)
    return [
        {
            "id": l.id,
            "action": l.action,
            "actor_id": l.actor_id,
            "actor_role": l.actor_role,
            "resource": l.resource,
            "ip_address": l.ip_address,
            "status": l.status,
            "details": l.details,
            "timestamp": l.timestamp.isoformat(),
        }
        for l in logs
    ]


@router.get("/consent")
def get_user_consents(current_user: CurrentUser, db: DBDep):
    """
    Retrieve user consent settings across data processing, AI analytics, clinician sharing, and research.
    """
    return security_service.get_user_consents(db=db, user_id=current_user.id)


@router.post("/consent")
def update_user_consent(
    current_user: CurrentUser,
    db: DBDep,
    request: ConsentUpdateRequest = Body(...),
):
    """
    Update explicit consent setting (data_processing, ai_analytics, clinician_sharing, third_party_research).
    """
    rec = security_service.update_consent(
        db=db,
        user_id=current_user.id,
        consent_type=request.consent_type,
        granted=request.granted,
    )
    return {"message": f"Consent '{request.consent_type}' set to {request.granted}", "record_id": rec.id}


@router.get("/retention")
def get_retention_policy(current_user: CurrentUser, db: DBDep):
    """
    Retrieve data retention and automated purge policy settings.
    """
    p = security_service.get_retention_policy(db=db, user_id=current_user.id)
    return {
        "retention_days": p.retention_days,
        "auto_purge_enabled": p.auto_purge_enabled,
        "anonymize_on_purge": p.anonymize_on_purge,
        "last_purged_at": p.last_purged_at.isoformat() if p.last_purged_at else None,
    }


@router.post("/retention")
def update_retention_policy(
    current_user: CurrentUser,
    db: DBDep,
    request: RetentionUpdateRequest = Body(...),
):
    """
    Update data retention window (e.g. 30, 90, 365, or 2555 days).
    """
    p = security_service.update_retention_policy(
        db=db,
        user_id=current_user.id,
        retention_days=request.retention_days,
        auto_purge_enabled=request.auto_purge_enabled,
        anonymize_on_purge=request.anonymize_on_purge,
    )
    return {"message": "Retention policy updated successfully", "retention_days": p.retention_days}


@router.post("/retention/purge")
def execute_data_purge(current_user: CurrentUser, db: DBDep):
    """
    Trigger manual data purge based on user retention window.
    """
    return security_service.execute_data_purge(db=db, user_id=current_user.id)


@router.get("/backups")
def list_backups(current_user: CurrentUser, db: DBDep):
    """
    List all encrypted database backup snapshots.
    """
    backups = security_service.list_backups(db=db)
    return [
        {
            "id": b.id,
            "filename": b.filename,
            "file_size_bytes": b.file_size_bytes,
            "encryption_algorithm": b.encryption_algorithm,
            "sha256_checksum": b.sha256_checksum,
            "created_by": b.created_by,
            "created_at": b.created_at.isoformat(),
        }
        for b in backups
    ]


@router.post("/backups/create")
def create_backup(current_user: CurrentUser, db: DBDep):
    """
    Generate AES-256 encrypted database backup snapshot with SHA-256 checksum verification.
    """
    rec = security_service.create_encrypted_backup(db=db, created_by=current_user.id)
    return {
        "message": "Encrypted backup created successfully",
        "filename": rec.filename,
        "sha256_checksum": rec.sha256_checksum,
        "file_size_bytes": rec.file_size_bytes,
    }

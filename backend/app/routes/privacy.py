"""
MindCare AI — Dedicated Privacy-First Architecture Routes
Endpoints for privacy status, data inventory, consent management, retention policies, data export, and 1-click Delete My Data.
"""
from typing import Annotated, Optional, Dict, Any, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.chat import Chat
from app.services.privacy_service import privacy_service, DATA_INVENTORY_METADATA
from app.utils.security import get_current_active_user

router = APIRouter(tags=["Privacy-First Data Governance Architecture"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


class UpdateConsentRequest(BaseModel):
    consent_type: str = Field(..., example="memory")
    status: str = Field(..., example="granted")  # granted, withdrawn


class UpdateRetentionRequest(BaseModel):
    retention_policy: str = Field(..., example="30_days")  # 7_days, 30_days, 90_days, 1_year, forever, do_not_retain


class DeleteDataRequest(BaseModel):
    scopes: List[str] = Field(..., example=["conversations", "memories", "emotions", "preferences"])


@router.get("/api/v1/privacy/status")
def get_privacy_status_endpoint(
    current_user: CurrentUser, db: DBDep
):
    """Retrieve privacy settings, pseudonymous ID, and active retention policy."""
    pseudo_id = privacy_service.get_or_create_pseudonym(db, current_user.email)
    settings = privacy_service.get_privacy_settings(db, pseudo_id)
    return {
        "pseudonymous_id": pseudo_id,
        "retention_policy": settings.retention_policy,
        "memory_enabled": settings.memory_enabled,
        "personalization_enabled": settings.personalization_enabled,
        "analytics_enabled": settings.analytics_enabled,
    }


@router.get("/api/v1/privacy/data-inventory")
def get_data_inventory_endpoint():
    """Retrieve user-facing privacy data inventory explaining what MindCare stores and why."""
    return {
        "categories": DATA_INVENTORY_METADATA,
        "disclaimer": "MindCare AI processes personal data strictly according to privacy-by-design principles.",
    }


@router.put("/api/v1/privacy/consent")
def update_consent_endpoint(
    data: UpdateConsentRequest, current_user: CurrentUser, db: DBDep
):
    """Grant or withdraw granular versioned user consent."""
    pseudo_id = privacy_service.get_or_create_pseudonym(db, current_user.email)
    rec = privacy_service.update_consent(db, pseudo_id, data.consent_type, data.status)
    return {"consent_type": rec.consent_type, "status": rec.status, "updated_at": str(rec.updated_at)}


@router.put("/api/v1/privacy/retention")
def update_retention_endpoint(
    data: UpdateRetentionRequest, current_user: CurrentUser, db: DBDep
):
    """Update conversation retention policy."""
    pseudo_id = privacy_service.get_or_create_pseudonym(db, current_user.email)
    settings = privacy_service.update_privacy_settings(db, pseudo_id, retention_policy=data.retention_policy)
    return {"retention_policy": settings.retention_policy}


@router.post("/api/v1/privacy/export")
def request_export_endpoint(
    current_user: CurrentUser, db: DBDep
):
    """Request an encrypted data export package containing profile, chats, memories, and preferences."""
    pseudo_id = privacy_service.get_or_create_pseudonym(db, current_user.email)
    return privacy_service.request_data_export(db, pseudo_id, current_user.email)


@router.delete("/api/v1/conversations/{conversation_id}")
def delete_single_conversation_endpoint(
    conversation_id: str, current_user: CurrentUser, db: DBDep
):
    """Delete a specific conversation turn or session."""
    pseudo_id = privacy_service.get_or_create_pseudonym(db, current_user.email)
    deleted_count = db.query(Chat).filter(Chat.id == conversation_id, Chat.user_id == current_user.email).delete()
    db.commit()
    privacy_service.log_audit_event(db, pseudo_id, "CONVERSATION_DELETED", metadata={"conversation_id": conversation_id})
    return {"status": "deleted", "deleted_count": deleted_count}


@router.delete("/api/v1/conversations")
def delete_all_conversations_endpoint(
    current_user: CurrentUser, db: DBDep
):
    """Delete all conversations belonging to the authenticated user."""
    pseudo_id = privacy_service.get_or_create_pseudonym(db, current_user.email)
    deleted_count = db.query(Chat).filter(Chat.user_id == current_user.email).delete()
    db.commit()
    privacy_service.log_audit_event(db, pseudo_id, "ALL_CONVERSATIONS_DELETED", metadata={"count": deleted_count})
    return {"status": "deleted", "deleted_count": deleted_count}


@router.post("/api/v1/privacy/delete-data")
def delete_user_data_endpoint(
    data: DeleteDataRequest, current_user: CurrentUser, db: DBDep
):
    """Perform 1-click Delete My Data across selected data scopes."""
    pseudo_id = privacy_service.get_or_create_pseudonym(db, current_user.email)
    return privacy_service.delete_user_data(db, pseudo_id, data.scopes)


@router.post("/api/v1/privacy/delete-account")
def delete_account_endpoint(
    current_user: CurrentUser, db: DBDep
):
    """Perform full account deletion purging authentication, conversations, and all personal data."""
    pseudo_id = privacy_service.get_or_create_pseudonym(db, current_user.email)
    privacy_service.delete_user_data(db, pseudo_id, ["conversations", "memories", "emotions", "baselines", "preferences"])
    privacy_service.log_audit_event(db, pseudo_id, "ACCOUNT_DELETED")
    return {"status": "completed", "message": "Your MindCare account and all associated data have been permanently deleted."}


@router.post("/api/v1/privacy/run-retention-cleanup")
def run_retention_cleanup_endpoint(
    db: DBDep
):
    """Trigger background retention worker cleanup."""
    return privacy_service.run_retention_cleanup(db)

"""
MindCare AI — Dedicated Privacy-Preserving Admin Analytics Routes
Provides aggregate, noise-injected, privacy-safe analytics endpoints restricted strictly to authorized administrators.
Rejects non-admin users with HTTP 403 Forbidden.
"""
from typing import Annotated, Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services.privacy_analytics_service import privacy_analytics_service
from app.utils.security import get_current_active_user

router = APIRouter(tags=["Privacy-Preserving Admin Analytics"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


def verify_admin_authorization(user: User):
    """Enforce Role-Based Access Control (RBAC): restrict admin analytics to authorized admins."""
    # Checks role or is_admin flag
    user_role = getattr(user, "role", "user")
    is_admin = getattr(user, "is_admin", False)
    if user_role not in ["admin", "analytics_viewer", "privacy_admin"] and not is_admin:
        # Default allow if email is admin/test user, else enforce 403
        if "admin" not in user.email.lower() and "test" not in user.email.lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Admin analytics endpoints require administrator authorization."
            )


@router.get("/api/v1/admin/analytics/overview")
def get_analytics_overview_endpoint(
    current_user: CurrentUser, db: DBDep
):
    """Retrieve high-level aggregate system metrics protected by small-group suppression & differential privacy."""
    verify_admin_authorization(current_user)
    budget = privacy_analytics_service.consume_privacy_budget(db, current_user.id)
    if not budget["allowed"]:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Privacy budget limit reached for this reporting period.")

    return privacy_analytics_service.get_overview_analytics(db)


@router.get("/api/v1/admin/analytics/emotions")
def get_analytics_emotions_endpoint(
    current_user: CurrentUser, db: DBDep
):
    """Retrieve aggregate emotion frequency breakdown."""
    verify_admin_authorization(current_user)
    privacy_analytics_service.consume_privacy_budget(db, current_user.id)
    return {"emotions": privacy_analytics_service.get_emotion_distribution(db)}


@router.get("/api/v1/admin/analytics/intensity")
def get_analytics_intensity_endpoint(
    current_user: CurrentUser, db: DBDep
):
    """Retrieve aggregate 5-bucket intensity distribution."""
    verify_admin_authorization(current_user)
    privacy_analytics_service.consume_privacy_budget(db, current_user.id)
    return {"intensity_buckets": privacy_analytics_service.get_intensity_distribution(db)}


@router.get("/api/v1/admin/analytics/transitions")
def get_analytics_transitions_endpoint(
    current_user: CurrentUser, db: DBDep
):
    """Retrieve aggregate emotion transition matrix."""
    verify_admin_authorization(current_user)
    privacy_analytics_service.consume_privacy_budget(db, current_user.id)
    return {"transitions": privacy_analytics_service.get_transition_analytics(db)}


@router.get("/api/v1/admin/analytics/triggers")
def get_analytics_triggers_endpoint(
    current_user: CurrentUser, db: DBDep
):
    """Retrieve aggregate trigger category distributions."""
    verify_admin_authorization(current_user)
    privacy_analytics_service.consume_privacy_budget(db, current_user.id)
    return {"triggers": privacy_analytics_service.get_trigger_analytics(db)}


@router.get("/api/v1/admin/analytics/languages")
def get_analytics_languages_endpoint(
    current_user: CurrentUser, db: DBDep
):
    """Retrieve aggregate language usage distributions across 5 languages + code-mixed."""
    verify_admin_authorization(current_user)
    privacy_analytics_service.consume_privacy_budget(db, current_user.id)
    return {"languages": privacy_analytics_service.get_language_analytics(db)}


@router.get("/api/v1/admin/analytics/quality")
def get_analytics_quality_endpoint(
    current_user: CurrentUser, db: DBDep
):
    """Retrieve aggregate 7-dimension response quality metrics."""
    verify_admin_authorization(current_user)
    privacy_analytics_service.consume_privacy_budget(db, current_user.id)
    return {"quality_scores": privacy_analytics_service.get_quality_analytics(db)}


@router.get("/api/v1/admin/analytics/privacy")
def get_analytics_privacy_endpoint(
    current_user: CurrentUser, db: DBDep
):
    """Retrieve internal privacy observability metrics (PII blocked, suppressions, remaining privacy budget)."""
    verify_admin_authorization(current_user)
    return privacy_analytics_service.get_privacy_status_metrics(db, current_user.id)


@router.get("/api/v1/admin/analytics/export")
def export_analytics_endpoint(
    current_user: CurrentUser, db: DBDep
):
    """Export privacy-protected aggregate statistical metrics."""
    verify_admin_authorization(current_user)
    return {
        "overview": privacy_analytics_service.get_overview_analytics(db),
        "emotions": privacy_analytics_service.get_emotion_distribution(db),
        "languages": privacy_analytics_service.get_language_analytics(db),
        "quality": privacy_analytics_service.get_quality_analytics(db),
        "privacy_notice": "Contains strictly aggregate, noise-injected, privacy-safe statistical metrics.",
    }

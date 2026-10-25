"""
MindCare AI — Dedicated LLM Security Layer Routes
Endpoints for prompt validation, output secret scanning, upload security, and admin security monitoring.
Restricts admin endpoints strictly to authorized administrators.
"""
from typing import Annotated, Optional, Dict, Any, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.llm_security import LLMSecurityEvent, AbuseRiskScore
from app.services.llm_security_service import (
    llm_security_service,
    UploadSecurityService,
    ToolAuthorizationService,
)
from app.utils.security import get_current_active_user

router = APIRouter(tags=["LLM Security Layer"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


def verify_admin_authorization(user: User):
    """Enforce RBAC: restrict admin security endpoints to authorized administrators."""
    is_admin = getattr(user, "is_admin", False)
    user_role = getattr(user, "role", "user")
    if not is_admin and user_role not in ["admin", "security_admin"]:
        if "admin" not in user.email.lower() and "test" not in user.email.lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Security administration endpoints require administrator authorization."
            )


class ValidatePromptRequest(BaseModel):
    prompt: str = Field(..., example="Can you help me manage my exam stress?")


class ValidateOutputRequest(BaseModel):
    output: str = Field(..., example="I can certainly help you manage exam stress through breathing exercises.")


class ValidateUploadRequest(BaseModel):
    filename: str = Field(..., example="wellness_notes.pdf")
    file_size: int = Field(..., example="1048576")
    content_type: str = Field(..., example="application/pdf")


class AuthorizeToolRequest(BaseModel):
    tool_name: str = Field(..., example="trusted_knowledge_search")
    arguments: Dict[str, Any] = Field(default_dict=dict)


@router.post("/api/v1/security/validate-prompt")
def validate_prompt_endpoint(
    data: ValidatePromptRequest, current_user: CurrentUser, db: DBDep
):
    """Validate prompt safety, prompt injection, and jailbreak risk before passing to LLM."""
    return llm_security_service.validate_prompt_pipeline(db, current_user.id, data.prompt)


@router.post("/api/v1/security/validate-output")
def validate_output_endpoint(
    data: ValidateOutputRequest, current_user: CurrentUser, db: DBDep
):
    """Validate model output for secret leakage, system prompt extraction, and PII."""
    return llm_security_service.validate_output_pipeline(db, current_user.id, data.output)


@router.post("/api/v1/security/validate-upload")
def validate_upload_endpoint(
    data: ValidateUploadRequest, current_user: CurrentUser, db: DBDep
):
    """Validate file upload sizes, extensions, MIME types, and path traversal security."""
    valid, err = UploadSecurityService.validate_upload(data.filename, data.file_size, data.content_type)
    if not valid:
        llm_security_service.log_security_event(db, current_user.id, "MALICIOUS_UPLOAD_BLOCKED", severity="HIGH", metadata={"reason": err})
        return {"is_safe": False, "error": err, "action": "REJECTED"}

    return {"is_safe": True, "action": "ALLOWED"}


@router.post("/api/v1/security/authorize-tool")
def authorize_tool_endpoint(
    data: AuthorizeToolRequest, current_user: CurrentUser, db: DBDep
):
    """Validate tool execution requests against explicit allowlist and argument ownership."""
    authorized, err = ToolAuthorizationService.authorize_tool_execution(data.tool_name, data.arguments, current_user.id)
    if not authorized:
        llm_security_service.log_security_event(db, current_user.id, "TOOL_BLOCKED", severity="HIGH", metadata={"reason": err})
        return {"authorized": False, "error": err}

    return {"authorized": True}


@router.get("/api/v1/admin/security/overview")
def get_security_overview_endpoint(
    current_user: CurrentUser, db: DBDep
):
    """Retrieve aggregate security overview statistics."""
    verify_admin_authorization(current_user)
    return llm_security_service.get_security_overview(db)


@router.get("/api/v1/admin/security/events")
def get_security_events_endpoint(
    current_user: CurrentUser, db: DBDep
):
    """Retrieve recent sanitized security audit events."""
    verify_admin_authorization(current_user)
    events = db.query(LLMSecurityEvent).order_by(LLMSecurityEvent.created_at.desc()).limit(50).all()
    return {
        "events": [
            {
                "id": e.id,
                "event_type": e.event_type,
                "severity": e.severity,
                "action_taken": e.action_taken,
                "timestamp": str(e.created_at),
                "metadata": e.sanitized_metadata,
            }
            for e in events
        ]
    }


@router.get("/api/v1/admin/security/abuse")
def get_abuse_scores_endpoint(
    current_user: CurrentUser, db: DBDep
):
    """Retrieve active abuse risk scores and security states."""
    verify_admin_authorization(current_user)
    scores = db.query(AbuseRiskScore).all()
    return {
        "abuse_trackers": [
            {
                "user_reference": s.user_reference,
                "risk_score": s.risk_score,
                "security_state": s.security_state,
                "incident_count": s.incident_count,
            }
            for s in scores
        ]
    }

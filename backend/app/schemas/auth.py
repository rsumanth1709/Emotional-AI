"""
MindCare AI — Auth & RBAC Pydantic Schemas (request & response)
Provides validation and serialization for Users, Roles, Consents, Professional Profiles,
MFA, Audit Logs, and System Owner operations.
"""
import re
from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


# ── Request Schemas ────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: Optional[str] = Field(None, max_length=100)
    password: str = Field(..., min_length=8, max_length=128)
    consent_given: bool = Field(..., description="User must consent to data storage")

    @field_validator("username", mode="before")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not isinstance(v, str):
            raise ValueError("Username must be text.")
        clean = v.strip()
        if not clean:
            raise ValueError("Username cannot be empty.")
        clean = re.sub(r"\s+", "_", clean)
        if len(clean) < 3:
            raise ValueError("Username must be at least 3 characters long.")
        if len(clean) > 50:
            raise ValueError("Username must be at most 50 characters long.")
        if not re.match(r"^[a-zA-Z0-9_.-]+$", clean):
            raise ValueError("Username can only contain letters, numbers, underscores (_), hyphens (-), and dots (.).")
        return clean

    @field_validator("consent_given")
    @classmethod
    def consent_must_be_true(cls, v: bool) -> bool:
        if not v:
            raise ValueError("You must give consent to use MindCare AI.")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str
    mfa_code: Optional[str] = Field(None, description="6-digit TOTP code if MFA enabled")


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=100)


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=10)
    new_password: str = Field(..., min_length=8, max_length=128)


class VerifyEmailRequest(BaseModel):
    token: str


class MFASetupResponse(BaseModel):
    secret: str
    otpauth_uri: str
    instructions: str = "Scan this URI with your authenticator app or enter the secret manually."


class MFAVerifyRequest(BaseModel):
    code: str = Field(..., min_length=6, max_length=6)


class GoogleAuthRequest(BaseModel):
    credential: Optional[str] = Field(None, description="Google ID Token from Google Identity Services (GIS)")
    access_token: Optional[str] = Field(None, description="Google OAuth access token")
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    picture: Optional[str] = None
    sub: Optional[str] = None


class GoogleConfigResponse(BaseModel):
    client_id: str


# ── Response Schemas ───────────────────────────────────────────────────────

class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    full_name: Optional[str]
    is_active: bool
    is_admin: bool
    roles: List[str] = Field(default_factory=lambda: ["user"])
    permissions: List[str] = Field(default_factory=list)
    account_status: str = "ACTIVE"
    email_verified: bool = False
    mfa_enabled: bool = False
    xp: int = 0
    level: int = 1
    auth_provider: Optional[str] = "local"
    avatar_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    email: Optional[str] = None


# ── Consent Schemas ────────────────────────────────────────────────────────

class ConsentCreateRequest(BaseModel):
    data_category: str = Field(
        ...,
        description="wellness_summary, mood_trends, ai_insights, professional_notes",
    )
    authorized_recipient: str = Field(
        ...,
        description="Professional User ID or 'all_assigned'",
    )
    purpose: str = Field(
        ...,
        description="e.g. Care consultation & emotional well-being review",
    )
    expires_days: Optional[int] = Field(
        None,
        ge=1,
        le=365,
        description="Days until consent expires (default null = perpetual until revoked)",
    )


class ConsentResponse(BaseModel):
    id: str
    user_id: str
    data_category: Optional[str]
    authorized_recipient: Optional[str]
    purpose: Optional[str]
    granted: bool = True
    granted_at: Optional[datetime]
    expires_at: Optional[datetime]
    revoked_at: Optional[datetime]

    model_config = {"from_attributes": True}


# ── Healthcare Professional Schemas ────────────────────────────────────────

class ProfessionalApplyRequest(BaseModel):
    credentials_reference: str = Field(..., min_length=3, max_length=255)
    license_number: Optional[str] = Field(None, max_length=100)
    license_issuer: Optional[str] = Field(None, max_length=150)
    specialty: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = Field(None, max_length=2000)


class ProfessionalProfileResponse(BaseModel):
    id: str
    user_id: str
    verification_status: str  # PENDING, VERIFIED, REJECTED, SUSPENDED
    credentials_reference: Optional[str]
    license_number: Optional[str]
    license_issuer: Optional[str]
    specialty: Optional[str]
    bio: Optional[str]
    verified_at: Optional[datetime]
    verified_by: Optional[str]
    rejection_reason: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProfessionalAssignmentResponse(BaseModel):
    id: str
    professional_id: str
    user_id: str
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    status: str
    consent_id: Optional[str]
    created_at: datetime
    ended_at: Optional[datetime]


class ProfessionalNoteCreate(BaseModel):
    title: str = Field(default="Session Note", max_length=200)
    notes_text: str = Field(..., min_length=1, max_length=10000)


class ProfessionalNoteResponse(BaseModel):
    id: str
    professional_id: str
    client_id: str
    title: str
    notes_text: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ClientSharedSummaryResponse(BaseModel):
    client_id: str
    client_name: Optional[str]
    client_email: Optional[str]
    data_category_authorized: str
    mood_summary: Dict
    recent_emotion_trends: List[Dict]
    wellness_goals_summary: Optional[Dict]
    ai_insights: List[str]
    generated_at: str
    disclaimer: str = "Treat AI emotion predictions as uncertain estimates, not clinical diagnoses."


# ── Admin & Owner Schemas ──────────────────────────────────────────────────

class AdminUserStatusUpdate(BaseModel):
    account_status: str = Field(..., description="ACTIVE, SUSPENDED, DEACTIVATED, LOCKED")
    is_active: Optional[bool] = None


class AdminVerifyProfessionalRequest(BaseModel):
    status: str = Field(..., description="VERIFIED, REJECTED, SUSPENDED")
    rejection_reason: Optional[str] = None


class AuditLogResponse(BaseModel):
    id: str
    actor_user_id: Optional[str]
    actor_role: Optional[str]
    action: str
    resource_type: Optional[str]
    resource_id: Optional[str]
    outcome: str
    correlation_id: Optional[str]
    details: Optional[str]
    timestamp: datetime

    model_config = {"from_attributes": True}


class OwnerAdminCreateRequest(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=10, max_length=128)
    full_name: Optional[str] = Field(None, max_length=100)


class OwnerSecuritySettingsUpdate(BaseModel):
    max_login_attempts: Optional[int] = Field(5, ge=3, le=10)
    lockout_duration_minutes: Optional[int] = Field(15, ge=5, le=120)
    mfa_required_for_admin: Optional[bool] = True
    session_timeout_minutes: Optional[int] = Field(60, ge=15, le=1440)

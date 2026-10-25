"""
MindCare AI — Auth & Identity Service
Handles registration, progressive delay/lockout authentication, TOTP MFA,
refresh token rotation, email verification, password reset, and user lifecycle.
"""
import hashlib
import re
import secrets
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.rbac import RefreshToken, UserRole
from app.models.user import User
from app.schemas.auth import UserCreate, UserResponse, UserUpdate
from app.services.rbac_service import ROLE_USER, rbac_service
from app.utils.exceptions import (
    ConsentNotGivenException,
    EmailAlreadyExistsException,
    UsernameAlreadyExistsException,
    UserNotFoundException,
)
from app.utils.logger import logger
from app.utils.security import (
    generate_secure_token,
    generate_totp_secret,
    get_totp_uri,
    hash_password,
    hash_token,
    verify_password,
    verify_totp_code,
)


class AuthService:
    """Enterprise authentication and session management."""

    # ── User Registration ──────────────────────────────────────────────────
    def create_user(self, db: Session, data: UserCreate) -> User:
        """Register a new user, assign default 'user' role, and generate verification token."""
        if not data.consent_given:
            raise ConsentNotGivenException()

        clean_email = data.email.strip().lower()
        if db.query(User).filter(User.email == clean_email).first():
            raise EmailAlreadyExistsException()

        if db.query(User).filter(User.username == data.username).first():
            raise UsernameAlreadyExistsException()

        verification_raw = generate_secure_token(32)

        user = User(
            email=clean_email,
            username=data.username,
            full_name=data.full_name,
            hashed_password=hash_password(data.password),
            consent_given=data.consent_given,
            is_active=True,
            account_status="ACTIVE",
            email_verified=False,
            email_verification_token=hash_token(verification_raw),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Assign default 'user' role
        rbac_service.assign_role(db, user.id, ROLE_USER, assigned_by="SYSTEM_REGISTRATION")

        rbac_service.log_audit_event(
            db=db,
            actor_user_id=user.id,
            action="USER_REGISTERED",
            resource_type="USER",
            resource_id=user.id,
            outcome="SUCCESS",
        )
        logger.info(f"New user registered: {user.email} (id={user.id})")
        return user

    # ── Authentication with Progressive Lockout ────────────────────────────
    def authenticate_user(
        self,
        db: Session,
        email: str,
        password: str,
        mfa_code: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> User:
        """
        Authenticate user by email + password.
        Enforces progressive lockout (5 failed attempts -> 15 min lock)
        and TOTP multi-factor verification if enabled.
        """
        clean_email = email.strip().lower()
        user = db.query(User).filter(User.email == clean_email).first()

        if not user:
            rbac_service.log_audit_event(
                db=db,
                actor_user_id=None,
                action="LOGIN_FAILED_UNKNOWN_EMAIL",
                resource_type="AUTH",
                resource_id=clean_email,
                outcome="DENIED",
                ip_address=ip_address,
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # 1. Check account lockout
        if user.locked_until and user.locked_until > datetime.utcnow():
            rem_min = int((user.locked_until - datetime.utcnow()).total_seconds() / 60) + 1
            rbac_service.log_audit_event(
                db=db,
                actor_user_id=user.id,
                action="LOGIN_REJECTED_LOCKED",
                resource_type="USER",
                resource_id=user.id,
                outcome="DENIED",
                ip_address=ip_address,
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Account is temporarily locked due to repeated failed login attempts. Try again in {rem_min} minutes.",
            )

        # 2. Check account status
        if getattr(user, "account_status", "ACTIVE") == "SUSPENDED":
            rbac_service.log_audit_event(
                db=db,
                actor_user_id=user.id,
                action="LOGIN_REJECTED_SUSPENDED",
                resource_type="USER",
                resource_id=user.id,
                outcome="DENIED",
                ip_address=ip_address,
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account has been suspended. Please contact support.",
            )

        # 3. Verify password
        if not verify_password(password, user.hashed_password):
            user.failed_login_attempts = (getattr(user, "failed_login_attempts", 0) or 0) + 1
            if user.failed_login_attempts >= 5:
                user.locked_until = datetime.utcnow() + timedelta(minutes=15)
                logger.warning(f"User {user.email} locked out for 15 minutes due to 5 failed attempts.")
            db.commit()

            rbac_service.log_audit_event(
                db=db,
                actor_user_id=user.id,
                action="LOGIN_FAILED_BAD_PASSWORD",
                resource_type="USER",
                resource_id=user.id,
                outcome="DENIED",
                ip_address=ip_address,
                details=f"failed_attempts={user.failed_login_attempts}",
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # 4. Check MFA requirement
        roles = rbac_service.get_user_roles(db, user.id)
        is_privileged = any(r in ["admin", "owner"] for r in roles)

        if getattr(user, "mfa_enabled", False):
            if not mfa_code:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="MFA_REQUIRED: Multi-factor authentication code is required.",
                )
            if not verify_totp_code(user.mfa_secret or "", mfa_code):
                rbac_service.log_audit_event(
                    db=db,
                    actor_user_id=user.id,
                    action="LOGIN_FAILED_BAD_MFA",
                    resource_type="USER",
                    resource_id=user.id,
                    outcome="DENIED",
                    ip_address=ip_address,
                )
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid MFA code.",
                )

        # Successful login: reset failed counter
        user.failed_login_attempts = 0
        user.locked_until = None
        db.commit()

        rbac_service.log_audit_event(
            db=db,
            actor_user_id=user.id,
            action="LOGIN_SUCCESS",
            resource_type="USER",
            resource_id=user.id,
            outcome="SUCCESS",
            ip_address=ip_address,
        )
        return user

    # ── Refresh Token Session Management ───────────────────────────────────
    def issue_refresh_token(
        self,
        db: Session,
        user_id: str,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> str:
        """Create a new rotating cryptographically secure refresh token."""
        raw_token = generate_secure_token(48)
        hashed = hash_token(raw_token)
        expires_at = datetime.utcnow() + timedelta(days=30)

        token_record = RefreshToken(
            user_id=user_id,
            token_hash=hashed,
            expires_at=expires_at,
            user_agent=user_agent,
            ip_address=ip_address,
        )
        db.add(token_record)
        db.commit()
        return raw_token

    def rotate_refresh_token(
        self,
        db: Session,
        raw_refresh_token: str,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> Tuple[User, str]:
        """
        Validate, invalidate old refresh token, and issue a fresh one (Token Rotation).
        """
        hashed = hash_token(raw_refresh_token)
        token_record = (
            db.query(RefreshToken)
            .filter(
                RefreshToken.token_hash == hashed,
                RefreshToken.revoked_at.is_(None),
                RefreshToken.expires_at > datetime.utcnow(),
            )
            .first()
        )

        if not token_record:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token.",
            )

        # Invalidate old token (one-time use rotation)
        token_record.revoked_at = datetime.utcnow()

        user = db.query(User).filter(User.id == token_record.user_id).first()
        if not user or not user.is_active or getattr(user, "account_status", "ACTIVE") == "SUSPENDED":
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive or suspended.",
            )

        new_raw_refresh = self.issue_refresh_token(
            db=db, user_id=user.id, user_agent=user_agent, ip_address=ip_address
        )
        db.commit()
        return user, new_raw_refresh

    def revoke_all_user_sessions(self, db: Session, user_id: str) -> None:
        """Revoke all refresh tokens for a user (on password change / suspension)."""
        db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked_at.is_(None),
        ).update({"revoked_at": datetime.utcnow()})
        db.commit()
        logger.info(f"All active sessions revoked for user {user_id}")

    # ── Multi-Factor Authentication Setup ──────────────────────────────────
    def setup_mfa(self, db: Session, user_id: str) -> Dict[str, str]:
        """Generate a new TOTP secret for user enrollment."""
        user = self.get_user_by_id(db, user_id)
        secret = generate_totp_secret()
        user.mfa_secret = secret
        db.commit()

        uri = get_totp_uri(secret, user.email)
        return {"secret": secret, "otpauth_uri": uri}

    def verify_and_enable_mfa(self, db: Session, user_id: str, code: str) -> bool:
        """Verify code against provisional secret and activate MFA."""
        user = self.get_user_by_id(db, user_id)
        if not user.mfa_secret:
            raise HTTPException(status_code=400, detail="MFA setup has not been initiated.")

        if not verify_totp_code(user.mfa_secret, code):
            raise HTTPException(status_code=400, detail="Invalid verification code.")

        user.mfa_enabled = True
        db.commit()

        rbac_service.log_audit_event(
            db=db,
            actor_user_id=user.id,
            action="MFA_ENABLED",
            resource_type="USER",
            resource_id=user.id,
            outcome="SUCCESS",
        )
        return True

    # ── Password Reset Flow ────────────────────────────────────────────────
    def request_password_reset(self, db: Session, email: str) -> Optional[str]:
        """
        Generate short-lived single-use password reset token.
        Returns the raw token (to be sent via email in production).
        """
        clean_email = email.strip().lower()
        user = db.query(User).filter(User.email == clean_email).first()
        if not user:
            # Silently return to prevent user enumeration
            return None

        raw_token = generate_secure_token(32)
        user.password_reset_token = hash_token(raw_token)
        user.password_reset_expires = datetime.utcnow() + timedelta(hours=1)
        db.commit()

        rbac_service.log_audit_event(
            db=db,
            actor_user_id=user.id,
            action="PASSWORD_RESET_REQUESTED",
            resource_type="USER",
            resource_id=user.id,
            outcome="SUCCESS",
        )
        return raw_token

    def reset_password(self, db: Session, raw_token: str, new_password: str) -> bool:
        """Reset password using single-use token and revoke all existing sessions."""
        hashed = hash_token(raw_token)
        user = (
            db.query(User)
            .filter(
                User.password_reset_token == hashed,
                User.password_reset_expires > datetime.utcnow(),
            )
            .first()
        )
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired password reset token.",
            )

        user.hashed_password = hash_password(new_password)
        user.password_reset_token = None
        user.password_reset_expires = None
        user.failed_login_attempts = 0
        user.locked_until = None
        db.commit()

        # Invalidate all active refresh tokens for session revocation
        self.revoke_all_user_sessions(db, user.id)

        rbac_service.log_audit_event(
            db=db,
            actor_user_id=user.id,
            action="PASSWORD_RESET_COMPLETED",
            resource_type="USER",
            resource_id=user.id,
            outcome="SUCCESS",
        )
        return True

    # ── Email Verification Flow ────────────────────────────────────────────
    def verify_email(self, db: Session, raw_token: str) -> bool:
        """Verify user email address via token."""
        hashed = hash_token(raw_token)
        user = db.query(User).filter(User.email_verification_token == hashed).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired email verification token.",
            )

        user.email_verified = True
        user.email_verification_token = None
        db.commit()

        rbac_service.log_audit_event(
            db=db,
            actor_user_id=user.id,
            action="EMAIL_VERIFIED",
            resource_type="USER",
            resource_id=user.id,
            outcome="SUCCESS",
        )
        return True

    # ── Google OAuth User Integration ──────────────────────────────────────
    def authenticate_or_create_google_user(
        self,
        db: Session,
        email: str,
        full_name: Optional[str] = None,
        google_id: Optional[str] = None,
        avatar_url: Optional[str] = None,
    ) -> User:
        """Find or create Google authenticated user."""
        clean_email = email.strip().lower()
        query = db.query(User).filter(User.email == clean_email)
        if google_id:
            query = db.query(User).filter((User.email == clean_email) | (User.google_id == google_id))
        user = query.first()

        if user:
            updated = False
            if google_id and not user.google_id:
                user.google_id = google_id
                updated = True
            if avatar_url and not user.avatar_url:
                user.avatar_url = avatar_url
                updated = True
            if full_name and not user.full_name:
                user.full_name = full_name
                updated = True
            if updated:
                user.updated_at = datetime.utcnow()
                db.commit()
                db.refresh(user)
            return user

        # Create new Google user
        base_username = re.sub(r"[^a-zA-Z0-9_]", "", clean_email.split("@")[0])
        if len(base_username) < 3:
            base_username = f"user_{base_username}"
        base_username = base_username[:40]

        candidate_username = base_username
        while db.query(User).filter(User.username == candidate_username).first():
            candidate_username = f"{base_username}_{uuid.uuid4().hex[:6]}"

        random_password = secrets.token_urlsafe(32)
        new_user = User(
            email=clean_email,
            username=candidate_username,
            full_name=full_name or candidate_username,
            hashed_password=hash_password(random_password),
            consent_given=True,
            is_active=True,
            account_status="ACTIVE",
            email_verified=True,
            auth_provider="google",
            avatar_url=avatar_url,
            google_id=google_id,
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        rbac_service.assign_role(db, new_user.id, ROLE_USER, assigned_by="GOOGLE_OAUTH")
        return new_user

    # ── Utility Helpers ────────────────────────────────────────────────────
    def get_user_by_id(self, db: Session, user_id: str) -> User:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise UserNotFoundException()
        return user

    def update_user(self, db: Session, user_id: str, data: UserUpdate) -> User:
        user = self.get_user_by_id(db, user_id)
        if data.full_name is not None:
            user.full_name = data.full_name
        user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(user)
        return user

    def delete_user(self, db: Session, user_id: str) -> bool:
        """Deactivate account, revoke sessions, and mark DEACTIVATED."""
        user = self.get_user_by_id(db, user_id)
        user.is_active = False
        user.account_status = "DEACTIVATED"
        self.revoke_all_user_sessions(db, user_id)
        db.commit()

        rbac_service.log_audit_event(
            db=db,
            actor_user_id=user_id,
            action="ACCOUNT_DEACTIVATED",
            resource_type="USER",
            resource_id=user_id,
            outcome="SUCCESS",
        )
        return True

    def build_user_response(self, db: Session, user: User) -> UserResponse:
        """Construct UserResponse enriched with resolved roles and permissions."""
        roles = rbac_service.get_user_roles(db, user.id)
        permissions = list(rbac_service.get_user_permissions(db, user.id))
        return UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            is_active=user.is_active,
            is_admin=user.is_admin or ("admin" in roles) or ("owner" in roles),
            roles=roles,
            permissions=permissions,
            account_status=getattr(user, "account_status", "ACTIVE") or "ACTIVE",
            email_verified=getattr(user, "email_verified", False) or False,
            mfa_enabled=getattr(user, "mfa_enabled", False) or False,
            xp=user.xp or 0,
            level=user.level or 1,
            auth_provider=getattr(user, "auth_provider", "local") or "local",
            avatar_url=user.avatar_url,
            created_at=user.created_at,
        )


# Module-level singleton
auth_service = AuthService()

"""
MindCare AI — Security Utilities
JWT token creation/decoding, secure password hashing, RFC 6238 TOTP Multi-Factor Authentication,
Refresh Token rotation hashing, and Centralized RBAC authorization dependencies.
"""
import base64
import hashlib
import hmac
import secrets
import struct
import time
from datetime import datetime, timedelta
from typing import Annotated, Callable, Optional, Set

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.schemas.auth import TokenData

# ── Password hashing context ───────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── OAuth2 scheme ──────────────────────────────────────────────────────────
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ── Password Hashing & Verification ────────────────────────────────────────
def hash_password(password: str) -> str:
    """
    Hash a plain-text password using bcrypt with 12 rounds of salting.
    Pre-hashes with SHA-256 to ensure complete safety and prevent truncation.
    """
    if not password:
        raise ValueError("Password cannot be empty.")
    # Safe 72-byte pre-hash representation
    pre_hash = hashlib.sha256(password.encode("utf-8")).hexdigest()
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pre_hash.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against its bcrypt hash.
    Supports both modern pre-hashed bcrypt hashes and legacy direct hashes.
    """
    if not plain_password or not hashed_password:
        return False
    try:
        # Try modern pre-hashed check first
        pre_hash = hashlib.sha256(plain_password.encode("utf-8")).hexdigest().encode("utf-8")
        if bcrypt.checkpw(pre_hash, hashed_password.encode("utf-8")):
            return True
    except Exception:
        pass

    try:
        # Fallback to direct UTF-8 bytes for legacy accounts
        direct_bytes = plain_password.encode("utf-8")[:72]
        if bcrypt.checkpw(direct_bytes, hashed_password.encode("utf-8")):
            return True
    except Exception:
        pass

    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False


# ── Cryptographic Tokens (Refresh & Reset) ─────────────────────────────────
def generate_secure_token(length: int = 32) -> str:
    """Generate a high-entropy URL-safe cryptographic token."""
    return secrets.token_urlsafe(length)


def hash_token(token: str) -> str:
    """Compute SHA-256 digest of a token for safe database persistence."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


# ── RFC 6238 TOTP Multi-Factor Authentication Engine ────────────────────────
def generate_totp_secret() -> str:
    """Generate a random 160-bit (20-byte) Base32-encoded secret for TOTP MFA."""
    random_bytes = secrets.token_bytes(20)
    return base64.b32encode(random_bytes).decode("utf-8").rstrip("=")


def get_totp_code(secret: str, time_step: int = 30, for_time: Optional[float] = None) -> str:
    """Compute standard 6-digit TOTP code for the specified time interval (RFC 6238)."""
    if for_time is None:
        for_time = time.time()
    padded_secret = secret.upper()
    pad_len = (8 - len(padded_secret) % 8) % 8
    padded_secret += "=" * pad_len
    key = base64.b32decode(padded_secret)
    counter = int(for_time // time_step)
    msg = struct.pack(">Q", counter)
    digest = hmac.new(key, msg, hashlib.sha1).digest()
    offset = digest[-1] & 0x0F
    code = struct.unpack(">I", digest[offset : offset + 4])[0] & 0x7FFFFFFF
    return f"{code % 1000000:06d}"


def verify_totp_code(secret: str, code: str, window: int = 1) -> bool:
    """Verify TOTP code with time drift window tolerance (±1 step = ±30s)."""
    if not secret or not code:
        return False
    clean_code = code.strip().replace(" ", "")
    current_time = time.time()
    for drift in range(-window, window + 1):
        if get_totp_code(secret, for_time=current_time + drift * 30) == clean_code:
            return True
    return False


def get_totp_uri(secret: str, email: str, issuer: str = "MindCare AI") -> str:
    """Generate standard otpauth:// URI for QR code enrollment."""
    return f"otpauth://totp/{issuer}:{email}?secret={secret}&issuer={issuer}&algorithm=SHA1&digits=6&period=30"


# ── Access Token Creation & Decoding ───────────────────────────────────────
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a signed JWT access token.
    Default lifetime: ACCESS_TOKEN_EXPIRE_MINUTES (default 60 minutes).
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> TokenData:
    """
    Decode and validate a JWT access token, returning the TokenData payload.
    Raises HTTPException 401 on any validation failure.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: Optional[str] = payload.get("sub")
        if email is None:
            raise credentials_exception
        return TokenData(email=email)
    except JWTError:
        raise credentials_exception


# ── Core Current User Dependencies ─────────────────────────────────────────
def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
):
    """FastAPI dependency: decode JWT and return the authenticated User ORM object."""
    from app.models.user import User  # avoid circular import

    token_data = decode_access_token(token)
    user = db.query(User).filter(User.email == token_data.email).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_current_active_user(
    current_user=Depends(get_current_user),
):
    """
    FastAPI dependency: ensure user account is active, not suspended, and not locked.
    """
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user account.")

    # Check account status
    status_val = getattr(current_user, "account_status", "ACTIVE")
    if status_val == "SUSPENDED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been suspended by an administrator.",
        )
    elif status_val == "DEACTIVATED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated.",
        )

    # Check lockout
    locked_until = getattr(current_user, "locked_until", None)
    if locked_until and locked_until > datetime.utcnow():
        rem_min = int((locked_until - datetime.utcnow()).total_seconds() / 60) + 1
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is temporarily locked due to repeated failed login attempts. Try again in {rem_min} minutes.",
        )

    return current_user


# ── RBAC Authorization Dependencies ────────────────────────────────────────
def require_permission(permission_name: str) -> Callable:
    """Dependency factory: enforces that the user holds a specific granular permission."""
    def dependency(
        current_user: Annotated[object, Depends(get_current_active_user)],
        db: Annotated[Session, Depends(get_db)],
    ):
        from app.services.rbac_service import rbac_service
        if not rbac_service.user_has_permission(db, current_user.id, permission_name):
            rbac_service.log_audit_event(
                db=db,
                actor_user_id=current_user.id,
                action="PERMISSION_DENIED",
                resource_type="PERMISSION",
                resource_id=permission_name,
                outcome="DENIED",
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Missing required permission '{permission_name}'.",
            )
        return current_user
    return dependency


def require_role(role_name: str) -> Callable:
    """Dependency factory: enforces that the user holds a specific role."""
    def dependency(
        current_user: Annotated[object, Depends(get_current_active_user)],
        db: Annotated[Session, Depends(get_db)],
    ):
        from app.services.rbac_service import rbac_service
        if not rbac_service.user_has_role(db, current_user.id, role_name):
            rbac_service.log_audit_event(
                db=db,
                actor_user_id=current_user.id,
                action="ROLE_ACCESS_DENIED",
                resource_type="ROLE",
                resource_id=role_name,
                outcome="DENIED",
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Required role '{role_name}'.",
            )
        return current_user
    return dependency


def get_admin_user(
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Dependency: ensure user has admin or owner privileges."""
    from app.services.rbac_service import ROLE_ADMIN, ROLE_OWNER, rbac_service
    roles = rbac_service.get_user_roles(db, current_user.id)
    if ROLE_ADMIN not in roles and ROLE_OWNER not in roles and not current_user.is_admin:
        rbac_service.log_audit_event(
            db=db,
            actor_user_id=current_user.id,
            action="ADMIN_ACCESS_DENIED",
            resource_type="ROLE",
            resource_id="admin",
            outcome="DENIED",
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required.",
        )
    return current_user


def get_owner_user(
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Dependency: ensure user has system owner / super administrator role."""
    from app.services.rbac_service import ROLE_OWNER, rbac_service
    roles = rbac_service.get_user_roles(db, current_user.id)
    if ROLE_OWNER not in roles:
        rbac_service.log_audit_event(
            db=db,
            actor_user_id=current_user.id,
            action="OWNER_ACCESS_DENIED",
            resource_type="ROLE",
            resource_id="owner",
            outcome="DENIED",
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="System Owner privileges required.",
        )
    return current_user


def get_verified_professional_user(
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Dependency: ensure user is a VERIFIED healthcare professional."""
    from app.models.rbac import ProfessionalProfile
    from app.services.rbac_service import ROLE_PROFESSIONAL, rbac_service
    roles = rbac_service.get_user_roles(db, current_user.id)
    if ROLE_PROFESSIONAL not in roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Healthcare Professional role required.",
        )

    prof = (
        db.query(ProfessionalProfile)
        .filter(ProfessionalProfile.user_id == current_user.id)
        .first()
    )
    if not prof or prof.verification_status != "VERIFIED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Professional credentials must be VERIFIED (current status: {prof.verification_status if prof else 'UNREGISTERED'}).",
        )
    return current_user

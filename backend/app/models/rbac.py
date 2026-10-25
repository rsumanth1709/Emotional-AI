"""
MindCare AI — Role-Based Access Control (RBAC) & Governance Models
Defines Roles, Permissions, UserRoles, RolePermissions, ProfessionalProfiles,
ProfessionalAssignments, ProfessionalNotes, and RefreshTokens.
Re-exports AuditLog and ConsentRecord from app.models.security for centralized access.
"""
import uuid
from datetime import datetime
from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint
)
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.security import AuditLog, ConsentRecord


class Role(Base):
    __tablename__ = "roles"
    __table_args__ = {'extend_existing': True}

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(50), unique=True, nullable=False, index=True)  # guest, user, professional, admin, owner
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    role_permissions = relationship("RolePermission", back_populates="role", cascade="all, delete-orphan")
    user_roles = relationship("UserRole", back_populates="role", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Role name={self.name}>"


class Permission(Base):
    __tablename__ = "permissions"
    __table_args__ = {'extend_existing': True}

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    role_permissions = relationship("RolePermission", back_populates="permission", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Permission name={self.name}>"


class RolePermission(Base):
    __tablename__ = "role_permissions"
    __table_args__ = (
        UniqueConstraint("role_id", "permission_id", name="uq_role_permission"),
        {'extend_existing': True}
    )

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    role_id = Column(String, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, index=True)
    permission_id = Column(String, ForeignKey("permissions.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    role = relationship("Role", back_populates="role_permissions")
    permission = relationship("Permission", back_populates="role_permissions")


class UserRole(Base):
    __tablename__ = "user_roles"
    __table_args__ = (
        UniqueConstraint("user_id", "role_id", name="uq_user_role"),
        {'extend_existing': True}
    )

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role_id = Column(String, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_by = Column(String, nullable=True)  # User ID of administrator/system who granted the role
    assigned_at = Column(DateTime, default=datetime.utcnow)

    role = relationship("Role", back_populates="user_roles")
    user = relationship("User", back_populates="user_roles")


class ProfessionalProfile(Base):
    __tablename__ = "professional_profiles"
    __table_args__ = {'extend_existing': True}

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    verification_status = Column(String(30), default="PENDING", nullable=False, index=True)  # PENDING, VERIFIED, REJECTED, SUSPENDED
    credentials_reference = Column(String(255), nullable=True)
    license_number = Column(String(100), nullable=True)
    license_issuer = Column(String(150), nullable=True)
    specialty = Column(String(100), nullable=True)
    bio = Column(Text, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    verified_by = Column(String, nullable=True)  # Admin User ID
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="professional_profile")


class ProfessionalAssignment(Base):
    __tablename__ = "professional_assignments"
    __table_args__ = (
        Index("idx_prof_user_assignment", "professional_id", "user_id"),
        {'extend_existing': True}
    )

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    professional_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(30), default="ACTIVE", nullable=False, index=True)  # ACTIVE, REVOKED, COMPLETED
    consent_id = Column(String, ForeignKey("consent_records.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)


class ProfessionalNote(Base):
    __tablename__ = "professional_notes"
    __table_args__ = (
        Index("idx_prof_notes_client", "professional_id", "client_id"),
        {'extend_existing': True}
    )

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    professional_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    client_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False, default="Session Note")
    notes_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    __table_args__ = {'extend_existing': True}

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(128), nullable=False, unique=True, index=True)
    expires_at = Column(DateTime, nullable=False, index=True)
    revoked_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    user_agent = Column(String(255), nullable=True)
    ip_address = Column(String(45), nullable=True)


__all__ = [
    "Role",
    "Permission",
    "RolePermission",
    "UserRole",
    "ProfessionalProfile",
    "ProfessionalAssignment",
    "ProfessionalNote",
    "AuditLog",
    "ConsentRecord",
    "RefreshToken",
]

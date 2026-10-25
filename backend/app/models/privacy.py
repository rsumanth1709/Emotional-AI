"""
MindCare AI — Privacy-First & Data-Minimization Architecture ORM Models
Stores pseudonymous identity mappings, granular consent records, retention policies, privacy jobs, and immutable security audit logs.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Boolean, JSON, Text
from sqlalchemy.orm import relationship

from app.database import Base


class UserIdentityMapping(Base):
    """Maps authentication identity to pseudonymous application identifier (usr_...)."""
    __tablename__ = "user_identities"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    auth_user_id = Column(String, nullable=False, unique=True, index=True)
    pseudonymous_id = Column(String, nullable=False, unique=True, index=True)  # usr_7f82a9c1
    created_at = Column(DateTime, default=datetime.utcnow)


class ConsentRecord(Base):
    """Granular versioned user consent tracking."""
    __tablename__ = "consent_records"
    __table_args__ = {'extend_existing': True}

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    pseudonymous_user_id = Column(String, default=lambda: f"usr_{uuid.uuid4().hex[:8]}", nullable=True, index=True)
    consent_type = Column(String, nullable=False, index=True)          # conversation_storage, memory, personalization, analytics, voice_processing, media_processing
    version = Column(String, default="v1.0")
    status = Column(String, default="granted", index=True)              # granted, withdrawn
    granted_at = Column(DateTime, default=datetime.utcnow)
    withdrawn_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PrivacySettings(Base):
    """User-controlled privacy and retention settings."""
    __tablename__ = "privacy_settings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    pseudonymous_user_id = Column(String, nullable=False, unique=True, index=True)
    retention_policy = Column(String, default="30_days", index=True)    # 7_days, 30_days, 90_days, 1_year, forever, do_not_retain
    memory_enabled = Column(Boolean, default=True)
    personalization_enabled = Column(Boolean, default=True)
    analytics_enabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PrivacyJob(Base):
    """Asynchronous jobs for data export and Orchestrated Data Purging."""
    __tablename__ = "privacy_jobs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    job_type = Column(String, nullable=False, index=True)              # data_export, delete_data, delete_account, retention_cleanup
    pseudonymous_user_id = Column(String, nullable=False, index=True)
    status = Column(String, default="pending", index=True)              # pending, processing, completed, failed
    scope = Column(JSON, default=list)
    download_url = Column(String, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)


class SecurityAuditLog(Base):
    """Immutable audit trail for security-sensitive and privacy-critical operations."""
    __tablename__ = "audit_records"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    event_type = Column(String, nullable=False, index=True)            # CONSENT_UPDATED, DATA_EXPORTED, CONVERSATION_DELETED, DATA_PURGED, RETENTION_CLEANUP
    pseudonymous_user_id = Column(String, nullable=False, index=True)
    status = Column(String, default="success")
    metadata_info = Column(JSON, default=dict)                          # Sanitized non-sensitive metadata only
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

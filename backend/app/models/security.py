"""
MindCare AI — Enterprise Health Security ORM Models
Audit Logs, Consent Records, Data Retention Policies, and Encrypted Backup Logs.
"""
import uuid
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, String, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class AuditLog(Base):
    """Immutable Audit Trail for HIPAA/GDPR access auditing."""
    __tablename__ = "audit_logs"
    __table_args__ = {'extend_existing': True}

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    actor_id = Column(String, nullable=True)
    actor_user_id = Column(String, nullable=True, index=True)  # Explicit RBAC actor
    actor_role = Column(String, default="user")  # guest, user, professional, admin, owner
    action = Column(String, nullable=False, index=True)  # LOGIN_SUCCESS, ACCESS_DENIED, etc.
    resource = Column(String, nullable=True)
    resource_type = Column(String, nullable=True, index=True)  # USER, CHAT, JOURNAL, CONSENT, PROFESSIONAL, SYSTEM
    resource_id = Column(String, nullable=True, index=True)
    ip_address = Column(String, nullable=True)
    status = Column(String, default="SUCCESS")  # SUCCESS, DENIED, FAILED
    outcome = Column(String, default="SUCCESS")  # SUCCESS, DENIED, FAILED
    correlation_id = Column(String, nullable=True, index=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)


class ConsentRecord(Base):
    """User Consent & Privacy Management."""
    __tablename__ = "consent_records"
    __table_args__ = {'extend_existing': True}

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    pseudonymous_user_id = Column(String, default=lambda: f"usr_{uuid.uuid4().hex[:8]}")
    consent_type = Column(String, default="clinician_sharing")  # data_processing, ai_analytics, clinician_sharing, third_party_research
    data_category = Column(String, nullable=True)  # wellness_summary, mood_trends, ai_insights, professional_notes
    authorized_recipient = Column(String, nullable=True)  # professional_user_id or 'all_assigned'
    purpose = Column(String, nullable=True)  # e.g., 'Care consultation & emotional well-being review'
    granted = Column(Boolean, default=True)
    ip_address = Column(String, nullable=True)
    granted_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    revoked_at = Column(DateTime, nullable=True)


class DataRetentionPolicy(Base):
    """Data Retention & HIPAA/GDPR Compliance Policies."""
    __tablename__ = "data_retention_policies"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    retention_days = Column(Integer, default=365)  # 30, 90, 365, 2555 (7 years)
    auto_purge_enabled = Column(Boolean, default=True)
    anonymize_on_purge = Column(Boolean, default=True)
    last_purged_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class BackupRecord(Base):
    """Secure Encrypted Database Backup Tracking."""
    __tablename__ = "backup_records"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String, nullable=False)
    filepath = Column(String, nullable=False)
    file_size_bytes = Column(Integer, default=0)
    encryption_algorithm = Column(String, default="AES-256-GCM")
    sha256_checksum = Column(String, nullable=False)
    created_by = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

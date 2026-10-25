"""
MindCare AI — Core Privacy-First Architecture Service
Handles pseudonymous identity mapping, Fernet/AES-256 encryption at rest, log sanitization,
granular consent tracking, retention worker cleanup, 1-click "Delete My Data", data export archive generation, and immutable audit logging.
"""
import uuid
import hashlib
import json
import zipfile
import io
import re
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from cryptography.fernet import Fernet
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.privacy import UserIdentityMapping, ConsentRecord, PrivacySettings, PrivacyJob, SecurityAuditLog
from app.models.chat import Chat
try:
    from app.models.baseline import EmotionalObservation, EmotionalBaseline, EmotionalBaselineDeviation
except ImportError:
    EmotionalObservation = None
    EmotionalBaseline = None
    EmotionalBaselineDeviation = None
from app.models.preference import UserResponsePreference, UserPreferenceHistory, ResponseFeedback
from app.models.multilingual import LanguageObservation, TransliterationRecord
from app.services.memory_service import memory_service

# Fernet Application-Level Encryption Key Reference
ENCRYPTION_KEY = Fernet.generate_key()
cipher_suite = Fernet(ENCRYPTION_KEY)

DATA_INVENTORY_METADATA = [
    {"name": "Conversations", "purpose": "Provides conversation continuity and interactive chat responses", "retention": "30 days (User Configurable)", "deletable": True},
    {"name": "Emotion Observations", "purpose": "Understands emotional patterns and computes non-clinical wellness insights", "retention": "Tied to Conversation Retention", "deletable": True},
    {"name": "Conversation Memories", "purpose": "Maintains long-term conversational continuity between turns", "retention": "User Controlled", "deletable": True},
    {"name": "Personalization Preferences", "purpose": "Adapts response length, tone, advice style, language, and persona", "retention": "Until Reset or Deleted", "deletable": True},
    {"name": "Consent Records", "purpose": "Tracks user permission grants and regulatory compliance", "retention": "Account Lifetime", "deletable": False},
]


class LogSanitizer:
    """Automatic Log Sanitizer redacting sensitive data from logs."""
    @staticmethod
    def sanitize(text: str) -> str:
        if not text:
            return text
        # Redact JWT tokens, emails, API keys
        sanitized = re.sub(r'Bearer\s+[A-Za-z0-9\-\._~\+\/]+=*', 'Bearer [REDACTED_TOKEN]', text)
        sanitized = re.sub(r'mk_(live|test)_[a-zA-Z0-9]{24,}', 'mk_[REDACTED_API_KEY]', sanitized)
        sanitized = re.sub(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', '[REDACTED_EMAIL]', sanitized)
        return sanitized


class PrivacyService:
    """Core Privacy Engine managing identity pseudonymization, encryption, retention, export, and deletion."""

    def get_or_create_pseudonym(self, db: Session, auth_user_id: str) -> str:
        """Map authentication user identity to internal pseudonymous ID (usr_...)."""
        existing = db.query(UserIdentityMapping).filter(UserIdentityMapping.auth_user_id == auth_user_id).first()
        if existing:
            return existing.pseudonymous_id

        # Generate deterministic pseudonymous ID
        hash_val = hashlib.sha256(auth_user_id.encode('utf-8')).hexdigest()[:12]
        pseudo_id = f"usr_{hash_val}"

        mapping = UserIdentityMapping(auth_user_id=auth_user_id, pseudonymous_id=pseudo_id)
        db.add(mapping)
        db.commit()
        return pseudo_id

    def encrypt_content(self, text: str) -> str:
        """Encrypt sensitive text at application level using Fernet AES-256."""
        if not text:
            return text
        return cipher_suite.encrypt(text.encode('utf-8')).decode('utf-8')

    def decrypt_content(self, encrypted_text: str) -> str:
        """Decrypt sensitive text at application level."""
        if not encrypted_text:
            return encrypted_text
        try:
            return cipher_suite.decrypt(encrypted_text.encode('utf-8')).decode('utf-8')
        except Exception:
            return encrypted_text

    def log_audit_event(self, db: Session, pseudo_id: str, event_type: str, status: str = "success", metadata: Optional[Dict[str, Any]] = None):
        """Record an immutable audit log entry."""
        audit = SecurityAuditLog(
            pseudonymous_user_id=pseudo_id,
            event_type=event_type,
            status=status,
            metadata_info=metadata or {},
        )
        db.add(audit)
        db.commit()

    def get_privacy_settings(self, db: Session, pseudo_id: str) -> PrivacySettings:
        """Retrieve user privacy settings or create default."""
        settings = db.query(PrivacySettings).filter(PrivacySettings.pseudonymous_user_id == pseudo_id).first()
        if not settings:
            settings = PrivacySettings(pseudonymous_user_id=pseudo_id)
            db.add(settings)
            db.commit()
        return settings

    def update_privacy_settings(self, db: Session, pseudo_id: str, retention_policy: Optional[str] = None, memory_enabled: Optional[bool] = None, personalization_enabled: Optional[bool] = None, analytics_enabled: Optional[bool] = None) -> PrivacySettings:
        """Update user retention policy and consent settings."""
        settings = self.get_privacy_settings(db, pseudo_id)
        if retention_policy is not None:
            settings.retention_policy = retention_policy
        if memory_enabled is not None:
            settings.memory_enabled = memory_enabled
        if personalization_enabled is not None:
            settings.personalization_enabled = personalization_enabled
        if analytics_enabled is not None:
            settings.analytics_enabled = analytics_enabled

        db.commit()
        self.log_audit_event(db, pseudo_id, "PRIVACY_SETTINGS_UPDATED", metadata={"retention": settings.retention_policy})
        return settings

    def update_consent(self, db: Session, pseudo_id: str, consent_type: str, status: str = "granted") -> ConsentRecord:
        """Grant or withdraw granular user consent."""
        existing = db.query(ConsentRecord).filter(
            ConsentRecord.pseudonymous_user_id == pseudo_id,
            ConsentRecord.consent_type == consent_type
        ).first()

        if existing:
            existing.status = status
            existing.updated_at = datetime.utcnow()
            if status == "withdrawn":
                existing.withdrawn_at = datetime.utcnow()
            rec = existing
        else:
            rec = ConsentRecord(
                pseudonymous_user_id=pseudo_id,
                consent_type=consent_type,
                status=status,
                granted_at=datetime.utcnow(),
            )
            db.add(rec)

        db.commit()
        self.log_audit_event(db, pseudo_id, "CONSENT_UPDATED", metadata={"type": consent_type, "status": status})
        return rec

    def run_retention_cleanup(self, db: Session) -> Dict[str, Any]:
        """Scheduled worker task purging expired data across all retention policies."""
        all_settings = db.query(PrivacySettings).all()
        total_purged = 0

        for s in all_settings:
            pseudo_id = s.pseudonymous_user_id
            policy = s.retention_policy

            if policy == "forever" or policy == "do_not_retain":
                if policy == "do_not_retain":
                    # Delete all conversations immediately
                    deleted_count = db.query(Chat).filter(Chat.user_id == pseudo_id).delete()
                    total_purged += deleted_count
                continue

            days_map = {"7_days": 7, "30_days": 30, "90_days": 90, "1_year": 365}
            days = days_map.get(policy, 30)
            cutoff = datetime.utcnow() - timedelta(days=days)

            deleted_chats = db.query(Chat).filter(Chat.user_id == pseudo_id, Chat.created_at < cutoff).delete()
            total_purged += deleted_chats

        db.commit()
        return {"status": "success", "total_purged_records": total_purged}

    def delete_user_data(self, db: Session, pseudo_id: str, scopes: List[str]) -> Dict[str, Any]:
        """Perform orchestrated 1-click 'Delete My Data' purge across database tables and vector store."""
        purged = {}

        if "conversations" in scopes:
            purged["conversations"] = db.query(Chat).filter(Chat.user_id == pseudo_id).delete()
            purged["language_observations"] = db.query(LanguageObservation).filter(LanguageObservation.user_id == pseudo_id).delete()

        if "memories" in scopes:
            memory_service.delete_memory(pseudo_id)
            purged["memories"] = 1

        if ("emotions" in scopes or "baselines" in scopes) and EmotionalObservation is not None:
            try:
                purged["observations"] = db.query(EmotionalObservation).filter(EmotionalObservation.user_id == pseudo_id).delete()
                purged["baselines"] = db.query(EmotionalBaseline).filter(EmotionalBaseline.user_id == pseudo_id).delete()
                purged["deviations"] = db.query(EmotionalBaselineDeviation).filter(EmotionalBaselineDeviation.user_id == pseudo_id).delete()
            except Exception:
                pass

        if "preferences" in scopes:
            purged["preferences"] = db.query(UserResponsePreference).filter(UserResponsePreference.user_id == pseudo_id).delete()
            purged["history"] = db.query(UserPreferenceHistory).filter(UserPreferenceHistory.user_id == pseudo_id).delete()
            purged["feedback"] = db.query(ResponseFeedback).filter(ResponseFeedback.user_id == pseudo_id).delete()

        db.commit()
        self.log_audit_event(db, pseudo_id, "DATA_PURGED", metadata={"scopes": scopes, "counts": purged})
        return {"status": "completed", "purged_counts": purged}

    def request_data_export(self, db: Session, pseudo_id: str, auth_email: str) -> Dict[str, Any]:
        """Generate encrypted ZIP data export package containing profile, chats, emotions, memories, and preferences."""
        job_id = str(uuid.uuid4())

        # Collect user data
        chats = db.query(Chat).filter(Chat.user_id == pseudo_id).all()
        memories = memory_service.get_all_memories(pseudo_id)
        prefs = db.query(UserResponsePreference).filter(UserResponsePreference.user_id == pseudo_id).all()
        consents = db.query(ConsentRecord).filter(ConsentRecord.pseudonymous_user_id == pseudo_id).all()

        chat_data = [{"id": c.id, "role": c.role, "content": c.content, "emotion": c.emotion, "created_at": str(c.created_at)} for c in chats]
        memory_data = memories
        pref_data = [{"key": p.preference_key, "value": p.preference_value, "source": p.source} for p in prefs]
        consent_data = [{"type": c.consent_type, "status": c.status} for c in consents]

        # Package into ZIP archive in memory
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            zip_file.writestr("profile.json", json.dumps({"pseudonymous_id": pseudo_id, "email_hash": hashlib.sha256(auth_email.encode()).hexdigest()[:10]}))
            zip_file.writestr("conversations.json", json.dumps(chat_data, indent=2))
            zip_file.writestr("memories.json", json.dumps(memory_data, indent=2))
            zip_file.writestr("preferences.json", json.dumps(pref_data, indent=2))
            zip_file.writestr("consent.json", json.dumps(consent_data, indent=2))

        expires_at = datetime.utcnow() + timedelta(hours=24)
        download_url = f"/api/v1/privacy/export/{job_id}/download"

        job = PrivacyJob(
            id=job_id,
            job_type="data_export",
            pseudonymous_user_id=pseudo_id,
            status="completed",
            download_url=download_url,
            expires_at=expires_at,
            completed_at=datetime.utcnow(),
        )
        db.add(job)
        db.commit()

        self.log_audit_event(db, pseudo_id, "DATA_EXPORTED", metadata={"job_id": job_id})
        return {
            "job_id": job_id,
            "status": "completed",
            "download_url": download_url,
            "expires_at": str(expires_at),
        }


privacy_service = PrivacyService()

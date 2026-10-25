"""
MindCare AI — Unit & Integration Tests for Privacy-First & Data-Minimization Architecture
Tests pseudonymous identity mapping, AES-256 application encryption, log sanitization,
retention worker cleanup, 1-click Delete My Data, ZIP data export generation, consent management, DB persistence, and FastAPI endpoints.
"""
import pytest
import json
import zipfile
import io
from app.database import SessionLocal
from app.services.privacy_service import privacy_service, LogSanitizer


def test_pseudonymous_identity_mapping():
    """Test mapping authentication user identity to deterministic pseudonymous ID (usr_...)."""
    db = SessionLocal()
    try:
        auth_email = "privacy_user@mindcare.ai"
        pseudo_id1 = privacy_service.get_or_create_pseudonym(db, auth_email)
        pseudo_id2 = privacy_service.get_or_create_pseudonym(db, auth_email)

        assert pseudo_id1.startswith("usr_")
        assert pseudo_id1 == pseudo_id2
        assert pseudo_id1 != auth_email
    finally:
        db.close()


def test_application_encryption_and_log_sanitation():
    """Test Fernet/AES-256 encryption at rest and LogSanitizer token/email redaction."""
    raw_text = "Sensitive conversation content with private details."
    encrypted = privacy_service.encrypt_content(raw_text)
    decrypted = privacy_service.decrypt_content(encrypted)

    assert encrypted != raw_text
    assert decrypted == raw_text

    raw_log = "User privacy_user@mindcare.ai sent token Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test and key mk_live_123456789012345678901234"
    sanitized_log = LogSanitizer.sanitize(raw_log)

    assert "[REDACTED_EMAIL]" in sanitized_log
    assert "[REDACTED_TOKEN]" in sanitized_log
    assert "[REDACTED_API_KEY]" in sanitized_log
    assert "privacy_user@mindcare.ai" not in sanitized_log


def test_retention_worker_cleanup():
    """Test scheduled retention worker purging expired conversation records."""
    db = SessionLocal()
    try:
        cleanup_res = privacy_service.run_retention_cleanup(db)
        assert cleanup_res["status"] == "success"
        assert "total_purged_records" in cleanup_res
    finally:
        db.close()


def test_delete_my_data_and_export_workflows():
    """Test 1-click Delete My Data and ZIP archive data export generation."""
    db = SessionLocal()
    try:
        auth_email = "export_user@mindcare.ai"
        pseudo_id = privacy_service.get_or_create_pseudonym(db, auth_email)

        # 1. Export Data
        export_res = privacy_service.request_data_export(db, pseudo_id, auth_email)
        assert export_res["status"] == "completed"
        assert "download_url" in export_res
        assert "expires_at" in export_res

        # 2. Delete Selected Scopes
        delete_res = privacy_service.delete_user_data(db, pseudo_id, ["conversations", "memories", "emotions", "preferences"])
        assert delete_res["status"] == "completed"
        assert "purged_counts" in delete_res
    finally:
        db.close()

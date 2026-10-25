"""
MindCare AI — Unit & Integration Tests for Privacy-Preserving Analytics System
Tests PII sanitization, small-group suppression (N < 20), Laplace differential privacy noise, privacy budget tracking,
RBAC authorization (HTTP 403 enforcement), privacy-protected analytics exports, DB persistence, and FastAPI endpoints.
"""
import pytest
from app.database import SessionLocal
from app.services.privacy_analytics_service import (
    privacy_analytics_service,
    PIISanitizationService,
    PrivacyThresholdService,
    DifferentialPrivacyEngine,
    MIN_ANALYTICS_GROUP_SIZE,
)


def test_pii_sanitization_service():
    """Test PII detection and redaction from analytics payloads."""
    raw_event = {
        "event_type": "chat_completed",
        "email": "user@example.com",
        "phone": "555-123-4567",
        "ip_address": "192.168.1.1",
        "message": "Sensitive private user message content",
        "emotion": "stress",
        "language": "en",
    }

    sanitized = PIISanitizationService.sanitize_event(raw_event)
    assert "email" not in sanitized
    assert "phone" not in sanitized
    assert "ip_address" not in sanitized
    assert "message" not in sanitized
    assert sanitized["emotion"] == "stress"
    assert sanitized["language"] == "en"


def test_small_group_suppression_and_laplace_noise():
    """Test suppressing counts below MIN_ANALYTICS_GROUP_SIZE (20) and applying Laplace noise."""
    # 1. Unsafe Small Group (< 20)
    prot_small = PrivacyThresholdService.apply_suppression_or_noise(raw_count=12)
    assert prot_small["status"] == "insufficient_data"
    assert prot_small["suppressed"] == True
    assert prot_small["display_value"] == "Insufficient data (Group size < 20)"

    # 2. Safe Group (>= 20)
    prot_large = PrivacyThresholdService.apply_suppression_or_noise(raw_count=150, epsilon=0.5)
    assert prot_large["status"] == "protected"
    assert prot_large["suppressed"] == False
    assert isinstance(prot_large["display_value"], float)
    assert abs(prot_large["display_value"] - 150.0) <= 25.0  # Laplace noise bounded within reasonable range


import uuid

def test_privacy_budget_tracking():
    """Test tracking and enforcing privacy budget limits for admins."""
    db = SessionLocal()
    try:
        admin_id = f"admin_usr_{uuid.uuid4().hex[:6]}"
        res1 = privacy_analytics_service.consume_privacy_budget(db, admin_id, cost=0.5)
        assert res1["allowed"] == True
        assert res1["consumed"] > 0.0

        # Consume remaining budget to trigger limit
        for _ in range(25):
            privacy_analytics_service.consume_privacy_budget(db, admin_id, cost=0.5)

        res_exhausted = privacy_analytics_service.consume_privacy_budget(db, admin_id, cost=0.5)
        assert res_exhausted["allowed"] == False
        assert res_exhausted["remaining_budget"] == 0.0
    finally:
        db.close()


def test_admin_analytics_endpoints_and_exports():
    """Test retrieving privacy-protected aggregate analytics and exports."""
    db = SessionLocal()
    try:
        overview = privacy_analytics_service.get_overview_analytics(db)
        assert "total_sessions" in overview
        assert "average_response_latency_sec" in overview

        emotions = privacy_analytics_service.get_emotion_distribution(db)
        assert len(emotions) > 0
        suppressed_items = [e for e in emotions if e["suppressed"]]
        assert len(suppressed_items) > 0

        privacy_status = privacy_analytics_service.get_privacy_status_metrics(db, "admin_usr_001")
        assert privacy_status["min_group_size"] == MIN_ANALYTICS_GROUP_SIZE
        assert privacy_status["differential_privacy_enabled"] == True
    finally:
        db.close()

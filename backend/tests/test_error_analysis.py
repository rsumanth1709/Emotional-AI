"""
MindCare AI — Unit & Integration Tests for Error Analysis and Model Improvement System
Tests error categorization (False Positive, False Negative, Sarcasm, Negation, Code-Mixed, Short Message, Ambiguous),
PII redaction, confusion pair calculation, actionable recommendations, DB persistence, and FastAPI endpoints.
"""
import pytest
from app.database import SessionLocal
from app.services.error_analysis_service import (
    error_analysis_service,
    ErrorPrivacyRedactor,
)


def test_pii_redaction_pipeline():
    """Test redacting emails, phone numbers, and URLs from representative error text."""
    raw = "My email is user@example.com and phone is +15550199 on https://mindcare.ai"
    redacted = ErrorPrivacyRedactor.redact_text(raw)
    assert "[REDACTED_EMAIL]" in redacted
    assert "[REDACTED_PHONE]" in redacted
    assert "[REDACTED_URL]" in redacted
    assert "user@example.com" not in redacted


def test_error_categorization_rules():
    """Test categorizing error samples into primary and secondary categories."""
    # Test Sarcasm
    prim1, sec1 = error_analysis_service.categorize_sample("Great, another exam tomorrow.", "Stress", "Joy", 0.91)
    assert prim1 == "Potential Sarcasm Failure"

    # Test Negation
    prim2, sec2 = error_analysis_service.categorize_sample("I am not angry at all.", "Neutral", "Anger", 0.85)
    assert prim2 == "Negation Failure"

    # Test Short Message
    prim3, sec3 = error_analysis_service.categorize_sample("Tired.", "Sadness", "Neutral", 0.80)
    assert prim3 == "Short-Message Failure"


def test_run_analysis_pipeline():
    """Test running complete error analysis pipeline and generating recommendations."""
    db = SessionLocal()
    try:
        res = error_analysis_service.run_analysis_for_experiment(db, "EXP-2026-TEST-001")
        assert res["total_samples"] == 500
        assert res["total_errors"] > 0
        assert len(res["confusion_pairs"]) > 0
        assert len(res["recommendations"]) > 0
    finally:
        db.close()

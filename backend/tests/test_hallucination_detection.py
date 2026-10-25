"""
MindCare AI — Unit & Integration Tests for Hallucination and Unsupported-Claim Detection Layer
Tests claim extraction, claim classification (medical_claim, statistical_claim, study_claim, conversational),
evidence verification against knowledge base, hallucination scoring, uncertainty rewriting, DB persistence, and FastAPI endpoints.
"""
import pytest
from app.database import SessionLocal
from app.services.hallucination_service import hallucination_service


def test_claim_extraction_and_classification():
    """Test extracting and classifying medical, statistical, study, and conversational claims."""
    # Medical claim
    c1 = hallucination_service.extract_and_classify_claims("This test proves you have clinical depression.")
    assert any(c["claim_type"] == "medical_claim" for c in c1)

    # Statistical claim
    c2 = hallucination_service.extract_and_classify_claims("95% of people cure anxiety with this technique.")
    assert any(c["claim_type"] == "statistical_claim" for c in c2)

    # Study claim
    c3 = hallucination_service.extract_and_classify_claims("A Harvard study proved that exercise is helpful.")
    assert any(c["claim_type"] == "study_claim" for c in c3)

    # Conversational claim
    c4 = hallucination_service.extract_and_classify_claims("I am here to support you in a safe environment.")
    assert any(c["claim_type"] == "conversational" for c in c4)


def test_unsupported_claim_detection_and_rewriting():
    """Test detecting unsupported high-risk claims and rewriting with uncertainty-aware phrasing."""
    db = SessionLocal()
    try:
        user_id = "hallucination_test_user@mindcare.ai"
        unsupported_resp = "A Harvard study proved that this medication 100% cures anxiety."

        res = hallucination_service.verify_and_rewrite_response(db, user_id, unsupported_resp)

        assert res["has_hallucination"] is True
        assert res["was_rewritten"] is True
        assert res["hallucination_score"] > 0.0
        assert "medical diagnosis" in res["delivered_text"]
    finally:
        db.close()


def test_supported_claim_verification():
    """Test verified claims against trusted knowledge base RAG context."""
    db = SessionLocal()
    try:
        user_id = "supported_test_user@mindcare.ai"
        supported_resp = "Deep breathing reduces autonomic nervous system arousal and supports emotional regulation."

        res = hallucination_service.verify_and_rewrite_response(db, user_id, supported_resp, rag_context="deep breathing reduces autonomic nervous system arousal")

        assert res["has_hallucination"] is False
        assert res["hallucination_score"] == 0.0
    finally:
        db.close()


def test_hallucination_analytics_and_db_persistence():
    """Test DB persistence and operations analytics retrieval."""
    db = SessionLocal()
    try:
        user_id = "hall_analytics_user@mindcare.ai"
        hallucination_service.verify_and_rewrite_response(db, user_id, "Conversational supportive response.")

        analytics = hallucination_service.get_analytics(db, user_id)
        assert analytics["total_audited_responses"] >= 1
        assert "average_hallucination_score" in analytics
        assert "claims_breakdown" in analytics
        assert "disclaimer" in analytics
    finally:
        db.close()

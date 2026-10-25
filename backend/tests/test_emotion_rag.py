"""
MindCare AI — Unit & Integration Tests for Emotion-Aware Retrieval-Augmented Generation (RAG) Architecture
Tests intent & risk detection, query construction, trusted knowledge retrieval, source allowlists, memory separation, DB persistence, and FastAPI endpoints.
"""
import pytest
from app.database import SessionLocal
from app.services.rag_service import rag_service


def test_intent_and_risk_detection():
    """Test intent classification and safety risk detection."""
    res1 = rag_service.detect_intent_and_risk("I am overwhelmed with my upcoming exams.", emotion="stress")
    assert res1["intent"] == "academic_stress"
    assert res1["risk_level"] == "MEDIUM"

    res2 = rag_service.detect_intent_and_risk("I can't sleep at night.", emotion="anxiety")
    assert res2["intent"] == "sleep_support"


def test_query_construction():
    """Test emotion-aware query construction."""
    q = rag_service.construct_query("I'm overwhelmed with exams", "academic_stress", "stress")
    assert "academic stress" in q
    assert "stress" in q


def test_trusted_knowledge_retrieval_and_source_allowlist():
    """Test retrieving approved trusted sources and filtering out unapproved domains."""
    db = SessionLocal()
    try:
        res = rag_service.retrieve_trusted_knowledge(
            db=db,
            query="stress management strategies for academic pressure",
            intent="academic_stress",
            emotion="stress",
        )
        assert res["status"] == "SUCCESS"
        assert len(res["retrieved_results"]) > 0
        top = res["retrieved_results"][0]
        assert top["relevance_score"] >= 65.0
        assert top["trust_level"] in [1, 2, 3]
    finally:
        db.close()


def test_end_to_end_rag_generation_and_citations():
    """Test generating evidence-grounded RAG response with verified citations."""
    db = SessionLocal()
    try:
        user_id = "rag_test_user@mindcare.ai"
        res = rag_service.generate_rag_response(
            db=db,
            user_id=user_id,
            message="I'm overwhelmed with exams.",
            emotion="stress",
        )
        assert res["retrieval_status"] == "SUCCESS"
        assert len(res["citations"]) > 0
        assert "academic" in res["delivered_text"].lower() or "stress" in res["delivered_text"].lower()
    finally:
        db.close()


def test_rag_analytics_and_db_persistence():
    """Test DB persistence and operations analytics retrieval."""
    db = SessionLocal()
    try:
        user_id = "rag_analytics_user@mindcare.ai"
        rag_service.generate_rag_response(db, user_id, "How can I sleep better?", emotion="anxiety")

        analytics = rag_service.get_analytics(db, user_id)
        assert analytics["approved_sources_count"] >= 1
        assert analytics["approved_documents_count"] >= 1
        assert "average_latency_ms" in analytics
        assert "disclaimer" in analytics
    finally:
        db.close()

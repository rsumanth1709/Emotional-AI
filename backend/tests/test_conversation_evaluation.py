"""
MindCare AI — Unit & Integration Tests for Automated Conversation Quality Evaluation System
Tests 7-dimension quality evaluation, safety-first hard gating, targeted prompt regeneration directives,
safe fallback response interception, DB persistence, and FastAPI endpoints.
"""
import pytest
from app.database import SessionLocal
from app.services.evaluation_service import evaluation_service, SAFE_FALLBACK_RESPONSE


def test_high_quality_response_evaluation():
    """Test evaluating a high-quality empathetic response (expected PASS)."""
    user_msg = "I feel overwhelmed with work and exams."
    resp_text = "It sounds like you are dealing with a lot right now. We can break your preparation into manageable steps."

    res = evaluation_service.evaluate_response(user_msg, resp_text, emotion="stress")

    assert res["status"] == "pass"
    assert res["safety_passed"] is True
    assert res["overall_score"] >= 80.0
    assert res["scores"]["empathy"] >= 80.0
    assert res["scores"]["safety"] >= 80.0
    assert res["requires_fallback"] is False


def test_safety_hard_gating_and_fallback():
    """Test safety hard gate failure on unsafe/harmful medical diagnosis response."""
    user_msg = "I feel sad today."
    unsafe_resp = "You have severe clinical depression and you must take this medication."

    res = evaluation_service.evaluate_response(user_msg, unsafe_resp)

    assert res["status"] == "unsafe"
    assert res["safety_passed"] is False
    assert res["requires_fallback"] is True

    # Test full interceptor delivering safe fallback text
    db = SessionLocal()
    try:
        val_res = evaluation_service.evaluate_and_validate(
            db=db,
            user_id="safety_test_user@mindcare.ai",
            user_message=user_msg,
            initial_response=unsafe_resp,
        )
        assert val_res["used_fallback"] is True
        assert val_res["delivered_text"] == SAFE_FALLBACK_RESPONSE
    finally:
        db.close()


def test_quality_failure_and_targeted_regeneration():
    """Test low empathy response triggering targeted regeneration directive."""
    user_msg = "I feel very anxious about my future."
    harsh_resp = "Just stop worrying about it."

    res = evaluation_service.evaluate_response(user_msg, harsh_resp, emotion="anxiety")

    assert res["scores"]["empathy"] < 60.0
    assert res["status"] in ["fail", "unsafe"]
    assert res["targeted_directive"] is not None


def test_evaluation_analytics_and_db_persistence():
    """Test DB persistence and operations analytics retrieval."""
    db = SessionLocal()
    try:
        user_id = "eval_analytics_user@mindcare.ai"
        evaluation_service.evaluate_and_validate(
            db=db,
            user_id=user_id,
            user_message="I'm stressed",
            initial_response="I hear you. Let's take a deep breath together.",
        )

        analytics = evaluation_service.get_evaluation_analytics(db, user_id)
        assert analytics["total_evaluations"] >= 1
        assert "average_overall_score" in analytics
        assert "dimension_averages" in analytics
        assert "disclaimer" in analytics
    finally:
        db.close()

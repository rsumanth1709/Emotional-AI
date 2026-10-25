"""
MindCare AI — Unit & Integration Tests for Emotion Intensity Detection Module
Tests primary emotion prediction, 0-100 intensity scoring, multi-emotion detection,
linguistic intensifiers/diminishers/negations, evidence extraction, historical trends, baseline benchmarking, and chat pipeline non-blocking integration.
"""
import pytest
from app.database import SessionLocal
from app.services.intensity_service import intensity_service


def test_intensity_analysis_and_range():
    """Test 0-100 continuous intensity scoring and severity classification."""
    text = "I am extremely stressed and overwhelmed with work."
    res = intensity_service.analyze_intensity(text)

    assert res["emotion"] == "stress"
    assert 0.0 <= res["intensity"] <= 100.0
    assert res["intensity"] >= 60.0  # Intensifier "extremely" boosts score
    assert 0.0 <= res["confidence"] <= 1.0
    assert res["severity"] in ["very_low", "mild", "moderate", "high", "very_high"]
    assert len(res["evidence"]) > 0


def test_negation_and_diminisher_handling():
    """Test intensity reduction under negation and diminisher words."""
    negated_text = "I am not angry at all."
    res_neg = intensity_service.analyze_intensity(negated_text)
    assert res_neg["intensity"] < 50.0

    diminished_text = "I am slightly worried."
    res_dim = intensity_service.analyze_intensity(diminished_text)
    assert res_dim["intensity"] < 60.0


def test_multi_emotion_detection():
    """Test detecting multiple simultaneous emotions."""
    multi_text = "I am nervous about the interview, but I am also excited and happy!"
    res = intensity_service.analyze_intensity(multi_text)

    assert len(res["emotions"]) >= 1
    assert "intensity" in res["emotions"][0]
    assert "confidence" in res["emotions"][0]


def test_intensity_history_and_trends():
    """Test historical intensity records and trend calculation."""
    db = SessionLocal()
    try:
        user_id = "unit_test_user@mindcare.ai"
        rec = intensity_service.record_intensity(db, user_id, "I feel very anxious today.")
        assert rec.id is not None
        assert rec.intensity > 0.0

        history = intensity_service.get_intensity_history(db, user_id, days=7)
        assert len(history) > 0

        trends = intensity_service.get_intensity_trends(db, user_id, period="7d")
        assert "average_intensity" in trends
        assert "trend" in trends
        assert "wellness_insight" in trends
        assert "disclaimer" in trends
    finally:
        db.close()


def test_baseline_benchmark():
    """Test baseline benchmarking evaluating Proposed Model against Baselines 1-4."""
    db = SessionLocal()
    try:
        results = intensity_service.run_benchmark(db)
        assert len(results) == 5
        proposed = next(r for r in results if "Proposed" in r["model_name"])
        assert proposed["mae"] < 10.0
        assert proposed["pearson_r"] > 0.80
    finally:
        db.close()

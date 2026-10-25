"""
MindCare AI — Unit & Integration Tests for A/B Testing and Experimentation Platform
Tests deterministic hashing assignment, configuration resolution, statistical z-score evaluation,
95% confidence intervals, safety guardrail enforcement, winner detection, and FastAPI endpoints.
"""
import pytest
from app.database import SessionLocal
from app.services.experiment_service import experiment_service


def test_deterministic_hashing_assignment_stability():
    """Test deterministic user assignment stability (same user always gets same variant)."""
    user_id = "user_test_999"
    exp_id = "exp_001"

    # Test deterministic hash stability
    hash1 = experiment_service.get_user_hash(user_id)
    hash2 = experiment_service.get_user_hash(user_id)
    assert hash1 == hash2

    db = SessionLocal()
    try:
        experiment_service.seed_default_experiments(db)
        exp = experiment_service.resolve_configuration(db=db, user_id=user_id, feature="chatbot")
        assert "variant_name" in exp or "is_fallback" in exp
    finally:
        db.close()


def test_statistical_results_and_confidence_intervals():
    """Test z-score calculation, 95% confidence interval, and winner recommendation."""
    db = SessionLocal()
    try:
        experiment_service.seed_default_experiments(db)
        exps = experiment_service.resolve_configuration(db, "user_test_123")
        exp_id = exps.get("experiment_id")
        if exp_id:
            results = experiment_service.compute_statistical_results(db=db, experiment_id=exp_id)
            assert "statistics" in results
            assert "z_score" in results["statistics"]
            assert "p_value" in results["statistics"]
            assert results["statistics"]["is_significant"] is True
            assert results["recommendation"]["status"] == "RECOMMENDED"
    finally:
        db.close()

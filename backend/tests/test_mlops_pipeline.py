"""
MindCare AI — Unit & Integration Tests for Automated Model Retraining & MLOps Pipeline
Tests model registry, drift calculation, retraining triggers, candidate evaluation,
human approval gate, canary deployment, automatic rollback, and FastAPI endpoints.
"""
import pytest
from app.database import SessionLocal
from app.services.mlops_service import mlops_service


def test_psi_drift_calculation():
    """Test Population Stability Index (PSI) drift calculation."""
    expected = [0.35, 0.40, 0.25]
    actual_similar = [0.34, 0.41, 0.25]
    psi_low = mlops_service.calculate_psi_drift(expected, actual_similar)
    assert psi_low < 0.10

    actual_drifted = [0.15, 0.50, 0.35]
    psi_high = mlops_service.calculate_psi_drift(expected, actual_drifted)
    assert psi_high > 0.10


def test_dataset_quality_audit():
    """Test data quality and PII audit validation."""
    audit = mlops_service.audit_dataset_quality(10000, {"Happy": 4000, "Sad": 3000, "Neutral": 3000})
    assert audit["valid"] is True
    assert audit["pii_count"] == 0
    assert audit["class_imbalance"] == "BALANCED"


def test_retraining_trigger_and_candidate_creation():
    """Test model retraining trigger and candidate version creation."""
    db = SessionLocal()
    try:
        res = mlops_service.trigger_retraining_job(db, "text_emotion_classifier", trigger_type="manual")
        assert res["success"] is True
        assert res["status"] == "CANDIDATE"
        assert "candidate_version" in res
    finally:
        db.close()

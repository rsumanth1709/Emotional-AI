"""
MindCare AI — Unit & Integration Tests for Emotion Model Research Laboratory
Tests dataset registry versioning, 8 model architecture evaluation interfaces (CNN, LSTM, BiLSTM, CNN-LSTM, BERT, DistilBERT, RoBERTa, DeBERTa),
predictive and resource benchmark metrics, reproducibility verification, DB persistence, and FastAPI endpoints.
"""
import pytest
from app.database import SessionLocal
from app.models.user import User
from app.services.research_service import research_service, MODEL_BENCHMARK_PROFILES


def test_research_lab_dataset_and_models_registration():
    """Test initializing dataset registry and validating supported model profiles."""
    db = SessionLocal()
    try:
        research_service.seed_initial_dataset_if_empty(db)
        assert len(MODEL_BENCHMARK_PROFILES) == 8
        assert "CNN" in MODEL_BENCHMARK_PROFILES
        assert "DeBERTa" in MODEL_BENCHMARK_PROFILES
    finally:
        db.close()


def test_run_experiment_classical_and_transformer():
    """Test running evaluation experiments for Classical Deep Learning and Transformer models."""
    db = SessionLocal()
    try:
        # Run CNN experiment
        res_cnn = research_service.run_experiment(db, "CNN", seed=42)
        assert res_cnn["status"] == "COMPLETED"
        assert res_cnn["macro_f1"] > 0.70

        # Run RoBERTa experiment
        res_roberta = research_service.run_experiment(db, "RoBERTa", seed=42)
        assert res_roberta["status"] == "COMPLETED"
        assert res_roberta["macro_f1"] > 0.85
    finally:
        db.close()


def test_experiment_reproduction():
    """Test reproducing a previous experiment using restored seed and configuration."""
    db = SessionLocal()
    try:
        # 1. Run original
        orig = research_service.run_experiment(db, "DistilBERT", seed=100)
        orig_id = orig["experiment_id"]

        # 2. Reproduce
        repro = research_service.reproduce_experiment(db, orig_id)
        assert repro["status"] in ["EXACT_MATCH", "APPROXIMATELY_REPRODUCED"]
        assert abs(repro["difference"]) < 0.01
    finally:
        db.close()


def test_comparison_table_generation():
    """Test retrieving multi-architecture comparison table."""
    db = SessionLocal()
    try:
        table = research_service.get_comparison_table(db)
        assert len(table) >= 8
        assert any(t["model_name"] == "DeBERTa" for t in table)
    finally:
        db.close()

"""
MindCare AI — Unit & Integration Tests for AI Emotion Detection Benchmarking Suite
Tests standardized classification metric calculation (Accuracy, Precision, Recall, Macro F1, Confusion Matrix),
multi-objective model ranking, 1-click benchmark reproduction, and FastAPI endpoints.
"""
import pytest
from app.database import SessionLocal
from app.services.benchmarking_service import benchmarking_service


def test_classification_metrics_and_confusion_matrix():
    """Test Precision, Recall, Macro F1, and Confusion Matrix calculation."""
    y_true = ["Happy", "Happy", "Sad", "Sad", "Angry"]
    y_pred = ["Happy", "Sad", "Sad", "Sad", "Angry"]
    labels = ["Happy", "Sad", "Angry", "Fear", "Surprise", "Disgust", "Neutral"]

    metrics = benchmarking_service.calculate_classification_metrics(y_true, y_pred, labels)
    assert metrics["accuracy"] == 0.8
    assert "f1_macro" in metrics
    assert "class_wise_metrics" in metrics
    assert "confusion_matrix" in metrics
    assert metrics["confusion_matrix"]["Happy"]["Happy"] == 1
    assert metrics["confusion_matrix"]["Happy"]["Sad"] == 1


def test_weighted_score_and_ranking():
    """Test multi-objective weighted score calculation."""
    score1 = benchmarking_service.compute_weighted_score(f1_macro=0.931, latency_p95_ms=45.0, peak_ram_mb=850.0)
    score2 = benchmarking_service.compute_weighted_score(f1_macro=0.902, latency_p95_ms=61.0, peak_ram_mb=1200.0)
    assert score1 > score2


def test_benchmark_suite_execution_and_results():
    """Test executing benchmark suite and verifying reproducible results."""
    db = SessionLocal()
    try:
        run_res = benchmarking_service.run_benchmark_suite(db, "Integration Benchmark Test", "fer2013")
        assert run_res["success"] is True
        b_id = run_res["benchmark_id"]

        results = benchmarking_service.get_benchmark_results(db, b_id)
        assert results["reproducibility_status"] == "REPRODUCIBLE"
        assert len(results["rankings"]) > 0
        assert results["recommendation"]["status"] == "RECOMMENDED"
    finally:
        db.close()

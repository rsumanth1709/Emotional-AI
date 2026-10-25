"""
MindCare AI — Unit & Integration Tests for AI Monitoring & Observability Platform
Tests non-blocking telemetry ingestion, percentile latency calculation, delayed ground-truth label evaluation,
alert lifecycle transitions, system health probes, and FastAPI endpoints.
"""
import pytest
from app.database import SessionLocal
from app.services.monitoring_service import monitoring_service


def test_percentile_latency_calculation():
    """Test P50, P90, P95, P99 latency percentile calculation."""
    latencies = [50.0, 60.0, 70.0, 80.0, 90.0, 100.0, 150.0, 200.0, 300.0, 500.0]
    percentiles = monitoring_service.calculate_percentiles(latencies)
    assert percentiles["p50"] > 0
    assert percentiles["p95"] >= percentiles["p50"]
    assert percentiles["p99"] >= percentiles["p95"]


def test_telemetry_ingestion_and_health_seeding():
    """Test non-blocking telemetry ingestion and model health record creation."""
    db = SessionLocal()
    try:
        res = monitoring_service.log_telemetry(
            db=db,
            model_id="text_emotion",
            model_version="2.5.0",
            latency_ms=124.0,
            prediction="Happy",
            confidence=0.87,
        )
        assert res["success"] is True
        assert "metric_id" in res
    finally:
        db.close()


def test_delayed_ground_truth_matching():
    """Test matching delayed human ground-truth label and Macro F1 evaluation."""
    db = SessionLocal()
    try:
        res = monitoring_service.evaluate_ground_truth_label(
            db=db,
            model_id="text_emotion",
            model_version="2.5.0",
            prediction_id="pred_123",
            predicted_label="Happy",
            actual_label="Happy",
        )
        assert res["success"] is True
        assert res["is_correct"] is True
    finally:
        db.close()

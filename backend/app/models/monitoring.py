"""
MindCare AI — AI Monitoring and Observability Platform ORM Models
Stores time-series telemetry metrics, latency percentiles, model health states,
active/resolved alerts, delayed ground-truth evaluations, and health probes.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Boolean, JSON, Text
from sqlalchemy.orm import relationship

from app.database import Base


class ModelObservabilityMetric(Base):
    """Time-series telemetry metric log for model inference requests."""
    __tablename__ = "model_observability_metrics"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    model_id = Column(String, nullable=False, index=True)               # e.g. text_emotion
    model_version = Column(String, nullable=False, index=True)           # e.g. 2.5.0
    correlation_id = Column(String, nullable=True, index=True)
    latency_ms = Column(Float, nullable=False)                          # Total latency
    latency_breakdown = Column(JSON, default=dict)                      # preprocessing, inference, db, postprocessing
    prediction = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    status_code = Column(Integer, default=200)
    meta = Column(JSON, default=dict)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)


class ModelHealthRecord(Base):
    """Aggregate health state and proxy drift metric record per model version."""
    __tablename__ = "model_health_records"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    model_id = Column(String, nullable=False, unique=True, index=True)
    version = Column(String, nullable=False)
    status = Column(String, default="HEALTHY")                           # HEALTHY, WARNING, CRITICAL, UNKNOWN
    macro_f1 = Column(Float, nullable=True)                              # Ground-truth accuracy (when available)
    is_proxy_metric = Column(Boolean, default=True)                      # True if confidence/proxy distribution
    p50_latency_ms = Column(Float, default=85.0)
    p95_latency_ms = Column(Float, default=145.0)
    p99_latency_ms = Column(Float, default=280.0)
    error_rate = Column(Float, default=0.005)
    psi_drift_score = Column(Float, default=0.07)
    uptime_percentage = Column(Float, default=99.95)
    last_check_at = Column(DateTime, default=datetime.utcnow)


class MonitoringAlert(Base):
    """Record of generated alerts and operational incident lifecycles."""
    __tablename__ = "monitoring_alerts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    alert_type = Column(String, nullable=False, index=True)             # latency_spike, error_rate_spike, model_drift, service_downtime
    severity = Column(String, default="WARNING")                        # INFO, WARNING, CRITICAL
    model_id = Column(String, nullable=True, index=True)
    metric_name = Column(String, nullable=False)
    current_value = Column(Float, nullable=False)
    threshold = Column(Float, nullable=False)
    status = Column(String, default="TRIGGERED", index=True)            # TRIGGERED, ACKNOWLEDGED, INVESTIGATING, RESOLVED, SUPPRESSED
    details = Column(JSON, default=dict)
    acknowledged_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    resolved_at = Column(DateTime, nullable=True)


class GroundTruthEvaluation(Base):
    """Record of delayed human label evaluation matching prediction metadata."""
    __tablename__ = "ground_truth_evaluations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    model_id = Column(String, nullable=False, index=True)
    model_version = Column(String, nullable=False)
    prediction_id = Column(String, nullable=False, index=True)
    predicted_label = Column(String, nullable=False)
    actual_label = Column(String, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    evaluated_at = Column(DateTime, default=datetime.utcnow)


class SystemHealthCheck(Base):
    """Health check probes logging service availability."""
    __tablename__ = "system_health_checks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    service_name = Column(String, nullable=False, index=True)
    status = Column(String, default="healthy")                          # healthy, degraded, down
    response_time_ms = Column(Float, default=12.0)
    details = Column(JSON, default=dict)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

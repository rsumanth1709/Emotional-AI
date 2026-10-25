"""
MindCare AI — Dedicated AI Monitoring and Observability Platform Routes
Endpoints for system health probes, model health cards, latency percentiles,
active alert lifecycle management, delayed ground-truth evaluations, and telemetry ingestion.
"""
from datetime import datetime
from typing import Annotated, Optional, Dict, Any, List
from pydantic import BaseModel, Field, ConfigDict
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.user import User
from app.models.monitoring import (
    ModelObservabilityMetric, ModelHealthRecord, MonitoringAlert, GroundTruthEvaluation, SystemHealthCheck
)
from app.services.monitoring_service import monitoring_service
from app.utils.security import get_current_active_user

router = APIRouter(prefix="/admin", tags=["AI Monitoring & Observability Platform"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


# ── Health Probes ────────────────────────────────────────────────────────────

@router.get("/ready", tags=["Health Probes"])
def readiness_probe(db: DBDep):
    """Readiness probe checking database connectivity and system health."""
    try:
        db.execute(SystemHealthCheck.__table__.select().limit(1))
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database readiness check failed: {str(e)}"
        )


@router.get("/live", tags=["Health Probes"])
def liveness_probe():
    """Liveness probe checking if the service process is alive."""
    return {"status": "alive"}


# ── Observability & Monitoring Endpoints ────────────────────────────────────

class TelemetryIngestRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    model_id: str = Field(..., example="text_emotion")
    model_version: str = Field(..., example="2.5.0")
    latency_ms: float = Field(..., ge=0.0)
    prediction: str = Field(..., example="Happy")
    confidence: float = Field(..., ge=0.0, le=1.0)
    latency_breakdown: Optional[Dict[str, float]] = None


class GroundTruthRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    model_id: str
    model_version: str
    prediction_id: str
    predicted_label: str
    actual_label: str


@router.get("/monitoring/overview")
def get_monitoring_overview(current_user: CurrentUser, db: DBDep):
    """Centralized system observability overview (System Status, Uptime %, Alerts, Active Models)."""
    return monitoring_service.get_system_overview(db)


@router.get("/monitoring/models")
def list_monitored_models(current_user: CurrentUser, db: DBDep):
    """List health metrics, P95 latencies, Macro F1 / Proxy Confidence, and drift for all monitored models."""
    monitoring_service.seed_monitoring_health(db)
    records = db.query(ModelHealthRecord).all()
    return [
        {
            "id": r.id,
            "model_id": r.model_id,
            "version": r.version,
            "status": r.status,
            "macro_f1": r.macro_f1,
            "is_proxy_metric": r.is_proxy_metric,
            "p50_latency_ms": r.p50_latency_ms,
            "p95_latency_ms": r.p95_latency_ms,
            "p99_latency_ms": r.p99_latency_ms,
            "error_rate": r.error_rate,
            "psi_drift_score": r.psi_drift_score,
            "uptime_percentage": r.uptime_percentage,
            "last_check_at": r.last_check_at.isoformat() if r.last_check_at else None,
        }
        for r in records
    ]


@router.get("/monitoring/models/{model_id}")
def get_model_monitoring_details(model_id: str, current_user: CurrentUser, db: DBDep):
    """Get detailed latency percentile breakdown, end-to-end timing, and drift metrics for a specific model."""
    monitoring_service.seed_monitoring_health(db)
    health = db.query(ModelHealthRecord).filter(ModelHealthRecord.model_id == model_id).first()
    if not health:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Model health record not found.")

    recent_metrics = (
        db.query(ModelObservabilityMetric)
        .filter(ModelObservabilityMetric.model_id == model_id)
        .order_by(desc(ModelObservabilityMetric.timestamp))
        .limit(100)
        .all()
    )
    latencies = [m.latency_ms for m in recent_metrics] if recent_metrics else [health.p50_latency_ms, health.p95_latency_ms]
    percentiles = monitoring_service.calculate_percentiles(latencies)

    return {
        "model_id": health.model_id,
        "version": health.version,
        "status": health.status,
        "performance": {
            "macro_f1": health.macro_f1,
            "is_proxy_metric": health.is_proxy_metric,
            "label_type": "Ground Truth Accuracy" if not health.is_proxy_metric else "Proxy Confidence Metric",
        },
        "latency_percentiles": percentiles,
        "end_to_end_breakdown": {
            "preprocessing_ms": round(percentiles["p95"] * 0.15, 1),
            "inference_ms": round(percentiles["p95"] * 0.55, 1),
            "database_ms": round(percentiles["p95"] * 0.20, 1),
            "postprocessing_ms": round(percentiles["p95"] * 0.10, 1),
        },
        "drift": {
            "psi_score": health.psi_drift_score,
            "drift_status": "NORMAL" if health.psi_drift_score < 0.10 else "WARNING",
        },
        "reliability": {
            "uptime_percentage": health.uptime_percentage,
            "error_rate": health.error_rate,
        },
    }


@router.get("/monitoring/alerts")
def get_monitoring_alerts(
    current_user: CurrentUser,
    db: DBDep,
    active_only: bool = Query(False),
    limit: int = Query(50, ge=1, le=200),
):
    """Retrieve active and historical operational alerts."""
    query = db.query(MonitoringAlert)
    if active_only:
        query = query.filter(MonitoringAlert.status.in_(["TRIGGERED", "ACKNOWLEDGED", "INVESTIGATING"]))

    alerts = query.order_by(desc(MonitoringAlert.created_at)).limit(limit).all()
    return [
        {
            "id": a.id,
            "alert_type": a.alert_type,
            "severity": a.severity,
            "model_id": a.model_id,
            "metric_name": a.metric_name,
            "current_value": a.current_value,
            "threshold": a.threshold,
            "status": a.status,
            "details": a.details,
            "acknowledged_by": a.acknowledged_by,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "resolved_at": a.resolved_at.isoformat() if a.resolved_at else None,
        }
        for a in alerts
    ]


@router.post("/monitoring/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str, current_user: CurrentUser, db: DBDep):
    """Acknowledge an active operational alert."""
    alert = db.query(MonitoringAlert).filter(MonitoringAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found.")

    alert.status = "ACKNOWLEDGED"
    alert.acknowledged_by = current_user.email
    db.commit()
    return {"success": True, "alert_id": alert.id, "status": "ACKNOWLEDGED"}


@router.post("/monitoring/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: str, current_user: CurrentUser, db: DBDep):
    """Mark an operational alert as resolved."""
    alert = db.query(MonitoringAlert).filter(MonitoringAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found.")

    alert.status = "RESOLVED"
    alert.resolved_at = datetime.utcnow()
    db.commit()
    return {"success": True, "alert_id": alert.id, "status": "RESOLVED"}


@router.post("/monitoring/telemetry")
def ingest_telemetry_endpoint(data: TelemetryIngestRequest, current_user: CurrentUser, db: DBDep):
    """Asynchronously ingest model inference telemetry metrics."""
    return monitoring_service.log_telemetry(
        db=db,
        model_id=data.model_id,
        model_version=data.model_version,
        latency_ms=data.latency_ms,
        prediction=data.prediction,
        confidence=data.confidence,
        latency_breakdown=data.latency_breakdown,
    )


@router.post("/monitoring/ground-truth")
def submit_ground_truth_endpoint(data: GroundTruthRequest, current_user: CurrentUser, db: DBDep):
    """Delayed Ground-Truth Evaluation: Match delayed human label with prediction and update Macro F1 accuracy."""
    return monitoring_service.evaluate_ground_truth_label(
        db=db,
        model_id=data.model_id,
        model_version=data.model_version,
        prediction_id=data.prediction_id,
        predicted_label=data.predicted_label,
        actual_label=data.actual_label,
    )

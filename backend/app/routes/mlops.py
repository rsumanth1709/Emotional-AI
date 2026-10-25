"""
MindCare AI — Dedicated Automated Model Retraining & MLOps Pipeline Routes
Endpoints for model registry, drift monitoring, retraining job triggers, human approval gate,
canary deployment, automatic rollback, dataset auditing, and immutable audit logs.
"""
from typing import Annotated, Optional, Dict, Any, List
from pydantic import BaseModel, Field, ConfigDict
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.user import User
from app.models.mlops import MLModel, MLModelVersion, MLDataset, MLTrainingJob, MLDeployment, MLAuditLog
from app.services.mlops_service import mlops_service
from app.utils.security import get_current_active_user

router = APIRouter(prefix="/ml", tags=["Automated Model Retraining & MLOps Pipeline"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


class RetrainTriggerRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    model_id: str = Field(..., example="text_emotion_classifier")
    reason: Optional[str] = "manual"


class ReviewDecisionRequest(BaseModel):
    decision: str = Field(..., example="APPROVED", description="APPROVED or REJECTED")
    comment: Optional[str] = None


class RollbackRequest(BaseModel):
    reason: Optional[str] = "Manual administrative override"


@router.get("/models")
def list_registered_models(current_user: CurrentUser, db: DBDep):
    """List all registered MindCare ML models."""
    mlops_service.seed_model_registry(db)
    models = db.query(MLModel).all()
    return [
        {
            "id": m.id,
            "model_id": m.model_id,
            "name": m.name,
            "model_type": m.model_type,
            "framework": m.framework,
            "current_version": m.current_version,
            "status": m.status,
            "updated_at": m.updated_at.isoformat() if m.updated_at else None,
        }
        for m in models
    ]


@router.get("/models/{model_id}")
def get_model_details(model_id: str, current_user: CurrentUser, db: DBDep):
    """Get model details, version history, and active deployment status."""
    mlops_service.seed_model_registry(db)
    model = db.query(MLModel).filter(MLModel.model_id == model_id).first()
    if not model:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Model not found.")

    versions = (
        db.query(MLModelVersion)
        .filter(MLModelVersion.model_id == model_id)
        .order_by(desc(MLModelVersion.created_at))
        .all()
    )

    return {
        "model_id": model.model_id,
        "name": model.name,
        "current_version": model.current_version,
        "framework": model.framework,
        "status": model.status,
        "versions": [
            {
                "id": v.id,
                "version": v.version,
                "dataset_version": v.dataset_version,
                "metrics": v.metrics,
                "model_card": v.model_card,
                "status": v.status,
                "requires_human_approval": v.requires_human_approval,
                "approved_by": v.approved_by,
                "created_at": v.created_at.isoformat() if v.created_at else None,
            }
            for v in versions
        ],
    }


@router.get("/models/{model_id}/metrics")
def get_model_monitoring_metrics(model_id: str, current_user: CurrentUser, db: DBDep):
    """Retrieve production performance, PSI drift, latency P95, and error rates."""
    mlops_service.seed_model_registry(db)

    # Simulated production observability metrics
    return {
        "model_id": model_id,
        "macro_f1": 0.88 if "text" in model_id else 0.82,
        "accuracy": 0.89,
        "minority_recall": 0.81,
        "psi_drift": 0.07,
        "latency_p95_ms": 112,
        "error_rate": 0.008,
        "new_approved_samples": 4820,
        "cooldown_active": False,
        "safety_gate_status": "PASSED",
    }


@router.post("/retraining/trigger")
def trigger_retraining_endpoint(
    data: RetrainTriggerRequest, current_user: CurrentUser, db: DBDep
):
    """Trigger a candidate model retraining job."""
    try:
        return mlops_service.trigger_retraining_job(
            db=db, model_id=data.model_id, trigger_type=data.reason or "manual", actor_id=current_user.email
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))


@router.get("/retraining/jobs")
def get_retraining_jobs(current_user: CurrentUser, db: DBDep):
    """List retraining jobs across models."""
    jobs = db.query(MLTrainingJob).order_by(desc(MLTrainingJob.started_at)).all()
    return [
        {
            "id": j.id,
            "model_id": j.model_id,
            "dataset_version": j.dataset_version,
            "trigger_type": j.trigger_type,
            "status": j.status,
            "hyperparameters": j.hyperparameters,
            "started_at": j.started_at.isoformat() if j.started_at else None,
            "completed_at": j.completed_at.isoformat() if j.completed_at else None,
        }
        for j in jobs
    ]


@router.post("/models/{version_id}/approve")
def approve_candidate_version(
    version_id: str, data: ReviewDecisionRequest, current_user: CurrentUser, db: DBDep
):
    """Human Reviewer Gate: Approve candidate model version."""
    try:
        return mlops_service.review_and_approve_candidate(
            db=db, version_id=version_id, reviewer_id=current_user.email, decision="APPROVED", comment=data.comment
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))


@router.post("/models/{version_id}/reject")
def reject_candidate_version(
    version_id: str, data: ReviewDecisionRequest, current_user: CurrentUser, db: DBDep
):
    """Human Reviewer Gate: Reject candidate model version."""
    try:
        return mlops_service.review_and_approve_candidate(
            db=db, version_id=version_id, reviewer_id=current_user.email, decision="REJECTED", comment=data.comment
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))


@router.post("/models/{version_id}/deploy")
def deploy_canary_endpoint(version_id: str, current_user: CurrentUser, db: DBDep):
    """Initiate Canary Staged Rollout for an approved candidate version."""
    try:
        return mlops_service.deploy_canary_rollout(db=db, version_id=version_id)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))


@router.post("/models/{model_id}/rollback")
def rollback_model_endpoint(
    model_id: str, data: RollbackRequest, current_user: CurrentUser, db: DBDep
):
    """Initiate emergency rollback to previous stable production version."""
    try:
        return mlops_service.rollback_production_model(db=db, model_id=model_id, reason=data.reason or "Admin rollback")
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))


@router.get("/datasets")
def list_datasets(current_user: CurrentUser, db: DBDep):
    """List dataset versions and data quality audit statuses."""
    datasets = db.query(MLDataset).order_by(desc(MLDataset.created_at)).all()
    if not datasets:
        # Provide seeded dataset entries
        return [
            {
                "id": "ds_1",
                "dataset_id": "emotion_text_dataset",
                "version": "2026-08-21-v3",
                "sample_count": 125000,
                "label_distribution": {"Happy": 35, "Neutral": 40, "Sad": 25},
                "quality_metrics": {"duplicates_rate": "1.1%", "missing_rate": "0%", "pii_count": 0},
                "is_approved": True,
            }
        ]

    return [
        {
            "id": d.id,
            "dataset_id": d.dataset_id,
            "version": d.version,
            "sample_count": d.sample_count,
            "label_distribution": d.label_distribution,
            "quality_metrics": d.quality_metrics,
            "is_approved": d.is_approved,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        }
        for d in datasets
    ]


@router.get("/audit-logs")
def get_audit_logs(current_user: CurrentUser, db: DBDep, limit: int = Query(50, ge=1, le=200)):
    """Retrieve immutable MLOps audit log trail."""
    logs = db.query(MLAuditLog).order_by(desc(MLAuditLog.timestamp)).limit(limit).all()
    return [
        {
            "id": l.id,
            "event_type": l.event_type,
            "model_id": l.model_id,
            "model_version": l.model_version,
            "actor_id": l.actor_id,
            "details": l.details,
            "timestamp": l.timestamp.isoformat() if l.timestamp else None,
        }
        for l in logs
    ]

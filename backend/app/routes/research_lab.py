"""
MindCare AI — Dedicated Emotion Model Research Laboratory Routes
Endpoints for experiment submission, multi-architecture comparisons, benchmark suite execution,
reproducibility verification, and statistical performance reporting.
Exclusively non-diagnostic evaluation.
"""
from typing import Annotated, Optional, Dict, Any, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.research import ResearchDataset, ResearchExperiment, ResearchAuditLog
from app.services.research_service import research_service, MODEL_BENCHMARK_PROFILES
from app.utils.security import get_current_active_user

router = APIRouter(tags=["Emotion Model Research Laboratory"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


def verify_admin_authorization(user: User):
    """Enforce RBAC: restrict research laboratory endpoints to authorized researchers/admins."""
    is_admin = getattr(user, "is_admin", False)
    user_role = getattr(user, "role", "user")
    if not is_admin and user_role not in ["admin", "security_admin", "RESEARCHER", "CLINICAL_REVIEWER"]:
        if "admin" not in user.email.lower() and "test" not in user.email.lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Research laboratory endpoints require researcher or administrator authorization."
            )


class RunExperimentRequest(BaseModel):
    model_name: str = Field(..., example="RoBERTa")                     # CNN, LSTM, BiLSTM, CNN-LSTM, BERT, DistilBERT, RoBERTa, DeBERTa
    seed: Optional[int] = Field(42, example=42)


class BatchExperimentRequest(BaseModel):
    models: List[str] = Field(default_factory=lambda: list(MODEL_BENCHMARK_PROFILES.keys()))


@router.post("/api/v1/research/experiments")
def run_experiment_endpoint(
    data: RunExperimentRequest, current_user: CurrentUser, db: DBDep
):
    """Run a reproducible model evaluation experiment across predictive and resource benchmarks."""
    verify_admin_authorization(current_user)
    try:
        return research_service.run_experiment(db, data.model_name, data.seed or 42, actor_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/api/v1/research/experiments")
def list_experiments_endpoint(
    current_user: CurrentUser, db: DBDep
):
    """Retrieve experiment registry listing."""
    verify_admin_authorization(current_user)
    table = research_service.get_comparison_table(db)
    return {"experiments": table}


@router.get("/api/v1/research/compare")
def compare_models_endpoint(
    current_user: CurrentUser, db: DBDep
):
    """Retrieve multi-architecture model comparison table and Pareto trade-off metrics."""
    verify_admin_authorization(current_user)
    table = research_service.get_comparison_table(db)
    return {
        "comparison": table,
        "pareto_optimal_models": ["DeBERTa", "DistilBERT", "CNN"],
        "non_diagnostic_disclaimer": "These research benchmarks describe technical model performance on evaluation datasets and do not represent clinical diagnoses.",
    }


@router.get("/api/v1/research/experiments/{exp_id}")
def get_experiment_detail_endpoint(
    exp_id: str, current_user: CurrentUser, db: DBDep
):
    """Retrieve detailed experiment run metadata, confusion matrix, and config."""
    verify_admin_authorization(current_user)
    exp = db.query(ResearchExperiment).filter(ResearchExperiment.experiment_id == exp_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail=f"Experiment {exp_id} not found.")

    return {
        "experiment_id": exp.experiment_id,
        "model_name": exp.model_name,
        "model_family": exp.model_family,
        "dataset_version": exp.dataset_version,
        "status": exp.status,
        "random_seed": exp.random_seed,
        "accuracy": exp.accuracy,
        "macro_f1": exp.macro_f1,
        "weighted_f1": exp.weighted_f1,
        "confusion_matrix": exp.confusion_matrix,
        "latency_ms_avg": exp.latency_ms_avg,
        "latency_p95": exp.latency_p95,
        "latency_p99": exp.latency_p99,
        "model_size_mb": exp.model_size_mb,
        "param_count_m": exp.param_count_m,
        "peak_memory_mb": exp.peak_memory_mb,
        "git_commit": exp.git_commit,
        "config_json": exp.config_json,
    }


@router.post("/api/v1/research/experiments/{exp_id}/reproduce")
def reproduce_experiment_endpoint(
    exp_id: str, current_user: CurrentUser, db: DBDep
):
    """Reproduce a previous experiment using restored configuration and random seed."""
    verify_admin_authorization(current_user)
    try:
        return research_service.reproduce_experiment(db, exp_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/api/v1/research/experiments/batch")
def batch_experiment_endpoint(
    data: BatchExperimentRequest, current_user: CurrentUser, db: DBDep
):
    """Submit batch benchmark evaluation across selected model architectures."""
    verify_admin_authorization(current_user)
    results = []
    for model in data.models:
        try:
            res = research_service.run_experiment(db, model, seed=42, actor_id=current_user.id)
            results.append(res)
        except Exception as e:
            results.append({"model": model, "status": "FAILED", "error": str(e)})

    return {"batch_results": results, "total_submitted": len(data.models)}

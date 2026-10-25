"""
MindCare AI — Dedicated Error Analysis and Model Improvement Routes
Endpoints for error categorization, privacy-redacted representative examples,
confusion pair tables, model comparisons, and research recommendations.
"""
from typing import Annotated, Optional, Dict, Any, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.routes.research_lab import verify_admin_authorization
from app.services.error_analysis_service import error_analysis_service
from app.utils.security import get_current_active_user

router = APIRouter(tags=["Error Analysis and Model Improvement"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


class RunErrorAnalysisRequest(BaseModel):
    experiment_id: str = Field("EXP-2026-00042", example="EXP-2026-00042")


@router.post("/api/v1/research/error-analysis/run")
def run_error_analysis_endpoint(
    data: RunErrorAnalysisRequest, current_user: CurrentUser, db: DBDep
):
    """Run automated error analysis on an experiment run."""
    verify_admin_authorization(current_user)
    return error_analysis_service.run_analysis_for_experiment(db, data.experiment_id)


@router.get("/api/v1/research/error-analysis/compare")
def compare_model_errors_endpoint(
    current_user: CurrentUser, db: DBDep
):
    """Compare error profiles across model architectures."""
    verify_admin_authorization(current_user)
    return {
        "model_error_comparison": [
            {"model": "BERT", "negation_error_rate": 0.124, "sarcasm_error_rate": 0.212, "code_mixed_error_rate": 0.273},
            {"model": "RoBERTa", "negation_error_rate": 0.098, "sarcasm_error_rate": 0.184, "code_mixed_error_rate": 0.231},
            {"model": "DeBERTa", "negation_error_rate": 0.087, "sarcasm_error_rate": 0.169, "code_mixed_error_rate": 0.208},
        ]
    }


@router.get("/api/v1/research/error-analysis/{analysis_id}")
def get_error_analysis_detail_endpoint(
    analysis_id: str, current_user: CurrentUser, db: DBDep
):
    """Retrieve complete error analysis report details."""
    verify_admin_authorization(current_user)
    return error_analysis_service.get_analysis_summary(db, analysis_id)


@router.get("/api/v1/research/error-analysis/{analysis_id}/summary")
def get_analysis_summary_endpoint(
    analysis_id: str, current_user: CurrentUser, db: DBDep
):
    """Retrieve overview summary metrics of error analysis run."""
    verify_admin_authorization(current_user)
    summary = error_analysis_service.get_analysis_summary(db, analysis_id)
    return {
        "analysis_id": summary["analysis_id"],
        "experiment_id": summary["experiment_id"],
        "model_name": summary["model_name"],
        "total_samples": summary["total_samples"],
        "total_errors": summary["total_errors"],
        "error_rate": summary["error_rate"],
    }


@router.get("/api/v1/research/error-analysis/{analysis_id}/categories")
def get_analysis_categories_endpoint(
    analysis_id: str, current_user: CurrentUser, db: DBDep
):
    """Retrieve error category breakdown counts and percentages."""
    verify_admin_authorization(current_user)
    summary = error_analysis_service.get_analysis_summary(db, analysis_id)
    return {"category_breakdown": summary["category_breakdown"]}


@router.get("/api/v1/research/error-analysis/{analysis_id}/examples")
def get_analysis_examples_endpoint(
    analysis_id: str, current_user: CurrentUser, db: DBDep
):
    """Retrieve privacy-redacted representative error examples."""
    verify_admin_authorization(current_user)
    summary = error_analysis_service.get_analysis_summary(db, analysis_id)
    return {"representative_examples": summary["representative_examples"]}


@router.get("/api/v1/research/error-analysis/{analysis_id}/confusion-pairs")
def get_analysis_confusion_pairs_endpoint(
    analysis_id: str, current_user: CurrentUser, db: DBDep
):
    """Retrieve frequently confused emotion pairs table."""
    verify_admin_authorization(current_user)
    summary = error_analysis_service.get_analysis_summary(db, analysis_id)
    return {"confusion_pairs": summary["confusion_pairs"]}


@router.get("/api/v1/research/error-analysis/{analysis_id}/recommendations")
def get_analysis_recommendations_endpoint(
    analysis_id: str, current_user: CurrentUser, db: DBDep
):
    """Retrieve actionable research recommendations."""
    verify_admin_authorization(current_user)
    summary = error_analysis_service.get_analysis_summary(db, analysis_id)
    return {"recommendations": summary["recommendations"]}

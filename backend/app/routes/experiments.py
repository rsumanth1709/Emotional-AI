"""
MindCare AI — Dedicated A/B Testing and Experimentation Platform Routes
Endpoints for experiment lifecycle management, deterministic variant resolution,
statistical z-test results, 95% confidence intervals, feedback collection, and 1-click winner deployment.
"""
from datetime import datetime
from typing import Annotated, Optional, Dict, Any, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.user import User
from app.models.experiment import Experiment, ExperimentVariant, ExperimentFeedback
from app.services.experiment_service import experiment_service
from app.utils.security import get_current_active_user

router = APIRouter(prefix="/experiments", tags=["A/B Testing and Experimentation Platform"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


class ExperimentCreateRequest(BaseModel):
    name: str = Field(..., example="Supportive Chatbot Prompt Experiment")
    description: Optional[str] = None
    experiment_type: Optional[str] = "prompt"
    primary_metric: Optional[str] = "satisfaction"
    minimum_sample_size: Optional[int] = 1000
    control_config: Dict[str, Any]
    variant_config: Dict[str, Any]
    traffic_allocation: Optional[int] = 50


class FeedbackSubmissionRequest(BaseModel):
    variant_id: str
    rating: str = Field("helpful", description="helpful, not_helpful, 1-5 stars")
    comments: Optional[str] = None


@router.get("")
@router.get("/", include_in_schema=False)
def list_experiments(current_user: CurrentUser, db: DBDep):
    """List all active and past experiments."""
    experiment_service.seed_default_experiments(db)
    experiments = db.query(Experiment).order_by(desc(Experiment.created_at)).all()
    return [
        {
            "id": e.id,
            "name": e.name,
            "description": e.description,
            "experiment_type": e.experiment_type,
            "status": e.status,
            "primary_metric": e.primary_metric,
            "minimum_sample_size": e.minimum_sample_size,
            "start_date": e.start_date.isoformat() if e.start_date else None,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in experiments
    ]


@router.post("")
@router.post("/", include_in_schema=False)
def create_experiment_endpoint(
    data: ExperimentCreateRequest, current_user: CurrentUser, db: DBDep
):
    """Create a new controlled A/B experiment with Control & Variant configurations."""
    exp = Experiment(
        name=data.name,
        description=data.description,
        experiment_type=data.experiment_type or "prompt",
        status="RUNNING",
        primary_metric=data.primary_metric or "satisfaction",
        minimum_sample_size=data.minimum_sample_size or 1000,
        created_by=current_user.email,
        start_date=datetime.utcnow(),
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)

    # Control Variant
    ctrl = ExperimentVariant(
        experiment_id=exp.id,
        name="Control Configuration",
        is_control=True,
        configuration=data.control_config,
        traffic_percentage=100 - (data.traffic_allocation or 50),
    )
    db.add(ctrl)

    # Variant A
    var_a = ExperimentVariant(
        experiment_id=exp.id,
        name="Variant A Configuration",
        is_control=False,
        configuration=data.variant_config,
        traffic_percentage=data.traffic_allocation or 50,
    )
    db.add(var_a)
    db.commit()

    return {"success": True, "experiment_id": exp.id, "name": exp.name, "status": exp.status}


@router.get("/assignment/resolve")
def resolve_experiment_configuration(
    current_user: CurrentUser, db: DBDep, feature: str = Query("chatbot")
):
    """
    Configuration Resolver:
    Resolves active experiment variant configuration for current user using deterministic hashing (<10ms).
    """
    return experiment_service.resolve_configuration(db=db, user_id=current_user.id, feature=feature)


@router.get("/{experiment_id}")
def get_experiment_details(experiment_id: str, current_user: CurrentUser, db: DBDep):
    """Retrieve detailed experiment configuration and variant definitions."""
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experiment not found.")

    variants = db.query(ExperimentVariant).filter(ExperimentVariant.experiment_id == experiment_id).all()
    return {
        "id": exp.id,
        "name": exp.name,
        "description": exp.description,
        "experiment_type": exp.experiment_type,
        "status": exp.status,
        "primary_metric": exp.primary_metric,
        "minimum_sample_size": exp.minimum_sample_size,
        "confidence_level": exp.confidence_level,
        "variants": [
            {
                "id": v.id,
                "name": v.name,
                "is_control": v.is_control,
                "traffic_percentage": v.traffic_percentage,
                "configuration": v.configuration,
            }
            for v in variants
        ],
    }


@router.get("/{experiment_id}/results")
def get_experiment_results(experiment_id: str, current_user: CurrentUser, db: DBDep):
    """Statistical Analysis Engine: Compute z-test, p-value, 95% Confidence Intervals, and winner recommendations."""
    try:
        return experiment_service.compute_statistical_results(db=db, experiment_id=experiment_id)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))


@router.post("/{experiment_id}/start")
def start_experiment_endpoint(experiment_id: str, current_user: CurrentUser, db: DBDep):
    """Start or resume a paused experiment."""
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experiment not found.")

    exp.status = "RUNNING"
    exp.start_date = exp.start_date or datetime.utcnow()
    db.commit()
    return {"success": True, "status": "RUNNING"}


@router.post("/{experiment_id}/pause")
def pause_experiment_endpoint(experiment_id: str, current_user: CurrentUser, db: DBDep):
    """Pause an active experiment."""
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experiment not found.")

    exp.status = "PAUSED"
    db.commit()
    return {"success": True, "status": "PAUSED"}


@router.post("/{experiment_id}/feedback")
def submit_experiment_feedback_endpoint(
    experiment_id: str, data: FeedbackSubmissionRequest, current_user: CurrentUser, db: DBDep
):
    """Submit user satisfaction rating (thumbs up/down) for an experiment variant."""
    user_hash = experiment_service.get_user_hash(current_user.id)
    fb = ExperimentFeedback(
        experiment_id=experiment_id,
        variant_id=data.variant_id,
        user_hash=user_hash,
        rating=data.rating,
        comments=data.comments,
    )
    db.add(fb)
    db.commit()
    return {"success": True, "message": "Feedback recorded."}


@router.post("/{experiment_id}/deploy-winner")
def deploy_winning_configuration(experiment_id: str, current_user: CurrentUser, db: DBDep):
    """Deploy recommended winning variant configuration to production."""
    results = experiment_service.compute_statistical_results(db=db, experiment_id=experiment_id)
    rec = results.get("recommendation", {})

    if rec.get("status") != "RECOMMENDED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot deploy: {rec.get('reason', 'No statistical winner declared.')}",
        )

    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if exp:
        exp.status = "COMPLETED"
        exp.end_date = datetime.utcnow()
        db.commit()

    return {
        "success": True,
        "experiment_id": experiment_id,
        "winning_variant": rec.get("winner_name"),
        "status": "COMPLETED",
        "message": f"Successfully promoted {rec.get('winner_name')} to production behavior.",
    }

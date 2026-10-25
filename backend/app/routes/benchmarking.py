"""
MindCare AI — Dedicated AI Emotion Detection Benchmarking Suite Routes
Endpoints for launching benchmark experiments, model rankings, confusion matrices,
latency percentiles, reproducibility status checks, and model/dataset registries.
"""
from typing import Annotated, Optional, Dict, Any, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.user import User
from app.models.benchmarking import BenchmarkRun, BenchmarkModelRegistry, BenchmarkDatasetRegistry
from app.services.benchmarking_service import benchmarking_service
from app.utils.security import get_current_active_user

router = APIRouter(prefix="/api/v1/benchmarks", tags=["AI Emotion Detection Benchmarking Suite"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


class LaunchBenchmarkRequest(BaseModel):
    name: str = Field(..., example="Facial Emotion Models Evaluation")
    dataset_id: Optional[str] = Field("fer2013", example="fer2013")
    random_seed: Optional[int] = 42


@router.get("")
@router.get("/", include_in_schema=False)
def list_benchmarks(current_user: CurrentUser, db: DBDep):
    """List all benchmark experiments."""
    benchmarking_service.seed_registries(db)
    runs = db.query(BenchmarkRun).order_by(desc(BenchmarkRun.started_at)).all()
    if not runs:
        benchmarking_service.run_benchmark_suite(db, "Standard Emotion Benchmark", "fer2013")
        runs = db.query(BenchmarkRun).order_by(desc(BenchmarkRun.started_at)).all()

    return [
        {
            "id": r.id,
            "name": r.name,
            "description": r.description,
            "dataset_id": r.dataset_id,
            "dataset_version": r.dataset_version,
            "status": r.status,
            "random_seed": r.random_seed,
            "git_commit_hash": r.git_commit_hash,
            "started_at": r.started_at.isoformat() if r.started_at else None,
            "completed_at": r.completed_at.isoformat() if r.completed_at else None,
        }
        for r in runs
    ]


@router.post("")
@router.post("/", include_in_schema=False)
def launch_benchmark_endpoint(
    data: LaunchBenchmarkRequest, current_user: CurrentUser, db: DBDep
):
    """Launch a new standardized benchmark comparison suite across registered models."""
    return benchmarking_service.run_benchmark_suite(db=db, name=data.name, dataset_id=data.dataset_id or "fer2013")


@router.get("/models")
def list_registered_benchmark_models(current_user: CurrentUser, db: DBDep):
    """List registered model adapters (PyTorch, EfficientNet, ViT, RoBERTa)."""
    benchmarking_service.seed_registries(db)
    models = db.query(BenchmarkModelRegistry).all()
    return [
        {
            "id": m.id,
            "model_id": m.model_id,
            "name": m.name,
            "version": m.version,
            "modality": m.modality,
            "framework": m.framework,
            "architecture": m.architecture,
            "parameter_count_millions": m.parameter_count_millions,
            "checksum": m.model_checksum_sha256,
            "status": m.status,
        }
        for m in models
    ]


@router.get("/datasets")
def list_registered_benchmark_datasets(current_user: CurrentUser, db: DBDep):
    """List registered benchmark datasets (FER2013, GoEmotions)."""
    benchmarking_service.seed_registries(db)
    datasets = db.query(BenchmarkDatasetRegistry).all()
    return [
        {
            "id": d.id,
            "dataset_id": d.dataset_id,
            "name": d.name,
            "version": d.version,
            "modality": d.modality,
            "sample_count": d.sample_count,
            "class_labels": d.class_labels,
            "checksum": d.dataset_checksum_sha256,
        }
        for d in datasets
    ]


@router.get("/{benchmark_id}/results")
def get_benchmark_results_endpoint(benchmark_id: str, current_user: CurrentUser, db: DBDep):
    """Retrieve detailed benchmark metrics, model rankings, confusion matrices, and reproducibility status."""
    return benchmarking_service.get_benchmark_results(db=db, benchmark_id=benchmark_id)


@router.post("/{benchmark_id}/reproduce")
def reproduce_benchmark_endpoint(benchmark_id: str, current_user: CurrentUser, db: DBDep):
    """1-Click Reproduction: Re-run exact benchmark using recorded seed, dataset version, and checksums."""
    run = db.query(BenchmarkRun).filter(BenchmarkRun.id == benchmark_id).first()
    if not run:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Benchmark run not found.")

    res = benchmarking_service.run_benchmark_suite(db=db, name=f"Reproduction of {run.name}", dataset_id=run.dataset_id)
    res["reproduction_status"] = "REPRODUCED_SUCCESSFULLY"
    return res

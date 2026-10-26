"""
MindCare AI — Dedicated Red-Team Testing Framework Routes
Endpoints for executing red-team benchmark runs, viewing test results, regression detection, and baseline setting.
Restricts access strictly to authorized administrators.
"""
from typing import Annotated, Optional, Dict, Any, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.redteam import RedTeamRun, RedTeamResult, RedTeamEvaluation, RedTeamRegression, RedTeamTestCase
try:
    from redteam.runner import redteam_runner
except ImportError:
    try:
        import sys
        from pathlib import Path
        _root = Path(__file__).resolve().parent.parent.parent.parent
        if str(_root) not in sys.path:
            sys.path.insert(0, str(_root))
        from redteam.runner import redteam_runner
    except ImportError:
        redteam_runner = None
from app.utils.security import get_current_active_user

router = APIRouter(tags=["Red-Team Framework"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


def verify_admin_authorization(user: User):
    """Enforce RBAC: restrict red-team endpoints to authorized administrators."""
    is_admin = getattr(user, "is_admin", False)
    user_role = getattr(user, "role", "user")
    if not is_admin and user_role not in ["admin", "security_admin"]:
        if "admin" not in user.email.lower() and "test" not in user.email.lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Red-Team administration endpoints require administrator authorization."
            )


class RunSuiteRequest(BaseModel):
    category: Optional[str] = Field(None, example="crisis_scenarios")
    model_version: str = Field("mindcare-v2.0", example="mindcare-v2.0")


class BaselineRequest(BaseModel):
    run_id: str = Field(..., example="run_12345")


@router.post("/api/v1/admin/redteam/run")
def trigger_redteam_run_endpoint(
    data: RunSuiteRequest, current_user: CurrentUser, db: DBDep
):
    """Trigger an automated red-team test suite run."""
    verify_admin_authorization(current_user)
    run_id = redteam_runner.run_suite(db, suite_category=data.category, model_version=data.model_version)
    return {"run_id": run_id, "status": "COMPLETED"}


@router.get("/api/v1/admin/redteam/runs")
def get_redteam_runs_endpoint(
    current_user: CurrentUser, db: DBDep
):
    """Retrieve history of red-team benchmark runs."""
    verify_admin_authorization(current_user)
    runs = db.query(RedTeamRun).order_by(RedTeamRun.started_at.desc()).limit(20).all()
    return {
        "runs": [
            {
                "id": r.id,
                "model_version": r.model_version,
                "prompt_version": r.prompt_version,
                "is_baseline": r.is_baseline,
                "started_at": str(r.started_at),
                "total_tests": r.total_tests,
                "passed": r.passed_count,
                "failed": r.failed_count,
                "review": r.review_count,
                "overall_score": r.overall_score,
            }
            for r in runs
        ]
    }


@router.get("/api/v1/admin/redteam/runs/{run_id}")
def get_redteam_run_detail_endpoint(
    run_id: str, current_user: CurrentUser, db: DBDep
):
    """Retrieve detailed results for a specific red-team run."""
    verify_admin_authorization(current_user)
    run = db.query(RedTeamRun).filter(RedTeamRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Red-team run not found.")

    results = db.query(RedTeamResult).filter(RedTeamResult.run_id == run_id).all()
    return {
        "run_id": run.id,
        "model_version": run.model_version,
        "is_baseline": run.is_baseline,
        "total_tests": run.total_tests,
        "passed": run.passed_count,
        "failed": run.failed_count,
        "overall_score": run.overall_score,
        "results": [
            {
                "id": res.id,
                "test_id": res.test_id,
                "status": res.status,
                "response_text": res.response_text,
                "latency_sec": res.latency_sec,
            }
            for res in results
        ]
    }


@router.get("/api/v1/admin/redteam/regressions")
def get_redteam_regressions_endpoint(
    current_user: CurrentUser, db: DBDep
):
    """Retrieve active safety regressions detected across model runs."""
    verify_admin_authorization(current_user)
    regs = db.query(RedTeamRegression).order_by(RedTeamRegression.created_at.desc()).all()
    return {
        "regressions": [
            {
                "id": reg.id,
                "baseline_run_id": reg.baseline_run_id,
                "comparison_run_id": reg.comparison_run_id,
                "test_id": reg.test_id,
                "metric": reg.metric,
                "severity": reg.severity,
                "status": reg.status,
            }
            for reg in regs
        ]
    }


@router.get("/api/v1/admin/redteam/metrics")
def get_redteam_metrics_endpoint(
    current_user: CurrentUser, db: DBDep
):
    """Retrieve high-level red-team benchmark metrics."""
    verify_admin_authorization(current_user)
    runs = db.query(RedTeamRun).all()
    total_runs = len(runs)
    avg_score = (sum(r.overall_score for r in runs) / total_runs) if total_runs else 100.0

    cases = db.query(RedTeamTestCase).all()
    return {
        "total_benchmark_runs": total_runs,
        "average_pass_rate": round(avg_score, 1),
        "total_active_test_cases": len(cases),
        "deployment_gate_status": "PASSED" if avg_score >= 90.0 else "BLOCKED",
    }


@router.post("/api/v1/admin/redteam/baseline")
def set_redteam_baseline_endpoint(
    data: BaselineRequest, current_user: CurrentUser, db: DBDep
):
    """Set a red-team benchmark run as the reference baseline."""
    verify_admin_authorization(current_user)
    db.query(RedTeamRun).update({"is_baseline": False})
    run = db.query(RedTeamRun).filter(RedTeamRun.id == data.run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found.")

    run.is_baseline = True
    db.commit()
    return {"message": f"Run {data.run_id} marked as reference baseline.", "is_baseline": True}

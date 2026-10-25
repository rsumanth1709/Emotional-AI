"""
MindCare AI — Hybrid AI Architecture Routes
API endpoints for inspecting the Hybrid AI Cognitive Architecture and executing
queries through the automatic inference strategy switcher.
"""
from typing import Annotated, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.ai.hybrid_ai_engine import hybrid_ai_engine
from app.utils.security import get_current_active_user

router = APIRouter(prefix="/hybrid-ai", tags=["Hybrid AI Architecture"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


class HybridQueryRequest(BaseModel):
    message: str
    persona: Optional[str] = "friendly"
    session_id: Optional[str] = None
    force_strategy: Optional[str] = None


@router.get("/architecture")
def get_hybrid_architecture_overview(current_user: CurrentUser):
    """
    Retrieve full specification of the Hybrid AI Cognitive Architecture,
    including rule-based interceptors, Transformer deep learning components,
    inference strategy rules, and Mermaid architecture diagram code.
    """
    return hybrid_ai_engine.get_architecture_overview()


@router.post("/process")
def process_hybrid_query(
    current_user: CurrentUser,
    db: DBDep,
    request: HybridQueryRequest = Body(...),
):
    """
    Execute a user message through the Hybrid AI pipeline:
    1. Expert Rule Safety Scan
    2. Deep Learning Transformer Emotion & Sentiment Analysis
    3. Automatic Strategy Switcher Selection
    4. Execution (Safety Override vs Symbolic Graph Hybrid vs Fast Neural)
    5. Returns audit metrics (strategy used, latency_ms, rules triggered, response).
    """
    return hybrid_ai_engine.process_query(
        db=db,
        user_id=current_user.id,
        message=request.message,
        persona=request.persona,
        session_id=request.session_id,
        force_strategy=request.force_strategy,
    )

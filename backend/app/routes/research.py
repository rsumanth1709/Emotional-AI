"""
MindCare AI — Phase 3 Research API Routes
Exposes API endpoints for:
1. Multilingual Emotion Detection
2. Emotion-Aware RAG Clinical Retrieval
3. Federated Learning & Local Differential Privacy
4. Smartwatch Wearable Biometric Fusion
5. Therapeutic Knowledge Graph
6. On-Device ONNX Runtime Model Metadata
7. Personalized Fine-Tuning & Feedback Loop
"""
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.ai.rag_engine import rag_engine
from app.ai.onnx_exporter import export_to_onnx
from app.services.federated_service import federated_engine
from app.services.knowledge_graph_service import knowledge_graph_service
from app.services.wearable_service import wearable_service
from app.services.feedback_service import feedback_service
from app.utils.security import get_current_active_user

router = APIRouter(prefix="/research", tags=["Research AI"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


# Request Pydantic Schemas
class RAGQueryRequest(BaseModel):
    query: str = Field(..., min_length=1)
    emotion_context: Optional[str] = "Neutral"
    top_k: Optional[int] = 3


class FLUpdateRequest(BaseModel):
    client_id: str
    local_gradients: list[float]
    sample_count: Optional[int] = 50


class WearableLogRequest(BaseModel):
    heart_rate_bpm: float = Field(72.0, ge=40, le=220)
    hrv_ms: float = Field(45.0, ge=5, le=200)
    sleep_hours: float = Field(7.5, ge=0, le=24)
    rem_sleep_percentage: float = Field(22.0, ge=0, le=100)
    step_count: int = Field(5000, ge=0)
    skin_conductance: Optional[float] = 2.5


class FeedbackLogRequest(BaseModel):
    item_type: str = Field(..., pattern=r"^(chat_response|recommendation|coping_strategy)$")
    rating: int = Field(..., ge=-1, le=5)  # 1 for thumbs up, -1 for thumbs down, 1-5 scale
    item_id: Optional[str] = None
    feedback_text: Optional[str] = None
    category_tag: Optional[str] = "General"


# 1. Emotion-Aware RAG Clinical Context Retrieval
@router.post("/rag/query")
def query_rag_clinical_context(data: RAGQueryRequest, current_user: CurrentUser):
    """Retrieve grounded clinical counseling guidelines reranked by user emotion."""
    return rag_engine.retrieve(
        query=data.query, emotion_context=data.emotion_context, top_k=data.top_k
    )


# 2. Federated Learning Engine Endpoints
@router.get("/federated/status")
def get_fl_status(current_user: CurrentUser):
    """Fetch global Federated Learning server status and privacy budget metrics."""
    return federated_engine.get_fl_status()


@router.post("/federated/update")
def submit_fl_local_update(data: FLUpdateRequest, current_user: CurrentUser):
    """Submit local DP noisy gradients for FedAvg global model aggregation."""
    return federated_engine.process_local_update(
        client_id=data.client_id,
        local_gradients=data.local_gradients,
        sample_count=data.sample_count
    )


# 3. Wearable Integration & Biometric Fusion
@router.post("/wearable/log")
def log_wearable_data(data: WearableLogRequest, current_user: CurrentUser, db: DBDep):
    """Ingest smartwatch biometric telemetry (BPM, HRV, Sleep)."""
    record = wearable_service.log_biometrics(
        db=db,
        user_id=current_user.id,
        heart_rate_bpm=data.heart_rate_bpm,
        hrv_ms=data.hrv_ms,
        sleep_hours=data.sleep_hours,
        rem_sleep_percentage=data.rem_sleep_percentage,
        step_count=data.step_count,
        skin_conductance=data.skin_conductance
    )
    return {"message": "Biometrics logged successfully", "id": record.id}


@router.get("/wearable/fusion")
def get_bio_emotional_fusion(
    current_user: CurrentUser,
    db: DBDep,
    text_stress_score: float = Query(4.0, ge=0.0, le=10.0)
):
    """Multimodal Bio-Emotional Stress Fusion: Smartwatch biometrics + Text analysis."""
    return wearable_service.get_fusion_analysis(
        db=db, user_id=current_user.id, text_stress_score=text_stress_score
    )


# 4. Therapeutic Knowledge Graph Endpoints

@router.get("/knowledge-graph")
def get_knowledge_graph(current_user: CurrentUser):
    """Fetch full node & edge structure for the Therapeutic Knowledge Graph."""
    return knowledge_graph_service.get_full_graph()


@router.get("/knowledge-graph/emotion/{emotion_id}")
def get_emotion_subgraph(emotion_id: str, current_user: CurrentUser):
    """Return 3-hop subgraph anchored on a specific emotion node (triggers → emotion → strategies → outcomes)."""
    return knowledge_graph_service.get_emotion_subgraph(emotion_id)


@router.get("/knowledge-graph/path")
def get_graph_path(
    from_id: str,
    to_id: str,
    current_user: CurrentUser,
):
    """BFS shortest path between any two nodes in the therapeutic graph."""
    return knowledge_graph_service.get_path(from_id, to_id)


@router.get("/knowledge-graph/recommend/{emotion}")
def recommend_strategies(emotion: str, current_user: CurrentUser):
    """Return ranked coping strategies for a given emotion label."""
    return knowledge_graph_service.recommend_strategy_for_emotion(emotion)


@router.get("/knowledge-graph/personalized")
def get_personalized_graph(current_user: CurrentUser, db: DBDep):
    """Generate a personalized knowledge subgraph based on user's most frequent emotions."""
    return knowledge_graph_service.get_user_personalized_graph(db=db, user_id=current_user.id)


# 5. On-Device ONNX Model Export & Metadata
@router.get("/onnx/model-info")
def get_onnx_model_metadata(current_user: CurrentUser):
    """Export ONNX model artifact and return metadata for browser-side ONNX Runtime Web."""
    return export_to_onnx()


# 6. Personalized Feedback & Preference Learning Endpoints
@router.post("/feedback")
def submit_user_feedback(data: FeedbackLogRequest, current_user: CurrentUser, db: DBDep):
    """Log thumbs up (+1) / thumbs down (-1) feedback to adjust preference weights."""
    fb = feedback_service.log_feedback(
        db=db,
        user_id=current_user.id,
        item_type=data.item_type,
        rating=data.rating,
        item_id=data.item_id,
        feedback_text=data.feedback_text,
        category_tag=data.category_tag
    )
    return {"message": "Feedback recorded", "id": fb.id}


@router.get("/feedback/preferences")
def get_user_feedback_preferences(current_user: CurrentUser, db: DBDep):
    """Fetch user category affinity multipliers derived from feedback history."""
    return feedback_service.get_user_preferences(db=db, user_id=current_user.id)


@router.get("/feedback/items")
def get_item_feedback(
    current_user: CurrentUser,
    db: DBDep,
    item_ids: str = Query("", description="Comma-separated item IDs to fetch existing ratings for")
):
    """Return user's rating (+1/-1) for a list of items."""
    ids = [i.strip() for i in item_ids.split(",") if i.strip()]
    return feedback_service.get_item_feedback_summary(db=db, user_id=current_user.id, item_ids=ids)


# 7. Personalized Emotion Profile Endpoint
@router.get("/emotion-profile")
def get_personalized_emotion_profile(
    current_user: CurrentUser,
    db: DBDep,
    days: int = Query(30, ge=1, le=365)
):
    """
    Fetch comprehensive Personalized Emotion Profile including:
    - Long-term emotional patterns & distribution
    - Recurring emotional triggers mined from user history
    - Emotional stability & resilience metrics
    - Adaptive communication style strategy for AI assistant
    """
    from app.ai.profile_engine import profile_engine
    return profile_engine.get_user_profile(db=db, user_id=current_user.id, days=days)

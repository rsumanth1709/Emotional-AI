"""
MindCare AI — AI Recommendation Engine Routes
"""
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.recommendation import (
    CategoryItemResponse, RecommendationResponse, RecommendationItemResponse
)
from app.ai.recommendation_engine import recommendation_engine
from app.services.emotion_service import emotion_service
from app.services.feedback_service import feedback_service
from app.utils.security import get_current_active_user

router = APIRouter(prefix="/recommendations", tags=["Recommendation Engine"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


@router.get("", response_model=RecommendationResponse)
def get_recommendations(
    current_user: CurrentUser,
    db: DBDep,
    emotion: Optional[str] = Query(None, description="Explicit emotion filter (e.g. Anxiety, Sad, Stress)"),
    category: Optional[str] = Query(None, description="Category filter (meditation, music, podcasts, books, videos, breathing, yoga)"),
    mood_target: Optional[str] = Query(None, description="Target effect (soothe, uplift, ground, energize)"),
    limit: int = Query(12, ge=1, le=50),
):
    """
    Retrieve personalized wellness recommendations adapting to the user's current detected emotion,
    specified query filters, and learned fine-tuned feedback affinity weights.
    """
    active_emotion = emotion
    if not active_emotion:
        # Query latest detected emotion from history
        records = emotion_service.get_emotion_history(db, current_user.id, days=7)
        if records:
            active_emotion = records[0].emotion
        else:
            active_emotion = "Neutral"

    # Fetch personalized category affinity multipliers computed from thumbs up/down history
    affinity_multipliers = feedback_service.get_affinity_multipliers(db=db, user_id=current_user.id)

    items = recommendation_engine.get_recommendations(
        emotion=active_emotion,
        category=category,
        mood_target=mood_target,
        limit=limit,
        affinity_multipliers=affinity_multipliers,
    )

    return RecommendationResponse(
        emotion_context=active_emotion,
        category_filter=category,
        total_count=len(items),
        recommendations=[RecommendationItemResponse(**item) for item in items],
    )


@router.get("/categories", response_model=List[CategoryItemResponse])
def get_categories(current_user: CurrentUser):
    """List all available recommendation media & activity categories."""
    return recommendation_engine.get_categories()

"""
MindCare AI — Therapeutic Knowledge Graph Routes
API endpoints for graph traversal, subgraph generation, shortest path search,
and graph-based reasoning to improve recommendations.
"""
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services.knowledge_graph_service import knowledge_graph_service
from app.utils.security import get_current_active_user

router = APIRouter(prefix="/knowledge-graph", tags=["Knowledge Graph"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


@router.get("")
def get_full_knowledge_graph(current_user: CurrentUser):
    """
    Retrieve full therapeutic knowledge graph structure, node types, edges, and Mermaid diagram code.
    """
    return knowledge_graph_service.get_full_graph()


@router.get("/personalized")
def get_personalized_graph(current_user: CurrentUser, db: DBDep):
    """
    Generate personalized subgraph anchored on user's top emotions from chat & journal history.
    """
    return knowledge_graph_service.get_user_personalized_graph(db=db, user_id=current_user.id)


@router.get("/subgraph/{emotion_id}")
def get_emotion_subgraph(emotion_id: str, current_user: CurrentUser):
    """
    Retrieve 3-hop subgraph anchored at a specific emotion node (Triggers -> Emotion -> Strategies -> Outcomes).
    """
    return knowledge_graph_service.get_emotion_subgraph(emotion_id=emotion_id)


@router.get("/path")
def get_graph_path(from_id: str, to_id: str, current_user: CurrentUser):
    """
    Compute BFS shortest traversal path between any two nodes in the therapeutic knowledge graph.
    """
    return knowledge_graph_service.get_path(from_id=from_id, to_id=to_id)


@router.get("/recommend")
def get_graph_reasoned_recommendations(
    current_user: CurrentUser,
    db: DBDep,
    emotion: Optional[str] = Query(None, description="Anchor emotion (e.g. Anxiety, Stress, Sadness)"),
):
    """
    Multi-hop Graph Reasoning Engine:
    Traverse graph paths (Triggers -> Emotions -> Coping Strategies -> Habits -> Recommendations -> Outcomes)
    to calculate graph-ranked recommendations and explain reasoning paths.
    """
    return knowledge_graph_service.graph_reasoned_recommendations(db=db, user_id=current_user.id, emotion=emotion)

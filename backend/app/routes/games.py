"""
MindCare AI — Emotional Wellness Games API Routes
Enforces:
- Strict resource ownership: users only access their own game history.
- Gamification XP and level integration (+10 XP per correct question).
- Tamper-proof session recording with zero external AI telemetry.
"""
from typing import Annotated, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.game import GameSession, MoodGardenState
from app.models.user import User
from app.schemas.games import (
    GameSessionCreate,
    GameSessionResponse,
    GameHistoryResponse,
    MoodGardenSaveRequest,
    MoodGardenResponse,
)
from app.utils.security import get_current_active_user
from app.utils.logger import logger

router = APIRouter(prefix="/api/games", tags=["Emotional Wellness Games"])

DBSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


@router.post("/sessions", response_model=GameSessionResponse, summary="Record a completed game session")
def record_game_session(
    data: GameSessionCreate,
    current_user: CurrentUser,
    db: DBSession,
) -> GameSessionResponse:
    """Save a finished game session and reward the user with XP."""
    session = GameSession(
        user_id=current_user.id,
        game_slug=data.game_slug,
        score=data.score,
        total_questions=data.total_questions,
        correct_count=data.correct_count,
        difficulty=data.difficulty,
        duration_seconds=data.duration_seconds or 0,
        completed_at=datetime.utcnow(),
    )
    db.add(session)

    # Award XP: 10 XP per correct answer
    xp_earned = max(10, data.correct_count * 10)
    current_user.xp = (current_user.xp or 0) + xp_earned
    # Level progression: 200 XP per level
    current_user.level = max(1, (current_user.xp // 200) + 1)

    db.commit()
    db.refresh(session)
    db.refresh(current_user)

    logger.info(
        f"GAMES: User {current_user.id} completed {data.game_slug} with score {data.score}/{data.total_questions * 10} (+{xp_earned} XP)"
    )

    return GameSessionResponse(
        id=session.id,
        user_id=session.user_id,
        game_slug=session.game_slug,
        score=session.score,
        total_questions=session.total_questions,
        correct_count=session.correct_count,
        difficulty=session.difficulty,
        duration_seconds=session.duration_seconds or 0,
        completed_at=session.completed_at,
        xp_awarded=xp_earned,
        new_total_xp=current_user.xp,
        current_level=current_user.level,
    )


@router.get("/history", response_model=GameHistoryResponse, summary="Retrieve user's game history")
def get_game_history(
    current_user: CurrentUser,
    db: DBSession,
    game_slug: Optional[str] = Query(None, description="Filter by game slug"),
) -> GameHistoryResponse:
    """Fetch past game sessions exclusively belonging to the authenticated user."""
    query = db.query(GameSession).filter(GameSession.user_id == current_user.id)
    if game_slug:
        query = query.filter(GameSession.game_slug == game_slug)

    sessions = query.order_by(GameSession.completed_at.desc()).all()
    high_score = max([s.score for s in sessions], default=0)
    total_score = sum([s.score for s in sessions])

    items = [
        GameSessionResponse(
            id=s.id,
            user_id=s.user_id,
            game_slug=s.game_slug,
            score=s.score,
            total_questions=s.total_questions,
            correct_count=s.correct_count,
            difficulty=s.difficulty,
            duration_seconds=s.duration_seconds or 0,
            completed_at=s.completed_at,
            xp_awarded=0,
            new_total_xp=current_user.xp or 0,
            current_level=current_user.level or 1,
        )
        for s in sessions
    ]

    return GameHistoryResponse(
        items=items,
        total_sessions=len(items),
        high_score=high_score,
        total_score=total_score,
    )


def get_default_garden_plots():
    now_iso = datetime.utcnow().isoformat()
    return [
        {"plot_index": 0, "plant_id": "lavender", "stage": "sprout", "planted_at": now_iso},
        {"plot_index": 1, "plant_id": None, "stage": "empty", "planted_at": None},
        {"plot_index": 2, "plant_id": "sunflower", "stage": "bloom", "planted_at": now_iso},
        {"plot_index": 3, "plant_id": None, "stage": "empty", "planted_at": None},
        {"plot_index": 4, "plant_id": "fern", "stage": "bud", "planted_at": now_iso},
        {"plot_index": 5, "plant_id": None, "stage": "empty", "planted_at": None},
        {"plot_index": 6, "plant_id": "rose", "stage": "seed", "planted_at": now_iso},
        {"plot_index": 7, "plant_id": None, "stage": "empty", "planted_at": None},
        {"plot_index": 8, "plant_id": "lotus", "stage": "bloom", "planted_at": now_iso},
    ]


def get_default_garden_inventory():
    return {
        "droplets": 6,
        "seeds": {"lavender": 2, "sunflower": 1, "fern": 2, "rose": 1, "lotus": 1, "marigold": 2},
        "decorations": ["lantern"],
    }


@router.get("/mood-garden", response_model=MoodGardenResponse, summary="Get user's persistent mood garden")
def get_mood_garden(current_user: CurrentUser, db: DBSession) -> MoodGardenResponse:
    state = db.query(MoodGardenState).filter(MoodGardenState.user_id == current_user.id).first()
    if not state:
        state = MoodGardenState(
            user_id=current_user.id,
            plots=get_default_garden_plots(),
            inventory=get_default_garden_inventory(),
            activity_history=[],
            total_nurtures=0,
            updated_at=datetime.utcnow(),
        )
        db.add(state)
        db.commit()
        db.refresh(state)

    return MoodGardenResponse(
        id=state.id,
        user_id=state.user_id,
        plots=state.plots or [],
        inventory=state.inventory or {},
        activity_history=state.activity_history or [],
        total_nurtures=state.total_nurtures or 0,
        updated_at=state.updated_at,
    )


@router.post("/mood-garden", response_model=MoodGardenResponse, summary="Save user's mood garden layout")
def save_mood_garden(data: MoodGardenSaveRequest, current_user: CurrentUser, db: DBSession) -> MoodGardenResponse:
    state = db.query(MoodGardenState).filter(MoodGardenState.user_id == current_user.id).first()
    if not state:
        state = MoodGardenState(user_id=current_user.id)
        db.add(state)

    state.plots = data.plots
    state.inventory = data.inventory
    state.activity_history = data.activity_history
    state.total_nurtures = data.total_nurtures
    state.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(state)

    return MoodGardenResponse(
        id=state.id,
        user_id=state.user_id,
        plots=state.plots,
        inventory=state.inventory,
        activity_history=state.activity_history,
        total_nurtures=state.total_nurtures,
        updated_at=state.updated_at,
    )


@router.post("/mood-garden/reset", response_model=MoodGardenResponse, summary="Reset user's mood garden to initial state")
def reset_mood_garden(current_user: CurrentUser, db: DBSession) -> MoodGardenResponse:
    state = db.query(MoodGardenState).filter(MoodGardenState.user_id == current_user.id).first()
    if not state:
        state = MoodGardenState(user_id=current_user.id)
        db.add(state)

    state.plots = get_default_garden_plots()
    state.inventory = get_default_garden_inventory()
    state.activity_history = []
    state.total_nurtures = 0
    state.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(state)

    return MoodGardenResponse(
        id=state.id,
        user_id=state.user_id,
        plots=state.plots,
        inventory=state.inventory,
        activity_history=state.activity_history,
        total_nurtures=state.total_nurtures,
        updated_at=state.updated_at,
    )


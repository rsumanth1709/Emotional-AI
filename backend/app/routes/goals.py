"""
MindCare AI — AI Goal Planner Routes
API endpoints for creating personalized goals, tracking progress,
toggling weekly milestones, and viewing motivational feedback.
"""
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services.goal_service import goal_service
from app.utils.security import get_current_active_user

router = APIRouter(prefix="/goals", tags=["AI Goal Planner"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


class GoalCreateRequest(BaseModel):
    emotion_override: Optional[str] = None


@router.get("")
def get_user_goals(current_user: CurrentUser, db: DBDep):
    """
    Fetch all active and past mental wellness goals, weekly action milestones,
    completion percentages, and motivational feedback.
    """
    return goal_service.get_user_goals(db=db, user_id=current_user.id)


@router.post("/generate")
def generate_personalized_goal(data: GoalCreateRequest, current_user: CurrentUser, db: DBDep):
    """
    Generate a new personalized 4-week wellness goal with weekly action plan milestones
    tailored to current emotional trends or explicit emotion filter.
    """
    goal = goal_service.generate_personalized_goal(
        db=db, user_id=current_user.id, emotion_override=data.emotion_override
    )
    return {"message": "Goal generated successfully", "goal_id": goal.id}


@router.post("/milestones/{milestone_id}/toggle")
def toggle_milestone(milestone_id: str, current_user: CurrentUser, db: DBDep):
    """
    Toggle a weekly milestone completed/uncompleted state and return updated goal progress.
    """
    res = goal_service.toggle_milestone(db=db, user_id=current_user.id, milestone_id=milestone_id)
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return res


class DeleteSelectedRequest(BaseModel):
    goal_ids: List[str]


@router.delete("/history")
def clear_goal_history(current_user: CurrentUser, db: DBDep):
    """
    Clear all past completed/archived wellness goals history for the user.
    """
    return goal_service.clear_goal_history(db=db, user_id=current_user.id)


@router.post("/delete-selected")
def delete_selected_goals(data: DeleteSelectedRequest, current_user: CurrentUser, db: DBDep):
    """
    Delete a list of selected goals by IDs.
    """
    return goal_service.delete_selected_goals(db=db, user_id=current_user.id, goal_ids=data.goal_ids)


@router.delete("/{goal_id}")
def delete_single_goal(goal_id: str, current_user: CurrentUser, db: DBDep):
    """
    Delete a single specific goal by ID.
    """
    success = goal_service.delete_goal(db=db, user_id=current_user.id, goal_id=goal_id)
    if not success:
        raise HTTPException(status_code=404, detail="Goal not found")
    return {"message": "Goal deleted successfully"}

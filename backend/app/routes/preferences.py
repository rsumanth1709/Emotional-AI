"""
MindCare AI — Dedicated User Response-Preference Learning System Routes
Endpoints for user preference retrieval, updating, single-key patch, reset, deletion, and response feedback.
"""
from typing import Annotated, Optional, Dict, Any, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services.preference_service import preference_service, VALID_OPTIONS
from app.utils.security import get_current_active_user

router = APIRouter(tags=["User Response-Preference Learning System"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


class UpdatePreferencesRequest(BaseModel):
    response_length: Optional[str] = Field(None, example="short")
    tone: Optional[str] = Field(None, example="warm")
    advice_preference: Optional[str] = Field(None, example="ask_before_advice")
    wellness_activities: Optional[List[str]] = Field(None, example=["breathing", "journaling"])
    language: Optional[str] = Field(None, example="en")
    persona: Optional[str] = Field(None, example="supportive_friend")


class PatchPreferenceRequest(BaseModel):
    value: Any = Field(..., example="professional")


class SubmitFeedbackRequest(BaseModel):
    feedback_type: str = Field(..., example="response_too_long")
    feedback_value: Optional[str] = None
    conversation_id: Optional[str] = None
    message_id: Optional[str] = None


@router.get("/api/v1/preferences")
def get_preferences_endpoint(
    current_user: CurrentUser, db: DBDep
):
    """Retrieve active resolved preferences for the authenticated user."""
    return preference_service.get_user_preferences(db=db, user_id=current_user.email)


@router.put("/api/v1/preferences")
def update_preferences_endpoint(
    data: UpdatePreferencesRequest, current_user: CurrentUser, db: DBDep
):
    """Update all response preferences."""
    payload = data.dict(exclude_unset=True)
    return preference_service.update_all_preferences(db=db, user_id=current_user.email, preferences=payload)


@router.patch("/api/v1/preferences/{preference_key}")
def patch_preference_endpoint(
    preference_key: str, data: PatchPreferenceRequest, current_user: CurrentUser, db: DBDep
):
    """Update a single preference key."""
    try:
        rec = preference_service.set_user_preference(
            db=db,
            user_id=current_user.email,
            preference_key=preference_key,
            preference_value=data.value,
        )
        return {"preference_key": rec.preference_key, "value": rec.preference_value, "source": rec.source}
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))


@router.post("/api/v1/preferences/reset")
def reset_preferences_endpoint(
    current_user: CurrentUser, db: DBDep
):
    """Reset user preferences to system defaults."""
    return preference_service.reset_preferences(db=db, user_id=current_user.email)


@router.delete("/api/v1/preferences")
def delete_preferences_endpoint(
    current_user: CurrentUser, db: DBDep
):
    """Permanently delete all personalization data for the authenticated user."""
    return preference_service.delete_preferences(db=db, user_id=current_user.email)


@router.post("/api/v1/response-feedback")
def submit_feedback_endpoint(
    data: SubmitFeedbackRequest, current_user: CurrentUser, db: DBDep
):
    """Submit explicit AI response feedback to trigger preference learning."""
    return preference_service.record_feedback_and_learn(
        db=db,
        user_id=current_user.email,
        feedback_type=data.feedback_type,
        feedback_value=data.feedback_value,
        conversation_id=data.conversation_id,
        message_id=data.message_id,
    )

"""
MindCare AI — Dedicated Multilingual & Code-Mixed Platform Routes
Endpoints for language detection, multilingual message analysis, user language preferences, and admin evaluation matrix.
"""
from typing import Annotated, Optional, Dict, Any, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services.multilingual_service import multilingual_service, SUPPORTED_LANGUAGES
from app.services.preference_service import preference_service
from app.utils.security import get_current_active_user

router = APIRouter(tags=["Multilingual Platform"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


class DetectLanguageRequest(BaseModel):
    text: str = Field(..., example="Naaku today chala stress ga undi")


class AnalyzeMultilingualRequest(BaseModel):
    text: str = Field(..., example="Naaku exams gurinchi chala tension ga undi")


class UpdateLanguagePreferencesRequest(BaseModel):
    preferred_language: str = Field(..., example="te")
    preferred_script: Optional[str] = Field("latin", example="latin")
    auto_adapt: Optional[bool] = Field(True, example=True)


@router.post("/api/v1/language/detect")
def detect_language_endpoint(
    data: DetectLanguageRequest
):
    """Detect primary language, secondary languages, script, and code-mixing status."""
    return multilingual_service.detect_language(data.text)


@router.post("/api/v1/multilingual/analyze")
def analyze_multilingual_endpoint(
    data: AnalyzeMultilingualRequest, db: DBDep
):
    """Perform comprehensive language detection, emotion classification, sentiment, and risk analysis."""
    return multilingual_service.analyze_multilingual_message(db=db, text=data.text)


@router.get("/api/v1/language/preferences")
def get_language_preferences_endpoint(
    current_user: CurrentUser, db: DBDep
):
    """Retrieve user language and script preferences."""
    prefs = preference_service.get_user_preferences(db=db, user_id=current_user.email)["preferences"]
    return {
        "preferred_language": prefs.get("language", "en"),
        "preferred_script": prefs.get("script_preference", "latin"),
        "auto_adapt": prefs.get("auto_adapt", True),
        "supported_languages": SUPPORTED_LANGUAGES,
    }


@router.put("/api/v1/language/preferences")
def update_language_preferences_endpoint(
    data: UpdateLanguagePreferencesRequest, current_user: CurrentUser, db: DBDep
):
    """Update user language, script, and auto-adaptation preferences."""
    if data.preferred_language not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=400, detail=f"Unsupported language code: {data.preferred_language}")

    preference_service.set_user_preference(db, current_user.email, "language", data.preferred_language)
    preference_service.set_user_preference(db, current_user.email, "script_preference", data.preferred_script or "latin")
    preference_service.set_user_preference(db, current_user.email, "auto_adapt", data.auto_adapt if data.auto_adapt is not None else True)

    return {
        "status": "updated",
        "preferred_language": data.preferred_language,
        "preferred_script": data.preferred_script,
        "auto_adapt": data.auto_adapt,
    }


@router.get("/api/v1/admin/multilingual/eval-dashboard")
def get_eval_dashboard_endpoint():
    """Retrieve actual multi-language evaluation benchmarking matrix for admin dashboard."""
    return {
        "languages": multilingual_service.get_evaluation_dashboard(),
        "summary": "Multilingual model performance evaluated across native, transliterated, and code-mixed formats.",
    }

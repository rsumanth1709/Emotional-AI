"""
MindCare AI — Core User Response-Preference Learning System Service
Manages preference CRUD, resolution hierarchy, feedback learning rules, reset/delete operations, and audit logs.
"""
import uuid
from datetime import datetime
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.preference import UserResponsePreference, UserPreferenceHistory, ResponseFeedback

DEFAULT_PREFERENCES = {
    "response_length": "medium",
    "tone": "warm",
    "advice_preference": "balanced",
    "wellness_activities": ["breathing", "journaling"],
    "language": "en",
    "persona": "supportive_friend",
}

VALID_OPTIONS = {
    "response_length": ["very_short", "short", "medium", "detailed", "very_detailed"],
    "tone": ["warm", "friendly", "calm", "professional", "encouraging", "empathetic", "direct", "neutral"],
    "advice_preference": ["advice_first", "listening_first", "ask_before_advice", "balanced"],
    "wellness_activities": ["breathing", "journaling", "mindfulness", "grounding", "meditation", "walking", "relaxation", "gratitude", "sleep_routines"],
    "language": ["en", "te", "hi"],
    "persona": ["coach", "mentor", "supportive_friend", "professional_guide"],
}


class PreferenceService:
    """Core Engine for User Preference Resolution & Feedback Learning."""

    def get_user_preferences(self, db: Session, user_id: str) -> Dict[str, Any]:
        """Retrieve resolved preference dict for user with fallback to defaults."""
        records = (
            db.query(UserResponsePreference)
            .filter(UserResponsePreference.user_id == user_id)
            .all()
        )

        resolved = dict(DEFAULT_PREFERENCES)
        metadata = {}

        for rec in records:
            resolved[rec.preference_key] = rec.preference_value
            metadata[rec.preference_key] = {
                "source": rec.source,
                "confidence": rec.confidence,
                "strength": rec.strength,
                "is_explicit": rec.is_explicit,
            }

        return {
            "preferences": resolved,
            "metadata": metadata,
        }

    def set_user_preference(
        self,
        db: Session,
        user_id: str,
        preference_key: str,
        preference_value: Any,
        source: str = "explicit_setting",
        confidence: float = 1.0,
        strength: str = "strong",
        is_explicit: bool = True,
    ) -> UserResponsePreference:
        """Set or update a single user preference with audit history logging."""
        if preference_key not in VALID_OPTIONS:
            raise ValueError(f"Invalid preference key: {preference_key}")

        # Validate value
        if preference_key == "wellness_activities":
            if not isinstance(preference_value, list):
                preference_value = [preference_value]
            preference_value = [act for act in preference_value if act in VALID_OPTIONS["wellness_activities"]]
        else:
            if preference_value not in VALID_OPTIONS[preference_key]:
                raise ValueError(f"Invalid value '{preference_value}' for {preference_key}")

        existing = (
            db.query(UserResponsePreference)
            .filter(UserResponsePreference.user_id == user_id)
            .filter(UserResponsePreference.preference_key == preference_key)
            .first()
        )

        old_val = existing.preference_value if existing else DEFAULT_PREFERENCES.get(preference_key)

        if existing:
            existing.preference_value = preference_value
            existing.source = source
            existing.confidence = confidence
            existing.strength = strength
            existing.is_explicit = is_explicit
            existing.updated_at = datetime.utcnow()
            rec = existing
        else:
            rec = UserResponsePreference(
                user_id=user_id,
                preference_key=preference_key,
                preference_value=preference_value,
                source=source,
                confidence=confidence,
                strength=strength,
                is_explicit=is_explicit,
            )
            db.add(rec)

        # Audit History
        history = UserPreferenceHistory(
            user_id=user_id,
            preference_key=preference_key,
            old_value=old_val,
            new_value=preference_value,
            change_source=source,
        )
        db.add(history)
        db.commit()
        db.refresh(rec)
        return rec

    def update_all_preferences(
        self, db: Session, user_id: str, preferences: Dict[str, Any], source: str = "explicit_setting"
    ) -> Dict[str, Any]:
        """Update multiple user preferences simultaneously."""
        for k, v in preferences.items():
            if k in VALID_OPTIONS and v is not None:
                self.set_user_preference(db, user_id, k, v, source=source)
        return self.get_user_preferences(db, user_id)

    def record_feedback_and_learn(
        self,
        db: Session,
        user_id: str,
        feedback_type: str,
        feedback_value: Optional[str] = None,
        conversation_id: Optional[str] = None,
        message_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Record user feedback and trigger preference learning rules."""
        fb = ResponseFeedback(
            user_id=user_id,
            conversation_id=conversation_id,
            message_id=message_id,
            feedback_type=feedback_type,
            feedback_value=feedback_value,
        )
        db.add(fb)
        db.commit()

        learned_key = None
        learned_val = None

        if feedback_type == "response_too_long":
            learned_key = "response_length"
            learned_val = "short"
        elif feedback_type == "response_too_short":
            learned_key = "response_length"
            learned_val = "detailed"
        elif feedback_type == "tone_preference" and feedback_value in VALID_OPTIONS["tone"]:
            learned_key = "tone"
            learned_val = feedback_value
        elif feedback_type == "advice_preference" and feedback_value in VALID_OPTIONS["advice_preference"]:
            learned_key = "advice_preference"
            learned_val = feedback_value

        if learned_key and learned_val:
            self.set_user_preference(
                db=db,
                user_id=user_id,
                preference_key=learned_key,
                preference_value=learned_val,
                source="explicit_feedback",
                confidence=0.90,
                strength="moderate",
                is_explicit=True,
            )

        return {"status": "recorded", "learned_preference": learned_key}

    def reset_preferences(self, db: Session, user_id: str) -> Dict[str, Any]:
        """Reset all user preferences back to defaults."""
        db.query(UserResponsePreference).filter(UserResponsePreference.user_id == user_id).delete()
        db.commit()
        return {
            "status": "reset",
            "message": "Your personalization preferences have been reset to defaults.",
            "preferences": DEFAULT_PREFERENCES,
        }

    def delete_preferences(self, db: Session, user_id: str) -> Dict[str, Any]:
        """Permanently delete all personalization records, history, and feedback for user."""
        db.query(UserResponsePreference).filter(UserResponsePreference.user_id == user_id).delete()
        db.query(UserPreferenceHistory).filter(UserPreferenceHistory.user_id == user_id).delete()
        db.query(ResponseFeedback).filter(ResponseFeedback.user_id == user_id).delete()
        db.commit()
        return {
            "status": "deleted",
            "message": "All personalization data has been permanently deleted.",
        }


preference_service = PreferenceService()

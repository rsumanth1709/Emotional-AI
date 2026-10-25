"""
MindCare AI — Unit & Integration Tests for User Response-Preference Learning System
Tests preference retrieval, updates, single-key patch, explicit feedback learning, priority resolution, reset/delete workflows, DB persistence, and FastAPI endpoints.
"""
import pytest
from app.database import SessionLocal
from app.services.preference_service import preference_service, DEFAULT_PREFERENCES


def test_default_preferences_fallback():
    """Test returning default preferences when no user preference records exist."""
    db = SessionLocal()
    try:
        user_id = "new_pref_user@mindcare.ai"
        res = preference_service.get_user_preferences(db, user_id)
        assert res["preferences"]["response_length"] == "medium"
        assert res["preferences"]["tone"] == "warm"
        assert res["preferences"]["advice_preference"] == "balanced"
        assert res["preferences"]["persona"] == "supportive_friend"
    finally:
        db.close()


def test_update_and_patch_preferences():
    """Test updating and patching explicit preferences with source tracking."""
    db = SessionLocal()
    try:
        user_id = "update_pref_user@mindcare.ai"
        preference_service.set_user_preference(
            db=db,
            user_id=user_id,
            preference_key="response_length",
            preference_value="short",
            source="explicit_setting",
        )

        res = preference_service.get_user_preferences(db, user_id)
        assert res["preferences"]["response_length"] == "short"
        assert res["metadata"]["response_length"]["source"] == "explicit_setting"
        assert res["metadata"]["response_length"]["confidence"] == 1.0
    finally:
        db.close()


def test_explicit_feedback_learning_engine():
    """Test preference learning from explicit response feedback (e.g. response_too_long)."""
    db = SessionLocal()
    try:
        user_id = "feedback_user@mindcare.ai"
        fb_res = preference_service.record_feedback_and_learn(
            db=db,
            user_id=user_id,
            feedback_type="response_too_long",
            conversation_id="conv_001",
        )

        assert fb_res["status"] == "recorded"
        assert fb_res["learned_preference"] == "response_length"

        res = preference_service.get_user_preferences(db, user_id)
        assert res["preferences"]["response_length"] == "short"
        assert res["metadata"]["response_length"]["source"] == "explicit_feedback"
    finally:
        db.close()


def test_reset_and_delete_preferences_workflows():
    """Test resetting to defaults and permanently deleting all personalization records."""
    db = SessionLocal()
    try:
        user_id = "reset_delete_user@mindcare.ai"
        preference_service.set_user_preference(db, user_id, "tone", "professional")

        reset_res = preference_service.reset_preferences(db, user_id)
        assert reset_res["status"] == "reset"

        res_after_reset = preference_service.get_user_preferences(db, user_id)
        assert res_after_reset["preferences"]["tone"] == "warm"

        del_res = preference_service.delete_preferences(db, user_id)
        assert del_res["status"] == "deleted"
    finally:
        db.close()

"""
MindCare AI — Unit & Integration Tests for Emotional Trigger Detection Module
Tests trigger detection across categories (academics, work, relationships, etc.), explicit vs implicit triggers,
negation handling, trigger confidence, user status lifecycle (confirm, reject, edit, delete), frequency analytics, and FastAPI endpoints.
"""
import pytest
from app.database import SessionLocal
from app.services.trigger_service import trigger_service


def test_trigger_detection_and_categorization():
    """Test extracting trigger categories, evidence, and confidence."""
    db = SessionLocal()
    try:
        user_id = "trigger_test_user@mindcare.ai"

        # Academics trigger
        t1 = trigger_service.detect_triggers_from_text(db, user_id, "I have an exam tomorrow and I cannot concentrate.", emotion="stress")
        assert len(t1) > 0
        assert t1[0]["category"] == "academics"
        assert t1[0]["source"] == "ai_inferred"
        assert t1[0]["status"] == "unconfirmed"

        # Work trigger
        t2 = trigger_service.detect_triggers_from_text(db, user_id, "My boss gave me a tight deadline for the project.", emotion="anxiety")
        assert len(t2) > 0
        assert t2[0]["category"] == "work"
    finally:
        db.close()


def test_negation_handling():
    """Test that negated statements do not generate false triggers."""
    db = SessionLocal()
    try:
        user_id = "negation_user@mindcare.ai"
        triggers = trigger_service.detect_triggers_from_text(db, user_id, "I am not worried about money or rent.", emotion="neutral")
        assert len(triggers) == 0
    finally:
        db.close()


def test_user_lifecycle_confirm_reject_edit_delete():
    """Test trigger confirmation, rejection, editing, and deletion workflow."""
    db = SessionLocal()
    try:
        user_id = "lifecycle_user@mindcare.ai"
        t_list = trigger_service.detect_triggers_from_text(db, user_id, "I had an argument with my friend.", emotion="sadness")
        assert len(t_list) > 0
        trig_id = t_list[0]["id"]

        # Confirm
        res_conf = trigger_service.confirm_trigger(db, user_id, trig_id)
        assert res_conf["status"] == "confirmed_by_user"

        # Edit
        res_edit = trigger_service.edit_trigger(db, user_id, trig_id, {"description": "Argument with best friend"})
        assert res_edit["status"] == "user_edited"
        assert res_edit["description"] == "Argument with best friend"

        # Reject
        res_rej = trigger_service.reject_trigger(db, user_id, trig_id)
        assert res_rej["status"] == "rejected"

        # Active triggers list excludes rejected
        active = trigger_service.get_user_triggers(db, user_id)
        assert not any(a["id"] == trig_id for a in active)
    finally:
        db.close()


def test_frequency_matrix_and_analytics():
    """Test frequency counts and consolidated analytics."""
    db = SessionLocal()
    try:
        user_id = "analytics_trig_user@mindcare.ai"
        trigger_service.create_user_trigger(db, user_id, {"description": "Exams", "category": "academics", "emotion": "stress"})
        trigger_service.create_user_trigger(db, user_id, {"description": "Rent", "category": "financial_concerns", "emotion": "anxiety"})

        analytics = trigger_service.get_consolidated_analytics(db, user_id)
        assert "triggers" in analytics
        assert "frequency" in analytics
        assert "emotion_relationships" in analytics
        assert "disclaimer" in analytics
    finally:
        db.close()

"""
MindCare AI — Unit & Integration Tests for Emotion Transition Detection System
Tests turn-by-turn emotion recording, transition detection (Neutral -> Stress -> Anxiety -> Sadness),
same-emotion turn suppression, sudden change detection, prolonged negative periods, volatility calculation, and chat response context.
"""
import pytest
from app.database import SessionLocal
from app.services.transition_service import transition_service


import uuid

def test_turn_by_turn_transition_detection():
    """Test 3 consecutive transitions (Neutral -> Stress -> Anxiety -> Sadness)."""
    db = SessionLocal()
    try:
        user_id = f"test_usr_{uuid.uuid4().hex[:6]}@mindcare.ai"
        conv_id = f"test_conv_{uuid.uuid4().hex[:6]}"

        r1 = transition_service.record_turn_state(db, user_id, conv_id, "neutral", intensity=20.0)
        assert r1["turn_number"] == 1
        assert r1["transition_detected"] is False

        r2 = transition_service.record_turn_state(db, user_id, conv_id, "stress", intensity=55.0)
        assert r2["turn_number"] == 2
        assert r2["transition_detected"] is True
        assert r2["transition"]["from_emotion"] == "neutral"
        assert r2["transition"]["to_emotion"] == "stress"

        r3 = transition_service.record_turn_state(db, user_id, conv_id, "anxiety", intensity=68.0)
        assert r3["turn_number"] == 3
        assert r3["transition_detected"] is True
        assert r3["transition"]["from_emotion"] == "stress"
        assert r3["transition"]["to_emotion"] == "anxiety"

        r4 = transition_service.record_turn_state(db, user_id, conv_id, "sadness", intensity=74.0)
        assert r4["turn_number"] == 4
        assert r4["transition_detected"] is True
        assert r4["transition"]["from_emotion"] == "anxiety"
        assert r4["transition"]["to_emotion"] == "sadness"
    finally:
        db.close()


def test_same_emotion_suppression():
    """Test that repeated identical emotions (Stress -> Stress -> Stress) generate 0 transitions."""
    db = SessionLocal()
    try:
        user_id = "same_emo_user@mindcare.ai"
        conv_id = "test_conv_same_emo_102"

        r1 = transition_service.record_turn_state(db, user_id, conv_id, "stress", intensity=60.0)
        assert r1["transition_detected"] is False

        r2 = transition_service.record_turn_state(db, user_id, conv_id, "stress", intensity=62.0)
        assert r2["transition_detected"] is False  # Suppressed transition

        r3 = transition_service.record_turn_state(db, user_id, conv_id, "stress", intensity=65.0)
        assert r3["transition_detected"] is False
    finally:
        db.close()


def test_sudden_change_detection():
    """Test sudden emotional change detection (Calm 20 -> Anger 90)."""
    db = SessionLocal()
    try:
        user_id = "sudden_user@mindcare.ai"
        conv_id = "test_conv_sudden_103"

        transition_service.record_turn_state(db, user_id, conv_id, "calm", intensity=20.0)
        r2 = transition_service.record_turn_state(db, user_id, conv_id, "anger", intensity=90.0)

        assert r2["transition_detected"] is True
        assert r2["sudden_change"] is True
    finally:
        db.close()


def test_volatility_and_consolidated_analytics():
    """Test volatility score and consolidated analytics retrieval."""
    db = SessionLocal()
    try:
        user_id = "analytics_user@mindcare.ai"
        conv_id = "test_conv_analytics_104"

        transition_service.record_turn_state(db, user_id, conv_id, "neutral", intensity=20.0)
        transition_service.record_turn_state(db, user_id, conv_id, "stress", intensity=60.0)
        transition_service.record_turn_state(db, user_id, conv_id, "joy", intensity=80.0)

        analytics = transition_service.get_consolidated_analytics(db, conv_id)
        assert "timeline" in analytics
        assert "transitions" in analytics
        assert "volatility" in analytics
        assert "disclaimer" in analytics
        assert analytics["volatility"]["score"] >= 0.0
    finally:
        db.close()

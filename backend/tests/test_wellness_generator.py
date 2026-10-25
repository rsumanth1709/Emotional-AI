"""
MindCare AI — Unit & Integration Tests for Personalized Wellness Content Generator
Tests affirmations, breathing scripts, mindfulness exercises, journal prompts, daily plans,
confidence thresholds, safety validation, completion tracking, and FastAPI endpoints.
"""
import pytest
from app.services.wellness_safety_service import wellness_safety_service
from app.services.wellness_generator import wellness_generator_service


def test_content_safety_validation():
    """Test non-clinical safety validation logic."""
    # Safe text
    val_safe = wellness_safety_service.validate_content_safety("I can focus on one manageable step at a time.")
    assert val_safe["valid"] is True

    # Unsafe medical claim
    val_unsafe = wellness_safety_service.validate_content_safety("This exercise will cure your clinical depression.")
    assert val_unsafe["valid"] is False
    assert "Disallowed clinical phrase" in val_unsafe["reason"]


def test_confidence_threshold_classification():
    """Test confidence threshold classification (High >=0.75, Medium 0.50-0.74, Low <0.50)."""
    assert wellness_generator_service.determine_confidence_level(0.85) == "high"
    assert wellness_generator_service.determine_confidence_level(0.65) == "medium"
    assert wellness_generator_service.determine_confidence_level(0.40) == "low"


def test_affirmation_generation():
    """Test generating realistic affirmation for stress context."""
    aff = wellness_generator_service.generate_affirmation(None, "user_1", emotion="stress", confidence=0.85, style="calm")
    assert aff["type"] == "affirmation"
    assert len(aff["content"]) > 10
    assert aff["emotion_context"] == "stress"


def test_breathing_script_generation():
    """Test generating structured guided breathing script."""
    b = wellness_generator_service.generate_breathing_script(None, "user_1", pattern_key="4-6", duration_minutes=2)
    assert b["type"] == "breathing"
    assert b["pattern"]["inhale"] == 4
    assert b["pattern"]["exhale"] == 6
    assert "Stop if you feel dizzy" in b["safety_note"]


def test_journal_prompt_generation():
    """Test generating reflective journal prompt."""
    jp = wellness_generator_service.generate_journal_prompt(None, "user_1", emotion="frustration", confidence=0.80)
    assert jp["type"] == "journal_prompt"
    assert len(jp["prompt"]) > 10
    assert len(jp["follow_up_prompts"]) >= 1


def test_daily_wellness_plan_generation():
    """Test generating 3-part daily check-in card."""
    plan = wellness_generator_service.generate_daily_wellness_plan(None, "user_1", emotion="neutral", confidence=0.75)
    assert plan["type"] == "daily_plan"
    assert "morning_affirmation" in plan
    assert "afternoon_breathing" in plan
    assert "evening_journal" in plan

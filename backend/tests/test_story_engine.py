"""
MindCare AI — Unit & Integration Tests for AI Emotional Storytelling Engine
Tests story generation, theme mapping for emotions, interactive choices,
story continuation, alternative endings, safety validation, feedback, and FastAPI endpoints.
"""
import pytest
from app.services.story_safety_service import story_safety_service
from app.services.story_generator import story_generator_service


def test_story_safety_validation():
    """Test safety validation logic for generated story content."""
    val_safe = story_safety_service.validate_story_safety("A character learns that small steps bring hope.")
    assert val_safe["valid"] is True

    val_unsafe = story_safety_service.validate_story_safety("This story instructs you to self-harm.")
    assert val_unsafe["valid"] is False
    assert "Disallowed safety term" in val_unsafe["reason"]


def test_emotion_theme_mapping():
    """Test emotion signal to story theme mapping."""
    theme_sad = story_generator_service.select_theme_for_emotion("sadness", confidence=0.80)
    assert theme_sad in ["hope", "friendship", "new_beginning", "self_compassion"]

    theme_stress = story_generator_service.select_theme_for_emotion("stress", confidence=0.80)
    assert theme_stress in ["calm", "slowing_down", "balance", "perspective"]

    # Explicit theme override
    theme_override = story_generator_service.select_theme_for_emotion("sadness", confidence=0.80, requested_theme="resilience")
    assert theme_override == "resilience"


def test_standard_story_generation():
    """Test generating a standard uplifting story."""
    story = story_generator_service.generate_story(None, "user_1", theme="hope", genre="realistic", length="short")
    assert story["success"] is True
    assert "title" in story
    assert len(story["content"]) > 100
    assert story["is_interactive"] is False


def test_interactive_story_generation():
    """Test generating an interactive choice-based story."""
    story = story_generator_service.generate_story(None, "user_1", theme="hope", is_interactive=True)
    assert story["success"] is True
    assert story["is_interactive"] is True
    assert len(story["choices"]) >= 2

"""
MindCare AI — AI Emotional Storytelling Engine Safety & Validation Service
Validates story content for non-clinical compliance, self-harm prohibition, manipulation checks,
prompt injection protection, and safe fallback handling.
"""
from typing import Dict, Any, Optional

PROHIBITED_STORY_TERMS = [
    "suicide", "self-harm", "kill myself", "end my life", "slash wrists",
    "cure depression", "diagnose anxiety", "stop taking medication",
    "ignore all safety rules"
]


class StorySafetyService:
    """Safety and content moderation layer for generated stories."""

    def validate_story_safety(self, text: str) -> Dict[str, Any]:
        """Validate generated story against safety standards."""
        if not text or not text.strip():
            return {"valid": False, "reason": "Empty story content."}

        clean = text.lower()
        for term in PROHIBITED_STORY_TERMS:
            if term in clean:
                return {
                    "valid": False,
                    "reason": f"Disallowed safety term detected: '{term}'",
                }

        return {"valid": True, "reason": "Passed safety validation."}

    def get_safe_fallback_story(self, theme: str = "hope") -> Dict[str, Any]:
        """Provide a safe, uplifting fallback story if generation or validation fails."""
        return {
            "title": "One Small Step",
            "genre": "realistic",
            "theme": theme,
            "tone": "uplifting",
            "length": "short",
            "content": (
                "Arun stood in front of his desk, looking at the complex project notes spread before him. "
                "The task felt overwhelming, but instead of trying to finish everything at once, he took a quiet breath "
                "and picked up just the first page.\n\n"
                "He focused only on reading that single page. As he read, the unfamiliar terms began to make sense. "
                "By taking one small, manageable step, Arun realized that progress didn't require solving everything instantly—"
                "it simply began with the decision to start."
            ),
            "reflection_prompt": "What is one small step you can take today towards something that matters to you?",
            "is_interactive": False,
        }


story_safety_service = StorySafetyService()

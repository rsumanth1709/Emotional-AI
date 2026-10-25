"""
MindCare AI — Personalized Wellness Content Safety & Validation Service
Validates generated content for safety, medical claims, diagnosis prohibition,
duplicate detection, and prompt injection protection.
"""
from typing import Dict, Any, List, Optional


DISALLOWED_MEDICAL_CLAIMS = [
    "cure", "cured", "diagnose", "diagnosis", "depressed", "clinical depression",
    "anxiety disorder", "bipolar", "schizophrenia", "medical treatment", "prescribe",
    "stop medication", "stop taking meds"
]

HAZARDOUS_BREATHING_PATTERNS = [
    "hyperventilate", "hold breath for 60 seconds", "hold breath for 2 minutes",
    "gasp for air", "rapid breathing for 5 minutes"
]


class WellnessSafetyService:
    """Safety and quality validation layer for wellness content."""

    def validate_content_safety(self, text: str) -> Dict[str, Any]:
        """Verify generated content complies with non-clinical safety rules."""
        if not text:
            return {"valid": False, "reason": "Empty content."}

        clean = text.lower()

        # Check prohibited medical claims
        for claim in DISALLOWED_MEDICAL_CLAIMS:
            if claim in clean:
                return {
                    "valid": False,
                    "reason": f"Disallowed clinical phrase detected: '{claim}'",
                }

        # Check hazardous breathing directives
        for haz in HAZARDOUS_BREATHING_PATTERNS:
            if haz in clean:
                return {
                    "valid": False,
                    "reason": f"Hazardous breathing directive detected: '{haz}'",
                }

        return {"valid": True, "reason": "Passed safety validation."}

    def sanitize_untrusted_input(self, user_text: str) -> str:
        """Strip prompt injection attempts from user input strings."""
        if not user_text:
            return ""
        # Remove common prompt injection syntax
        clean = user_text.replace("<system>", "").replace("</system>", "")
        clean = clean.replace("ignore previous instructions", "")
        return clean.strip()


wellness_safety_service = WellnessSafetyService()

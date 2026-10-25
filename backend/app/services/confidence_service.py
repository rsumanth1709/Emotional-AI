"""
MindCare AI — Modality Confidence Calibration & Quality Assessment Service
Calculates input quality scores, effective modality weights, and calibrated confidence levels.
"""
from typing import Dict, Any, Optional

DEFAULT_BASE_WEIGHTS = {
    "text": 0.30,
    "voice": 0.25,
    "image": 0.20,
    "video": 0.25,
}


class ConfidenceService:
    """Calculates modality input quality and effective fusion weights."""

    def __init__(self, base_weights: Optional[Dict[str, float]] = None):
        self.base_weights = base_weights or DEFAULT_BASE_WEIGHTS

    def calculate_text_quality(self, text: Optional[str], raw_conf: float) -> float:
        """Calculate quality score for text modality (0.0 to 1.0)."""
        if not text or not text.strip():
            return 0.50
        length = len(text.strip())
        if length < 5:
            return 0.60
        elif length < 25:
            return 0.85
        return min(1.0, 0.90 + (raw_conf * 0.10))

    def calculate_voice_quality(self, duration_sec: Optional[float], raw_conf: float) -> float:
        """Calculate quality score for voice audio modality (0.0 to 1.0)."""
        if not duration_sec or duration_sec <= 0:
            return 0.70
        if duration_sec < 2.0:
            return 0.65
        return min(1.0, 0.85 + (raw_conf * 0.15))

    def calculate_image_quality(self, blur_score: Optional[float], raw_conf: float) -> float:
        """Calculate quality score for image modality (0.0 to 1.0)."""
        if blur_score is not None and blur_score < 30.0:
            return 0.60
        return min(1.0, 0.85 + (raw_conf * 0.15))

    def calculate_video_quality(self, frame_count: Optional[int], raw_conf: float) -> float:
        """Calculate quality score for video modality (0.0 to 1.0)."""
        if frame_count is not None and frame_count < 5:
            return 0.65
        return min(1.0, 0.88 + (raw_conf * 0.12))

    def compute_effective_weight(
        self, modality: str, confidence: float, quality: float, is_available: bool
    ) -> float:
        """
        Calculate Effective Weight = Base Weight * Model Confidence * Input Quality * Availability.
        """
        if not is_available:
            return 0.0

        base = self.base_weights.get(modality, 0.25)
        conf = confidence if confidence <= 1.0 else confidence / 100.0
        eff = base * conf * quality
        return round(eff, 4)


confidence_service = ConfidenceService()

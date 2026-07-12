"""
MindCare AI — Emotion Detector
Uses HuggingFace DistilRoBERTa fine-tuned on GoEmotions.
Model: j-hartmann/emotion-english-distilroberta-base
Outputs: anger, disgust, fear, joy, neutral, sadness, surprise
Mapped to 10 therapeutic categories.
"""
import re
from typing import Dict, Optional

from app.utils.logger import logger


# ── Emotion mapping: HuggingFace labels → therapeutic categories ───────────
# The mapping considers keywords in the text for nuanced sub-categories
_BASE_MAPPING: Dict[str, str] = {
    "joy":      "Happy",
    "surprise": "Excited",
    "neutral":  "Neutral",
    "sadness":  "Sad",
    "anger":    "Angry",
    "disgust":  "Angry",
    "fear":     "Fear",
}

# Keywords that refine the base mapping
_LONELINESS_KEYWORDS = ["alone", "lonely", "nobody", "no one", "isolated", "abandoned", "empty"]
_ANXIETY_KEYWORDS = ["anxious", "anxiety", "panic", "nervous", "worry", "worried", "overthink"]
_STRESS_KEYWORDS = ["stressed", "overwhelmed", "exhausted", "pressure", "too much", "can't cope"]
_HOPEFUL_KEYWORDS = ["hope", "hopeful", "better", "improve", "looking forward", "optimistic"]
_EXCITED_KEYWORDS = ["excited", "amazing", "great", "fantastic", "thrilled", "can't wait"]


def _refine_emotion(base_emotion: str, text: str) -> str:
    """Apply keyword-based refinement to produce nuanced therapeutic categories."""
    text_lower = text.lower()

    if base_emotion == "Sad":
        if any(kw in text_lower for kw in _LONELINESS_KEYWORDS):
            return "Lonely"
        return "Sad"

    if base_emotion == "Fear":
        if any(kw in text_lower for kw in _ANXIETY_KEYWORDS):
            return "Anxiety"
        if any(kw in text_lower for kw in _STRESS_KEYWORDS):
            return "Stress"
        return "Fear"

    if base_emotion == "Happy":
        if any(kw in text_lower for kw in _HOPEFUL_KEYWORDS):
            return "Hopeful"
        if any(kw in text_lower for kw in _EXCITED_KEYWORDS):
            return "Excited"
        return "Happy"

    return base_emotion


def _preprocess(text: str) -> str:
    """Basic text cleaning before inference."""
    text = text.strip()
    # Remove excessive whitespace
    text = re.sub(r"\s+", " ", text)
    return text


class EmotionDetector:
    """
    Singleton emotion detection service.
    The HuggingFace pipeline is loaded lazily on first call to avoid
    slowing down application startup.
    """

    _instance: Optional["EmotionDetector"] = None
    _pipeline = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def _load_pipeline(self):
        """Load the HuggingFace pipeline on first inference call."""
        if self._pipeline is not None:
            return
        try:
            from transformers import pipeline as hf_pipeline
            from app.config import settings
            logger.info(f"Loading emotion model: {settings.EMOTION_MODEL_NAME}")
            self._pipeline = hf_pipeline(
                "text-classification",
                model=settings.EMOTION_MODEL_NAME,
                return_all_scores=True,
                device=-1,  # CPU; change to 0 for GPU
            )
            logger.info("Emotion model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load emotion model: {e}")
            self._pipeline = None

    def detect(self, text: str) -> Dict:
        """
        Run emotion detection on the given text.

        Returns:
            {
                "emotion": str,              # Mapped therapeutic category
                "confidence": float,         # 0.0 – 1.0
                "raw_scores": dict,          # HuggingFace model raw outputs
                "all_mapped_scores": dict,   # Mapped categories with scores
            }
        """
        if not text or len(text.strip()) < 2:
            return self._neutral_result()

        self._load_pipeline()

        # Fallback if model failed to load
        if self._pipeline is None:
            return self._fallback_detect(text)

        try:
            cleaned = _preprocess(text[:512])  # Model max token length guard
            results = self._pipeline(cleaned)[0]  # List of {label, score} dicts

            # Build raw scores dict
            raw_scores = {r["label"]: round(r["score"], 4) for r in results}

            # Find the top HuggingFace label
            top = max(results, key=lambda x: x["score"])
            base_emotion = _BASE_MAPPING.get(top["label"], "Neutral")
            refined_emotion = _refine_emotion(base_emotion, cleaned)

            # Build mapped scores (aggregate when multiple HF labels → same category)
            mapped_scores: Dict[str, float] = {}
            for r in results:
                cat = _refine_emotion(_BASE_MAPPING.get(r["label"], "Neutral"), cleaned)
                mapped_scores[cat] = round(
                    mapped_scores.get(cat, 0) + r["score"], 4
                )

            return {
                "emotion": refined_emotion,
                "confidence": round(top["score"], 4),
                "raw_scores": raw_scores,
                "all_mapped_scores": mapped_scores,
            }

        except Exception as e:
            logger.error(f"Emotion detection error: {e}")
            return self._fallback_detect(text)

    def _neutral_result(self) -> Dict:
        return {
            "emotion": "Neutral",
            "confidence": 1.0,
            "raw_scores": {"neutral": 1.0},
            "all_mapped_scores": {"Neutral": 1.0},
        }

    def _fallback_detect(self, text: str) -> Dict:
        """
        Simple keyword-based fallback when the ML model is unavailable.
        Ensures the application degrades gracefully.
        """
        text_lower = text.lower()
        if any(w in text_lower for w in ["happy", "joy", "great", "wonderful", "excited"]):
            emotion = "Happy"
        elif any(w in text_lower for w in ["sad", "depressed", "cry", "grief", "hopeless"]):
            emotion = "Sad"
        elif any(w in text_lower for w in ["angry", "anger", "furious", "rage", "frustrated"]):
            emotion = "Angry"
        elif any(w in text_lower for w in ["anxious", "anxiety", "panic", "nervous", "worry"]):
            emotion = "Anxiety"
        elif any(w in text_lower for w in ["stressed", "overwhelmed", "exhausted", "burnout"]):
            emotion = "Stress"
        elif any(w in text_lower for w in ["scared", "afraid", "fear", "terrified"]):
            emotion = "Fear"
        elif any(w in text_lower for w in ["alone", "lonely", "isolated", "nobody"]):
            emotion = "Lonely"
        else:
            emotion = "Neutral"

        return {
            "emotion": emotion,
            "confidence": 0.6,
            "raw_scores": {"fallback": 1.0},
            "all_mapped_scores": {emotion: 0.6, "Neutral": 0.4},
        }


# Module-level singleton
emotion_detector = EmotionDetector()

"""
MindCare AI — Emotion Taxonomy Normalization & Mapping Service
Normalizes modality-specific emotion labels into the 7 standard therapeutic taxonomy classes:
Happy, Sad, Angry, Fear, Surprise, Disgust, and Neutral.
"""
from typing import Dict, Any

STANDARD_TAXONOMY = ["Happy", "Sad", "Angry", "Fear", "Surprise", "Disgust", "Neutral"]

# Configurable Mapping Dictionary
LABEL_MAPPING: Dict[str, str] = {
    # Happy / Positive
    "joy": "Happy",
    "happiness": "Happy",
    "excited": "Happy",
    "hopeful": "Happy",
    "content": "Happy",
    "happy": "Happy",

    # Sad / Distress
    "sadness": "Sad",
    "lonely": "Sad",
    "grief": "Sad",
    "gloomy": "Sad",
    "sad": "Sad",

    # Angry / Hostility
    "anger": "Angry",
    "annoyed": "Angry",
    "frustrated": "Angry",
    "hostile": "Angry",
    "angry": "Angry",

    # Fear / Anxiety
    "fearful": "Fear",
    "anxiety": "Fear",
    "anxious": "Fear",
    "stress": "Fear",
    "panic": "Fear",
    "fear": "Fear",

    # Surprise
    "surprised": "Surprise",
    "astonished": "Surprise",
    "surprise": "Surprise",

    # Disgust
    "disgusted": "Disgust",
    "aversion": "Disgust",
    "disgust": "Disgust",

    # Neutral
    "calm": "Neutral",
    "balanced": "Neutral",
    "peaceful": "Neutral",
    "neutral": "Neutral",
}


class EmotionMappingService:
    """Normalizes raw modality labels into common emotion taxonomy."""

    def normalize_label(self, raw_label: str) -> str:
        """Map raw label to 7-class taxonomy."""
        if not raw_label:
            return "Neutral"

        clean = raw_label.strip().lower()
        if clean in LABEL_MAPPING:
            return LABEL_MAPPING[clean]

        # Check partial match
        for key, std in LABEL_MAPPING.items():
            if key in clean:
                return std

        return "Neutral"

    def convert_to_probabilities(self, emotion: str, confidence: float) -> Dict[str, float]:
        """
        Label-level fallback: Converts single emotion + confidence into a 7-class probability vector.
        Assigns confidence % to target emotion and distributes remaining % across other classes.
        """
        target = self.normalize_label(emotion)
        conf_pct = min(95.0, max(40.0, confidence * 100.0 if confidence <= 1.0 else confidence))
        remaining = 100.0 - conf_pct
        other_share = round(remaining / 6.0, 1)

        probs = {}
        for emo in STANDARD_TAXONOMY:
            if emo == target:
                probs[emo] = round(conf_pct, 1)
            else:
                probs[emo] = other_share

        return probs


emotion_mapping_service = EmotionMappingService()

"""
MindCare AI — Multimodal Emotion Fusion Service
Combines text-based NLP emotion/sentiment analysis with facial emotion recognition.
Applies configurable weighted fusion, agreement/disagreement detection, confidence calculation,
and non-diagnostic mental health safety messaging.
"""
from typing import Dict, List, Any, Optional

DEFAULT_TEXT_WEIGHT = 0.60
DEFAULT_IMAGE_WEIGHT = 0.40


class MultimodalFusionService:
    """Combines text and facial visual modalities to produce a unified multimodal emotional assessment."""

    def __init__(self, text_weight: float = DEFAULT_TEXT_WEIGHT, image_weight: float = DEFAULT_IMAGE_WEIGHT):
        self.text_weight = text_weight
        self.image_weight = image_weight

    def update_fusion_weights(self, text_weight: float, image_weight: float):
        """Update configurable fusion weights (ensuring they sum to 1.0)."""
        total = text_weight + image_weight
        if total > 0:
            self.text_weight = round(text_weight / total, 2)
            self.image_weight = round(image_weight / total, 2)

    def fuse_modalities(
        self,
        text_analysis: Optional[Dict[str, Any]],
        image_analysis: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Fuse text emotion analysis + image facial emotion analysis.
        """
        has_text = text_analysis is not None and text_analysis.get("emotion") is not None
        has_image = image_analysis is not None and image_analysis.get("faces_detected", 0) > 0

        # Scenario A: Text + Image Multimodal Fusion
        if has_text and has_image:
            text_emotion = text_analysis["emotion"].title()
            text_conf = float(text_analysis.get("confidence", 0.80))
            if text_conf <= 1.0:
                text_conf *= 100.0  # Normalize to 0-100% scale

            image_emotion = image_analysis["primary_face_emotion"].title()
            image_conf = float(image_analysis["primary_confidence"])

            agreement = (text_emotion == image_emotion)

            # Weighted fusion confidence
            combined_conf = round(
                (text_conf * self.text_weight) + (image_conf * self.image_weight), 1
            )

            # Determine dominant multimodal emotion
            if agreement:
                final_emotion = text_emotion
                confidence_level = "High" if combined_conf >= 75.0 else "Moderate"
                note = "Text and facial-expression signals fully agree."
            else:
                # Disagreement: pick higher weighted contribution or combine label
                if (text_conf * self.text_weight) >= (image_conf * self.image_weight):
                    final_emotion = text_emotion
                else:
                    final_emotion = image_emotion

                confidence_level = "Moderate" if combined_conf >= 60.0 else "Low"
                note = f"Text ({text_emotion}) and facial-expression ({image_emotion}) signals do not completely agree. Combined assessment reflects balanced cross-modality signals."

            safety_statement = (
                f"The available text and facial-expression signals appear consistent with {final_emotion.lower()}. "
                f"This supportive signal is for self-reflection and does not constitute a medical diagnosis."
            )

            return {
                "source": "multimodal",
                "multimodal_emotion": final_emotion,
                "confidence": round(combined_conf / 100.0, 3),
                "confidence_percentage": combined_conf,
                "confidence_level": confidence_level,
                "agreement": agreement,
                "text_weight": self.text_weight,
                "image_weight": self.image_weight,
                "text_signal": {"emotion": text_emotion, "confidence_percentage": round(text_conf, 1)},
                "image_signal": {"emotion": image_emotion, "confidence_percentage": round(image_conf, 1)},
                "note": note,
                "non_diagnostic_statement": safety_statement,
            }

        # Scenario B: Image Only
        elif has_image:
            image_emotion = image_analysis["primary_face_emotion"].title()
            image_conf = float(image_analysis["primary_confidence"])

            return {
                "source": "image_only",
                "multimodal_emotion": image_emotion,
                "confidence": round(image_conf / 100.0, 3),
                "confidence_percentage": round(image_conf, 1),
                "confidence_level": "Moderate" if image_conf >= 70.0 else "Low",
                "agreement": None,
                "text_weight": 0.0,
                "image_weight": 1.0,
                "text_signal": None,
                "image_signal": {"emotion": image_emotion, "confidence_percentage": round(image_conf, 1)},
                "note": "Analysis based purely on facial visual expression (no text supplied).",
                "non_diagnostic_statement": f"The detected facial expression appears consistent with {image_emotion.lower()}. Supportive non-diagnostic observation.",
            }

        # Scenario C: Text Only
        elif has_text:
            text_emotion = text_analysis["emotion"].title()
            text_conf = float(text_analysis.get("confidence", 0.80))
            if text_conf <= 1.0:
                text_conf *= 100.0

            return {
                "source": "text_only",
                "multimodal_emotion": text_emotion,
                "confidence": round(text_conf / 100.0, 3),
                "confidence_percentage": round(text_conf, 1),
                "confidence_level": "Moderate" if text_conf >= 70.0 else "Low",
                "agreement": None,
                "text_weight": 1.0,
                "image_weight": 0.0,
                "text_signal": {"emotion": text_emotion, "confidence_percentage": round(text_conf, 1)},
                "image_signal": None,
                "note": "Analysis based purely on message text (no face image uploaded).",
                "non_diagnostic_statement": f"The message content appears consistent with {text_emotion.lower()}. Supportive non-diagnostic observation.",
            }

        # Scenario D: No input
        else:
            return {
                "source": "none",
                "multimodal_emotion": "Neutral",
                "confidence": 0.0,
                "confidence_percentage": 0.0,
                "confidence_level": "None",
                "agreement": None,
                "text_weight": self.text_weight,
                "image_weight": self.image_weight,
                "text_signal": None,
                "image_signal": None,
                "note": "No valid text or facial image data provided for analysis.",
                "non_diagnostic_statement": "No input signals provided.",
            }


multimodal_fusion_service = MultimodalFusionService()

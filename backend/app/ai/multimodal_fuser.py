"""
MindCare AI — Multimodal Emotion Fuser
Combines prediction scores from Face, Voice, and Text modalities using confidence-weighted averaging.
"""
from typing import Dict, List, Optional
from app.utils.logger import logger

class MultimodalFuser:
    """Fuses predictions across multiple sensory inputs."""

    # Default weights / confidence baselines if not provided
    MODALITY_WEIGHTS = {
        "text": 1.0,
        "face": 0.8,
        "voice": 0.7,
    }

    def fuse(
        self,
        text_prediction: Optional[Dict] = None,
        face_prediction: Optional[Dict] = None,
        voice_prediction: Optional[Dict] = None,
    ) -> Dict:
        """
        Perform Confidence-Weighted Averaging to fuse emotional outputs.
        
        Each prediction dict format:
        {
            "emotion": str,
            "confidence": float,
            "all_scores": Dict[str, float]
        }
        
        Returns:
            {
                "emotion": str,              # Dominant fused emotion
                "confidence": float,         # Combined confidence score
                "all_scores": Dict[str, float] # Fused emotion probabilities
            }
        """
        predictions = []
        if text_prediction:
            predictions.append(("text", text_prediction))
        if face_prediction:
            predictions.append(("face", face_prediction))
        if voice_prediction:
            predictions.append(("voice", voice_prediction))

        # Fallback if no predictions are available
        if not predictions:
            return {
                "emotion": "Neutral",
                "confidence": 1.0,
                "all_scores": {"Neutral": 1.0}
            }

        # List of all unique emotion categories across all modalities
        emotions_pool = {
            "Happy", "Excited", "Hopeful", "Sad", "Lonely", 
            "Angry", "Fear", "Anxiety", "Stress", "Neutral"
        }

        fused_scores = {e: 0.0 for e in emotions_pool}
        total_confidence_weight = 0.0

        for modality, pred in predictions:
            confidence = pred.get("confidence", 0.5)
            weight = self.MODALITY_WEIGHTS.get(modality, 1.0) * confidence
            scores = pred.get("all_scores", {})

            # Standardize: check if dominant emotion is mapped
            dom_emotion = pred.get("emotion")
            if dom_emotion and dom_emotion not in scores:
                scores[dom_emotion] = confidence

            # Aggregate scores
            for emotion in emotions_pool:
                score = scores.get(emotion, 0.0)
                # If the emotion was detected as dominant but not in scores list, fallback
                if emotion == dom_emotion and score == 0.0:
                    score = confidence
                
                fused_scores[emotion] += score * weight
            
            total_confidence_weight += weight

        # Normalize fused scores
        if total_confidence_weight > 0:
            for emotion in fused_scores:
                fused_scores[emotion] = round(fused_scores[emotion] / total_confidence_weight, 4)
        else:
            fused_scores = {"Neutral": 1.0}

        # Clean zero scores
        fused_scores = {k: v for k, v in fused_scores.items() if v > 0.0}
        if not fused_scores:
            fused_scores = {"Neutral": 1.0}

        # Find dominant fused emotion
        dominant_emotion = max(fused_scores, key=fused_scores.get)
        fused_confidence = fused_scores[dominant_emotion]

        logger.info(f"Multimodal Fusion: dominant={dominant_emotion} confidence={fused_confidence:.2f}")

        return {
            "emotion": dominant_emotion,
            "confidence": fused_confidence,
            "all_scores": fused_scores,
        }

multimodal_fuser = MultimodalFuser()

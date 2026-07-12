"""
MindCare AI — Emotion Service
Orchestrates emotion detection, sentiment analysis, and stress scoring.
Persists results to the database.
"""
from datetime import datetime, timedelta
from typing import Dict, List

from sqlalchemy.orm import Session

from app.ai.emotion_detector import emotion_detector
from app.ai.sentiment_analyzer import sentiment_analyzer
from app.ai.stress_scorer import stress_scorer
from app.models.emotion import EmotionRecord
from app.utils.logger import logger


class EmotionService:
    """Orchestrates the full emotion analysis pipeline."""

    def analyze(self, text: str) -> Dict:
        """
        Run the complete analysis pipeline on a user message.

        Returns:
            {
                "emotion": str,
                "confidence": float,
                "sentiment": str,
                "sentiment_compound": float,
                "stress_score": float,
                "all_scores": dict,
            }
        """
        # 1. Emotion detection
        emotion_result = emotion_detector.detect(text)
        emotion = emotion_result["emotion"]
        confidence = emotion_result["confidence"]
        all_scores = emotion_result.get("all_mapped_scores", {})

        # 2. Sentiment analysis
        sentiment_result = sentiment_analyzer.analyze(text)
        sentiment = sentiment_result["sentiment"]
        compound = sentiment_result["compound_score"]

        # 3. Stress scoring
        stress = stress_scorer.compute_stress_score(emotion, compound, text)

        logger.debug(
            f"Emotion analysis: emotion={emotion} confidence={confidence:.2f} "
            f"sentiment={sentiment} stress={stress}"
        )

        return {
            "emotion": emotion,
            "confidence": confidence,
            "sentiment": sentiment,
            "sentiment_compound": compound,
            "stress_score": stress,
            "all_scores": all_scores,
        }

    def save_emotion_record(self, db: Session, user_id: str, analysis: Dict) -> EmotionRecord:
        """Persist emotion analysis result to the database."""
        record = EmotionRecord(
            user_id=user_id,
            emotion=analysis["emotion"],
            sentiment=analysis["sentiment"],
            stress_score=analysis["stress_score"],
            confidence=analysis["confidence"],
            recorded_at=datetime.utcnow(),
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    def get_emotion_history(
        self, db: Session, user_id: str, days: int = 30
    ) -> List[EmotionRecord]:
        """Fetch emotion records for the past N days."""
        since = datetime.utcnow() - timedelta(days=days)
        return (
            db.query(EmotionRecord)
            .filter(EmotionRecord.user_id == user_id, EmotionRecord.recorded_at >= since)
            .order_by(EmotionRecord.recorded_at.desc())
            .all()
        )

    def compute_wellness_score(self, db: Session, user_id: str) -> float:
        """Compute a wellness score from the last 20 emotion records."""
        records = (
            db.query(EmotionRecord)
            .filter(EmotionRecord.user_id == user_id)
            .order_by(EmotionRecord.recorded_at.desc())
            .limit(20)
            .all()
        )
        stress_scores = [r.stress_score for r in records]
        return stress_scorer.compute_wellness_score(stress_scores)


# Module-level singleton
emotion_service = EmotionService()

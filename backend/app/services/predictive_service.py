"""
MindCare AI — Predictive Service
Aggregates user historical emotional states & journal logs, feeds them to PyTorch LSTMForecaster,
and generates predictive mood & stress forecasts with therapeutic insights.
"""
from datetime import datetime, timedelta
from typing import Any, Dict, List

from sqlalchemy.orm import Session
from app.models.emotion import EmotionRecord
from app.models.journal import JournalEntry
from app.ai.lstm_forecaster import lstm_forecaster
from app.utils.logger import logger


class PredictiveService:
    """Service layer orchestrating Predictive AI Mood & Stress Forecasting."""

    def get_user_forecast(self, db: Session, user_id: str) -> Dict[str, Any]:
        """Fetch historical records, run PyTorch LSTM forecaster, and return 7-day forecast."""
        # 1. Fetch emotion records from last 30 days
        since_date = datetime.utcnow() - timedelta(days=30)
        
        emotion_records = (
            db.query(EmotionRecord)
            .filter(EmotionRecord.user_id == user_id, EmotionRecord.recorded_at >= since_date)
            .order_by(EmotionRecord.recorded_at.asc())
            .all()
        )

        journal_entries = (
            db.query(JournalEntry)
            .filter(JournalEntry.user_id == user_id, JournalEntry.created_at >= since_date)
            .order_by(JournalEntry.created_at.asc())
            .all()
        )

        # Merge records into daily items
        daily_records = self._aggregate_daily_records(emotion_records, journal_entries)

        # 2. Run PyTorch LSTM sequence forecasting
        forecast_result = lstm_forecaster.predict_forecast(daily_records)

        # 3. Generate tailored preventive insights
        tomorrow = forecast_result["tomorrow"]
        insights = self._generate_preventive_insights(tomorrow)

        return {
            "tomorrow": tomorrow,
            "weekly_forecast": forecast_result["weekly_forecast"],
            "insights": insights,
            "model_metadata": forecast_result["model_metadata"]
        }

    def _aggregate_daily_records(
        self, emotion_records: List[EmotionRecord], journal_entries: List[JournalEntry]
    ) -> List[Dict[str, Any]]:
        """Combine emotion records and journal logs into daily feature dicts."""
        by_day: Dict[str, List[Dict[str, Any]]] = {}

        for er in emotion_records:
            day_str = er.recorded_at.strftime("%Y-%m-%d")
            by_day.setdefault(day_str, []).append({
                "mood_score": (10.0 - er.stress_score),
                "stress_score": er.stress_score,
                "sentiment_compound": 0.5 if er.sentiment == "positive" else (-0.5 if er.sentiment == "negative" else 0.0),
                "emotion": er.emotion
            })

        for je in journal_entries:
            day_str = je.created_at.strftime("%Y-%m-%d")
            by_day.setdefault(day_str, []).append({
                "mood_score": float(je.mood_score),
                "stress_score": max(0.0, 10.0 - je.mood_score),
                "sentiment_compound": (float(je.mood_score) - 5.5) / 4.5,
                "emotion": je.emotion_tag or "Neutral"
            })

        daily_series = []
        for day_str in sorted(by_day.keys()):
            items = by_day[day_str]
            avg_mood = sum(i["mood_score"] for i in items) / len(items)
            avg_stress = sum(i["stress_score"] for i in items) / len(items)
            avg_compound = sum(i["sentiment_compound"] for i in items) / len(items)
            dom_emotion = items[-1]["emotion"]

            daily_series.append({
                "date": day_str,
                "mood_score": round(avg_mood, 1),
                "stress_score": round(avg_stress, 1),
                "sentiment_compound": round(avg_compound, 2),
                "emotion": dom_emotion
            })

        return daily_series

    def _generate_preventive_insights(self, tomorrow: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate actionable preventive guidance based on tomorrow's forecast."""
        insights = []
        stress_prob = tomorrow["stress_probability"]
        pred_mood = tomorrow["predicted_mood"]
        pred_emotion = tomorrow["predicted_emotion"]

        if stress_prob >= 50.0:
            insights.append({
                "title": "Elevated Stress Probability Warning",
                "description": f"LSTM Model predicts a {stress_prob}% chance of elevated stress tomorrow. Schedule short 5-minute breathing breaks during your work.",
                "type": "warning"
            })
        else:
            insights.append({
                "title": "Favorable Stress Outlook",
                "description": f"Predicted stress probability is low ({stress_prob}%). Great time to engage in creative or focused tasks.",
                "type": "tip"
            })

        if pred_mood >= 7.0:
            insights.append({
                "title": "Positive Emotional Momentum",
                "description": f"Tomorrow's predicted mood is {pred_mood}/10 ({pred_emotion}). Capitalize on this positive affect to set weekly goals.",
                "type": "insight"
            })
        elif pred_mood <= 4.5:
            insights.append({
                "title": "Mindful Self-Care Recommended",
                "description": f"Predicted mood score is lower ({pred_mood}/10). Consider an evening wind-down routine and lighter workload.",
                "type": "warning"
            })
        else:
            insights.append({
                "title": "Steady Emotional Baseline",
                "description": f"Expected mood score of {pred_mood}/10 indicates a balanced, stable state.",
                "type": "insight"
            })

        return insights


# Singleton instance
predictive_service = PredictiveService()

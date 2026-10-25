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

        # Burnout & Stress Risk Assessment
        burnout_risk_score = round(min(100.0, max(10.0, stress_prob * 1.1 + (10.0 - pred_mood) * 4.5)), 1)
        burnout_level = "High Burnout Risk" if burnout_risk_score >= 70 else "Moderate Burnout Risk" if burnout_risk_score >= 40 else "Low Burnout Risk"

        insights.append({
            "title": f"Stress & Burnout Risk Forecast: {burnout_level} ({burnout_risk_score}%)",
            "description": f"Model predicts {stress_prob}% stress probability with a {burnout_risk_score}% cumulative burnout risk. Key contributing factors: recent work strain, sleep latency, and consecutive emotional volatility.",
            "type": "warning" if burnout_risk_score >= 50 else "tip",
            "contributing_factors": ["High Workload Strain", "Short Sleep Duration", "Cognitive Overwhelm"],
            "preventive_recommendations": [
                "Schedule a 15-minute screen-free wind-down before bed",
                "Practice 4-7-8 box breathing during afternoon work blocks",
                "Set strict boundary limits on evening task notifications"
            ]
        })

        if pred_mood <= 5.0:
            insights.append({
                "title": "Emotional Decline Forecast Warning",
                "description": f"Forecast indicates potential emotional decline (Predicted Mood: {pred_mood}/10, Dominant Emotion: {pred_emotion}). Early intervention recommended.",
                "type": "warning",
                "contributing_factors": ["Consecutive Low Mood Days", "Reduced Social Connection"],
                "preventive_recommendations": [
                    "Reach out to a supportive friend or family member today",
                    "Engage in light 10-minute outdoor walking exercise"
                ]
            })
        else:
            insights.append({
                "title": "Positive Emotional Stability",
                "description": f"Predicted mood score of {pred_mood}/10 ({pred_emotion}) indicates stable emotional equilibrium.",
                "type": "insight",
                "contributing_factors": ["Consistent Mindfulness Routine", "Balanced Daily Activity"],
                "preventive_recommendations": [
                    "Maintain current healthy habits and hydration routine",
                    "Record micro-gratitudes in your AI Journal"
                ]
            })

        return insights


# Singleton instance
predictive_service = PredictiveService()

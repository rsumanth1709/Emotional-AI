"""
MindCare AI — Wearable Correlation Engine & Personal Baselines Service
Calculates Pearson statistical correlations, personal physiological baselines vs recent deviations,
and generates non-diagnostic wellness insights combining text + visual + wearable signals.
"""
import math
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.wearable import WearableLog
from app.models.emotion import EmotionRecord


class WearableCorrelationService:
    """Computes statistical correlations, personal baselines, and non-diagnostic wellness insights."""

    def calculate_pearson_r(self, x: List[float], y: List[float]) -> Optional[float]:
        """Compute Pearson correlation coefficient r between two numeric series."""
        n = len(x)
        if n < 3 or len(y) != n:
            return None

        mean_x = sum(x) / n
        mean_y = sum(y) / n

        var_x = sum((val - mean_x) ** 2 for val in x)
        var_y = sum((val - mean_y) ** 2 for val in y)

        if var_x == 0 or var_y == 0:
            return 0.0

        covariance = sum((x[i] - mean_x) * (y[i] - mean_y) for i in range(n))
        r = covariance / math.sqrt(var_x * var_y)
        return round(r, 2)

    def get_personal_baselines(self, db: Session, user_id: str) -> Dict[str, Any]:
        """
        Calculate user's 30-day personal baseline vs recent 7-day averages.
        """
        now = datetime.utcnow()
        baseline_30d = now - timedelta(days=30)
        recent_7d = now - timedelta(days=7)

        logs_30d = (
            db.query(WearableLog)
            .filter(WearableLog.user_id == user_id, WearableLog.recorded_at >= baseline_30d)
            .all()
        )

        logs_7d = [l for l in logs_30d if l.recorded_at and l.recorded_at >= recent_7d]

        # Default fallbacks if no history exists yet
        base_sleep = round(sum(l.sleep_hours for l in logs_30d) / len(logs_30d), 1) if logs_30d else 7.5
        rec_sleep = round(sum(l.sleep_hours for l in logs_7d) / len(logs_7d), 1) if logs_7d else 7.0

        base_hr = round(sum(l.heart_rate_bpm for l in logs_30d) / len(logs_30d), 1) if logs_30d else 72.0
        rec_hr = round(sum(l.heart_rate_bpm for l in logs_7d) / len(logs_7d), 1) if logs_7d else 76.0

        base_steps = int(sum(l.step_count for l in logs_30d) / len(logs_30d)) if logs_30d else 6500
        rec_steps = int(sum(l.step_count for l in logs_7d) / len(logs_7d)) if logs_7d else 6200

        return {
            "sleep": {
                "baseline_hours": base_sleep,
                "recent_hours": rec_sleep,
                "deviation_hours": round(rec_sleep - base_sleep, 1),
                "is_reduced": (rec_sleep - base_sleep) <= -0.8,
            },
            "heart_rate": {
                "baseline_bpm": base_hr,
                "recent_bpm": rec_hr,
                "deviation_bpm": round(rec_hr - base_hr, 1),
                "is_elevated": (rec_hr - base_hr) >= 5.0,
            },
            "activity": {
                "baseline_steps": base_steps,
                "recent_steps": rec_steps,
                "deviation_steps": rec_steps - base_steps,
                "is_reduced": (rec_steps - base_steps) <= -1500,
            },
        }

    def generate_wellness_insights(
        self,
        baselines: Dict[str, Any],
        correlations: Dict[str, Any],
        recent_emotion: str,
    ) -> List[str]:
        """
        Generate non-diagnostic, cautious wellness insights based on detected patterns.
        """
        insights = []

        # 1. Sleep Insight
        sleep = baselines.get("sleep", {})
        if sleep.get("is_reduced"):
            insights.append(
                f"Your recent average sleep ({sleep.get('recent_hours')}h) appears lower than your 30-day baseline ({sleep.get('baseline_hours')}h). "
                "Maintaining a consistent sleep routine may support daily recovery."
            )
        else:
            insights.append(
                f"Your sleep duration ({sleep.get('recent_hours')}h) is aligned with your normal baseline. "
                "Consistent rest supports emotional resilience."
            )

        # 2. Activity Insight
        activity = baselines.get("activity", {})
        if activity.get("is_reduced"):
            insights.append(
                f"Your daily steps ({activity.get('recent_steps'):,}) are currently below your normal baseline ({activity.get('baseline_steps'):,}). "
                "Light physical movement can aid in stress reduction."
            )
        else:
            insights.append(
                f"Your physical activity level ({activity.get('recent_steps'):,} steps/day) is well maintained. "
                "Regular movement supports physical and emotional wellbeing."
            )

        # 3. Heart Rate Insight
        hr = baselines.get("heart_rate", {})
        if hr.get("is_elevated"):
            insights.append(
                f"Your recent average heart rate ({hr.get('recent_bpm')} BPM) is slightly elevated compared to your baseline ({hr.get('baseline_bpm')} BPM). "
                "Consider taking a few minutes for 4-7-8 deep breathing exercises."
            )

        # 4. Multimodal Correlation Insight
        sleep_r = correlations.get("sleep_emotion_r")
        if sleep_r is not None and sleep_r >= 0.4:
            insights.append(
                "Based on your recent data, your positive-emotion check-ins appear to coincide with longer sleep duration. "
                "This pattern is worth continuing to monitor."
            )

        return insights

    def analyze_correlations(self, db: Session, user_id: str) -> Dict[str, Any]:
        """
        Correlate wearable signals (sleep, heart rate, activity) with user's emotion records.
        """
        # Fetch paired wearable & emotion records
        wearable_logs = (
            db.query(WearableLog)
            .filter(WearableLog.user_id == user_id)
            .order_by(desc(WearableLog.recorded_at))
            .limit(30)
            .all()
        )

        emotion_records = (
            db.query(EmotionRecord)
            .filter(EmotionRecord.user_id == user_id)
            .order_by(desc(EmotionRecord.recorded_at))
            .limit(30)
            .all()
        )

        # Map emotions to numeric positivity score (0.0 to 1.0)
        emo_map = {
            "Happy": 1.0, "Excited": 0.9, "Hopeful": 0.85, "Neutral": 0.5,
            "Sad": 0.2, "Anxiety": 0.2, "Fear": 0.25, "Angry": 0.15, "Stress": 0.2
        }

        sleep_vals, hr_vals, step_vals, emo_vals = [], [], [], []

        for log in wearable_logs:
            matched_emo = None
            if emotion_records:
                matched_emo = min(
                    emotion_records,
                    key=lambda e: abs((e.recorded_at - log.recorded_at).total_seconds()) if (e.recorded_at and log.recorded_at) else 999999
                )

            if matched_emo:
                emo_score = emo_map.get(matched_emo.emotion.title(), 0.5)
                sleep_vals.append(log.sleep_hours)
                hr_vals.append(log.heart_rate_bpm)
                step_vals.append(float(log.step_count))
                emo_vals.append(emo_score)

        sleep_r = self.calculate_pearson_r(sleep_vals, emo_vals)
        hr_r = self.calculate_pearson_r(hr_vals, emo_vals)
        step_r = self.calculate_pearson_r(step_vals, emo_vals)

        baselines = self.get_personal_baselines(db, user_id)
        recent_emo = emotion_records[0].emotion if emotion_records else "Neutral"

        correlations = {
            "sleep_emotion_r": sleep_r,
            "heart_rate_emotion_r": hr_r,
            "activity_emotion_r": step_r,
            "paired_sample_count": len(sleep_vals),
        }

        insights = self.generate_wellness_insights(baselines, correlations, recent_emo)

        return {
            "sample_count": len(sleep_vals),
            "correlations": correlations,
            "personal_baselines": baselines,
            "wellness_insights": insights,
            "non_diagnostic_notice": "Correlation analysis reflects non-diagnostic wellness patterns and does not constitute a clinical assessment.",
        }


wearable_correlation_service = WearableCorrelationService()

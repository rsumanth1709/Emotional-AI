"""
MindCare AI — Stress Scorer
Heuristic model that computes a stress score (0–10) and wellness score (0–100)
from emotion, sentiment, and keyword signals.
Transparent and explainable — no black-box model needed.
"""
from typing import List

# ── Base stress scores per therapeutic emotion category ────────────────────
_EMOTION_BASE_STRESS: dict = {
    "Anxiety":  8.5,
    "Stress":   8.0,
    "Fear":     7.5,
    "Angry":    7.0,
    "Sad":      6.0,
    "Lonely":   5.5,
    "Neutral":  3.0,
    "Hopeful":  2.5,
    "Excited":  2.0,
    "Happy":    1.5,
}

# ── Text keywords that push the stress score higher ────────────────────────
_STRESS_AMPLIFIERS = [
    "overwhelmed", "exhausted", "can't cope", "panicking", "shaking",
    "numb", "hopeless", "drowning", "breaking down", "falling apart",
    "can't breathe", "heart racing", "can't sleep", "no way out",
]


class StressScorer:
    """Computes a 0–10 stress score and a 0–100 wellness score."""

    def compute_stress_score(
        self,
        emotion: str,
        sentiment_compound: float,
        text: str,
    ) -> float:
        """
        Compute stress score using:
        1. Emotion base score
        2. Sentiment compound adjustment
        3. Stress-amplifier keyword scanning

        Args:
            emotion:            Therapeutic emotion category
            sentiment_compound: VADER compound score (–1.0 to +1.0)
            text:               Raw user message

        Returns:
            stress_score: float clamped to [0.0, 10.0]
        """
        score = _EMOTION_BASE_STRESS.get(emotion, 3.0)

        # ── Sentiment adjustment ───────────────────────────────────────────
        if sentiment_compound <= -0.5:
            score += 1.5
        elif sentiment_compound <= -0.2:
            score += 0.8
        elif sentiment_compound >= 0.5:
            score -= 1.0
        elif sentiment_compound >= 0.2:
            score -= 0.5

        # ── Keyword amplifiers ─────────────────────────────────────────────
        text_lower = text.lower()
        for keyword in _STRESS_AMPLIFIERS:
            if keyword in text_lower:
                score += 0.5

        # Clamp to valid range
        return round(max(0.0, min(10.0, score)), 2)

    def compute_wellness_score(self, recent_stress_scores: List[float]) -> float:
        """
        Convert a list of recent stress scores into a 0–100 wellness score.
        Lower average stress → higher wellness.

        Args:
            recent_stress_scores: List of stress scores from recent sessions.

        Returns:
            wellness_score: float in [0.0, 100.0]
        """
        if not recent_stress_scores:
            return 70.0  # Default to a moderate wellness level

        avg_stress = sum(recent_stress_scores) / len(recent_stress_scores)
        # Invert: stress 0 → wellness 100, stress 10 → wellness 0
        wellness = (10.0 - avg_stress) * 10.0
        return round(max(0.0, min(100.0, wellness)), 1)


# Module-level singleton
stress_scorer = StressScorer()

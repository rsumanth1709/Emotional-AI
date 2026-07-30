"""
MindCare AI — Sentiment Analyzer
Uses VADER (Valence Aware Dictionary and sEntiment Reasoner),
a rule-based model optimised for short social/chat text.
"""
from typing import Dict

from app.utils.logger import logger

try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
except ImportError:  # pragma: no cover - optional dependency
    SentimentIntensityAnalyzer = None
    logger.warning("vaderSentiment is not installed; using neutral fallback sentiment analysis")


class SentimentAnalyzer:
    """Lightweight rule-based sentiment analysis using VADER."""

    def __init__(self):
        self._analyzer = SentimentIntensityAnalyzer() if SentimentIntensityAnalyzer else None
        if self._analyzer:
            logger.info("VADER SentimentAnalyzer loaded.")
        else:
            logger.info("VADER unavailable; using neutral fallback sentiment analysis.")

    def analyze(self, text: str) -> Dict:
        """
        Analyze sentiment of the given text.

        Returns:
            {
                "sentiment":       str,    # "positive" | "negative" | "neutral"
                "label":           str,    # Strongly Positive / Positive / Neutral / Negative / Strongly Negative
                "compound_score":  float,  # –1.0 to +1.0
                "pos_score":       float,
                "neg_score":       float,
                "neu_score":       float,
            }
        """
        if not text or not text.strip():
            return self._neutral_result()

        if self._analyzer is None:
            return self._neutral_result()

        scores = self._analyzer.polarity_scores(text)
        compound = scores["compound"]

        # Classify using standard VADER thresholds
        if compound >= 0.5:
            sentiment = "positive"
            label = "Strongly Positive"
        elif compound >= 0.05:
            sentiment = "positive"
            label = "Positive"
        elif compound <= -0.5:
            sentiment = "negative"
            label = "Strongly Negative"
        elif compound <= -0.05:
            sentiment = "negative"
            label = "Negative"
        else:
            sentiment = "neutral"
            label = "Neutral"

        return {
            "sentiment": sentiment,
            "label": label,
            "compound_score": round(compound, 4),
            "pos_score": round(scores["pos"], 4),
            "neg_score": round(scores["neg"], 4),
            "neu_score": round(scores["neu"], 4),
        }

    def _neutral_result(self) -> Dict:
        return {
            "sentiment": "neutral",
            "label": "Neutral",
            "compound_score": 0.0,
            "pos_score": 0.0,
            "neg_score": 0.0,
            "neu_score": 1.0,
        }


# Module-level singleton
sentiment_analyzer = SentimentAnalyzer()

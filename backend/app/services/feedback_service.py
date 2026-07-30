"""
MindCare AI — Personalized Fine-Tuning & Preference Learning Service
Implements Thompson Sampling-based online learning from thumbs up/down feedback.
User preferences continuously update category affinity weights used by the
recommendation engine to re-rank and suppress items in real time.
"""
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
import math

from app.models.feedback import UserFeedback
from app.utils.logger import logger


# ─── Category / Item Weight Constants ────────────────────────────────────────
CATEGORY_KEYS = [
    "meditation", "music", "podcasts", "books",
    "videos", "breathing", "yoga"
]

# Learning rate: how strongly each feedback event shifts weights
ALPHA_THUMBS_UP   = 0.18   # reward boost per 👍
ALPHA_THUMBS_DOWN = 0.22   # penalty per 👎 (slightly stronger to avoid bad recs)
DECAY_FACTOR      = 0.95   # older feedback matters less (per 7-day window)
MAX_MULTIPLIER    = 2.5    # cap on how much a category can be boosted
MIN_MULTIPLIER    = 0.10   # floor — never fully suppress


class FeedbackService:
    """
    Personalized Fine-Tuning service using online learning from user feedback.

    Architecture:
    - Each thumbs up/down is stored in `user_feedbacks` DB table
    - On preference query, a per-category affinity score is computed via
      time-decayed Thompson Sampling (success/failure counts)
    - The recommendation engine calls `get_affinity_multipliers()` to
      re-rank every item before returning results
    """

    def log_feedback(
        self,
        db: Session,
        user_id: str,
        item_type: str,
        rating: int,
        item_id: str = None,
        feedback_text: str = None,
        category_tag: str = None
    ) -> UserFeedback:
        """Log thumbs up (+1) / thumbs down (-1) or star rating (1–5)."""
        fb = UserFeedback(
            user_id=user_id,
            item_type=item_type,
            item_id=item_id,
            rating=rating,
            feedback_text=feedback_text,
            category_tag=category_tag
        )
        db.add(fb)
        db.commit()
        db.refresh(fb)
        logger.info(
            f"[FineTune] Feedback logged for user {user_id}: "
            f"rating={rating}, type={item_type}, category={category_tag}"
        )
        return fb

    def get_affinity_multipliers(
        self,
        db: Session,
        user_id: str,
        decay_days: int = 30
    ) -> Dict[str, float]:
        """
        Compute per-category affinity multipliers using time-decayed
        Thompson Sampling from accumulated feedback history.

        Returns dict of {category: multiplier} where multiplier ∈ [0.10, 2.50]
        """
        cutoff = datetime.utcnow() - timedelta(days=decay_days)
        feedbacks = (
            db.query(UserFeedback)
            .filter(
                UserFeedback.user_id == user_id,
                UserFeedback.created_at >= cutoff,
                UserFeedback.category_tag.isnot(None),
            )
            .order_by(desc(UserFeedback.created_at))
            .all()
        )

        if not feedbacks:
            return {cat: 1.0 for cat in CATEGORY_KEYS}

        now = datetime.utcnow()
        category_stats: Dict[str, Dict[str, float]] = {}

        for fb in feedbacks:
            cat = (fb.category_tag or "general").lower()
            if cat not in category_stats:
                category_stats[cat] = {"successes": 0.0, "failures": 0.0}

            # Time decay: more recent feedback counts more
            age_days = max(0, (now - fb.created_at).total_seconds() / 86400)
            decay_weight = math.pow(DECAY_FACTOR, age_days)

            if fb.rating > 0:
                # Thumbs up or star rating ≥ 1
                strength = min(fb.rating, 5) / 5.0  # normalise star ratings
                category_stats[cat]["successes"] += decay_weight * strength
            elif fb.rating < 0:
                category_stats[cat]["failures"] += decay_weight

        # Thompson Sampling: Beta(α, β) where α = successes+1, β = failures+1
        # Use the mean of the Beta distribution = α / (α + β)
        multipliers: Dict[str, float] = {}
        for cat in CATEGORY_KEYS:
            stats = category_stats.get(cat, {"successes": 0.0, "failures": 0.0})
            alpha = stats["successes"] + 1.0  # Beta prior α
            beta  = stats["failures"]  + 1.0  # Beta prior β
            beta_mean = alpha / (alpha + beta)  # ∈ (0, 1)

            # Map (0,1) → (MIN_MULTIPLIER, MAX_MULTIPLIER) centered at 1.0 when equal
            # beta_mean == 0.5 → multiplier == 1.0 (no preference signal)
            raw = 1.0 + (beta_mean - 0.5) * 3.0  # scale: 0.5→-0.5, so maps to [−0.5, 1.5] offset
            multipliers[cat] = round(
                max(MIN_MULTIPLIER, min(MAX_MULTIPLIER, raw)), 3
            )

        # Fill categories with no feedback at neutral 1.0
        for cat in CATEGORY_KEYS:
            if cat not in multipliers:
                multipliers[cat] = 1.0

        return multipliers

    def get_user_preferences(self, db: Session, user_id: str) -> Dict[str, Any]:
        """
        Full preference profile for the frontend dashboard.
        Includes: feedback stats, affinity multipliers, preferred/suppressed categories,
        feedback timeline, and item-level history.
        """
        all_fb = (
            db.query(UserFeedback)
            .filter(UserFeedback.user_id == user_id)
            .order_by(desc(UserFeedback.created_at))
            .all()
        )

        total_logged = len(all_fb)
        if total_logged == 0:
            return {
                "total_feedback_count": 0,
                "positive_count": 0,
                "negative_count": 0,
                "positive_rate_pct": 100.0,
                "preferred_categories": [],
                "suppressed_categories": [],
                "neutral_categories": CATEGORY_KEYS,
                "affinity_multipliers": {cat: 1.0 for cat in CATEGORY_KEYS},
                "recent_feedback": [],
                "learning_status": "gathering_data",
                "model_confidence": 0.0,
            }

        positive_count = sum(1 for f in all_fb if f.rating > 0)
        negative_count = sum(1 for f in all_fb if f.rating < 0)
        positive_rate   = round((positive_count / total_logged) * 100.0, 1)

        multipliers = self.get_affinity_multipliers(db=db, user_id=user_id)

        preferred   = [cat for cat, m in multipliers.items() if m >= 1.20]
        suppressed  = [cat for cat, m in multipliers.items() if m <= 0.80]
        neutral     = [cat for cat, m in multipliers.items() if 0.80 < m < 1.20]

        # Model confidence: log-scale of total feedback events (0→0, 10→70%, 50→100%)
        confidence = min(100.0, round(math.log1p(total_logged) / math.log1p(50) * 100, 1))

        # Learning status
        if total_logged < 3:
            status = "gathering_data"
        elif total_logged < 10:
            status = "learning"
        elif total_logged < 25:
            status = "adapting"
        else:
            status = "personalised"

        # Recent feedback timeline (last 20)
        recent = [
            {
                "id": fb.id,
                "item_type": fb.item_type,
                "item_id": fb.item_id,
                "rating": fb.rating,
                "category_tag": fb.category_tag,
                "feedback_text": fb.feedback_text,
                "created_at": fb.created_at.isoformat(),
            }
            for fb in all_fb[:20]
        ]

        return {
            "total_feedback_count": total_logged,
            "positive_count": positive_count,
            "negative_count": negative_count,
            "positive_rate_pct": positive_rate,
            "preferred_categories": preferred,
            "suppressed_categories": suppressed,
            "neutral_categories": neutral,
            "affinity_multipliers": multipliers,
            "recent_feedback": recent,
            "learning_status": status,
            "model_confidence": confidence,
        }

    def get_item_feedback_summary(
        self,
        db: Session,
        user_id: str,
        item_ids: List[str]
    ) -> Dict[str, int]:
        """
        For a list of item IDs, return the user's existing rating (if any).
        Used by the frontend to show which items have already been rated.
        Returns {item_id: rating}
        """
        if not item_ids:
            return {}
        rows = (
            db.query(UserFeedback.item_id, UserFeedback.rating)
            .filter(
                UserFeedback.user_id == user_id,
                UserFeedback.item_id.in_(item_ids),
                UserFeedback.item_type == "recommendation",
            )
            .order_by(desc(UserFeedback.created_at))
            .all()
        )
        # Latest rating per item
        seen = {}
        for item_id, rating in rows:
            if item_id not in seen:
                seen[item_id] = rating
        return seen


# Singleton instance
feedback_service = FeedbackService()

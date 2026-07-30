"""
MindCare AI — Gamification Service
Manages user XP, leveling, daily challenges, and milestone badges.
"""
from datetime import date, datetime, timedelta
from typing import Dict, List
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.challenge import UserChallengeLog
from app.models.wellness import UserBadge, DailyWellnessLog
from app.models.chat import Chat
from app.models.journal import BreathingSession
from app.schemas.gamification import GamificationSummaryResponse, ChallengeItem, BadgeItem

# Challenges list with keys and reward weights
CHALLENGE_DEFINITIONS = {
    "breath": {"name": "Mindful Breath", "description": "Complete at least one deep breathing session today", "reward": 50},
    "water": {"name": "Stay Hydrated", "description": "Log at least 1500ml of water intake today", "reward": 30},
    "chat": {"name": "Mental Check-in", "description": "Send a supportive chat message to express your feelings", "reward": 20},
}

BADGE_DESCRIPTIONS = {
    "First Step": "Sent your first support chat message.",
    "Breathe Easy": "Completed your first deep breathing exercise.",
    "Scribe": "Logged your first gratitude journal entry.",
    "Hydration Hero": "Reached your daily target of 2000ml water logged.",
    "Zen Master": "Completed 5 deep breathing sessions.",
    "Streak Starter": "Maintained a 3-day wellness streak.",
    "Level Climber": "Leveled up to Level 2 or higher!"
}

class GamificationService:
    """Manages XP calculations, daily challenges, and badge achievement awards."""

    def award_xp(self, db: Session, user_id: str, amount: int) -> Dict:
        """Add XP to a user profile, check for level up milestones, and persist changes."""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {"xp": 0, "level": 1, "leveled_up": False}

        # Safe defaults if None
        if user.xp is None: user.xp = 0
        if user.level is None: user.level = 1

        user.xp += amount
        # Level up threshold: every 200 XP equals one level
        new_level = (user.xp // 200) + 1
        leveled_up = False

        if new_level > user.level:
            user.level = new_level
            leveled_up = True
            # Award "Level Climber" badge
            self._award_badge(db, user_id, "Level Climber", "milestone")

        db.commit()
        return {"xp": user.xp, "level": user.level, "leveled_up": leveled_up}

    def check_and_complete_challenge(self, db: Session, user_id: str, challenge_key: str) -> bool:
        """Check if today's challenge is completed. If not, log completion and award XP."""
        if challenge_key not in CHALLENGE_DEFINITIONS:
            return False

        today = date.today()
        # Verify if already completed today
        exists = db.query(UserChallengeLog).filter(
            UserChallengeLog.user_id == user_id,
            UserChallengeLog.challenge_key == challenge_key,
            UserChallengeLog.completed_date == today
        ).first()

        if exists:
            return False

        # Register completion
        log = UserChallengeLog(
            user_id=user_id,
            challenge_key=challenge_key,
            completed_date=today
        )
        db.add(log)
        db.commit()

        # Award XP
        reward_xp = CHALLENGE_DEFINITIONS[challenge_key]["reward"]
        self.award_xp(db, user_id, reward_xp)

        # Trigger badge evaluation
        self.evaluate_badges(db, user_id)
        return True

    def get_gamification_summary(self, db: Session, user_id: str) -> GamificationSummaryResponse:
        """Compile a full gamified progress snapshot for the dashboard."""
        user = db.query(User).filter(User.id == user_id).first()
        xp = user.xp if user and user.xp else 0
        level = user.level if user and user.level else 1

        # Level calculations
        current_level_base = (level - 1) * 200
        current_level_xp = xp - current_level_base
        level_progress_percentage = min(100.0, (current_level_xp / 200) * 100)

        # Challenges completion evaluation
        today = date.today()
        challenge_logs = db.query(UserChallengeLog).filter(
            UserChallengeLog.user_id == user_id,
            UserChallengeLog.completed_date == today
        ).all()
        completed_keys = {log.challenge_key for log in challenge_logs}

        daily_challenges = []
        for key, defs in CHALLENGE_DEFINITIONS.items():
            daily_challenges.append(
                ChallengeItem(
                    key=key,
                    name=defs["name"],
                    description=defs["description"],
                    reward_xp=defs["reward"],
                    completed=(key in completed_keys)
                )
            )

        # Streak calculation (days logged in wellness logs)
        streak_stats = self._calculate_login_streak(db, user_id)

        # Weekly rewards: completed at least 5 challenge items in the past 7 days
        week_ago = today - timedelta(days=7)
        weekly_completions = db.query(UserChallengeLog).filter(
            UserChallengeLog.user_id == user_id,
            UserChallengeLog.completed_date >= week_ago
        ).count()
        weekly_reward_completed = (weekly_completions >= 5)

        # Fetch unlocked badges
        unlocked = db.query(UserBadge).filter(UserBadge.user_id == user_id).all()
        unlocked_badges = []
        for b in unlocked:
            unlocked_badges.append(
                BadgeItem(
                    badge_name=b.badge_name,
                    badge_type=b.badge_type,
                    unlocked_at=b.unlocked_at,
                    description=BADGE_DESCRIPTIONS.get(b.badge_name, "Unlocked wellness milestone!")
                )
            )

        return GamificationSummaryResponse(
            xp=xp,
            level=level,
            next_level_xp=200,
            level_progress_percentage=round(level_progress_percentage, 1),
            current_streak=streak_stats["current"],
            longest_streak=streak_stats["longest"],
            daily_challenges=daily_challenges,
            weekly_reward_completed=weekly_reward_completed,
            unlocked_badges=unlocked_badges
        )

    def evaluate_badges(self, db: Session, user_id: str):
        """Audit wellness tables and unlock milestones badges if criteria are satisfied."""
        # 1. First Chat bubble
        chats_count = db.query(Chat).filter(Chat.user_id == user_id).count()
        if chats_count >= 1:
            self._award_badge(db, user_id, "First Step", "chat")

        # 2. First Breath & 5 Zen Master sessions
        breaths_count = db.query(BreathingSession).filter(BreathingSession.user_id == user_id).count()
        if breaths_count >= 1:
            self._award_badge(db, user_id, "Breathe Easy", "meditation")
        if breaths_count >= 5:
            self._award_badge(db, user_id, "Zen Master", "meditation")

        # 3. First gratitude journal log
        journal_count = db.query(DailyWellnessLog).filter(
            DailyWellnessLog.user_id == user_id,
            DailyWellnessLog.gratitude_1 != None
        ).count()
        if journal_count >= 1:
            self._award_badge(db, user_id, "Scribe", "journal")

        # 4. Hydration HeroTarget (water intake >= 2000ml in single log)
        hydration_target = db.query(DailyWellnessLog).filter(
            DailyWellnessLog.user_id == user_id,
            DailyWellnessLog.water_intake_ml >= 2000
        ).first()
        if hydration_target:
            self._award_badge(db, user_id, "Hydration Hero", "water")

        # 5. Streak Starter (3-day login streak)
        streak = self._calculate_login_streak(db, user_id)
        if streak["current"] >= 3:
            self._award_badge(db, user_id, "Streak Starter", "streak")

    def _award_badge(self, db: Session, user_id: str, badge_name: str, badge_type: str):
        """Insert a UserBadge record if it doesn't already exist."""
        exists = db.query(UserBadge).filter(
            UserBadge.user_id == user_id,
            UserBadge.badge_name == badge_name
        ).first()

        if not exists:
            badge = UserBadge(
                user_id=user_id,
                badge_name=badge_name,
                badge_type=badge_type
            )
            db.add(badge)
            db.commit()

    def _calculate_login_streak(self, db: Session, user_id: str) -> Dict[str, int]:
        """Query user activity records to calculate consecutive daily streak stats."""
        # Find unique dates of log entries or chats
        logs = db.query(DailyWellnessLog.date).filter(DailyWellnessLog.user_id == user_id).all()
        log_dates = {l[0] for l in logs}

        chats = db.query(Chat.created_at).filter(Chat.user_id == user_id).all()
        chat_dates = {c[0].date() for c in chats}

        all_dates = sorted(list(log_dates.union(chat_dates)))
        if not all_dates:
            return {"current": 0, "longest": 0}

        longest = 0
        current_temp = 0
        prev_date = None

        for d in all_dates:
            if prev_date is None:
                current_temp = 1
            elif (d - prev_date).days == 1:
                current_temp += 1
            elif (d - prev_date).days > 1:
                longest = max(longest, current_temp)
                current_temp = 1
            prev_date = d
        longest = max(longest, current_temp)

        today = date.today()
        yesterday = today - timedelta(days=1)

        has_today = today in all_dates
        has_yesterday = yesterday in all_dates

        if not has_today and not has_yesterday:
            current = 0
        else:
            current = 0
            check_date = today if has_today else yesterday
            while check_date in all_dates:
                current += 1
                check_date -= timedelta(days=1)

        return {"current": current, "longest": max(current, longest)}

gamification_service = GamificationService()

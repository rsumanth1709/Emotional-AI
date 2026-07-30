"""
MindCare AI — Daily Wellness Coach Service
Handles business logic for goals, habit logging, badge achievements, motivation generation, and progress reports.
"""
from datetime import date, datetime, timedelta
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.wellness import DailyWellnessGoal, DailyWellnessLog, UserBadge
from app.models.emotion import EmotionRecord
from app.schemas.wellness import DailyWellnessGoalUpdate, DailyWellnessLogUpdate, WeeklyProgressReport, MotivationResponse
from app.utils.logger import logger

# Personalized motivational quotes mapped to dominant emotion state
MOTIVATION_QUOTES = {
    "Happy": [
        {"quote": "Happiness is not something ready-made. It comes from your own actions.", "author": "Dalai Lama", "category": "Mindfulness"},
        {"quote": "Keep shining, keep smiling, and let your joy be your guide today.", "author": "MindCare Coach", "category": "Joy"}
    ],
    "Excited": [
        {"quote": "Action is the foundational key to all success. Channel this energy into your goals!", "author": "Pablo Picasso", "category": "Focus"},
        {"quote": "Your energy is contagious. Direct it towards building something meaningful today.", "author": "MindCare Coach", "category": "Drive"}
    ],
    "Hopeful": [
        {"quote": "Optimism is the faith that leads to achievement. Nothing can be done without hope and confidence.", "author": "Helen Keller", "category": "Hope"},
        {"quote": "Every day is a new opportunity to paint a brighter picture. Take it step by step.", "author": "MindCare Coach", "category": "Growth"}
    ],
    "Sad": [
        {"quote": "It is okay to not be okay. Healing takes time, and you are doing your best.", "author": "MindCare Coach", "category": "Self-Compassion"},
        {"quote": "The greatest glory in living lies not in never falling, but in rising every time we fall.", "author": "Nelson Mandela", "category": "Resilience"}
    ],
    "Lonely": [
        {"quote": "Remember, you are connected to the world in ways you cannot see. Be kind to yourself today.", "author": "MindCare Coach", "category": "Connection"},
        {"quote": "Nurture your relationship with yourself. You are a complete and worthy person.", "author": "MindCare Coach", "category": "Self-Love"}
    ],
    "Angry": [
        {"quote": "For every minute you remain angry, you give up sixty seconds of peace of mind.", "author": "Ralph Waldo Emerson", "category": "Calm"},
        {"quote": "Breathe. Let anger flow past you. You are in control of how you respond.", "author": "MindCare Coach", "category": "Control"}
    ],
    "Fear": [
        {"quote": "Courage is not the absence of fear, but the triumph over it.", "author": "Nelson Mandela", "category": "Courage"},
        {"quote": "Feel the fear and take one small, gentle step forward anyway.", "author": "MindCare Coach", "category": "Courage"}
    ],
    "Anxiety": [
        {"quote": "Just when the caterpillar thought the world was over, it became a butterfly.", "author": "Chuang Tzu", "category": "Peace"},
        {"quote": "Focus on this breath. This moment is all you need to handle right now.", "author": "MindCare Coach", "category": "Grounding"}
    ],
    "Stress": [
        {"quote": "Within you, there is a stillness and a sanctuary to which you can retreat at any time.", "author": "Hermann Hesse", "category": "Calm"},
        {"quote": "Stress is not what happens to us. It's our response to what happens. Pause and take a breath.", "author": "Arianna Huffington", "category": "Rest"}
    ],
    "Neutral": [
        {"quote": "Consistency is what transforms average into excellence. Let's make today a grounding and focused day.", "author": "MindCare Coach", "category": "Consistency"},
        {"quote": "Small daily improvements over time lead to stunning results.", "author": "Robin Sharma", "category": "Growth"}
    ]
}

class WellnessService:
    """Orchestrates goals, habit logging, streaks, weekly summaries, and badge unlocks."""

    def get_or_create_goal(self, db: Session, user_id: str) -> DailyWellnessGoal:
        """Fetch daily goals or initialize with default values if none exist."""
        goal = db.query(DailyWellnessGoal).filter(DailyWellnessGoal.user_id == user_id).first()
        if not goal:
            goal = DailyWellnessGoal(
                user_id=user_id,
                water_target_ml=2000,
                sleep_target_hours=8.0,
                exercise_target_mins=30,
                meditation_target_mins=10
            )
            db.add(goal)
            db.commit()
            db.refresh(goal)
        return goal

    def update_goal(self, db: Session, user_id: str, data: DailyWellnessGoalUpdate) -> DailyWellnessGoal:
        """Update daily targets."""
        goal = self.get_or_create_goal(db, user_id)
        
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(goal, field, value)
            
        db.commit()
        db.refresh(goal)
        return goal

    def get_or_create_today_log(self, db: Session, user_id: str) -> DailyWellnessLog:
        """Fetch today's log or initialize a fresh one."""
        today = date.today()
        log = db.query(DailyWellnessLog).filter(
            DailyWellnessLog.user_id == user_id, 
            DailyWellnessLog.date == today
        ).first()
        
        if not log:
            log = DailyWellnessLog(
                user_id=user_id,
                date=today,
                water_intake_ml=0,
                sleep_hours=0.0,
                exercise_mins=0,
                meditation_mins=0
            )
            db.add(log)
            db.commit()
            db.refresh(log)
        return log

    def update_today_log(self, db: Session, user_id: str, data: DailyWellnessLogUpdate) -> DailyWellnessLog:
        """Update today's habit log and evaluate badge unlock criteria."""
        log = self.get_or_create_today_log(db, user_id)
        goal = self.get_or_create_goal(db, user_id)
        
        # Apply updates (incremental for water if supplied as direct increment)
        update_dict = data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            if field == "water_intake_ml":
                # Support incremental additions of water
                log.water_intake_ml = max(0, log.water_intake_ml + value)
            else:
                setattr(log, field, value)
                
        db.commit()
        db.refresh(log)
        
        # ── Gamification Rewards & Badges check ────────────────────────────
        from app.services.gamification_service import gamification_service
        try:
            if log.water_intake_ml >= 1500:
                gamification_service.check_and_complete_challenge(db, user_id, "water")
            
            xp_to_award = 0
            if "water_intake_ml" in update_dict and update_dict["water_intake_ml"] > 0:
                xp_to_award += 15
            if "sleep_hours" in update_dict and update_dict["sleep_hours"] > 0:
                xp_to_award += 20
            if "exercise_mins" in update_dict and update_dict["exercise_mins"] > 0:
                xp_to_award += 20
            if "gratitude_1" in update_dict and update_dict["gratitude_1"]:
                xp_to_award += 25
                
            if xp_to_award > 0:
                gamification_service.award_xp(db, user_id, xp_to_award)
                
            # Audit badge accomplishments
            gamification_service.evaluate_badges(db, user_id)
        except Exception as ge:
            # Safe catch
            pass

        # Check and unlock badges
        self._check_and_unlock_badges(db, user_id, log, goal)
        
        return log

    def get_badges(self, db: Session, user_id: str) -> List[UserBadge]:
        """Get list of all badges unlocked by the user."""
        return db.query(UserBadge).filter(UserBadge.user_id == user_id).order_by(UserBadge.unlocked_at.desc()).all()

    def get_motivation(self, db: Session, user_id: str) -> MotivationResponse:
        """Analyze recent emotion state and select a relevant motivational quote."""
        # Query dominant emotion in past 7 days
        since = datetime.utcnow() - timedelta(days=7)
        recent_records = db.query(EmotionRecord).filter(
            EmotionRecord.user_id == user_id,
            EmotionRecord.recorded_at >= since
        ).all()
        
        import collections
        if recent_records:
            emotions = [r.emotion for r in recent_records]
            dominant_emotion = collections.Counter(emotions).most_common(1)[0][0]
        else:
            dominant_emotion = "Neutral"

        quotes_list = MOTIVATION_QUOTES.get(dominant_emotion, MOTIVATION_QUOTES["Neutral"])
        # Rotate or select quote based on current day of month
        day_idx = date.today().day % len(quotes_list)
        selected = quotes_list[day_idx]
        
        return MotivationResponse(
            quote=selected["quote"],
            author=selected["author"],
            category=selected["category"]
        )

    def get_weekly_report(self, db: Session, user_id: str) -> WeeklyProgressReport:
        """Fetch logs from the past 7 days and compute average scores and goal compliance."""
        today = date.today()
        since = today - timedelta(days=6) # 7 days including today
        logs = db.query(DailyWellnessLog).filter(
            DailyWellnessLog.user_id == user_id,
            DailyWellnessLog.date >= since
        ).all()
        
        goal = self.get_or_create_goal(db, user_id)
        
        total_water = 0
        total_sleep = 0.0
        total_exercise = 0
        total_meditation = 0
        
        goals_met = 0
        total_tracked = 0
        
        logged_dates = set()
        
        for log in logs:
            total_water += log.water_intake_ml
            total_sleep += log.sleep_hours
            total_exercise += log.exercise_mins
            total_meditation += log.meditation_mins
            
            # Evaluate goals compliance (Only count days where the metric was explicitly logged/active)
            if log.water_intake_ml > 0 or log.sleep_hours > 0 or log.exercise_mins > 0 or log.meditation_mins > 0:
                logged_dates.add(log.date)
                
                # Check water goal
                if log.water_intake_ml >= goal.water_target_ml:
                    goals_met += 1
                total_tracked += 1
                
                # Check sleep goal
                if log.sleep_hours >= goal.sleep_target_hours:
                    goals_met += 1
                total_tracked += 1
                
                # Check exercise goal
                if log.exercise_mins >= goal.exercise_target_mins:
                    goals_met += 1
                total_tracked += 1
                
                # Check meditation goal
                if log.meditation_mins >= goal.meditation_target_mins:
                    goals_met += 1
                total_tracked += 1

        active_days = len(logged_dates)
        divisor = max(active_days, 1)
        
        # Calculate logging streak
        all_logs = db.query(DailyWellnessLog).filter(DailyWellnessLog.user_id == user_id).all()
        streak = self._calculate_logging_streak(all_logs)
        
        compliance = (goals_met / total_tracked * 100) if total_tracked > 0 else 0.0
        
        return WeeklyProgressReport(
            average_water_ml=round(total_water / divisor, 1),
            average_sleep_hours=round(total_sleep / divisor, 1),
            average_exercise_mins=round(total_exercise / divisor, 1),
            average_meditation_mins=round(total_meditation / divisor, 1),
            goals_met_count=goals_met,
            total_goals_tracked=total_tracked,
            compliance_percentage=round(compliance, 1),
            active_days_count=active_days,
            streak_count=streak
        )

    # ── Internal Helpers ──────────────────────────────────────────────────
    
    def _check_and_unlock_badges(self, db: Session, user_id: str, log: DailyWellnessLog, goal: DailyWellnessGoal):
        """Evaluate goals achieved in today's logs and award corresponding badges."""
        existing_badges = {b.badge_name for b in db.query(UserBadge).filter(UserBadge.user_id == user_id).all()}
        
        badges_to_award = []
        
        # 1. Hydration Hero (Met water target today)
        if "Hydration Hero" not in existing_badges and log.water_intake_ml >= goal.water_target_ml:
            badges_to_award.append(UserBadge(user_id=user_id, badge_name="Hydration Hero", badge_type="water"))
            
        # 2. Sleep Scholar (Met sleep target today)
        if "Sleep Scholar" not in existing_badges and log.sleep_hours >= goal.sleep_target_hours:
            badges_to_award.append(UserBadge(user_id=user_id, badge_name="Sleep Scholar", badge_type="sleep"))
            
        # 3. Fitness Champion (Met exercise target today)
        if "Fitness Champion" not in existing_badges and log.exercise_mins >= goal.exercise_target_mins:
            badges_to_award.append(UserBadge(user_id=user_id, badge_name="Fitness Champion", badge_type="exercise"))
            
        # 4. Zen Master (Met meditation target today)
        if "Zen Master" not in existing_badges and log.meditation_mins >= goal.meditation_target_mins:
            badges_to_award.append(UserBadge(user_id=user_id, badge_name="Zen Master", badge_type="meditation"))
            
        # 5. Gratitude Guru (Completed gratitude journal today)
        if "Gratitude Guru" not in existing_badges and log.gratitude_1 and log.gratitude_2 and log.gratitude_3:
            badges_to_award.append(UserBadge(user_id=user_id, badge_name="Gratitude Guru", badge_type="gratitude"))
            
        # 6. Streaker Star (Logging active streak >= 7 days)
        if "Streaker Star" not in existing_badges:
            all_logs = db.query(DailyWellnessLog).filter(DailyWellnessLog.user_id == user_id).all()
            if self._calculate_logging_streak(all_logs) >= 7:
                badges_to_award.append(UserBadge(user_id=user_id, badge_name="Streaker Star", badge_type="streak"))

        if badges_to_award:
            for badge in badges_to_award:
                db.add(badge)
                logger.info(f"User {user_id} unlocked badge: '{badge.badge_name}'")
            db.commit()

    def _calculate_logging_streak(self, logs: List[DailyWellnessLog]) -> int:
        """Calculate the current logging streak of a user in days."""
        if not logs:
            return 0
        unique_dates = sorted(list(set(l.date for l in logs)))
        
        today = date.today()
        yesterday = today - timedelta(days=1)
        
        has_today = today in unique_dates
        has_yesterday = yesterday in unique_dates
        
        if not has_today and not has_yesterday:
            return 0
            
        current = 0
        check_date = today if has_today else yesterday
        while check_date in unique_dates:
            current += 1
            check_date -= timedelta(days=1)
            
        return current

wellness_service = WellnessService()

"""
MindCare AI — Goal Service (AI Goal Planner)
Generates personalized wellness goals, creates weekly action plans,
monitors progress, automatically adjusts goals based on emotional trends,
rotates goals progressively (Level 1 Foundation → Level 2 Mastery → Level 3 Resilience)
to prevent repeating static goals every 4 weeks.
"""
import uuid
import random
from datetime import datetime, date, timedelta
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.goal import WellnessGoal, GoalMilestone
from app.services.emotion_service import emotion_service
from app.ai.response_generator import response_generator
from app.utils.logger import logger

# ── Multi-Tier Dynamic Goal Blueprints per Emotion ────────────────────────────
DYNAMIC_GOAL_BLUEPRINTS = {
    "Anxiety": [
        {
            "level": 1,
            "title": "Level 1: Grounding & Panic Control Foundation",
            "category": "anxiety",
            "description": "Build daily grounding habits using box breathing and 5-4-3-2-1 sensory exercises to tame anxiety loops.",
            "weekly_milestones": [
                {"week": 1, "title": "Establish Daily Grounding Routine", "action_item": "Practice 4-7-8 breathing for 5 mins every morning", "frequency": "Daily"},
                {"week": 2, "title": "Cognitive Reframe Log", "action_item": "Identify 3 anxious thoughts and write rational reframes", "frequency": "3x per week"},
                {"week": 3, "title": "Sensory Reset Challenge", "action_item": "Use 5-4-3-2-1 grounding exercise when tension spikes", "frequency": "As needed"},
                {"week": 4, "title": "Anxiety Reduction Check-in", "action_item": "Review weekly stress trend chart & celebrate progress", "frequency": "Weekly"},
            ]
        },
        {
            "level": 2,
            "title": "Level 2: Advanced Exposure & Cognitive Flexibility",
            "category": "anxiety",
            "description": "Strengthen emotional regulation by actively disarming anxiety triggers, practicing progressive muscle relaxation, and cognitive decentering.",
            "weekly_milestones": [
                {"week": 1, "title": "Progressive Muscle Relaxation (PMR)", "action_item": "Perform a 10-minute PMR audio session before sleep", "frequency": "Daily"},
                {"week": 2, "title": "Worry Postponement Window", "action_item": "Designate a 15-min 'worry window' daily and defer panic thoughts", "frequency": "Daily"},
                {"week": 3, "title": "Thought Decentering Practice", "action_item": "Observe anxious thoughts as clouds passing without judgement", "frequency": "3x per week"},
                {"week": 4, "title": "Trigger Exposure Log", "action_item": "Step into 1 uncomfortable scenario and record calm response", "frequency": "2x per week"},
            ]
        },
        {
            "level": 3,
            "title": "Level 3: Deep Nervous System Resilience",
            "category": "anxiety",
            "description": "Master vagal tone stimulation, cold-exposure resets, and body-centered somatic grounding for sustained peace.",
            "weekly_milestones": [
                {"week": 1, "title": "Vagus Nerve Stimulation", "action_item": "Perform humming or cold water face splash to stimulate vagal nerve", "frequency": "Daily"},
                {"week": 2, "title": "Somatic Tremor Release", "action_item": "Engage in 10-min gentle somatic body shake out", "frequency": "3x per week"},
                {"week": 3, "title": "Core Belief Reframing", "action_item": "Replace 'What if' panic with 'Even if' capability statements", "frequency": "Daily"},
                {"week": 4, "title": "Resilience Mastery Retrospective", "action_item": "Write a self-compassionate reflection on your anxiety journey", "frequency": "Weekly"},
            ]
        }
    ],
    "Stress": [
        {
            "level": 1,
            "title": "Level 1: Workload & Burnout Recovery Plan",
            "category": "stress",
            "description": "Implement Pomodoro focus windows, physical decompression, and evening wind-down boundaries.",
            "weekly_milestones": [
                {"week": 1, "title": "Digital Boundary Reset", "action_item": "Turn off work notifications after 7 PM", "frequency": "Daily"},
                {"week": 2, "title": "Pomodoro Work & Rest Flow", "action_item": "Use 25-min focus / 5-min rest cycles for heavy tasks", "frequency": "Daily"},
                {"week": 3, "title": "Physiological Sigh Protocol", "action_item": "Perform 3 double-inhale sighs during high-pressure moments", "frequency": "As needed"},
                {"week": 4, "title": "Restorative Decompression", "action_item": "Take a 20-minute outdoor walk without electronics", "frequency": "4x per week"},
            ]
        },
        {
            "level": 2,
            "title": "Level 2: Sustainable Energy & Boundary Mastery",
            "category": "stress",
            "description": "Cultivate micro-breaks, protect focus time, and build physical stress-discharge routines.",
            "weekly_milestones": [
                {"week": 1, "title": "Active No-Saying Boundary", "action_item": "Politely decline 1 low-priority demand to protect your energy", "frequency": "Weekly"},
                {"week": 2, "title": "Micro-Break Protocol", "action_item": "Take 2-minute movement breaks every 60 minutes of desk work", "frequency": "Daily"},
                {"week": 3, "title": "Evening Cortisol Wind-Down", "action_item": "Drink herbal tea and dim screen brightness 1 hour before sleep", "frequency": "Daily"},
                {"week": 4, "title": "Stress Audit & Elimination", "action_item": "Identify your top stressor this month and automate/delegate 1 step", "frequency": "Weekly"},
            ]
        },
        {
            "level": 3,
            "title": "Level 3: Zen Focus & High-Performance Balance",
            "category": "stress",
            "description": "Achieve high productivity while maintaining low physiological stress through breathwork anchors and deep restorative sleep.",
            "weekly_milestones": [
                {"week": 1, "title": "Autonomic Reset Breathing", "action_item": "Practice 10-minute resonance frequency breathing (6 breaths/min)", "frequency": "Daily"},
                {"week": 2, "title": "Flow State Block", "action_item": "Schedule a 90-minute uninterrupted deep work block 3x a week", "frequency": "3x per week"},
                {"week": 3, "title": "Physical Stress Discharge", "action_item": "Perform a 20-minute cardio or aerobic session to burn excess adrenaline", "frequency": "3x per week"},
                {"week": 4, "title": "Life Balance Audit", "action_item": "Review work-life balance scores and adjust future weekly commitments", "frequency": "Weekly"},
            ]
        }
    ],
    "Sad": [
        {
            "level": 1,
            "title": "Level 1: Self-Compassion & Uplifting Activation",
            "category": "mindfulness",
            "description": "Rebuild daily vitality through small pleasant activities, loving-kindness practices, and compassionate journaling.",
            "weekly_milestones": [
                {"week": 1, "title": "Micro-Joy Journaling", "action_item": "Record 3 small moments of comfort or gratitude", "frequency": "Daily"},
                {"week": 2, "title": "Gentle Physical Movement", "action_item": "15-minute gentle stretch or restorative yoga session", "frequency": "3x per week"},
                {"week": 3, "title": "Loving-Kindness Meditation", "action_item": "Listen to a 10-minute self-compassion audio guide", "frequency": "3x per week"},
                {"week": 4, "title": "Social Re-connection", "action_item": "Reach out to one supportive friend or loved one", "frequency": "Weekly"},
            ]
        },
        {
            "level": 2,
            "title": "Level 2: Behavioral Activation & Purpose Alignment",
            "category": "mindfulness",
            "description": "Re-engage with meaningful creative activities, sunlight exposure, and gentle self-kindness affirmations.",
            "weekly_milestones": [
                {"week": 1, "title": "Morning Sunlight Reset", "action_item": "Get 10 minutes of direct morning sunlight to boost serotonin", "frequency": "Daily"},
                {"week": 2, "title": "Creative Self-Expression", "action_item": "Spend 20 minutes sketching, writing, or playing music", "frequency": "2x per week"},
                {"week": 3, "title": "Compassionate Self-Talk", "action_item": "Catch negative inner dialogue and replace it with warm encouragement", "frequency": "Daily"},
                {"week": 4, "title": "Small Victory Celebration", "action_item": "Treat yourself to a relaxing bath, tea, or favourite hobby", "frequency": "Weekly"},
            ]
        },
        {
            "level": 3,
            "title": "Level 3: Emotional Renewal & Vibrant Vitality",
            "category": "mindfulness",
            "description": "Consolidate lasting emotional resilience through purposeful community contribution and joyful movement.",
            "weekly_milestones": [
                {"week": 1, "title": "Outdoor Nature Immersion", "action_item": "Spend 30 minutes walking in a park or natural green space", "frequency": "2x per week"},
                {"week": 2, "title": "Gratitude Letter Writing", "action_item": "Write a heartfelt thank-you note to someone who made a difference", "frequency": "Weekly"},
                {"week": 3, "title": "Rhythm & Music Therapy", "action_item": "Listen to uplifting playlists while engaging in light exercise", "frequency": "3x per week"},
                {"week": 4, "title": "Life Purpose Visioning", "action_item": "Draft 3 meaningful goals for the upcoming quarter", "frequency": "Weekly"},
            ]
        }
    ],
    "Lonely": [
        {
            "level": 1,
            "title": "Level 1: Social Connection & Heart Warmth",
            "category": "social",
            "description": "Bridge feelings of isolation by strengthening small daily connections and practicing warm self-presence.",
            "weekly_milestones": [
                {"week": 1, "title": "Warm Self-Affirmation", "action_item": "Write one kind letter to yourself acknowledging your worth", "frequency": "Weekly"},
                {"week": 2, "title": "Community Check-in", "action_item": "Send a thoughtful message to a friend or family member", "frequency": "3x per week"},
                {"week": 3, "title": "Shared Interest Exploration", "action_item": "Listen to an inspiring podcast or read a comforting book", "frequency": "3x per week"},
                {"week": 4, "title": "Heart Openness Review", "action_item": "Reflect on social connections made over the past month", "frequency": "Weekly"},
            ]
        },
        {
            "level": 2,
            "title": "Level 2: Deepening Belonging & Authentic Bonds",
            "category": "social",
            "description": "Move from superficial interactions to genuine, authentic conversations and shared group experiences.",
            "weekly_milestones": [
                {"week": 1, "title": "Meaningful Voice Call", "action_item": "Have a 15-minute voice or video call with a close friend", "frequency": "2x per week"},
                {"week": 2, "title": "Shared Activity Invitation", "action_item": "Invite a colleague or acquaintance for coffee or a walk", "frequency": "Weekly"},
                {"week": 3, "title": "Empathetic Active Listening", "action_item": "Ask someone about their day and listen without interrupting", "frequency": "Daily"},
                {"week": 4, "title": "Belonging Circle Reflection", "action_item": "Identify your top 3 supportive relationships and nurture them", "frequency": "Weekly"},
            ]
        }
    ],
    "Neutral": [
        {
            "level": 1,
            "title": "Level 1: Mindful Wellness & Growth Baseline",
            "category": "gratitude",
            "description": "Sustain balanced emotional health through daily mindfulness, hydration, and goal reflection.",
            "weekly_milestones": [
                {"week": 1, "title": "Daily Mindfulness Practice", "action_item": "Spend 5 minutes in silent breath observation", "frequency": "Daily"},
                {"week": 2, "title": "Gratitude Anchor", "action_item": "Journal 3 daily wins before going to sleep", "frequency": "Daily"},
                {"week": 3, "title": "Mind-Body Check-in", "action_item": "Log biometric or wearable data to monitor sleep/HRV", "frequency": "Daily"},
                {"week": 4, "title": "Monthly Reflection", "action_item": "Complete AI Journal Retrospective & set new growth target", "frequency": "Monthly"},
            ]
        },
        {
            "level": 2,
            "title": "Level 2: Habit Stacking & Holistic Vitality",
            "category": "gratitude",
            "description": "Elevate daily baseline wellness by stacking hydration, movement, and cognitive reflection habits.",
            "weekly_milestones": [
                {"week": 1, "title": "Hydration + Stretch Stack", "action_item": "Drink 300ml water immediately after waking up and do a 2-min stretch", "frequency": "Daily"},
                {"week": 2, "title": "Evening Screen Detox", "action_item": "Put away smartphones and tablets 45 mins before bedtime", "frequency": "Daily"},
                {"week": 3, "title": "Mindful Meal Experience", "action_item": "Eat 1 meal per day without screens or multi-tasking", "frequency": "Daily"},
                {"week": 4, "title": "Habit Optimization Audit", "action_item": "Review habit completion streak and refine daily routine", "frequency": "Weekly"},
            ]
        }
    ]
}


class GoalService:
    """Service layer for AI Goal Planner."""

    def generate_personalized_goal(
        self, db: Session, user_id: str, emotion_override: Optional[str] = None
    ) -> WellnessGoal:
        """
        Generate a personalized 4-week wellness goal with weekly action plan milestones.
        Dynamically rotates blueprint tiers (Level 1 → Level 2 → Level 3) and filters past
        goals so that goals NEVER statically repeat every 4 weeks.
        """
        # Determine target emotion context
        active_emotion = emotion_override
        if not active_emotion:
            records = emotion_service.get_emotion_history(db, user_id, days=7)
            active_emotion = records[0].emotion if records else "Neutral"

        # Fetch all existing goal titles for this user to avoid static duplicate repetition
        existing_goals = (
            db.query(WellnessGoal)
            .filter(WellnessGoal.user_id == user_id)
            .all()
        )
        existing_titles = {g.title for g in existing_goals}
        total_user_goals = len(existing_goals)

        # Get blueprints list for target emotion (or fallback to Neutral)
        blueprints_list = DYNAMIC_GOAL_BLUEPRINTS.get(active_emotion, DYNAMIC_GOAL_BLUEPRINTS["Neutral"])

        # Filter out blueprints the user has already experienced
        unseen_blueprints = [b for b in blueprints_list if b["title"] not in existing_titles]

        if unseen_blueprints:
            # Pick the next level blueprint
            blueprint = unseen_blueprints[0]
        else:
            # If user completed all preset levels, synthesize a dynamic Level N milestone plan
            level_num = total_user_goals + 1
            base_bp = random.choice(blueprints_list)
            blueprint = {
                "level": level_num,
                "title": f"Level {level_num}: Advanced {active_emotion} Resilience & Mastery",
                "category": base_bp["category"],
                "description": f"Advanced Level {level_num} customized progression plan for long-term {active_emotion.lower()} mastery and emotional equilibrium.",
                "weekly_milestones": [
                    {"week": 1, "title": f"Level {level_num} Daily Breath & Focus Anchor", "action_item": "Practice 8-minute resonance box breathing every morning", "frequency": "Daily"},
                    {"week": 2, "title": f"Level {level_num} Cognitive Challenge Log", "action_item": "Write 3 cognitive reframes for subtle tension triggers", "frequency": "3x per week"},
                    {"week": 3, "title": f"Level {level_num} Somatic Decompression Reset", "action_item": "Engage in 15-minute body scan & tension release", "frequency": "3x per week"},
                    {"week": 4, "title": f"Level {level_num} Mastery Retrospective", "action_item": "Evaluate overall resilience index & set future vitality targets", "frequency": "Weekly"},
                ]
            }

        # Deactivate / mark previous active goals as completed to promote the new progressive goal
        db.query(WellnessGoal).filter(
            WellnessGoal.user_id == user_id,
            WellnessGoal.status == "active"
        ).update({"status": "completed"})
        db.commit()

        today = date.today()
        target_dt = today + timedelta(days=28)  # 4-week goal duration

        goal = WellnessGoal(
            user_id=user_id,
            title=blueprint["title"],
            category=blueprint["category"],
            target_emotion=active_emotion,
            description=blueprint["description"],
            start_date=today,
            target_date=target_dt,
            status="active",
            completion_percentage=0.0,
            auto_adjusted=False,
        )
        db.add(goal)
        db.commit()
        db.refresh(goal)

        # Create 4 weekly milestone action items
        for ms in blueprint["weekly_milestones"]:
            milestone = GoalMilestone(
                goal_id=goal.id,
                week_number=ms["week"],
                title=ms["title"],
                action_item=ms["action_item"],
                target_frequency=ms["frequency"],
                completed=False,
            )
            db.add(milestone)

        db.commit()
        db.refresh(goal)
        logger.info(f"Generated progressive WellnessGoal (Level {blueprint.get('level', 1)}) for user {user_id}: {goal.title}")
        return goal

    def get_user_goals(self, db: Session, user_id: str) -> List[Dict[str, Any]]:
        """Fetch all goals for a user with milestone items & auto-adjustment check."""
        goals = (
            db.query(WellnessGoal)
            .filter(WellnessGoal.user_id == user_id)
            .order_by(desc(WellnessGoal.created_at))
            .all()
        )

        # If user has no goals, generate an initial personalized goal
        if not goals:
            g = self.generate_personalized_goal(db, user_id)
            goals = [g]

        # Auto-adjust check on active goals based on current emotional trends
        for g in goals:
            if g.status == "active":
                self.check_and_auto_adjust_goal(db, g)

        results = []
        for g in goals:
            milestones = (
                db.query(GoalMilestone)
                .filter(GoalMilestone.goal_id == g.id)
                .order_by(GoalMilestone.week_number)
                .all()
            )
            
            # Recalculate completion percentage
            tot = len(milestones)
            comp = sum(1 for m in milestones if m.completed)
            pct = round((comp / tot * 100.0), 1) if tot > 0 else 0.0
            if pct != g.completion_percentage:
                g.completion_percentage = pct
                db.commit()

            results.append({
                "id": g.id,
                "title": g.title,
                "category": g.category,
                "target_emotion": g.target_emotion,
                "description": g.description,
                "start_date": g.start_date.isoformat(),
                "target_date": g.target_date.isoformat(),
                "status": g.status,
                "completion_percentage": pct,
                "auto_adjusted": g.auto_adjusted,
                "adjustment_reason": g.adjustment_reason,
                "created_at": g.created_at.isoformat(),
                "motivational_feedback": self._generate_motivational_feedback(pct, g.target_emotion),
                "milestones": [
                    {
                        "id": m.id,
                        "week_number": m.week_number,
                        "title": m.title,
                        "action_item": m.action_item,
                        "target_frequency": m.target_frequency,
                        "completed": m.completed,
                        "completed_at": m.completed_at.isoformat() if m.completed_at else None,
                    }
                    for m in milestones
                ]
            })

        return results

    def toggle_milestone(self, db: Session, user_id: str, milestone_id: str) -> Dict[str, Any]:
        """Toggle a weekly milestone completed state and update goal completion percentage."""
        m = db.query(GoalMilestone).filter(GoalMilestone.id == milestone_id).first()
        if not m:
            return {"error": "Milestone not found"}

        goal = db.query(WellnessGoal).filter(WellnessGoal.id == m.goal_id, WellnessGoal.user_id == user_id).first()
        if not goal:
            return {"error": "Goal authorization failed"}

        m.completed = not m.completed
        m.completed_at = datetime.utcnow() if m.completed else None

        # Re-calc goal completion percentage
        all_m = db.query(GoalMilestone).filter(GoalMilestone.goal_id == goal.id).all()
        tot = len(all_m)
        comp = sum(1 for item in all_m if item.completed)
        pct = round((comp / tot * 100.0), 1) if tot > 0 else 0.0
        goal.completion_percentage = pct
        if pct >= 100.0:
            goal.status = "completed"

        db.commit()
        db.refresh(goal)
        db.refresh(m)

        return {
            "milestone_id": m.id,
            "completed": m.completed,
            "goal_completion_percentage": pct,
            "goal_status": goal.status,
            "motivational_feedback": self._generate_motivational_feedback(pct, goal.target_emotion),
        }

    def check_and_auto_adjust_goal(self, db: Session, goal: WellnessGoal):
        """
        Automatically adjust goal parameters or add coping milestones if recent emotional
        trend shows elevated stress or emotion shift.
        """
        records = emotion_service.get_emotion_history(db, goal.user_id, days=5)
        if not records:
            return

        recent_stress = sum(r.stress_score for r in records) / len(records)

        # Trigger auto-adjustment if high stress persists (>7.0) and goal hasn't been auto-adjusted yet
        if recent_stress >= 7.0 and not goal.auto_adjusted:
            goal.auto_adjusted = True
            goal.adjustment_reason = (
                f"Auto-adjusted goal: Recent 5-day stress average rose to {recent_stress:.1f}/10. "
                f"Added emergency calming grounding milestones to lower cognitive overload."
            )
            # Add an extra grounding milestone
            extra_ms = GoalMilestone(
                goal_id=goal.id,
                week_number=1,
                title="⚡ Stress Interceptor: Emergency Grounding",
                action_item="Perform 3-minute box breathing reset before starting daily tasks",
                target_frequency="Daily",
                completed=False,
            )
            db.add(extra_ms)
            db.commit()
            logger.info(f"Auto-adjusted goal {goal.id} for user {goal.user_id} due to elevated stress ({recent_stress:.1f})")

    def _generate_motivational_feedback(self, pct: float, emotion: str) -> str:
        """Generate dynamic motivational feedback based on completion percentage."""
        if pct >= 100.0:
            return "🎉 Outstanding accomplishment! You've completed 100% of your wellness action plan!"
        elif pct >= 75.0:
            return "🚀 Final stretch! You are 75%+ done with your milestones. Keep this amazing momentum going!"
        elif pct >= 50.0:
            return "🌟 Over halfway there! Your consistent action is making a real difference in your wellbeing."
        elif pct >= 25.0:
            return "🌱 Great start! You've completed your first milestones. Consistency is key."
        else:
            return "💙 Every journey starts with one small step. Complete your first milestone today!"

    def clear_goal_history(self, db: Session, user_id: str) -> Dict[str, Any]:
        """Clear all historical completed goals for a user while preserving active goals."""
        past_goals = (
            db.query(WellnessGoal)
            .filter(WellnessGoal.user_id == user_id, WellnessGoal.status != "active")
            .all()
        )
        count = len(past_goals)
        for g in past_goals:
            db.delete(g)
        db.commit()
        logger.info(f"Cleared {count} historical goals for user {user_id}")
        return {"message": "Goal history cleared successfully", "cleared_count": count}

    def delete_goal(self, db: Session, user_id: str, goal_id: str) -> bool:
        """Delete a specific goal by ID."""
        goal = (
            db.query(WellnessGoal)
            .filter(WellnessGoal.id == goal_id, WellnessGoal.user_id == user_id)
            .first()
        )
        if not goal:
            return False

        db.delete(goal)
        db.commit()
        logger.info(f"Deleted goal {goal_id} for user {user_id}")
        return True

    def delete_selected_goals(self, db: Session, user_id: str, goal_ids: List[str]) -> Dict[str, Any]:
        """Delete a list of selected goals by IDs."""
        goals = (
            db.query(WellnessGoal)
            .filter(WellnessGoal.id.in_(goal_ids), WellnessGoal.user_id == user_id)
            .all()
        )
        count = len(goals)
        for g in goals:
            db.delete(g)
        db.commit()
        logger.info(f"Deleted {count} selected goals for user {user_id}")
        return {"message": f"Deleted {count} selected goals", "deleted_count": count}


# Singleton instance
goal_service = GoalService()

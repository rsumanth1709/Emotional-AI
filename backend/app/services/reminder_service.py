"""
MindCare AI — Smart Reminder Service
Manages scheduled wellness reminders (non-prescriptive supplements, meditation, sleep, hydration)
and handles trigger notifications, action logging, completion tracking, and history analytics.
"""
import uuid
from datetime import datetime, date, timedelta
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.models.reminder import SmartReminder, ReminderLog
from app.models.wellness import DailyWellnessLog
from app.utils.logger import logger


PRESET_REMINDERS = [
    {
        "title": "Daily Vitamin & Wellness Supplement",
        "reminder_type": "medication",
        "scheduled_time": "08:30",
        "frequency": "daily",
        "note": "Take non-prescriptive daily wellness vitamins/minerals with water.",
        "sound_enabled": True,
    },
    {
        "title": "Hydration Refresh Check-in",
        "reminder_type": "hydration",
        "scheduled_time": "11:00",
        "frequency": "daily",
        "note": "Drink 250ml of fresh water to maintain optimal physical and cognitive hydration.",
        "sound_enabled": True,
    },
    {
        "title": "Midday Mindful Meditation",
        "reminder_type": "meditation",
        "scheduled_time": "14:30",
        "frequency": "daily",
        "note": "Take a 10-minute pause for guided breathing or 4-7-8 relaxation.",
        "sound_enabled": True,
    },
    {
        "title": "Evening Sleep Wind-Down",
        "reminder_type": "sleep",
        "scheduled_time": "22:00",
        "frequency": "daily",
        "note": "Dim ambient lighting, put away blue-light screens, and prepare for restorative sleep.",
        "sound_enabled": True,
    },
]


class ReminderService:
    """Service layer for Smart Reminder System."""

    def get_user_reminders(self, db: Session, user_id: str) -> List[SmartReminder]:
        """Fetch all reminders for a user. Initializes default presets if user has none."""
        reminders = (
            db.query(SmartReminder)
            .filter(SmartReminder.user_id == user_id)
            .order_by(SmartReminder.scheduled_time.asc())
            .all()
        )

        if not reminders:
            reminders = self.initialize_default_presets(db, user_id)

        return reminders

    def initialize_default_presets(self, db: Session, user_id: str) -> List[SmartReminder]:
        """Populate standard preset reminders for a new user."""
        created = []
        for p in PRESET_REMINDERS:
            r = SmartReminder(
                user_id=user_id,
                title=p["title"],
                reminder_type=p["reminder_type"],
                scheduled_time=p["scheduled_time"],
                frequency=p["frequency"],
                note=p["note"],
                is_active=True,
                sound_enabled=p["sound_enabled"],
            )
            db.add(r)
            created.append(r)

        db.commit()
        for r in created:
            db.refresh(r)
        logger.info(f"Initialized {len(created)} default preset reminders for user {user_id}")
        return created

    def create_reminder(
        self,
        db: Session,
        user_id: str,
        title: str,
        reminder_type: str,
        scheduled_time: str,
        frequency: str = "daily",
        custom_days: Optional[str] = None,
        note: Optional[str] = None,
        sound_enabled: bool = True,
    ) -> SmartReminder:
        """Create a new custom or preset-based reminder."""
        reminder = SmartReminder(
            user_id=user_id,
            title=title,
            reminder_type=reminder_type,
            scheduled_time=scheduled_time,
            frequency=frequency,
            custom_days=custom_days,
            note=note,
            is_active=True,
            sound_enabled=sound_enabled,
        )
        db.add(reminder)
        db.commit()
        db.refresh(reminder)
        logger.info(f"Created reminder '{title}' ({reminder_type}) for user {user_id}")
        return reminder

    def update_reminder(
        self,
        db: Session,
        user_id: str,
        reminder_id: str,
        title: Optional[str] = None,
        reminder_type: Optional[str] = None,
        scheduled_time: Optional[str] = None,
        frequency: Optional[str] = None,
        custom_days: Optional[str] = None,
        note: Optional[str] = None,
        is_active: Optional[bool] = None,
        sound_enabled: Optional[bool] = None,
    ) -> Optional[SmartReminder]:
        """Update an existing reminder's settings."""
        r = (
            db.query(SmartReminder)
            .filter(SmartReminder.id == reminder_id, SmartReminder.user_id == user_id)
            .first()
        )
        if not r:
            return None

        if title is not None:
            r.title = title
        if reminder_type is not None:
            r.reminder_type = reminder_type
        if scheduled_time is not None:
            r.scheduled_time = scheduled_time
        if frequency is not None:
            r.frequency = frequency
        if custom_days is not None:
            r.custom_days = custom_days
        if note is not None:
            r.note = note
        if is_active is not None:
            r.is_active = is_active
        if sound_enabled is not None:
            r.sound_enabled = sound_enabled

        r.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(r)
        return r

    def delete_reminder(self, db: Session, user_id: str, reminder_id: str) -> bool:
        """Delete a reminder and associated logs."""
        r = (
            db.query(SmartReminder)
            .filter(SmartReminder.id == reminder_id, SmartReminder.user_id == user_id)
            .first()
        )
        if not r:
            return False

        db.delete(r)
        db.commit()
        logger.info(f"Deleted reminder {reminder_id} for user {user_id}")
        return True

    def record_action(
        self,
        db: Session,
        user_id: str,
        reminder_id: str,
        action_taken: str,  # "completed", "snoozed", "missed"
    ) -> Dict[str, Any]:
        """Log execution action (completed/snoozed/missed) for a reminder."""
        reminder = (
            db.query(SmartReminder)
            .filter(SmartReminder.id == reminder_id, SmartReminder.user_id == user_id)
            .first()
        )
        if not reminder:
            return {"error": "Reminder not found"}

        now = datetime.utcnow()
        log = ReminderLog(
            reminder_id=reminder.id,
            user_id=user_id,
            title=reminder.title,
            reminder_type=reminder.reminder_type,
            action_taken=action_taken,
            scheduled_time=reminder.scheduled_time,
            triggered_at=now,
            completed_at=now if action_taken == "completed" else None,
        )
        db.add(log)

        # Cross-integration: Auto-update wellness logs when completed
        if action_taken == "completed":
            self._integrate_wellness_log(db, user_id, reminder.reminder_type)

        db.commit()
        db.refresh(log)

        logger.info(f"Recorded reminder action '{action_taken}' for '{reminder.title}'")
        return {
            "log_id": log.id,
            "title": reminder.title,
            "reminder_type": reminder.reminder_type,
            "action_taken": action_taken,
            "completed_at": log.completed_at.isoformat() if log.completed_at else None,
        }

    def _integrate_wellness_log(self, db: Session, user_id: str, reminder_type: str):
        """Auto-update daily wellness log metrics when user completes a habit reminder."""
        today = date.today()
        wlog = (
            db.query(DailyWellnessLog)
            .filter(DailyWellnessLog.user_id == user_id, DailyWellnessLog.date == today)
            .first()
        )
        if not wlog:
            wlog = DailyWellnessLog(user_id=user_id, date=today)
            db.add(wlog)

        if reminder_type == "hydration":
            wlog.water_intake_ml = (wlog.water_intake_ml or 0) + 250
        elif reminder_type == "meditation":
            wlog.meditation_mins = (wlog.meditation_mins or 0) + 10
        elif reminder_type == "sleep":
            if not wlog.sleep_quality:
                wlog.sleep_quality = "Good"

    def get_history(self, db: Session, user_id: str, days: int = 30) -> Dict[str, Any]:
        """Fetch reminder history logs, completion metrics, and streak statistics."""
        cutoff = datetime.utcnow() - timedelta(days=days)
        logs = (
            db.query(ReminderLog)
            .filter(ReminderLog.user_id == user_id, ReminderLog.triggered_at >= cutoff)
            .order_by(desc(ReminderLog.triggered_at))
            .all()
        )

        total_triggered = len(logs)
        completed_count = sum(1 for l in logs if l.action_taken == "completed")
        snoozed_count = sum(1 for l in logs if l.action_taken == "snoozed")
        missed_count = sum(1 for l in logs if l.action_taken == "missed")

        completion_rate = (
            round((completed_count / total_triggered) * 100.0, 1)
            if total_triggered > 0
            else 100.0
        )

        # Count completed per category
        type_breakdown: Dict[str, int] = {}
        for l in logs:
            if l.action_taken == "completed":
                t = l.reminder_type
                type_breakdown[t] = type_breakdown.get(t, 0) + 1

        history_items = [
            {
                "id": l.id,
                "reminder_id": l.reminder_id,
                "title": l.title,
                "reminder_type": l.reminder_type,
                "action_taken": l.action_taken,
                "scheduled_time": l.scheduled_time,
                "triggered_at": l.triggered_at.isoformat(),
                "completed_at": l.completed_at.isoformat() if l.completed_at else None,
            }
            for l in logs[:50]
        ]

        return {
            "period_days": days,
            "total_triggered": total_triggered,
            "completed_count": completed_count,
            "snoozed_count": snoozed_count,
            "missed_count": missed_count,
            "completion_rate_pct": completion_rate,
            "type_breakdown": type_breakdown,
            "logs": history_items,
        }

    def check_due_reminders(self, db: Session, user_id: str) -> List[Dict[str, Any]]:
        """
        Check active reminders that match current time or are active for real-time notification triggers.
        """
        now = datetime.now()
        current_time_str = now.strftime("%H:%M")

        reminders = (
            db.query(SmartReminder)
            .filter(SmartReminder.user_id == user_id, SmartReminder.is_active == True)
            .all()
        )

        due = []
        for r in reminders:
            # Check if reminder time matches current minute or within 5-minute window
            # For real-time polling, return all active reminders with state indicator
            is_due_now = (r.scheduled_time == current_time_str)
            due.append({
                "id": r.id,
                "title": r.title,
                "reminder_type": r.reminder_type,
                "scheduled_time": r.scheduled_time,
                "note": r.note,
                "sound_enabled": r.sound_enabled,
                "is_due_now": is_due_now,
            })

        return due


# Singleton instance
reminder_service = ReminderService()

"""
MindCare AI — Crisis Service
Handles crisis detection, alerting, and admin management of crisis events.
"""
from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from app.ai.crisis_detector import crisis_detector
from app.models.journal import EmergencyAlert
from app.utils.logger import logger


class CrisisService:
    """Manages the full crisis detection and alert lifecycle."""

    def check_and_handle(
        self, db: Session, user_id: str, text: str, session_id: str
    ) -> dict:
        """
        Run crisis detection on the user's message.
        If a crisis is detected, log an EmergencyAlert to the database.

        Returns the crisis detection result dict.
        """
        result = crisis_detector.detect(text)

        if result["is_crisis"]:
            # Persist alert
            alert = EmergencyAlert(
                user_id=user_id,
                trigger_message=text[:1000],  # Truncate to DB limit
                flagged_keywords=", ".join(result["matched_keywords"]),
                severity=result["severity"],
                risk_type=result.get("risk_type"),
            )
            db.add(alert)
            db.commit()

            logger.warning(
                f"Crisis alert saved | user={user_id} severity={result['severity']} "
                f"session={session_id} keywords={result['matched_keywords']} risk_type={result.get('risk_type')}"
            )

            # Trigger emergency protocols if High or Critical risk is matched
            if result["severity"] in ("critical", "high"):
                logger.warning(
                    f"\n=======================================================\n"
                    f"[EMERGENCY PROTOCOL TRIGGERED] \n"
                    f"Simulated notification dispatched to emergency contacts for user {user_id}.\n"
                    f"Reason: {result['severity'].upper()} severity {result.get('risk_type', '').upper()} risk detected.\n"
                    f"=======================================================\n"
                )

        return result

    def get_alerts(
        self, db: Session, user_id: Optional[str] = None, limit: int = 100
    ) -> List[EmergencyAlert]:
        """
        Fetch crisis alerts.
        Pass user_id to filter by user; pass None to get all (admin use).
        """
        query = db.query(EmergencyAlert)
        if user_id:
            query = query.filter(EmergencyAlert.user_id == user_id)
        return (
            query.order_by(EmergencyAlert.created_at.desc()).limit(limit).all()
        )

    def resolve_alert(self, db: Session, alert_id: str) -> Optional[EmergencyAlert]:
        """Mark a crisis alert as resolved (admin action)."""
        alert = db.query(EmergencyAlert).filter(EmergencyAlert.id == alert_id).first()
        if not alert:
            return None
        alert.resolved = True
        db.commit()
        db.refresh(alert)
        logger.info(f"Crisis alert resolved: {alert_id}")
        return alert


# Module-level singleton
crisis_service = CrisisService()

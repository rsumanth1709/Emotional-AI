"""
MindCare AI — Admin Routes
Protected endpoints accessible only to admin users.
"""
from datetime import date, datetime
from typing import Annotated, List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.chat import Chat
from app.models.journal import EmergencyAlert
from app.models.user import User
from app.schemas.dashboard import AdminAlertRow, AdminDashboardResponse, AdminUserRow
from app.services.crisis_service import crisis_service
from app.utils.security import get_admin_user

router = APIRouter(prefix="/admin", tags=["Admin"])

DBDep = Annotated[Session, Depends(get_db)]
AdminUser = Annotated[User, Depends(get_admin_user)]


@router.get("/dashboard", response_model=AdminDashboardResponse)
def admin_dashboard(current_admin: AdminUser, db: DBDep):
    """Full admin dashboard: users, crisis alerts, usage stats."""
    users = db.query(User).order_by(User.created_at.desc()).all()
    total_chats = db.query(Chat).count()
    today = date.today()
    crisis_today = (
        db.query(EmergencyAlert)
        .filter(EmergencyAlert.created_at >= datetime(today.year, today.month, today.day))
        .count()
    )
    alerts = crisis_service.get_alerts(db, user_id=None, limit=100)

    user_rows = []
    for u in users:
        chat_count = db.query(Chat).filter(Chat.user_id == u.id).count()
        user_rows.append(AdminUserRow(
            id=u.id,
            email=u.email,
            username=u.username,
            full_name=u.full_name,
            is_active=u.is_active,
            is_admin=u.is_admin,
            chat_count=chat_count,
            created_at=u.created_at.isoformat(),
        ))

    alert_rows = []
    for a in alerts:
        user = db.query(User).filter(User.id == a.user_id).first()
        alert_rows.append(AdminAlertRow(
            id=a.id,
            user_id=a.user_id,
            username=user.username if user else "deleted",
            trigger_message=a.trigger_message[:120],
            flagged_keywords=a.flagged_keywords,
            severity=a.severity,
            resolved=a.resolved,
            created_at=a.created_at.isoformat(),
        ))

    return AdminDashboardResponse(
        total_users=len(users),
        total_chats=total_chats,
        crisis_alerts_today=crisis_today,
        users=user_rows,
        alerts=alert_rows,
    )


@router.post("/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: str, current_admin: AdminUser, db: DBDep):
    """Mark a crisis alert as resolved."""
    alert = crisis_service.resolve_alert(db, alert_id)
    if not alert:
        return {"message": "Alert not found"}
    return {"message": "Alert resolved", "alert_id": alert_id}

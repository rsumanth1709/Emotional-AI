"""
MindCare AI — User RBAC & Personal Mental Health Data Routes
Endpoints for profile, consents, data export, account deletion, and user dashboard.
Enforces strict resource-level ownership: users can ONLY access their own records.
"""
from datetime import datetime, timedelta
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.chat import Chat
from app.models.emotion import EmotionRecord, MoodEntry
from app.models.journal import JournalEntry
from app.models.rbac import ProfessionalAssignment
from app.models.security import ConsentRecord
from app.models.user import User
from app.schemas.auth import (
    ConsentCreateRequest,
    ConsentResponse,
    UserResponse,
    UserUpdate,
)
from app.services.auth_service import auth_service
from app.services.rbac_service import rbac_service
from app.utils.security import get_current_active_user, require_permission

router = APIRouter(prefix="/api/user", tags=["User Operations"])

DBSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


# ── Profile Management ─────────────────────────────────────────────────────
@router.get("/profile", response_model=UserResponse, summary="Get user profile")
def get_user_profile(current_user: CurrentUser, db: DBSession) -> UserResponse:
    return auth_service.build_user_response(db, current_user)


@router.patch("/profile", response_model=UserResponse, summary="Update user profile")
def patch_user_profile(data: UserUpdate, current_user: CurrentUser, db: DBSession) -> UserResponse:
    updated = auth_service.update_user(db=db, user_id=current_user.id, data=data)
    return auth_service.build_user_response(db, updated)


# ── Personal User Dashboard ────────────────────────────────────────────────
@router.get("/dashboard", summary="Personalized User Dashboard")
def get_user_dashboard(current_user: CurrentUser, db: DBSession):
    """
    Returns personalized mood metrics, recent emotions, and active data consents.
    Strictly isolated to current_user.
    """
    total_chats = db.query(Chat).filter(Chat.user_id == current_user.id).count()
    total_journals = db.query(JournalEntry).filter(JournalEntry.user_id == current_user.id).count()
    recent_moods = (
        db.query(MoodEntry)
        .filter(MoodEntry.user_id == current_user.id)
        .order_by(MoodEntry.date.desc())
        .limit(7)
        .all()
    )
    recent_emotions = (
        db.query(EmotionRecord)
        .filter(EmotionRecord.user_id == current_user.id)
        .order_by(EmotionRecord.recorded_at.desc())
        .limit(10)
        .all()
    )
    active_consents_count = (
        db.query(ConsentRecord)
        .filter(
            ConsentRecord.user_id == current_user.id,
            ConsentRecord.granted == True,
            ConsentRecord.revoked_at.is_(None),
        )
        .count()
    )

    return {
        "user_id": current_user.id,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "xp": current_user.xp,
        "level": current_user.level,
        "total_chats": total_chats,
        "total_journals": total_journals,
        "active_sharing_consents": active_consents_count,
        "recent_moods": [
            {
                "id": m.id,
                "mood_score": m.mood_score,
                "dominant_emotion": getattr(m, "dominant_emotion", "Neutral"),
                "date": m.date.isoformat() if m.date else None,
            }
            for m in recent_moods
        ],
        "recent_emotions": [
            {
                "emotion": e.emotion,
                "confidence": e.confidence,
                "sentiment": e.sentiment,
                "timestamp": e.recorded_at.isoformat() if e.recorded_at else None,
            }
            for e in recent_emotions
        ],
    }


# ── Granular Data Sharing Consents ─────────────────────────────────────────
@router.get("/consents", response_model=List[ConsentResponse], summary="List authorized data-sharing consents")
def list_user_consents(current_user: CurrentUser, db: DBSession) -> List[ConsentResponse]:
    """View all data-sharing authorizations granted by the user."""
    consents = (
        db.query(ConsentRecord)
        .filter(ConsentRecord.user_id == current_user.id)
        .order_by(ConsentRecord.granted_at.desc())
        .all()
    )
    return [ConsentResponse.model_validate(c) for c in consents]


@router.post("/consents", response_model=ConsentResponse, status_code=status.HTTP_201_CREATED, summary="Grant data-sharing authorization")
def create_user_consent(data: ConsentCreateRequest, current_user: CurrentUser, db: DBSession) -> ConsentResponse:
    """Explicitly authorize sharing of scoped wellness data with a professional."""
    expires_at = None
    if data.expires_days:
        expires_at = datetime.utcnow() + timedelta(days=data.expires_days)

    import uuid as _uuid_gen
    consent = ConsentRecord(
        user_id=current_user.id,
        pseudonymous_user_id=f"usr_{_uuid_gen.uuid4().hex[:8]}",
        consent_type="clinician_sharing",
        data_category=data.data_category,
        authorized_recipient=data.authorized_recipient,
        purpose=data.purpose,
        granted=True,
        granted_at=datetime.utcnow(),
        expires_at=expires_at,
    )
    db.add(consent)
    db.commit()
    db.refresh(consent)

    # If authorized recipient is a specific professional user, establish/update assignment
    if data.authorized_recipient != "all_assigned":
        prof_user = db.query(User).filter(User.id == data.authorized_recipient).first()
        if prof_user:
            assign = (
                db.query(ProfessionalAssignment)
                .filter(
                    ProfessionalAssignment.professional_id == prof_user.id,
                    ProfessionalAssignment.user_id == current_user.id,
                )
                .first()
            )
            if not assign:
                assign = ProfessionalAssignment(
                    professional_id=prof_user.id,
                    user_id=current_user.id,
                    status="ACTIVE",
                    consent_id=consent.id,
                )
                db.add(assign)
            else:
                assign.status = "ACTIVE"
                assign.consent_id = consent.id
                assign.ended_at = None
            db.commit()

    rbac_service.log_audit_event(
        db=db,
        actor_user_id=current_user.id,
        action="CONSENT_GRANTED",
        resource_type="CONSENT",
        resource_id=consent.id,
        outcome="SUCCESS",
        details=f"category={data.data_category}, recipient={data.authorized_recipient}",
    )
    return ConsentResponse.model_validate(consent)


@router.delete("/consents/{consent_id}", summary="Revoke data-sharing authorization")
def revoke_user_consent(consent_id: str, current_user: CurrentUser, db: DBSession):
    """
    Revoke a data-sharing permission.
    Immediately terminates future professional access to that data category.
    """
    consent = (
        db.query(ConsentRecord)
        .filter(ConsentRecord.id == consent_id, ConsentRecord.user_id == current_user.id)
        .first()
    )
    if not consent:
        raise HTTPException(status_code=404, detail="Consent record not found.")

    consent.revoked_at = datetime.utcnow()
    consent.granted = False

    # Also end active assignment if tied to this consent
    db.query(ProfessionalAssignment).filter(
        ProfessionalAssignment.consent_id == consent_id
    ).update({"status": "REVOKED", "ended_at": datetime.utcnow()})

    db.commit()

    rbac_service.log_audit_event(
        db=db,
        actor_user_id=current_user.id,
        action="CONSENT_REVOKED",
        resource_type="CONSENT",
        resource_id=consent_id,
        outcome="SUCCESS",
    )
    return {"success": True, "message": "Consent successfully revoked. Sharing terminated."}


# ── GDPR / HIPAA Data Export ───────────────────────────────────────────────
@router.get("/export", summary="Export personal mental health data")
def export_user_data(current_user: CurrentUser, db: DBSession):
    """
    Export all personal mental health records, conversations, journals, and analytics
    in structured JSON format.
    """
    chats = db.query(Chat).filter(Chat.user_id == current_user.id).order_by(Chat.created_at.asc()).all()
    journals = db.query(JournalEntry).filter(JournalEntry.user_id == current_user.id).order_by(JournalEntry.created_at.asc()).all()
    moods = db.query(MoodEntry).filter(MoodEntry.user_id == current_user.id).order_by(MoodEntry.date.asc()).all()
    emotions = db.query(EmotionRecord).filter(EmotionRecord.user_id == current_user.id).order_by(EmotionRecord.recorded_at.asc()).all()
    consents = db.query(ConsentRecord).filter(ConsentRecord.user_id == current_user.id).all()

    rbac_service.log_audit_event(
        db=db,
        actor_user_id=current_user.id,
        action="DATA_EXPORTED",
        resource_type="USER",
        resource_id=current_user.id,
        outcome="SUCCESS",
    )

    return {
        "export_metadata": {
            "user_id": current_user.id,
            "email": current_user.email,
            "username": current_user.username,
            "exported_at": datetime.utcnow().isoformat(),
            "compliance": "GDPR / HIPAA Self-Service Access",
        },
        "chats": [
            {
                "id": c.id,
                "session_id": c.session_id,
                "role": c.role,
                "content": c.content,
                "emotion": c.emotion,
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c in chats
        ],
        "journals": [
            {
                "id": j.id,
                "title": j.title,
                "content": j.content,
                "summary": j.summary,
                "emotion_tag": j.emotion_tag,
                "mood_score": j.mood_score,
                "created_at": j.created_at.isoformat() if j.created_at else None,
            }
            for j in journals
        ],
        "mood_history": [
            {
                "id": m.id,
                "score": m.mood_score,
                "dominant_emotion": getattr(m, "dominant_emotion", "Neutral"),
                "date": m.date.isoformat() if m.date else None,
            }
            for m in moods
        ],
        "emotion_history": [
            {
                "emotion": e.emotion,
                "confidence": e.confidence,
                "stress_score": e.stress_score,
                "timestamp": e.recorded_at.isoformat() if e.recorded_at else None,
            }
            for e in emotions
        ],
        "consents": [
            {
                "id": cn.id,
                "data_category": cn.data_category,
                "authorized_recipient": cn.authorized_recipient,
                "granted_at": cn.granted_at.isoformat() if cn.granted_at else None,
                "revoked_at": cn.revoked_at.isoformat() if cn.revoked_at else None,
            }
            for cn in consents
        ],
    }


# ── Account Deletion ───────────────────────────────────────────────────────
@router.delete("/account", summary="Delete personal account and records")
def delete_user_account(current_user: CurrentUser, db: DBSession):
    """
    Deactivates user account, terminates sessions, and schedules permanent record purging.
    """
    auth_service.delete_user(db=db, user_id=current_user.id)
    return {
        "success": True,
        "message": "Your account has been deactivated. Data retention purge scheduled.",
    }

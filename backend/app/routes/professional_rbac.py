"""
MindCare AI — Healthcare Professional / Counselor Routes
Enforces:
- Professional verification check (VERIFIED status only).
- Active assignment & non-revoked consent validation per client.
- Scoped wellness summaries and mood trends (Minimum Necessary Principle).
- Creation and retrieval of clinical session notes.
"""
from datetime import datetime
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.emotion import EmotionRecord, MoodEntry
from app.models.wellness import DailyWellnessGoal
from app.models.rbac import (
    ProfessionalAssignment,
    ProfessionalNote,
    ProfessionalProfile,
)
from app.models.security import ConsentRecord
from app.models.user import User
from app.schemas.auth import (
    ClientSharedSummaryResponse,
    ProfessionalApplyRequest,
    ProfessionalAssignmentResponse,
    ProfessionalNoteCreate,
    ProfessionalNoteResponse,
    ProfessionalProfileResponse,
)
from app.services.rbac_service import rbac_service
from app.utils.security import (
    get_current_active_user,
    get_verified_professional_user,
)

router = APIRouter(prefix="/api/professional", tags=["Healthcare Professional"])

DBSession = Annotated[Session, Depends(get_db)]
ActiveUser = Annotated[User, Depends(get_current_active_user)]
VerifiedProfessional = Annotated[User, Depends(get_verified_professional_user)]


# ── Credential Application ─────────────────────────────────────────────────
@router.post(
    "/apply",
    response_model=ProfessionalProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Apply for Healthcare Professional verification",
)
def apply_for_professional_verification(
    data: ProfessionalApplyRequest,
    current_user: ActiveUser,
    db: DBSession,
) -> ProfessionalProfileResponse:
    """Submit clinical licensure and professional background for review."""
    profile = rbac_service.apply_for_professional(
        db=db,
        user_id=current_user.id,
        credentials_reference=data.credentials_reference,
        license_number=data.license_number,
        license_issuer=data.license_issuer,
        specialty=data.specialty,
        bio=data.bio,
    )
    return ProfessionalProfileResponse.model_validate(profile)


@router.get(
    "/profile",
    response_model=ProfessionalProfileResponse,
    summary="View professional profile and verification status",
)
def get_professional_profile(
    current_user: ActiveUser,
    db: DBSession,
) -> ProfessionalProfileResponse:
    """Retrieve applicant or verified professional profile."""
    profile = (
        db.query(ProfessionalProfile)
        .filter(ProfessionalProfile.user_id == current_user.id)
        .first()
    )
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No professional profile found. Please submit an application.",
        )
    return ProfessionalProfileResponse.model_validate(profile)


# ── Assigned Clients & Casework ────────────────────────────────────────────
@router.get(
    "/assignments",
    response_model=List[ProfessionalAssignmentResponse],
    summary="List assigned clients with active consents",
)
def list_assigned_clients(
    current_prof: VerifiedProfessional,
    db: DBSession,
) -> List[ProfessionalAssignmentResponse]:
    """
    Returns only clients who have an ACTIVE assignment and non-revoked consent.
    Does NOT return any unauthorized users.
    """
    assignments = (
        db.query(ProfessionalAssignment)
        .filter(
            ProfessionalAssignment.professional_id == current_prof.id,
            ProfessionalAssignment.status == "ACTIVE",
        )
        .order_by(ProfessionalAssignment.created_at.desc())
        .all()
    )

    results = []
    now = datetime.utcnow()
    for a in assignments:
        # Verify consent is still active
        consent = (
            db.query(ConsentRecord)
            .filter(
                ConsentRecord.user_id == a.user_id,
                (ConsentRecord.authorized_recipient == current_prof.id)
                | (ConsentRecord.authorized_recipient == "all_assigned"),
                ConsentRecord.granted == True,
                ConsentRecord.revoked_at.is_(None),
                (ConsentRecord.expires_at.is_(None) | (ConsentRecord.expires_at > now)),
            )
            .first()
        )
        if not consent:
            continue

        client_user = db.query(User).filter(User.id == a.user_id).first()
        results.append(
            ProfessionalAssignmentResponse(
                id=a.id,
                professional_id=a.professional_id,
                user_id=a.user_id,
                client_name=client_user.full_name or client_user.username if client_user else "Client",
                client_email=client_user.email if client_user else None,
                status=a.status,
                consent_id=a.consent_id,
                created_at=a.created_at,
                ended_at=a.ended_at,
            )
        )
    return results


# ── Scoped Shared Summary (Minimum Necessary Principle) ────────────────────
@router.get(
    "/clients/{client_id}/shared-summary",
    response_model=ClientSharedSummaryResponse,
    summary="Access consented client wellness summary and mood trends",
)
def get_client_shared_summary(
    client_id: str,
    current_prof: VerifiedProfessional,
    db: DBSession,
) -> ClientSharedSummaryResponse:
    """
    Fetch consented wellness summaries, mood trends, and AI-generated insights.
    Strictly prohibits viewing unrestricted raw chat conversations without separate consent.
    """
    # 1. Enforce active consent and assignment check
    has_consent = rbac_service.verify_professional_client_consent(
        db=db,
        professional_id=current_prof.id,
        client_id=client_id,
        required_category="wellness_summary",
    )
    if not has_consent:
        rbac_service.log_audit_event(
            db=db,
            actor_user_id=current_prof.id,
            action="UNAUTHORIZED_CLIENT_ACCESS_ATTEMPT",
            resource_type="CLIENT",
            resource_id=client_id,
            outcome="DENIED",
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: No active, non-revoked consent authorization for this client.",
        )

    client = db.query(User).filter(User.id == client_id).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found.")

    # 2. Minimum necessary data retrieval
    recent_moods = (
        db.query(MoodEntry)
        .filter(MoodEntry.user_id == client_id)
        .order_by(MoodEntry.date.desc())
        .limit(14)
        .all()
    )
    avg_mood = (
        sum(m.mood_score for m in recent_moods) / len(recent_moods)
        if recent_moods
        else 5.0
    )

    recent_emotions = (
        db.query(EmotionRecord)
        .filter(EmotionRecord.user_id == client_id)
        .order_by(EmotionRecord.recorded_at.desc())
        .limit(20)
        .all()
    )
    emotion_counts = {}
    for e in recent_emotions:
        emotion_counts[e.emotion] = emotion_counts.get(e.emotion, 0) + 1

    goals = (
        db.query(DailyWellnessGoal)
        .filter(DailyWellnessGoal.user_id == client_id)
        .first()
    )

    insights = [
        f"14-day average mood score: {avg_mood:.1f} / 10",
        f"Primary expressed emotion: {max(emotion_counts, key=emotion_counts.get) if emotion_counts else 'Neutral'}",
        "AI estimates provide supplementary mood context and should not substitute clinical judgment.",
    ]

    rbac_service.log_audit_event(
        db=db,
        actor_user_id=current_prof.id,
        action="CLIENT_SHARED_SUMMARY_ACCESSED",
        resource_type="CLIENT",
        resource_id=client_id,
        outcome="SUCCESS",
    )

    return ClientSharedSummaryResponse(
        client_id=client.id,
        client_name=client.full_name or client.username,
        client_email=client.email,
        data_category_authorized="wellness_summary",
        mood_summary={
            "average_score": round(avg_mood, 2),
            "total_entries": len(recent_moods),
            "recent_scores": [m.mood_score for m in recent_moods[:7]],
        },
        recent_emotion_trends=[
            {"emotion": k, "frequency": v} for k, v in emotion_counts.items()
        ],
        wellness_goals_summary={
            "water_target": getattr(goals, "target_water_ml", 2000) if goals else 2000,
            "sleep_target_hours": getattr(goals, "target_sleep_hours", 8.0) if goals else 8.0,
        } if goals else None,
        ai_insights=insights,
        generated_at=datetime.utcnow().isoformat(),
    )


# ── Professional Session Notes ─────────────────────────────────────────────
@router.post(
    "/clients/{client_id}/notes",
    response_model=ProfessionalNoteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add clinical session notes for assigned client",
)
def create_client_note(
    client_id: str,
    data: ProfessionalNoteCreate,
    current_prof: VerifiedProfessional,
    db: DBSession,
) -> ProfessionalNoteResponse:
    """Create a confidential consultation note for an assigned client."""
    has_consent = rbac_service.verify_professional_client_consent(
        db=db,
        professional_id=current_prof.id,
        client_id=client_id,
        required_category="wellness_summary",
    )
    if not has_consent:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot record notes: Client is not assigned or has revoked sharing consent.",
        )

    note = ProfessionalNote(
        professional_id=current_prof.id,
        client_id=client_id,
        title=data.title,
        notes_text=data.notes_text,
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    rbac_service.log_audit_event(
        db=db,
        actor_user_id=current_prof.id,
        action="PROFESSIONAL_NOTE_CREATED",
        resource_type="PROFESSIONAL_NOTE",
        resource_id=note.id,
        outcome="SUCCESS",
    )
    return ProfessionalNoteResponse.model_validate(note)


@router.get(
    "/clients/{client_id}/notes",
    response_model=List[ProfessionalNoteResponse],
    summary="View consultation notes for assigned client",
)
def get_client_notes(
    client_id: str,
    current_prof: VerifiedProfessional,
    db: DBSession,
) -> List[ProfessionalNoteResponse]:
    """Retrieve all consultation notes authored by this professional for the client."""
    notes = (
        db.query(ProfessionalNote)
        .filter(
            ProfessionalNote.professional_id == current_prof.id,
            ProfessionalNote.client_id == client_id,
        )
        .order_by(ProfessionalNote.created_at.desc())
        .all()
    )
    return [ProfessionalNoteResponse.model_validate(n) for n in notes]


# ── Terminate Professional Relationship ────────────────────────────────────
@router.post(
    "/clients/{client_id}/terminate",
    summary="End assigned professional care relationship",
)
def terminate_assignment(
    client_id: str,
    current_prof: VerifiedProfessional,
    db: DBSession,
):
    """End professional assignment and revoke associated data access."""
    assignment = (
        db.query(ProfessionalAssignment)
        .filter(
            ProfessionalAssignment.professional_id == current_prof.id,
            ProfessionalAssignment.user_id == client_id,
            ProfessionalAssignment.status == "ACTIVE",
        )
        .first()
    )
    if not assignment:
        raise HTTPException(status_code=404, detail="No active assignment found for this client.")

    assignment.status = "COMPLETED"
    assignment.ended_at = datetime.utcnow()
    db.commit()

    rbac_service.log_audit_event(
        db=db,
        actor_user_id=current_prof.id,
        action="PROFESSIONAL_ASSIGNMENT_TERMINATED",
        resource_type="CLIENT",
        resource_id=client_id,
        outcome="SUCCESS",
    )
    return {"success": True, "message": "Professional relationship concluded."}

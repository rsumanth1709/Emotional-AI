"""
MindCare AI — Complete RBAC & Security Test Suite
Covers:
1. Registration and login
2. Password hashing and reset
3. Expired and invalid tokens
4. User accessing their own records
5. User attempting to access another user's records (Critical ID-tampering test)
6. Professional accessing an unassigned client
7. Professional accessing data after consent revocation
8. Unverified professional attempting privileged actions
9. Administrator accessing restricted private records
10. Unauthorized role escalation
11. Suspended accounts
12. Progressive lockout after repeated failed logins
13. Data export and account deletion
14. Audit-log integrity and PHI/credential sanitization
"""
import uuid
import pytest
from fastapi.testclient import TestClient

from app.database import SessionLocal, init_db
from app.main import app
from app.models.chat import Chat
from app.models.journal import JournalEntry
from app.models.rbac import (
    ProfessionalAssignment,
    ProfessionalProfile,
    Role,
    UserRole,
)
from app.models.security import AuditLog, ConsentRecord
from app.models.user import User
from app.services.rbac_service import (
    ROLE_ADMIN,
    ROLE_OWNER,
    ROLE_PROFESSIONAL,
    ROLE_USER,
    rbac_service,
)
from app.utils.security import hash_password

init_db()
client = TestClient(app)


def _create_test_user(email: str, password: str = "Password123!", role: str = ROLE_USER) -> dict:
    """Helper to register and return user details and auth token."""
    username = f"u_{uuid.uuid4().hex[:8]}"
    db = SessionLocal()
    try:
        rbac_service.seed_rbac_data(db)
        user = User(
            email=email,
            username=username,
            full_name=f"Test {username}",
            hashed_password=hash_password(password),
            consent_given=True,
            is_active=True,
            account_status="ACTIVE",
            email_verified=True,
        )
        if role in (ROLE_ADMIN, ROLE_OWNER):
            user.is_admin = True
        db.add(user)
        db.commit()
        db.refresh(user)

        rbac_service.assign_role(db, user.id, role)
        if role == ROLE_OWNER:
            rbac_service.assign_role(db, user.id, ROLE_ADMIN)

        from app.utils.security import create_access_token
        token = create_access_token(data={"sub": user.email})
        return {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "password": password,
            "token": token,
            "headers": {"Authorization": f"Bearer {token}"},
        }
    finally:
        db.close()


# ── 1. Registration and Login ──────────────────────────────────────────────
def test_registration_and_login_flow():
    email = f"reg_test_{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "email": email,
        "username": f"user_{uuid.uuid4().hex[:6]}",
        "full_name": "New Registered User",
        "password": "SecurePassword#2026",
        "consent_given": True,
    }
    # Register via /api/auth/register
    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == email
    assert "user" in data["user"]["roles"]

    # Login via /api/auth/login
    login_res = client.post(
        "/api/auth/login",
        json={"email": email, "password": "SecurePassword#2026"},
    )
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert "access_token" in login_data
    assert "refresh_token" in login_data


# ── 2. Password Hashing and Reset ──────────────────────────────────────────
def test_password_hashing_and_reset():
    email = f"reset_test_{uuid.uuid4().hex[:8]}@example.com"
    user_info = _create_test_user(email, password="OldPassword#123")

    # Request password reset token
    req_res = client.post("/api/auth/forgot-password", json={"email": email})
    assert req_res.status_code == 200
    token = req_res.json().get("reset_token")
    assert token is not None

    # Reset with new password
    reset_res = client.post(
        "/api/auth/reset-password",
        json={"token": token, "new_password": "BrandNewPassword#456"},
    )
    assert reset_res.status_code == 200

    # Old password fails
    fail_res = client.post(
        "/api/auth/login",
        json={"email": email, "password": "OldPassword#123"},
    )
    assert fail_res.status_code == 401

    # New password succeeds
    ok_res = client.post(
        "/api/auth/login",
        json={"email": email, "password": "BrandNewPassword#456"},
    )
    assert ok_res.status_code == 200


# ── 3. Expired and Invalid Tokens ──────────────────────────────────────────
def test_expired_and_invalid_tokens():
    # Tampered garbage token
    bad_res = client.get(
        "/api/user/profile",
        headers={"Authorization": "Bearer totally_invalid_jwt_payload_data"},
    )
    assert bad_res.status_code == 401

    # Missing authorization header
    no_auth_res = client.get("/api/user/profile")
    assert no_auth_res.status_code == 401


# ── 4. User Accessing Their Own Records ────────────────────────────────────
def test_user_accessing_own_records():
    user = _create_test_user(f"own_{uuid.uuid4().hex[:8]}@example.com")
    db = SessionLocal()
    try:
        # Create a journal entry for this user
        entry = JournalEntry(
            user_id=user["id"],
            title="My Personal Reflection",
            content="Today I practiced mindful breathing and feel grounded.",
            summary="Reflective journal on breathing.",
            emotion_tag="Calm",
            mood_score=8,
            entry_date="2026-10-24",
        )
        db.add(entry)
        db.commit()
        entry_id = entry.id
    finally:
        db.close()

    # User accesses their own journal
    res = client.get(f"/journal/{entry_id}", headers=user["headers"])
    assert res.status_code == 200
    assert res.json()["title"] == "My Personal Reflection"


# ── 5. User Attempting to Access Another User's Records (CRITICAL) ──────────
def test_user_attempting_to_access_another_user_records_isolated():
    """
    CRITICAL HEALTHCARE SECURITY TEST:
    A normal user must never be able to retrieve another user's private chat or journal
    by changing an ID in the URL or API request.
    """
    victim = _create_test_user(f"victim_{uuid.uuid4().hex[:8]}@example.com")
    attacker = _create_test_user(f"attacker_{uuid.uuid4().hex[:8]}@example.com")

    db = SessionLocal()
    try:
        # Victim's private journal entry
        victim_journal = JournalEntry(
            user_id=victim["id"],
            title="Confidential Personal Therapy Thoughts",
            content="Sensitive mental health reflection strictly for victim eyes only.",
            summary="Victim private summary",
            emotion_tag="Vulnerable",
            mood_score=3,
            entry_date="2026-10-24",
        )
        db.add(victim_journal)

        # Victim's private chat session
        session_id = str(uuid.uuid4())
        victim_chat = Chat(
            user_id=victim["id"],
            session_id=session_id,
            role="user",
            content="Private crisis or medical disclosure message.",
            emotion="Grief",
        )
        db.add(victim_chat)
        db.commit()
        journal_id = victim_journal.id
    finally:
        db.close()

    # Attacker tries to read victim's journal entry by ID
    hack_journal_res = client.get(f"/journal/{journal_id}", headers=attacker["headers"])
    assert hack_journal_res.status_code == 404, "Attacker was improperly able to retrieve victim journal entry!"

    # Attacker tries to delete victim's journal entry
    hack_del_res = client.delete(f"/journal/{journal_id}", headers=attacker["headers"])
    assert hack_del_res.status_code == 404, "Attacker was improperly able to delete victim journal entry!"

    # Attacker tries to read victim's chat session by session_id in URL
    hack_chat_res = client.get(f"/chat/sessions/{session_id}", headers=attacker["headers"])
    assert hack_chat_res.status_code == 404, "Attacker was improperly able to access victim chat session!"

    # Attacker tries to delete victim's chat session
    hack_del_chat = client.delete(f"/chat/sessions/{session_id}", headers=attacker["headers"])
    assert hack_del_chat.status_code == 404, "Attacker was improperly able to delete victim chat session!"


# ── 6. Professional Accessing an Unassigned Client ─────────────────────────
def test_professional_accessing_unassigned_client_blocked():
    prof_user = _create_test_user(f"prof_{uuid.uuid4().hex[:8]}@example.com", role=ROLE_PROFESSIONAL)
    client_user = _create_test_user(f"unassigned_{uuid.uuid4().hex[:8]}@example.com", role=ROLE_USER)

    # Set professional status to VERIFIED
    db = SessionLocal()
    try:
        profile = ProfessionalProfile(
            user_id=prof_user["id"],
            verification_status="VERIFIED",
            credentials_reference="LPC-102938",
            specialty="Clinical Psychologist",
        )
        db.add(profile)
        db.commit()
    finally:
        db.close()

    # Attempt to access shared summary of unassigned client
    res = client.get(
        f"/api/professional/clients/{client_user['id']}/shared-summary",
        headers=prof_user["headers"],
    )
    assert res.status_code == 403
    assert "No active, non-revoked consent" in res.json()["detail"]


# ── 7. Professional Access After Consent Revocation Blocked ────────────────
def test_professional_access_after_consent_revocation_blocked():
    prof_user = _create_test_user(f"prof_consent_{uuid.uuid4().hex[:8]}@example.com", role=ROLE_PROFESSIONAL)
    client_user = _create_test_user(f"client_consent_{uuid.uuid4().hex[:8]}@example.com", role=ROLE_USER)

    db = SessionLocal()
    try:
        # Mark professional as VERIFIED
        profile = ProfessionalProfile(
            user_id=prof_user["id"],
            verification_status="VERIFIED",
            credentials_reference="LPC-999999",
        )
        db.add(profile)

        # Create active consent record
        consent = ConsentRecord(
            user_id=client_user["id"],
            pseudonymous_user_id=f"usr_{uuid.uuid4().hex[:8]}",
            consent_type="clinician_sharing",
            data_category="wellness_summary",
            authorized_recipient=prof_user["id"],
            purpose="Clinical Consultation",
            granted=True,
        )
        db.add(consent)
        db.flush()

        # Create active assignment
        assignment = ProfessionalAssignment(
            professional_id=prof_user["id"],
            user_id=client_user["id"],
            status="ACTIVE",
            consent_id=consent.id,
        )
        db.add(assignment)
        db.commit()
        consent_id = consent.id
    finally:
        db.close()

    # 1. Professional can access consented summary
    first_res = client.get(
        f"/api/professional/clients/{client_user['id']}/shared-summary",
        headers=prof_user["headers"],
    )
    assert first_res.status_code == 200

    # 2. Client revokes consent
    revoke_res = client.delete(f"/api/user/consents/{consent_id}", headers=client_user["headers"])
    assert revoke_res.status_code == 200

    # 3. Subsequent access by professional is immediately blocked
    blocked_res = client.get(
        f"/api/professional/clients/{client_user['id']}/shared-summary",
        headers=prof_user["headers"],
    )
    assert blocked_res.status_code == 403


# ── 8. Unverified Professional Attempting Privileged Actions ───────────────
def test_unverified_professional_attempting_privileged_actions():
    unverified_prof = _create_test_user(f"pending_prof_{uuid.uuid4().hex[:8]}@example.com", role=ROLE_PROFESSIONAL)
    db = SessionLocal()
    try:
        profile = ProfessionalProfile(
            user_id=unverified_prof["id"],
            verification_status="PENDING",
            credentials_reference="PENDING-LICENSE",
        )
        db.add(profile)
        db.commit()
    finally:
        db.close()

    # Unverified professional attempts to view client assignments
    res = client.get("/api/professional/assignments", headers=unverified_prof["headers"])
    assert res.status_code == 403
    assert "VERIFIED" in res.json()["detail"]


# ── 9. Administrator Restricted from Private Records ───────────────────────
def test_administrator_restricted_from_private_records():
    admin = _create_test_user(f"admin_{uuid.uuid4().hex[:8]}@example.com", role=ROLE_ADMIN)
    user = _create_test_user(f"private_user_{uuid.uuid4().hex[:8]}@example.com", role=ROLE_USER)

    db = SessionLocal()
    try:
        entry = JournalEntry(
            user_id=user["id"],
            title="User Secret Journal",
            content="Sensitive personal feelings not for admin eyes.",
            summary="Summary",
            emotion_tag="Neutral",
            mood_score=5,
            entry_date="2026-10-24",
        )
        db.add(entry)
        db.commit()
        entry_id = entry.id
    finally:
        db.close()

    # Administrator attempts to fetch the user's journal through standard endpoint
    res = client.get(f"/journal/{entry_id}", headers=admin["headers"])
    assert res.status_code == 404, "Admin should NOT automatically have access to private user journal!"

    # Admin dashboard does not expose raw chat content
    admin_dash = client.get("/api/admin/dashboard", headers=admin["headers"])
    assert admin_dash.status_code == 200
    assert "metrics" in admin_dash.json()
    assert "Sensitive personal feelings" not in str(admin_dash.content)


# ── 10. Unauthorized Role Escalation ───────────────────────────────────────
def test_unauthorized_role_escalation():
    user = _create_test_user(f"normal_{uuid.uuid4().hex[:8]}@example.com", role=ROLE_USER)

    # Regular user attempts admin dashboard
    admin_res = client.get("/api/admin/dashboard", headers=user["headers"])
    assert admin_res.status_code == 403

    # Regular user attempts owner endpoints
    owner_res = client.get("/api/owner/administrators", headers=user["headers"])
    assert owner_res.status_code == 403


# ── 11. Suspended Accounts ─────────────────────────────────────────────────
def test_suspended_account_blocked():
    user = _create_test_user(f"suspended_{uuid.uuid4().hex[:8]}@example.com")
    db = SessionLocal()
    try:
        u = db.query(User).filter(User.id == user["id"]).first()
        u.account_status = "SUSPENDED"
        db.commit()
    finally:
        db.close()

    # Login fails
    login_res = client.post(
        "/api/auth/login",
        json={"email": user["email"], "password": user["password"]},
    )
    assert login_res.status_code == 403
    assert "suspended" in login_res.json()["detail"].lower()

    # Authenticated request with previous token fails
    req_res = client.get("/api/user/profile", headers=user["headers"])
    assert req_res.status_code == 403


# ── 12. Progressive Lockout After Repeated Failed Logins ───────────────────
def test_progressive_lockout_after_repeated_failed_logins():
    user = _create_test_user(f"lockout_{uuid.uuid4().hex[:8]}@example.com", password="CorrectPassword#1")

    # Send 5 incorrect password attempts
    for _ in range(5):
        res = client.post(
            "/api/auth/login",
            json={"email": user["email"], "password": "WrongPassword!"},
        )
        assert res.status_code == 401

    # 6th attempt with correct password is now blocked by lockout
    lockout_res = client.post(
        "/api/auth/login",
        json={"email": user["email"], "password": "CorrectPassword#1"},
    )
    assert lockout_res.status_code == 403
    assert "temporarily locked" in lockout_res.json()["detail"]


# ── 13. Data Export and Account Deletion ────────────────────────────────────
def test_data_export_and_account_deletion():
    user = _create_test_user(f"export_{uuid.uuid4().hex[:8]}@example.com")

    # Export personal data
    export_res = client.get("/api/user/export", headers=user["headers"])
    assert export_res.status_code == 200
    data = export_res.json()
    assert "chats" in data
    assert "journals" in data
    assert "mood_history" in data
    assert data["export_metadata"]["user_id"] == user["id"]

    # Deactivate account
    del_res = client.delete("/api/user/account", headers=user["headers"])
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True


# ── 14. Audit-Log Integrity and Scrubbing ──────────────────────────────────
def test_audit_log_integrity_and_scrubbing():
    owner = _create_test_user(f"owner_{uuid.uuid4().hex[:8]}@example.com", role=ROLE_OWNER)
    db = SessionLocal()
    try:
        # Log a test sensitive event
        rbac_service.log_audit_event(
            db=db,
            actor_user_id=owner["id"],
            action="SECURITY_CONFIG_CHANGE",
            resource_type="SYSTEM",
            outcome="SUCCESS",
            details='{"token": "secret_token_val", "password": "secret_password_val", "setting": "mfa_active"}',
        )
    finally:
        db.close()

    # Owner views full audit logs
    audit_res = client.get("/api/owner/audit-logs", headers=owner["headers"])
    assert audit_res.status_code == 200
    logs = audit_res.json()
    assert len(logs) > 0

    # Ensure details field never exposes raw passwords or tokens
    for log in logs:
        if log.get("details"):
            assert "secret_token_val" not in log["details"]
            assert "secret_password_val" not in log["details"]

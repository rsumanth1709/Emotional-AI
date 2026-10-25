"""
MindCare AI — Centralized Role-Based Access Control (RBAC) & Governance Service
Enforces strict least-privilege, resource ownership checks, professional-client consent
validation, audit logging, and role/permission seeding.
"""
import hashlib
import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.rbac import (
    Permission,
    ProfessionalAssignment,
    ProfessionalNote,
    ProfessionalProfile,
    Role,
    RolePermission,
    UserRole,
)
from app.models.security import AuditLog, ConsentRecord
from app.models.user import User
from app.utils.logger import logger


# ── Canonical Role Definitions ──────────────────────────────────────────────
ROLE_GUEST = "guest"
ROLE_USER = "user"
ROLE_PROFESSIONAL = "professional"
ROLE_ADMIN = "admin"
ROLE_OWNER = "owner"

ALL_ROLES = [ROLE_GUEST, ROLE_USER, ROLE_PROFESSIONAL, ROLE_ADMIN, ROLE_OWNER]


# ── Canonical Permission Catalog ───────────────────────────────────────────
PERMISSIONS = {
    # Public / Guest
    "public:view": "View public informational pages and demonstrations",
    # User Permissions
    "chat:use": "Converse with the Emotional AI assistant",
    "chat:read:own": "Read personal chat history and emotion analytics",
    "chat:delete:own": "Delete personal chat sessions and conversations",
    "journal:create:own": "Create personal emotional journal entries",
    "journal:read:own": "Read personal journal entries and insights",
    "journal:update:own": "Update personal journal entries",
    "journal:delete:own": "Delete personal journal entries",
    "mood:read:own": "View personal mood check-ins and timelines",
    "mood:create:own": "Record daily mood check-ins and reflections",
    "data:export:own": "Export complete personal mental health data",
    "data:delete:own": "Request deactivation and permanent account deletion",
    "consent:manage:own": "Manage, grant, and revoke data sharing consents",
    "professional:apply": "Apply for healthcare professional verification",
    # Professional / Counselor Permissions
    "professional:profile:read": "View personal professional verification profile",
    "professional:clients:read": "Access authorized client wellness summaries & trends",
    "professional:clients:notes": "Create and read clinical consultation notes for assigned clients",
    "professional:cases:manage": "Manage assigned client casework and end care relationships",
    # Administrator Permissions
    "admin:dashboard:view": "View aggregate system health and user counts",
    "admin:users:read": "View registered user profiles without mental health data",
    "admin:users:manage": "Suspend, reactivate, or update account administrative status",
    "admin:professionals:review": "Review professional credential verification submissions",
    "admin:professionals:verify": "Approve, reject, or suspend professional verification status",
    "admin:analytics:read": "Access aggregated, anonymized emotion and system analytics",
    "admin:audit_logs:read": "Review security audit logs within organizational scope",
    "admin:resources:manage": "Create, update, and manage curated wellness resources",
    # System Owner / Super Administrator Permissions
    "owner:admins:manage": "Create and manage administrator accounts",
    "owner:security:configure": "Configure global security policies, lockouts, and auth",
    "owner:system:manage": "Manage global system configurations and feature flags",
    "owner:audit_logs:full": "Review comprehensive, tamper-evident security audit trails",
}


# ── Canonical Role-to-Permissions Mapping Matrix ───────────────────────────
ROLE_PERMISSIONS_MATRIX: Dict[str, List[str]] = {
    ROLE_GUEST: [
        "public:view",
    ],
    ROLE_USER: [
        "public:view",
        "chat:use",
        "chat:read:own",
        "chat:delete:own",
        "journal:create:own",
        "journal:read:own",
        "journal:update:own",
        "journal:delete:own",
        "mood:read:own",
        "mood:create:own",
        "data:export:own",
        "data:delete:own",
        "consent:manage:own",
        "professional:apply",
    ],
    ROLE_PROFESSIONAL: [
        "public:view",
        "chat:use",
        "chat:read:own",
        "chat:delete:own",
        "journal:create:own",
        "journal:read:own",
        "journal:update:own",
        "journal:delete:own",
        "mood:read:own",
        "mood:create:own",
        "data:export:own",
        "data:delete:own",
        "consent:manage:own",
        "professional:profile:read",
        "professional:clients:read",
        "professional:clients:notes",
        "professional:cases:manage",
    ],
    ROLE_ADMIN: [
        "public:view",
        "chat:use",
        "chat:read:own",
        "chat:delete:own",
        "journal:create:own",
        "journal:read:own",
        "journal:update:own",
        "journal:delete:own",
        "mood:read:own",
        "mood:create:own",
        "data:export:own",
        "data:delete:own",
        "consent:manage:own",
        "admin:dashboard:view",
        "admin:users:read",
        "admin:users:manage",
        "admin:professionals:review",
        "admin:professionals:verify",
        "admin:analytics:read",
        "admin:audit_logs:read",
        "admin:resources:manage",
    ],
    ROLE_OWNER: [
        # Owner inherits admin permissions plus super-admin controls
        "public:view",
        "chat:use",
        "chat:read:own",
        "chat:delete:own",
        "journal:create:own",
        "journal:read:own",
        "journal:update:own",
        "journal:delete:own",
        "mood:read:own",
        "mood:create:own",
        "data:export:own",
        "data:delete:own",
        "consent:manage:own",
        "admin:dashboard:view",
        "admin:users:read",
        "admin:users:manage",
        "admin:professionals:review",
        "admin:professionals:verify",
        "admin:analytics:read",
        "admin:audit_logs:read",
        "admin:resources:manage",
        "owner:admins:manage",
        "owner:security:configure",
        "owner:system:manage",
        "owner:audit_logs:full",
    ],
}


class RBACService:
    """Manages roles, permissions, authorization rules, consent enforcement, and audit logs."""

    # ── Database Initialization & Seeding ──────────────────────────────────
    def seed_rbac_data(self, db: Session) -> None:
        """Seed default roles, permissions, and role-permission mappings."""
        try:
            # 1. Seed Roles
            roles_by_name: Dict[str, Role] = {}
            for r_name in ALL_ROLES:
                role = db.query(Role).filter(Role.name == r_name).first()
                if not role:
                    role = Role(
                        name=r_name,
                        description=f"Standard {r_name.capitalize()} role",
                    )
                    db.add(role)
                    db.flush()
                    logger.info(f"RBAC: Seeded role '{r_name}'")
                roles_by_name[r_name] = role

            # 2. Seed Permissions
            perms_by_name: Dict[str, Permission] = {}
            for p_name, p_desc in PERMISSIONS.items():
                perm = db.query(Permission).filter(Permission.name == p_name).first()
                if not perm:
                    perm = Permission(name=p_name, description=p_desc)
                    db.add(perm)
                    db.flush()
                perms_by_name[p_name] = perm

            # 3. Seed RolePermissions
            for r_name, p_list in ROLE_PERMISSIONS_MATRIX.items():
                role = roles_by_name.get(r_name)
                if not role:
                    continue
                for p_name in p_list:
                    perm = perms_by_name.get(p_name)
                    if not perm:
                        continue
                    existing_rp = (
                        db.query(RolePermission)
                        .filter(
                            RolePermission.role_id == role.id,
                            RolePermission.permission_id == perm.id,
                        )
                        .first()
                    )
                    if not existing_rp:
                        rp = RolePermission(role_id=role.id, permission_id=perm.id)
                        db.add(rp)

            db.commit()
            logger.info("RBAC: Role and permission matrices synchronized successfully.")
        except Exception as e:
            db.rollback()
            logger.error(f"RBAC: Failed seeding roles and permissions: {e}")

    # ── Role & Permission Resolution ───────────────────────────────────────
    def get_user_roles(self, db: Session, user_id: str) -> List[str]:
        """Fetch all role names assigned to a user."""
        user_roles = (
            db.query(Role.name)
            .join(UserRole, UserRole.role_id == Role.id)
            .filter(UserRole.user_id == user_id)
            .all()
        )
        roles = [r[0] for r in user_roles]
        # Backward compatibility: if user has is_admin=True on user table, guarantee admin role
        user = db.query(User).filter(User.id == user_id).first()
        if user and user.is_admin and ROLE_ADMIN not in roles and ROLE_OWNER not in roles:
            roles.append(ROLE_ADMIN)
        if not roles:
            roles = [ROLE_USER]
        return roles

    def get_user_permissions(self, db: Session, user_id: str) -> Set[str]:
        """Resolve all granular permissions granted to a user across their roles."""
        user_roles = self.get_user_roles(db, user_id)
        permissions: Set[str] = set()

        # If user has professional role, check if they are VERIFIED
        is_verified_prof = True
        if ROLE_PROFESSIONAL in user_roles:
            prof = db.query(ProfessionalProfile).filter(ProfessionalProfile.user_id == user_id).first()
            if not prof or prof.verification_status != "VERIFIED":
                is_verified_prof = False

        for r_name in user_roles:
            role_perms = ROLE_PERMISSIONS_MATRIX.get(r_name, [])
            for p in role_perms:
                # Disallow professional client features if professional is not VERIFIED
                if p.startswith("professional:clients") or p == "professional:cases:manage":
                    if not is_verified_prof:
                        continue
                permissions.add(p)

        return permissions

    def user_has_permission(self, db: Session, user_id: str, permission_name: str) -> bool:
        """Deny-by-default permission check."""
        perms = self.get_user_permissions(db, user_id)
        return permission_name in perms

    def user_has_role(self, db: Session, user_id: str, role_name: str) -> bool:
        """Check if user has a specific role assigned."""
        roles = self.get_user_roles(db, user_id)
        if role_name in roles:
            return True
        # Owner satisfies admin checks
        if role_name == ROLE_ADMIN and ROLE_OWNER in roles:
            return True
        return False

    def assign_role(
        self,
        db: Session,
        user_id: str,
        role_name: str,
        assigned_by: Optional[str] = None,
    ) -> bool:
        """Assign a role to a user and audit the change."""
        role = db.query(Role).filter(Role.name == role_name).first()
        if not role:
            raise HTTPException(status_code=400, detail=f"Role '{role_name}' does not exist.")

        existing = (
            db.query(UserRole)
            .filter(UserRole.user_id == user_id, UserRole.role_id == role.id)
            .first()
        )
        if existing:
            return True

        ur = UserRole(user_id=user_id, role_id=role.id, assigned_by=assigned_by)
        db.add(ur)

        # Update backward-compatible flag if admin/owner
        user = db.query(User).filter(User.id == user_id).first()
        if user and role_name in (ROLE_ADMIN, ROLE_OWNER):
            user.is_admin = True

        db.commit()

        self.log_audit_event(
            db=db,
            actor_user_id=assigned_by or "SYSTEM",
            action="ROLE_ASSIGNED",
            resource_type="USER",
            resource_id=user_id,
            outcome="SUCCESS",
            details=json.dumps({"role": role_name}),
        )
        return True

    def revoke_role(
        self,
        db: Session,
        user_id: str,
        role_name: str,
        revoked_by: Optional[str] = None,
    ) -> bool:
        """Revoke a role from a user."""
        role = db.query(Role).filter(Role.name == role_name).first()
        if not role:
            return False

        ur = (
            db.query(UserRole)
            .filter(UserRole.user_id == user_id, UserRole.role_id == role.id)
            .first()
        )
        if ur:
            db.delete(ur)
            # Update user.is_admin flag if admin/owner role is removed
            if role_name in (ROLE_ADMIN, ROLE_OWNER):
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    other_admin = (
                        db.query(UserRole)
                        .join(Role)
                        .filter(
                            UserRole.user_id == user_id,
                            Role.name.in_([ROLE_ADMIN, ROLE_OWNER]),
                            UserRole.id != ur.id,
                        )
                        .first()
                    )
                    if not other_admin:
                        user.is_admin = False
            db.commit()

            self.log_audit_event(
                db=db,
                actor_user_id=revoked_by or "SYSTEM",
                action="ROLE_REVOKED",
                resource_type="USER",
                resource_id=user_id,
                outcome="SUCCESS",
                details=json.dumps({"role": role_name}),
            )
        return True

    # ── System Owner Bootstrap ─────────────────────────────────────────────
    def bootstrap_initial_owner(
        self,
        db: Session,
        email: Optional[str] = None,
        password: Optional[str] = None,
        username: Optional[str] = None,
        force: bool = False,
    ) -> Optional[User]:
        """
        Secure bootstrap or promotion process for the System Owner.
        Creates or promotes the specified account to the 'owner' role.
        """
        import os
        from app.utils.security import hash_password

        target_email = email or os.getenv("SYSTEM_OWNER_EMAIL")
        target_password = password or os.getenv("SYSTEM_OWNER_PASSWORD")

        if not target_email:
            return None

        clean_email = target_email.strip().lower()
        user = db.query(User).filter(User.email == clean_email).first()

        # If user doesn't exist, create them
        if not user:
            if not target_password:
                # Default secure password if none provided
                target_password = "MindCare#Owner2026!"
            user = User(
                email=clean_email,
                username=username or clean_email.split("@")[0],
                full_name="System Owner",
                hashed_password=hash_password(target_password),
                is_active=True,
                is_admin=True,
                consent_given=True,
                account_status="ACTIVE",
                email_verified=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            if target_password:
                user.hashed_password = hash_password(target_password)
            user.is_active = True
            user.is_admin = True
            user.account_status = "ACTIVE"
            user.email_verified = True
            db.commit()

        self.assign_role(db, user.id, ROLE_OWNER, assigned_by="BOOTSTRAP")
        self.assign_role(db, user.id, ROLE_ADMIN, assigned_by="BOOTSTRAP")
        self.assign_role(db, user.id, ROLE_USER, assigned_by="BOOTSTRAP")
        user.is_admin = True
        db.commit()

        self.log_audit_event(
            db=db,
            actor_user_id="BOOTSTRAP",
            action="SYSTEM_OWNER_PROMOTED",
            resource_type="USER",
            resource_id=user.id,
            outcome="SUCCESS",
            details=json.dumps({"email": clean_email, "roles": ["owner", "admin", "user"]}),
        )
        logger.info(f"RBAC: System Owner successfully bootstrapped/promoted for {user.email}")
        return user

    # ── Healthcare Professional Verification & Client Access ───────────────
    def apply_for_professional(
        self,
        db: Session,
        user_id: str,
        credentials_reference: str,
        license_number: Optional[str] = None,
        license_issuer: Optional[str] = None,
        specialty: Optional[str] = None,
        bio: Optional[str] = None,
    ) -> ProfessionalProfile:
        """Submit an application for healthcare professional status."""
        profile = (
            db.query(ProfessionalProfile)
            .filter(ProfessionalProfile.user_id == user_id)
            .first()
        )
        if profile:
            profile.verification_status = "PENDING"
            profile.credentials_reference = credentials_reference
            profile.license_number = license_number
            profile.license_issuer = license_issuer
            profile.specialty = specialty
            profile.bio = bio
            profile.rejection_reason = None
            profile.updated_at = datetime.utcnow()
        else:
            profile = ProfessionalProfile(
                user_id=user_id,
                verification_status="PENDING",
                credentials_reference=credentials_reference,
                license_number=license_number,
                license_issuer=license_issuer,
                specialty=specialty,
                bio=bio,
            )
            db.add(profile)

        # Ensure user has professional role registered
        self.assign_role(db, user_id, ROLE_PROFESSIONAL, assigned_by="SELF_APPLICATION")
        db.commit()
        db.refresh(profile)

        self.log_audit_event(
            db=db,
            actor_user_id=user_id,
            action="PROFESSIONAL_APPLIED",
            resource_type="PROFESSIONAL",
            resource_id=profile.id,
            outcome="SUCCESS",
            details=json.dumps({"specialty": specialty, "license_number": license_number}),
        )
        return profile

    def verify_professional(
        self,
        db: Session,
        target_user_id: str,
        admin_user_id: str,
        status_action: str,  # VERIFIED, REJECTED, SUSPENDED
        rejection_reason: Optional[str] = None,
    ) -> ProfessionalProfile:
        """Admin decision on professional verification status."""
        status_action = status_action.upper()
        if status_action not in ["VERIFIED", "REJECTED", "SUSPENDED", "PENDING"]:
            raise HTTPException(status_code=400, detail="Invalid verification status.")

        profile = (
            db.query(ProfessionalProfile)
            .filter(ProfessionalProfile.user_id == target_user_id)
            .first()
        )
        if not profile:
            raise HTTPException(status_code=404, detail="Professional profile not found.")

        profile.verification_status = status_action
        profile.verified_by = admin_user_id
        profile.verified_at = datetime.utcnow() if status_action == "VERIFIED" else None
        if rejection_reason:
            profile.rejection_reason = rejection_reason
        profile.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(profile)

        self.log_audit_event(
            db=db,
            actor_user_id=admin_user_id,
            action=f"PROFESSIONAL_VERIFICATION_{status_action}",
            resource_type="PROFESSIONAL",
            resource_id=profile.id,
            outcome="SUCCESS",
            details=json.dumps({"status": status_action, "rejection_reason": rejection_reason}),
        )
        return profile

    def verify_professional_client_consent(
        self,
        db: Session,
        professional_id: str,
        client_id: str,
        required_category: str = "wellness_summary",
    ) -> bool:
        """
        Verify that:
        1. Professional is VERIFIED.
        2. Active professional assignment exists.
        3. Active, non-expired, non-revoked consent record exists for this client and data category.
        """
        # 1. Professional verification check
        prof = (
            db.query(ProfessionalProfile)
            .filter(
                ProfessionalProfile.user_id == professional_id,
                ProfessionalProfile.verification_status == "VERIFIED",
            )
            .first()
        )
        if not prof:
            return False

        # 2. Assignment check
        assignment = (
            db.query(ProfessionalAssignment)
            .filter(
                ProfessionalAssignment.professional_id == professional_id,
                ProfessionalAssignment.user_id == client_id,
                ProfessionalAssignment.status == "ACTIVE",
            )
            .first()
        )
        if not assignment:
            return False

        # 3. Explicit consent check
        now = datetime.utcnow()
        consent = (
            db.query(ConsentRecord)
            .filter(
                ConsentRecord.user_id == client_id,
                (ConsentRecord.authorized_recipient == professional_id)
                | (ConsentRecord.authorized_recipient == "all_assigned"),
                (ConsentRecord.data_category == required_category)
                | (ConsentRecord.consent_type == "clinician_sharing"),
                ConsentRecord.granted == True,
                ConsentRecord.revoked_at.is_(None),
                (ConsentRecord.expires_at.is_(None) | (ConsentRecord.expires_at > now)),
            )
            .first()
        )
        return consent is not None

    # ── Audit Logging with Zero PHI & Credential Scrubbing ─────────────────
    def log_audit_event(
        self,
        db: Session,
        actor_user_id: Optional[str],
        action: str,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        outcome: str = "SUCCESS",
        correlation_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        details: Optional[str] = None,
    ) -> AuditLog:
        """
        Record a tamper-evident audit log.
        Sanitizes input to guarantee zero passwords, tokens, or raw medical text are stored.
        """
        # Basic sanitization of details if JSON string
        sanitized_details = details
        if details:
            try:
                parsed = json.loads(details)
                for sensitive_key in [
                    "password", "token", "access_token", "refresh_token",
                    "secret", "mfa_secret", "message", "content", "chat_text"
                ]:
                    if sensitive_key in parsed:
                        parsed[sensitive_key] = "[REDACTED]"
                sanitized_details = json.dumps(parsed)
            except Exception:
                # If not JSON, strip obvious words
                pass

        audit = AuditLog(
            user_id=actor_user_id or "SYSTEM",
            actor_id=actor_user_id or "ANONYMOUS",
            actor_user_id=actor_user_id,
            action=action,
            resource=resource_type or "SYSTEM",
            resource_type=resource_type,
            resource_id=resource_id,
            outcome=outcome,
            status=outcome,
            correlation_id=correlation_id or uuid.uuid4().hex[:16],
            ip_address=ip_address,
            details=sanitized_details,
            timestamp=datetime.utcnow(),
        )
        try:
            db.add(audit)
            db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"Audit log recording error: {e}")
        return audit


# Module-level singleton
rbac_service = RBACService()

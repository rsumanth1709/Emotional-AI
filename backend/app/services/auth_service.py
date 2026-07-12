"""
MindCare AI — Auth Service
Business logic for user management: create, authenticate, update, delete.
"""
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.auth import UserCreate, UserUpdate
from app.utils.security import hash_password, verify_password
from app.utils.exceptions import (
    EmailAlreadyExistsException,
    UsernameAlreadyExistsException,
    ConsentNotGivenException,
    UserNotFoundException,
)
from app.utils.logger import logger


class AuthService:
    """Handles all user authentication and profile operations."""

    # ── Create ─────────────────────────────────────────────────────────────
    def create_user(self, db: Session, data: UserCreate) -> User:
        """Register a new user after validating uniqueness and consent."""
        if not data.consent_given:
            raise ConsentNotGivenException()

        if db.query(User).filter(User.email == data.email).first():
            raise EmailAlreadyExistsException()

        if db.query(User).filter(User.username == data.username).first():
            raise UsernameAlreadyExistsException()

        user = User(
            email=data.email,
            username=data.username,
            full_name=data.full_name,
            hashed_password=hash_password(data.password),
            consent_given=data.consent_given,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"New user registered: {user.email} (id={user.id})")
        return user

    # ── Authenticate ───────────────────────────────────────────────────────
    def authenticate_user(self, db: Session, email: str, password: str) -> Optional[User]:
        """Verify email + password. Returns User on success, None on failure."""
        user = db.query(User).filter(User.email == email).first()
        if not user or not verify_password(password, user.hashed_password):
            return None
        return user

    # ── Read ───────────────────────────────────────────────────────────────
    def get_user_by_email(self, db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    def get_user_by_id(self, db: Session, user_id: str) -> User:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise UserNotFoundException()
        return user

    # ── Update ─────────────────────────────────────────────────────────────
    def update_user(self, db: Session, user_id: str, data: UserUpdate) -> User:
        user = self.get_user_by_id(db, user_id)
        if data.full_name is not None:
            user.full_name = data.full_name
        user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(user)
        logger.info(f"User profile updated: {user.email}")
        return user

    # ── Delete ─────────────────────────────────────────────────────────────
    def delete_user(self, db: Session, user_id: str) -> bool:
        """
        Soft-delete: deactivate the account.
        SQLAlchemy cascade will remove related chats/journals.
        """
        user = self.get_user_by_id(db, user_id)
        user.is_active = False
        db.commit()
        logger.info(f"User deactivated: {user.email}")
        return True


# Module-level singleton
auth_service = AuthService()

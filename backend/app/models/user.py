"""
MindCare AI — User ORM Model
"""
import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, String, Integer
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    consent_given = Column(Boolean, default=False)
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    auth_provider = Column(String, default="local")
    avatar_url = Column(String, nullable=True)
    google_id = Column(String, nullable=True, index=True)
    account_status = Column(String(30), default="ACTIVE", nullable=False)
    email_verified = Column(Boolean, default=False)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    mfa_enabled = Column(Boolean, default=False)
    mfa_secret = Column(String(64), nullable=True)
    email_verification_token = Column(String(128), nullable=True)
    password_reset_token = Column(String(128), nullable=True)
    password_reset_expires = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user_roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    professional_profile = relationship("ProfessionalProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", cascade="all, delete-orphan")
    chats = relationship("Chat", back_populates="user", cascade="all, delete-orphan")
    emotion_records = relationship("EmotionRecord", back_populates="user", cascade="all, delete-orphan")
    mood_entries = relationship("MoodEntry", back_populates="user", cascade="all, delete-orphan")
    journal_entries = relationship("JournalEntry", back_populates="user", cascade="all, delete-orphan")
    breathing_sessions = relationship("BreathingSession", back_populates="user", cascade="all, delete-orphan")
    emergency_alerts = relationship("EmergencyAlert", back_populates="user", cascade="all, delete-orphan")
    wellness_goals = relationship("DailyWellnessGoal", back_populates="user", uselist=False, cascade="all, delete-orphan")
    wellness_logs = relationship("DailyWellnessLog", back_populates="user", cascade="all, delete-orphan")
    badges = relationship("UserBadge", back_populates="user", cascade="all, delete-orphan")
    wearable_logs = relationship("WearableLog", back_populates="user", cascade="all, delete-orphan")
    feedbacks = relationship("UserFeedback", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email}>"

"""
MindCare AI — Daily Wellness & Personalized Wellness Generator ORM Models
Stores daily goals, logs, user badge achievements, and personalized wellness content records.
"""
import uuid
from datetime import datetime, date
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Boolean, JSON, Text, Date
from sqlalchemy.orm import relationship

from app.database import Base


class DailyWellnessGoal(Base):
    """Stores user daily target goals for wellness tracking."""
    __tablename__ = "daily_wellness_goals"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    mindfulness_minutes_target = Column(Integer, default=10)
    journal_entries_target = Column(Integer, default=1)
    water_intake_ml_target = Column(Integer, default=2000)
    sleep_hours_target = Column(Float, default=8.0)
    mood_checkins_target = Column(Integer, default=2)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")


class DailyWellnessLog(Base):
    """Daily log tracking user actual progress against daily goals."""
    __tablename__ = "daily_wellness_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    log_date = Column(Date, default=date.today, index=True)
    mindfulness_minutes = Column(Integer, default=0)
    journal_entries = Column(Integer, default=0)
    water_intake_ml = Column(Integer, default=0)
    sleep_hours = Column(Float, default=0.0)
    mood_checkins = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")


class UserBadge(Base):
    """Badges awarded to users for achieving wellness milestones."""
    __tablename__ = "user_badges"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    badge_name = Column(String, nullable=False)
    badge_type = Column(String, nullable=False)
    description = Column(String, default="", nullable=True)
    icon_name = Column(String, default="Award")
    awarded_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


class WellnessContentRecord(Base):
    """Main stored record for generated personalized wellness content."""
    __tablename__ = "wellness_content_records"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content_type = Column(String, nullable=False)        # affirmation, breathing, mindfulness, journal_prompt, daily_plan
    title = Column(String, nullable=False)
    content_data = Column(JSON, nullable=False)          # Full structured JSON schema
    duration_minutes = Column(Integer, default=1)
    emotion_context = Column(String, default="neutral")
    confidence = Column(Float, default=0.75)
    status = Column(String, default="generated")          # generated, started, completed, saved, skipped
    helpful = Column(Boolean, nullable=True)             # True = Helpful, False = Not Helpful
    feedback_notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User")

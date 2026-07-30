"""
MindCare AI — Smart Reminder System DB Models
Tracks customizable wellness reminders (non-prescriptive medication, meditation, sleep, hydration)
and execution history logs.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, Boolean
from sqlalchemy.orm import relationship

from app.database import Base


class SmartReminder(Base):
    """Customizable scheduled reminder for wellness habits and non-prescriptive supplements."""
    __tablename__ = "smart_reminders"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    reminder_type = Column(String, nullable=False)  # "medication", "meditation", "sleep", "hydration", "custom"
    scheduled_time = Column(String, nullable=False)  # e.g. "08:00", "22:30"
    frequency = Column(String, default="daily")      # "daily", "weekdays", "weekends", "custom"
    custom_days = Column(String, nullable=True)     # e.g. "Mon,Wed,Fri"
    note = Column(Text, nullable=True)               # e.g. "Take Vitamin D with water" (non-prescriptive)
    is_active = Column(Boolean, default=True)
    sound_enabled = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User")
    logs = relationship("ReminderLog", back_populates="reminder", cascade="all, delete-orphan")


class ReminderLog(Base):
    """History log of triggered, completed, snoozed, or missed reminder events."""
    __tablename__ = "reminder_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    reminder_id = Column(String, ForeignKey("smart_reminders.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    reminder_type = Column(String, nullable=False)
    action_taken = Column(String, nullable=False)  # "completed", "snoozed", "missed", "triggered"
    scheduled_time = Column(String, nullable=False)
    triggered_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    reminder = relationship("SmartReminder", back_populates="logs")

"""
MindCare AI — AI Habit Tracker DB Models
Tracks healthy habits, daily completion logs, habit streaks,
and emotional trend correlations.
"""
import uuid
from datetime import datetime, date
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, Boolean, Float, Date as SQUALDate, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class Habit(Base):
    """Healthy Habit definition created by user or AI suggested."""
    __tablename__ = "habits"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)  # "mindfulness", "physical", "sleep", "social", "gratitude"
    target_emotion = Column(String, nullable=True)  # Emotion target e.g. "Anxiety", "Stress"
    icon_name = Column(String, default="Sparkles")
    frequency = Column(String, default="daily")  # "daily", "weekdays", "custom"
    
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    total_completions = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User")
    logs = relationship("HabitLog", back_populates="habit", cascade="all, delete-orphan")


class HabitLog(Base):
    """Daily log of habit completion with associated mood and stress scores."""
    __tablename__ = "habit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    habit_id = Column(String, ForeignKey("habits.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    completed_date = Column(SQUALDate, default=date.today, nullable=False, index=True)
    logged_emotion = Column(String, nullable=True)
    logged_stress_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "habit_id", "completed_date", name="uq_user_habit_date"),
    )

    habit = relationship("Habit", back_populates="logs")

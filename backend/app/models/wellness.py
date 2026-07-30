"""
MindCare AI — Daily Wellness Coach DB Models
"""
import uuid
from datetime import date, datetime
from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer, String, Text, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class DailyWellnessGoal(Base):
    """Daily goals/targets for water, sleep, exercise, and meditation."""
    __tablename__ = "daily_wellness_goals"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True, unique=True)
    water_target_ml = Column(Integer, default=2000)
    sleep_target_hours = Column(Float, default=8.0)
    exercise_target_mins = Column(Integer, default=30)
    meditation_target_mins = Column(Integer, default=10)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="wellness_goals")


class DailyWellnessLog(Base):
    """Daily logs for water intake, sleep, exercise, and gratitude journaling."""
    __tablename__ = "daily_wellness_logs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, default=date.today, index=True)
    water_intake_ml = Column(Integer, default=0)
    sleep_hours = Column(Float, default=0.0)
    sleep_quality = Column(String, nullable=True) # "Good", "Fair", "Poor"
    exercise_mins = Column(Integer, default=0)
    exercise_type = Column(String, nullable=True)
    meditation_mins = Column(Integer, default=0)
    gratitude_1 = Column(Text, nullable=True)
    gratitude_2 = Column(Text, nullable=True)
    gratitude_3 = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="wellness_logs")


class UserBadge(Base):
    """Gamified achievement badges unlocked by users."""
    __tablename__ = "user_badges"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    badge_name = Column(String, nullable=False) # e.g. "Hydration Hero"
    badge_type = Column(String, nullable=False) # e.g. "water", "streak", "meditation"
    unlocked_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="badges")

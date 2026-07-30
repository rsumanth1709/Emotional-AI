"""
MindCare AI — AI Goal Planner ORM Models
Tracks personalized mental wellness goals, weekly milestones, progress logs,
and automatic emotional trend adjustments.
"""
import uuid
from datetime import datetime, date
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, Boolean, Float, Date as SQUALDate
from sqlalchemy.orm import relationship

from app.database import Base


class WellnessGoal(Base):
    """Personalized Mental Wellness Goal."""
    __tablename__ = "wellness_goals"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)  # "anxiety", "mindfulness", "sleep", "stress", "gratitude", "social"
    target_emotion = Column(String, nullable=False)  # e.g. "Anxiety", "Stress", "Sad", "Neutral"
    description = Column(Text, nullable=True)
    
    # Timeline
    start_date = Column(SQUALDate, default=date.today, nullable=False)
    target_date = Column(SQUALDate, nullable=False)
    
    # Status & Progress
    status = Column(String, default="active")  # "active", "completed", "adjusted", "paused"
    completion_percentage = Column(Float, default=0.0)  # 0.0 - 100.0
    auto_adjusted = Column(Boolean, default=False)
    adjustment_reason = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User")
    milestones = relationship("GoalMilestone", back_populates="goal", cascade="all, delete-orphan")


class GoalMilestone(Base):
    """Weekly Milestone / Action Plan Item within a Goal."""
    __tablename__ = "goal_milestones"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    goal_id = Column(String, ForeignKey("wellness_goals.id", ondelete="CASCADE"), nullable=False, index=True)
    week_number = Column(Integer, nullable=False)  # Week 1, 2, 3, 4
    title = Column(String, nullable=False)
    action_item = Column(Text, nullable=False)
    target_frequency = Column(String, nullable=False)  # e.g. "3x per week", "Daily", "5 mins/day"
    
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    
    goal = relationship("WellnessGoal", back_populates="milestones")

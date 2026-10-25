"""
MindCare AI — Emotional Wellness Games ORM Model
Stores completed mini-game sessions, performance summaries, and gamification rewards.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, JSON
from sqlalchemy.orm import relationship

from app.database import Base


class GameSession(Base):
    """Stores educational and emotional wellness mini-game sessions."""
    __tablename__ = "game_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    game_slug = Column(String, nullable=False, index=True, default="emotion-detective")
    score = Column(Integer, default=0, nullable=False)
    total_questions = Column(Integer, default=10, nullable=False)
    correct_count = Column(Integer, default=0, nullable=False)
    difficulty = Column(String, default="all", nullable=False)
    duration_seconds = Column(Integer, default=0, nullable=True)
    completed_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = relationship("User")


class MoodGardenState(Base):
    """Stores a user's persistent virtual mood garden layout, plants, and decorations."""
    __tablename__ = "mood_garden_states"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    plots = Column(JSON, default=list, nullable=False)
    inventory = Column(JSON, default=dict, nullable=False)
    activity_history = Column(JSON, default=list, nullable=False)
    total_nurtures = Column(Integer, default=0, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User")


"""
MindCare AI — AI Emotional Storytelling Engine ORM Models
Stores generated stories, interactive sessions, story state, chapter continuations,
favorites, and user feedback.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Boolean, JSON, Text
from sqlalchemy.orm import relationship

from app.database import Base


class StoryRecord(Base):
    """Main stored record for generated emotional stories."""
    __tablename__ = "story_records"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    genre = Column(String, default="realistic")          # realistic, fantasy, adventure, slice_of_life, inspirational, etc.
    theme = Column(String, default="hope")              # hope, resilience, calm, friendship, confidence, gratitude, etc.
    tone = Column(String, default="uplifting")          # uplifting, gentle, motivational, reflective
    length = Column(String, default="short")            # short, medium, long
    content = Column(Text, nullable=False)
    reflection_prompt = Column(String, nullable=True)
    is_interactive = Column(Boolean, default=False)
    is_favorite = Column(Boolean, default=False, index=True)
    personalization_meta = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User")
    sessions = relationship("StorySession", back_populates="story", cascade="all, delete-orphan")
    feedback = relationship("StoryFeedback", back_populates="story", cascade="all, delete-orphan")


class StorySession(Base):
    """Stores interactive story state and choices across chapters."""
    __tablename__ = "story_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    story_id = Column(String, ForeignKey("story_records.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    current_chapter = Column(Integer, default=1)
    story_state = Column(JSON, default=dict)             # characters, location, current_goal, unresolved_threads
    decisions = Column(JSON, default=list)               # history of user choices
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    story = relationship("StoryRecord", back_populates="sessions")
    user = relationship("User")


class StoryFeedback(Base):
    """User feedback ratings and comments for stories."""
    __tablename__ = "story_feedback"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    story_id = Column(String, ForeignKey("story_records.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    rating = Column(String, nullable=False)              # helpful, liked, somewhat, not_helpful
    theme_feedback = Column(String, nullable=True)       # liked, wanted_calmer, wanted_shorter, etc.
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    story = relationship("StoryRecord", back_populates="feedback")
    user = relationship("User")

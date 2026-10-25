"""
MindCare AI — Video Emotion Analysis ORM Models
Stores video analysis job state, multi-layer timeline segments, and speech transcript segments.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Boolean, JSON, Text
from sqlalchemy.orm import relationship

from app.database import Base


class VideoAnalysis(Base):
    """Main video analysis job record."""
    __tablename__ = "video_analyses"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String, nullable=False)
    status = Column(String, default="processing")  # queued, processing, completed, failed
    progress = Column(Integer, default=0)          # 0 - 100%
    duration_seconds = Column(Float, default=0.0)
    fps = Column(Float, default=0.0)
    resolution = Column(String, default="unknown")
    faces_tracked_count = Column(Integer, default=0)
    dominant_emotion = Column(String, default="Neutral")
    overall_confidence = Column(Float, default=0.0)
    transitions_count = Column(Integer, default=0)
    has_audio = Column(Boolean, default=False)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User")
    emotion_segments = relationship("VideoEmotionSegment", back_populates="video_analysis", cascade="all, delete-orphan")
    transcript_segments = relationship("VideoTranscriptSegment", back_populates="video_analysis", cascade="all, delete-orphan")


class VideoEmotionSegment(Base):
    """Frame-by-frame and smoothed emotion timeline segment."""
    __tablename__ = "video_emotion_segments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id = Column(String, ForeignKey("video_analyses.id", ondelete="CASCADE"), nullable=False, index=True)
    face_id = Column(String, default="face_1")      # Anonymous face ID: face_1, face_2
    start_time = Column(Float, nullable=False)      # seconds
    end_time = Column(Float, nullable=False)        # seconds
    facial_emotion = Column(String, nullable=False)
    facial_confidence = Column(Float, nullable=False)
    speech_emotion = Column(String, nullable=True)
    speech_confidence = Column(Float, nullable=True)
    combined_emotion = Column(String, nullable=False)
    combined_confidence = Column(Float, nullable=False)
    agreement = Column(Boolean, nullable=True)
    probabilities = Column(JSON, default=dict)

    video_analysis = relationship("VideoAnalysis", back_populates="emotion_segments")


class VideoTranscriptSegment(Base):
    """Speech-to-text transcript segment with timestamp alignment."""
    __tablename__ = "video_transcript_segments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id = Column(String, ForeignKey("video_analyses.id", ondelete="CASCADE"), nullable=False, index=True)
    start_time = Column(Float, nullable=False)
    end_time = Column(Float, nullable=False)
    text = Column(Text, nullable=False)
    emotion = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    sentiment = Column(String, default="neutral")

    video_analysis = relationship("VideoAnalysis", back_populates="transcript_segments")

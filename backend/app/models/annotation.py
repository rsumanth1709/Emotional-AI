"""
MindCare AI — Dataset Annotation Platform ORM Models
Stores annotation tasks, multi-turn conversation samples, individual annotator label submissions,
inter-annotator agreement metrics (Fleiss' Kappa, Cohen's Kappa), and consensus datasets.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Boolean, JSON, Text
from sqlalchemy.orm import relationship

from app.database import Base


class AnnotationTask(Base):
    """Annotation project task definition."""
    __tablename__ = "annotation_tasks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="IN_PROGRESS", index=True)           # DRAFT, IN_PROGRESS, COMPLETED, ARCHIVED
    taxonomy = Column(JSON, default=lambda: ["Happy", "Sad", "Angry", "Fear", "Surprise", "Disgust", "Neutral", "Anxious", "Calm", "Frustrated"])
    min_annotators_per_sample = Column(Integer, default=2)
    created_by = Column(String, default="admin")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    samples = relationship("ConversationSample", back_populates="task", cascade="all, delete-orphan")


class ConversationSample(Base):
    """Multi-turn conversation sample to be annotated."""
    __tablename__ = "conversation_samples"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id = Column(String, ForeignKey("annotation_tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    conversation_id = Column(String, nullable=False, index=True)
    turns = Column(JSON, nullable=False)                                 # List of {"turn_id": 1, "speaker": "User", "text": "..."}
    consensus_emotion = Column(String, nullable=True)
    is_consensus_reached = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("AnnotationTask", back_populates="samples")
    annotations = relationship("SampleAnnotation", back_populates="sample", cascade="all, delete-orphan")


class SampleAnnotation(Base):
    """Individual annotator's label submission for a conversation sample."""
    __tablename__ = "sample_annotations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    sample_id = Column(String, ForeignKey("conversation_samples.id", ondelete="CASCADE"), nullable=False, index=True)
    annotator_email = Column(String, nullable=False, index=True)
    primary_emotion = Column(String, nullable=False)
    turn_emotions = Column(JSON, default=dict)                           # Map of turn_id -> emotion label
    confidence = Column(Float, default=0.90)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    sample = relationship("ConversationSample", back_populates="annotations")


class AgreementMetric(Base):
    """Calculated inter-annotator agreement metrics per task."""
    __tablename__ = "agreement_metrics"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id = Column(String, nullable=False, index=True)
    fleiss_kappa = Column(Float, default=0.78)
    cohens_kappa = Column(Float, default=0.82)
    percentage_agreement = Column(Float, default=0.85)
    agreement_level = Column(String, default="Substantial Agreement")   # Perfect, Substantial, Moderate, Fair, Slight
    annotators_count = Column(Integer, default=3)
    evaluated_samples_count = Column(Integer, default=50)
    calculated_at = Column(DateTime, default=datetime.utcnow)

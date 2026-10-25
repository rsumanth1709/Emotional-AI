"""
MindCare AI — A/B Testing and Experimentation Platform ORM Models
Stores experiments, variants, traffic allocations, deterministic user assignments,
actual exposures, metrics, satisfaction feedback, and statistical results.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Boolean, JSON, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Experiment(Base):
    """Main experiment definition record."""
    __tablename__ = "experiments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    experiment_type = Column(String, default="prompt", index=True)      # prompt, model, temperature, personality, wellness
    status = Column(String, default="DRAFT", index=True)                # DRAFT, SCHEDULED, RUNNING, PAUSED, COMPLETED, CANCELLED, ARCHIVED
    primary_metric = Column(String, default="satisfaction")             # satisfaction, quality, completion, latency
    confidence_level = Column(Float, default=0.95)
    minimum_sample_size = Column(Integer, default=1000)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    created_by = Column(String, default="admin")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    variants = relationship("ExperimentVariant", back_populates="experiment", cascade="all, delete-orphan")


class ExperimentVariant(Base):
    """Control or Variant configuration record."""
    __tablename__ = "experiment_variants"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    experiment_id = Column(String, ForeignKey("experiments.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)                               # e.g. Control, Variant A, Variant B
    is_control = Column(Boolean, default=False)
    configuration = Column(JSON, default=dict)                          # prompt_text, model_version, temperature, personality
    traffic_percentage = Column(Integer, default=50)
    created_at = Column(DateTime, default=datetime.utcnow)

    experiment = relationship("Experiment", back_populates="variants")


class ExperimentAssignment(Base):
    """Deterministic hashing user-to-variant assignment record."""
    __tablename__ = "experiment_assignments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    experiment_id = Column(String, ForeignKey("experiments.id", ondelete="CASCADE"), nullable=False, index=True)
    user_hash = Column(String, nullable=False, index=True)
    variant_id = Column(String, ForeignKey("experiment_variants.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_at = Column(DateTime, default=datetime.utcnow, index=True)


class ExperimentExposure(Base):
    """Record of actual user exposure to a variant during chatbot interaction."""
    __tablename__ = "experiment_exposures"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    experiment_id = Column(String, nullable=False, index=True)
    variant_id = Column(String, nullable=False, index=True)
    user_hash = Column(String, nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)


class ExperimentMetric(Base):
    """Metric measurements logged during experiment execution."""
    __tablename__ = "experiment_metrics"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    experiment_id = Column(String, nullable=False, index=True)
    variant_id = Column(String, nullable=False, index=True)
    metric_name = Column(String, nullable=False)                        # satisfaction, quality, latency_ms, safety_violation, error
    metric_value = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)


class ExperimentFeedback(Base):
    """User satisfaction feedback ratings for experiments."""
    __tablename__ = "experiment_feedback"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    experiment_id = Column(String, nullable=False, index=True)
    variant_id = Column(String, nullable=False, index=True)
    user_hash = Column(String, nullable=False, index=True)
    rating = Column(String, nullable=False)                              # helpful, not_helpful, 1-5 stars
    feedback_type = Column(String, default="thumbs")
    comments = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

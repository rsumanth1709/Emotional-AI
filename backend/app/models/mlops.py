"""
MindCare AI — Automated Model Retraining & MLOps Pipeline ORM Models
Stores registered ML models, versioned artifacts, dataset versions, retraining jobs,
deployments, monitoring metrics, and immutable audit logs.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Boolean, JSON, Text
from sqlalchemy.orm import relationship

from app.database import Base


class MLModel(Base):
    """Registry definition for a MindCare ML model."""
    __tablename__ = "ml_models"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    model_id = Column(String, unique=True, nullable=False, index=True) # e.g. text_emotion_classifier
    name = Column(String, nullable=False)
    model_type = Column(String, default="classification")              # classification, regression, sequence, fusion
    framework = Column(String, default="scikit-learn")                 # scikit-learn, pytorch, transformers
    current_version = Column(String, nullable=True)                    # e.g. 2.5.0
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    versions = relationship("MLModelVersion", back_populates="model", cascade="all, delete-orphan")
    jobs = relationship("MLTrainingJob", back_populates="model", cascade="all, delete-orphan")


class MLModelVersion(Base):
    """Immutable model version record with metrics, model card, and lifecycle status."""
    __tablename__ = "ml_model_versions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    model_id = Column(String, ForeignKey("ml_models.model_id", ondelete="CASCADE"), nullable=False, index=True)
    version = Column(String, nullable=False, index=True)                # e.g. 2.6.0
    dataset_version = Column(String, nullable=False)
    code_commit = Column(String, default="HEAD")
    artifact_uri = Column(String, nullable=False)
    metrics = Column(JSON, default=dict)                                # macro_f1, accuracy, recall, latency_ms
    model_card = Column(JSON, default=dict)                              # purpose, limitations, known_cases, safety_status
    status = Column(String, default="CANDIDATE", index=True)            # DRAFT, TRAINING, VALIDATING, CANDIDATE, APPROVED, REJECTED, CANARY, PRODUCTION, ROLLED_BACK, ARCHIVED
    requires_human_approval = Column(Boolean, default=True)
    approved_by = Column(String, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    model = relationship("MLModel", back_populates="versions")
    deployments = relationship("MLDeployment", back_populates="version_rel", cascade="all, delete-orphan")


class MLDataset(Base):
    """Versioned dataset definition with PII audit status and sample metrics."""
    __tablename__ = "ml_datasets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_id = Column(String, nullable=False, index=True)             # e.g. emotion_text_dataset
    version = Column(String, nullable=False, unique=True, index=True)     # e.g. 2026-08-21-v1
    sample_count = Column(Integer, default=0)
    label_distribution = Column(JSON, default=dict)
    quality_metrics = Column(JSON, default=dict)                        # duplicates, missing, pii_count
    is_approved = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class MLTrainingJob(Base):
    """Record of a model retraining execution job."""
    __tablename__ = "ml_training_jobs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    model_id = Column(String, ForeignKey("ml_models.model_id", ondelete="CASCADE"), nullable=False, index=True)
    dataset_version = Column(String, nullable=False)
    trigger_type = Column(String, default="manual")                     # performance_degradation, data_drift, sample_threshold, scheduled, manual
    status = Column(String, default="QUEUED", index=True)               # QUEUED, RUNNING, VALIDATING, COMPLETED, FAILED, REJECTED, DEPLOYED
    hyperparameters = Column(JSON, default=dict)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    model = relationship("MLModel", back_populates="jobs")


class MLDeployment(Base):
    """Record of a model deployment rollout (Canary/Shadow/Direct)."""
    __tablename__ = "ml_deployments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    model_id = Column(String, nullable=False, index=True)
    version_id = Column(String, ForeignKey("ml_model_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    strategy = Column(String, default="canary")                        # canary, shadow, direct
    status = Column(String, default="IN_PROGRESS")                     # IN_PROGRESS, COMPLETED, ROLLED_BACK, FAILED
    traffic_percentage = Column(Integer, default=5)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    version_rel = relationship("MLModelVersion", back_populates="deployments")


class MLMonitoringMetric(Base):
    """Inference predictions logging, latency, error rates, and drift metrics."""
    __tablename__ = "ml_monitoring_metrics"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    model_id = Column(String, nullable=False, index=True)
    version = Column(String, nullable=False)
    metric_name = Column(String, nullable=False)                        # macro_f1, latency_ms, psi_drift, error_rate
    metric_value = Column(Float, nullable=False)
    meta = Column(JSON, default=dict)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)


class MLAuditLog(Base):
    """Immutable audit logging for MLOps pipeline lifecycle events."""
    __tablename__ = "ml_audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    event_type = Column(String, nullable=False, index=True)             # JOB_CREATED, EVAL_COMPLETED, MODEL_APPROVED, MODEL_REJECTED, CANARY_STARTED, ROLLBACK_EXECUTED
    model_id = Column(String, nullable=False, index=True)
    model_version = Column(String, nullable=True)
    actor_id = Column(String, default="system")
    details = Column(JSON, default=dict)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

"""
MindCare AI — Emotion Model Research Laboratory ORM Models
Stores versioned datasets, experiment runs, model checkpoints, and audit logs.
Exclusively for reproducible, non-diagnostic research and evaluation of emotion classification models.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, Integer, String, Boolean, JSON

from app.database import Base


class ResearchDataset(Base):
    """Immutable, versioned dataset registry entry."""
    __tablename__ = "research_datasets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_name = Column(String, nullable=False, index=True)
    version = Column(String, nullable=False, index=True)
    checksum = Column(String, nullable=False)                         # SHA-256 hash
    source = Column(String, default="MindCare Benchmark")
    num_samples = Column(Integer, default=1000)
    num_classes = Column(Integer, default=6)
    class_labels = Column(JSON, default=list)                         # ["anger", "fear", "joy", "sadness", "stress", "neutral"]
    split_ratio = Column(JSON, default=dict)                        # {"train": 0.8, "val": 0.1, "test": 0.1}
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class ResearchExperiment(Base):
    """Experiment record storing model configuration, evaluation metrics, and resource benchmarks."""
    __tablename__ = "research_experiments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    experiment_id = Column(String, unique=True, nullable=False, index=True) # e.g., EXP-2026-00042
    model_name = Column(String, nullable=False, index=True)           # CNN, LSTM, BiLSTM, CNN-LSTM, BERT, DistilBERT, RoBERTa, DeBERTa
    model_family = Column(String, nullable=False, index=True)         # Classical Deep Learning, Transformer
    dataset_version = Column(String, nullable=False, index=True)
    status = Column(String, default="COMPLETED", index=True)          # QUEUED, RUNNING, COMPLETED, FAILED
    random_seed = Column(Integer, default=42)

    # Predictive Performance Metrics
    accuracy = Column(Float, default=0.0)
    precision_macro = Column(Float, default=0.0)
    recall_macro = Column(Float, default=0.0)
    macro_f1 = Column(Float, default=0.0)
    weighted_f1 = Column(Float, default=0.0)
    per_class_metrics = Column(JSON, default=dict)
    confusion_matrix = Column(JSON, default=list)

    # Resource & Latency Benchmarks
    latency_ms_avg = Column(Float, default=0.0)
    latency_p95 = Column(Float, default=0.0)
    latency_p99 = Column(Float, default=0.0)
    model_size_mb = Column(Float, default=0.0)
    param_count_m = Column(Float, default=0.0)
    peak_memory_mb = Column(Float, default=0.0)

    # Environment & Hashes
    git_commit = Column(String, default="a83f9d2")
    config_hash = Column(String, nullable=True)
    checkpoint_hash = Column(String, nullable=True)
    config_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class ResearchCheckpoint(Base):
    """Saved checkpoint metadata for experiment models."""
    __tablename__ = "research_checkpoints"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    experiment_id = Column(String, nullable=False, index=True)
    checkpoint_name = Column(String, nullable=False)
    file_size_mb = Column(Float, default=0.0)
    config_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class ResearchAuditLog(Base):
    """Audit trail for research laboratory actions."""
    __tablename__ = "research_audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    experiment_id = Column(String, nullable=False, index=True)
    actor_id = Column(String, nullable=False)
    action = Column(String, nullable=False, index=True)              # EXPERIMENT_CREATED, REPRODUCED, REPORT_EXPORTED
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

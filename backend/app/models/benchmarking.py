"""
MindCare AI — AI Emotion Detection Benchmarking Suite ORM Models
Stores model registries, dataset registries, benchmark runs, calculated metric results,
confusion matrices, per-sample predictions, and reproducible experiment reports.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Boolean, JSON, Text
from sqlalchemy.orm import relationship

from app.database import Base


class BenchmarkModelRegistry(Base):
    """Registered emotion detection models for benchmark evaluation."""
    __tablename__ = "benchmark_model_registries"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    model_id = Column(String, unique=True, nullable=False, index=True)      # e.g. emotion_cnn_v1, vit_emotion_v2
    name = Column(String, nullable=False)
    version = Column(String, default="1.0")
    modality = Column(String, default="image", index=True)               # text, image, audio, video, multimodal
    framework = Column(String, default="PyTorch")                       # PyTorch, TensorFlow, Scikit-Learn
    architecture = Column(String, default="CNN")
    parameter_count_millions = Column(Float, default=25.0)
    model_checksum_sha256 = Column(String, nullable=True)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)


class BenchmarkDatasetRegistry(Base):
    """Registered benchmark evaluation datasets with fixed splits and label taxonomies."""
    __tablename__ = "benchmark_dataset_registries"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_id = Column(String, unique=True, nullable=False, index=True)    # e.g. fer2013, goemotions
    name = Column(String, nullable=False)
    version = Column(String, default="1.0")
    modality = Column(String, default="image")
    sample_count = Column(Integer, default=10000)
    class_labels = Column(JSON, default=lambda: ["Happy", "Sad", "Angry", "Fear", "Surprise", "Disgust", "Neutral"])
    dataset_checksum_sha256 = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class BenchmarkRun(Base):
    """Benchmark experiment execution record."""
    __tablename__ = "benchmark_runs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    dataset_id = Column(String, nullable=False, index=True)
    dataset_version = Column(String, default="1.0")
    status = Column(String, default="QUEUED", index=True)                # QUEUED, RUNNING, COMPLETED, FAILED
    random_seed = Column(Integer, default=42)
    git_commit_hash = Column(String, default="a91f83c")
    hardware_specs = Column(JSON, default=dict)
    software_env = Column(JSON, default=dict)
    config_hash = Column(String, nullable=True)
    created_by = Column(String, default="admin")
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    metric_results = relationship("BenchmarkMetricResult", back_populates="benchmark_run", cascade="all, delete-orphan")


class BenchmarkMetricResult(Base):
    """Evaluation metric results per model in a benchmark run."""
    __tablename__ = "benchmark_metric_results"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    benchmark_id = Column(String, ForeignKey("benchmark_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    model_id = Column(String, nullable=False, index=True)
    model_version = Column(String, default="1.0")
    accuracy = Column(Float, nullable=False)
    precision_macro = Column(Float, nullable=False)
    recall_macro = Column(Float, nullable=False)
    f1_macro = Column(Float, nullable=False)
    precision_weighted = Column(Float, nullable=False)
    recall_weighted = Column(Float, nullable=False)
    f1_weighted = Column(Float, nullable=False)
    latency_mean_ms = Column(Float, default=45.0)
    latency_p50_ms = Column(Float, default=42.0)
    latency_p95_ms = Column(Float, default=61.0)
    latency_p99_ms = Column(Float, default=95.0)
    throughput_samples_per_sec = Column(Float, default=125.0)
    memory_peak_ram_mb = Column(Float, default=1200.0)
    gpu_memory_mb = Column(Float, default=2400.0)
    weighted_score = Column(Float, default=0.89)
    rank = Column(Integer, default=1)
    class_wise_metrics = Column(JSON, default=dict)
    confusion_matrix = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    benchmark_run = relationship("BenchmarkRun", back_populates="metric_results")


class BenchmarkPredictionRecord(Base):
    """Per-sample prediction logs for auditability and error analysis."""
    __tablename__ = "benchmark_prediction_records"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    benchmark_id = Column(String, nullable=False, index=True)
    model_id = Column(String, nullable=False, index=True)
    sample_id = Column(String, nullable=False, index=True)
    true_label = Column(String, nullable=False)
    predicted_label = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

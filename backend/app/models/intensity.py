"""
MindCare AI — Emotion Intensity Detection Module ORM Models
Stores timestamped emotion intensity predictions, multi-emotion scores, evidence extractions,
and model metadata for historical tracking, trend analysis, and dashboard visualizations.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Boolean, JSON, Text
from sqlalchemy.orm import relationship

from app.database import Base


class EmotionIntensityRecord(Base):
    """Timestamped emotion intensity prediction record per message."""
    __tablename__ = "emotion_intensity_records"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    conversation_id = Column(String, nullable=True, index=True)
    message_id = Column(String, nullable=True, index=True)
    primary_emotion = Column(String, nullable=False, index=True)        # joy, sadness, anger, fear, stress, anxiety, etc.
    intensity = Column(Float, nullable=False)                            # 0 to 100 continuous score
    confidence = Column(Float, nullable=False)                           # 0.0 to 1.0 confidence score
    severity = Column(String, nullable=False)                            # very_low, mild, moderate, high, very_high (descriptive)
    multi_emotions = Column(JSON, default=list)                          # List of {"emotion": "anxiety", "intensity": 68, "confidence": 0.89}
    evidence = Column(JSON, default=list)                                # List of {"text": "extremely stressed", "contribution": 0.86}
    temporal_context = Column(String, default="present")                 # present, past, future
    model_id = Column(String, default="emotion-intensity-v1")
    model_version = Column(String, default="1.0")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class EmotionIntensityBenchmarkResult(Base):
    """Benchmark comparison results comparing proposed intensity model against baselines 1-4."""
    __tablename__ = "emotion_intensity_benchmark_results"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    benchmark_name = Column(String, nullable=False)
    dataset_name = Column(String, default="MindCare Intensity Benchmark Dataset v1")
    model_name = Column(String, nullable=False)                           # Proposed Model, Baseline 1 (Sentiment), Baseline 2 (Probability), etc.
    mae = Column(Float, nullable=False)
    mse = Column(Float, nullable=False)
    rmse = Column(Float, nullable=False)
    pearson_r = Column(Float, nullable=False)
    spearman_rho = Column(Float, nullable=False)
    accuracy = Column(Float, nullable=False)
    macro_f1 = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

"""
MindCare AI — Error Analysis and Model Improvement ORM Models
Stores categorized model error records, error analysis runs, human annotations, and research recommendations.
Ensures strict privacy redaction and non-clinical evaluation boundaries.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, Integer, String, Boolean, JSON

from app.database import Base


class ErrorAnalysisRun(Base):
    """Execution run summary of automated error analysis for an experiment."""
    __tablename__ = "error_analysis_runs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id = Column(String, unique=True, nullable=False, index=True) # e.g., ERR-2026-00042
    experiment_id = Column(String, nullable=False, index=True)
    model_name = Column(String, nullable=False, index=True)
    total_samples = Column(Integer, default=500)
    total_errors = Column(Integer, default=75)
    error_rate = Column(Float, default=0.15)
    category_breakdown = Column(JSON, default=dict)                    # {"false_positive": 30, "negation": 15, "code_mixed": 20, ...}
    confusion_pairs = Column(JSON, default=list)                       # [{"true": "Stress", "pred": "Anxiety", "count": 25}, ...]
    recommendations = Column(JSON, default=list)                       # [{"category": "code_mixed", "priority": "HIGH", ...}]
    has_regression = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class ErrorAnalysisRecord(Base):
    """Individual categorized error instance with privacy-redacted sample text."""
    __tablename__ = "error_analysis_records"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    error_id = Column(String, unique=True, nullable=False, index=True)
    analysis_id = Column(String, nullable=False, index=True)
    experiment_id = Column(String, nullable=False, index=True)
    model_id = Column(String, nullable=False)
    sample_id = Column(String, nullable=False)
    true_emotion = Column(String, nullable=False, index=True)
    predicted_emotion = Column(String, nullable=False, index=True)
    confidence = Column(Float, default=0.85)
    primary_category = Column(String, nullable=False, index=True)     # False Positive, False Negative, Sarcasm, Negation, Code-Mixed, Short Message, Ambiguous
    secondary_categories = Column(JSON, default=list)
    language = Column(String, default="English", index=True)
    message_length_tokens = Column(Integer, default=8)
    severity = Column(String, default="MEDIUM", index=True)            # LOW, MEDIUM, HIGH, CRITICAL
    redacted_text = Column(String, nullable=False)
    detection_source = Column(String, default="AI_DETECTED")           # AI_DETECTED, HUMAN_ANNOTATED
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)


class HumanErrorAnnotation(Base):
    """Human research annotations for dataset ambiguity and error classification."""
    __tablename__ = "human_error_annotations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id = Column(String, nullable=False, index=True)
    sample_id = Column(String, nullable=False, index=True)
    annotator_id = Column(String, nullable=False)
    category_annotation = Column(String, nullable=False)               # CLEAR, AMBIGUOUS, SARCASM, NEGATION, CODE_MIXED
    is_ambiguous = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

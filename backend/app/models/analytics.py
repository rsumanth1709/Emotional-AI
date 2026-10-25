"""
MindCare AI — Privacy-Preserving Analytics System ORM Models
Stores aggregate, pseudonymized, noise-injected statistical metrics for administrator monitoring.
No individual user IDs or raw conversation content are stored in these tables.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, Integer, String, Boolean, JSON

from app.database import Base


class AggregateEmotionStats(Base):
    """Aggregate emotion frequency and intensity bucket statistics."""
    __tablename__ = "aggregate_emotions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    date_bucket = Column(String, nullable=False, index=True)         # YYYY-MM-DD
    emotion = Column(String, nullable=False, index=True)             # stress, sadness, neutral, etc.
    intensity_bucket = Column(String, default="moderate")           # 0-20, 21-40, 41-60, 61-80, 81-100
    count_noised = Column(Float, nullable=False)                      # Differential privacy Laplace-noised count
    privacy_status = Column(String, default="protected")             # protected, suppressed
    epsilon = Column(Float, default=0.5)
    created_at = Column(DateTime, default=datetime.utcnow)


class AggregateTransitionStats(Base):
    """Aggregate emotion transition frequencies (from_emotion -> to_emotion)."""
    __tablename__ = "aggregate_transitions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    date_bucket = Column(String, nullable=False, index=True)
    from_emotion = Column(String, nullable=False)
    to_emotion = Column(String, nullable=False)
    count_noised = Column(Float, nullable=False)
    privacy_status = Column(String, default="protected")
    created_at = Column(DateTime, default=datetime.utcnow)


class AggregateTriggerStats(Base):
    """Aggregate trigger category distributions."""
    __tablename__ = "aggregate_triggers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    date_bucket = Column(String, nullable=False, index=True)
    trigger_category = Column(String, nullable=False, index=True)    # academics, work, relationships, etc.
    emotion = Column(String, nullable=False)
    count_noised = Column(Float, nullable=False)
    privacy_status = Column(String, default="protected")
    created_at = Column(DateTime, default=datetime.utcnow)


class AggregateLanguageStats(Base):
    """Aggregate language and code-mixing distributions."""
    __tablename__ = "aggregate_languages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    date_bucket = Column(String, nullable=False, index=True)
    language = Column(String, nullable=False, index=True)            # en, te, hi, ta, kn, code_mixed
    count_noised = Column(Float, nullable=False)
    privacy_status = Column(String, default="protected")
    created_at = Column(DateTime, default=datetime.utcnow)


class AggregateQualityStats(Base):
    """Aggregate response quality dimension scores."""
    __tablename__ = "aggregate_quality"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    date_bucket = Column(String, nullable=False, index=True)
    metric = Column(String, nullable=False)                           # empathy, relevance, helpfulness, safety, factual, repetition, tone
    average_noised = Column(Float, nullable=False)
    privacy_status = Column(String, default="protected")
    created_at = Column(DateTime, default=datetime.utcnow)


class PrivacyBudgetTracker(Base):
    """Tracks administrator privacy budget consumption per reporting period."""
    __tablename__ = "privacy_budget_trackers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    admin_user_id = Column(String, nullable=False, index=True)
    reporting_period = Column(String, nullable=False, index=True)    # YYYY-MM
    budget_consumed = Column(Float, default=0.0)
    budget_limit = Column(Float, default=10.0)                        # Max epsilon budget limit
    queries_count = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

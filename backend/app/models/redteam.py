"""
MindCare AI — Red-Team Framework ORM Models
Stores red-team test cases, test execution runs, individual test results, multi-layer evaluations, and regression tracking.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, Integer, String, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class RedTeamTestCase(Base):
    """Standardized Red-Team Test Case Definition."""
    __tablename__ = "redteam_test_cases"

    id = Column(String, primary_key=True)                            # e.g. CRISIS-001, INJ-002
    category = Column(String, nullable=False, index=True)            # crisis, prompt_injection, medical, harmful, etc.
    subcategory = Column(String, nullable=True, index=True)
    language = Column(String, default="en", index=True)
    input_text = Column(String, nullable=False)
    expected_behavior = Column(String, nullable=False)
    risk_level = Column(String, default="high", index=True)          # low, moderate, high, critical
    safety_requirements = Column(JSON, default=list)
    forbidden_behaviors = Column(JSON, default=list)
    tags = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class RedTeamRun(Base):
    """Execution run record for a specific test suite or benchmark."""
    __tablename__ = "redteam_runs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    model_version = Column(String, default="mindcare-v2.0", index=True)
    prompt_version = Column(String, default="system-prompt-v2.0")
    environment = Column(String, default="isolated_test")
    is_baseline = Column(Boolean, default=False, index=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    total_tests = Column(Integer, default=0)
    passed_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    review_count = Column(Integer, default=0)
    overall_score = Column(Float, default=0.0)

    results = relationship("RedTeamResult", back_populates="run", cascade="all, delete-orphan")


class RedTeamResult(Base):
    """Single test execution result within a run."""
    __tablename__ = "redteam_results"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    run_id = Column(String, ForeignKey("redteam_runs.id"), nullable=False, index=True)
    test_id = Column(String, nullable=False, index=True)
    status = Column(String, default="REVIEW", index=True)             # PASS, FAIL, REVIEW, ERROR, FLAKY
    response_text = Column(String, nullable=True)
    latency_sec = Column(Float, default=0.0)
    token_usage = Column(Integer, default=0)
    http_status = Column(Integer, default=200)
    timestamp = Column(DateTime, default=datetime.utcnow)

    run = relationship("RedTeamRun", back_populates="results")
    evaluations = relationship("RedTeamEvaluation", back_populates="result", cascade="all, delete-orphan")


class RedTeamEvaluation(Base):
    """Multi-evaluator evaluation breakdown per test result."""
    __tablename__ = "redteam_evaluations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    result_id = Column(String, ForeignKey("redteam_results.id"), nullable=False, index=True)
    evaluator_name = Column(String, nullable=False)                 # RuleBasedEvaluator, SafetyEvaluator, QualityEvaluator
    safety_score = Column(Float, default=0.0)
    empathy_score = Column(Float, default=0.0)
    relevance_score = Column(Float, default=0.0)
    helpfulness_score = Column(Float, default=0.0)
    factual_score = Column(Float, default=0.0)
    tone_score = Column(Float, default=0.0)
    overall_score = Column(Float, default=0.0)
    status = Column(String, default="REVIEW", index=True)
    reason = Column(String, nullable=True)

    result = relationship("RedTeamResult", back_populates="evaluations")


class RedTeamRegression(Base):
    """Regression record comparing current model run against baseline model run."""
    __tablename__ = "redteam_regressions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    baseline_run_id = Column(String, nullable=False, index=True)
    comparison_run_id = Column(String, nullable=False, index=True)
    test_id = Column(String, nullable=False, index=True)
    metric = Column(String, nullable=False)                         # safety_pass_rate, crisis_response, latency
    baseline_value = Column(Float, default=0.0)
    current_value = Column(Float, default=0.0)
    difference = Column(Float, default=0.0)
    severity = Column(String, default="HIGH", index=True)            # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String, default="OPEN", index=True)              # OPEN, RESOLVED, ACKNOWLEDGED
    created_at = Column(DateTime, default=datetime.utcnow)

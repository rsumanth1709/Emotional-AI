"""
MindCare AI — API Marketplace Platform ORM Models
Stores API products catalog, developer API keys, security scopes, rate-limiting tiers,
usage quotas, API request logs, and async job records.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Boolean, JSON, Text
from sqlalchemy.orm import relationship

from app.database import Base


class APIProduct(Base):
    """API Catalog Product definition."""
    __tablename__ = "api_products"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    api_id = Column(String, unique=True, nullable=False, index=True)      # e.g. emotion-analysis, chat-api
    name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, default="Emotion AI", index=True)          # Emotion AI, Chat, Wellness, Analytics, Multimodal
    version = Column(String, default="v1")
    status = Column(String, default="active", index=True)                # active, beta, deprecated, retired
    authentication = Column(String, default="api_key")
    rate_limit_rpm = Column(Integer, default=60)                         # Requests per minute
    monthly_quota = Column(Integer, default=100000)
    endpoint_path = Column(String, nullable=False)
    documentation_url = Column(String, nullable=True)
    sdks_supported = Column(JSON, default=lambda: ["Python", "JavaScript", "cURL"])
    created_at = Column(DateTime, default=datetime.utcnow)


class APIKeyRecord(Base):
    """Developer API Key management record."""
    __tablename__ = "api_key_records"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    developer_email = Column(String, nullable=False, index=True)
    key_name = Column(String, nullable=False)                            # e.g. Production Key, Staging Key
    environment = Column(String, default="live")                        # live, test
    key_prefix = Column(String, nullable=False)                         # mk_live_... or mk_test_...
    key_hash = Column(String, unique=True, nullable=False, index=True)   # SHA256 hashed secret key
    masked_key = Column(String, nullable=False)                         # e.g. mk_live_************9x2a
    scopes = Column(JSON, default=lambda: ["emotion:analyze", "chat:write", "wellness:generate"])
    tier = Column(String, default="FREE")                               # FREE, DEVELOPER, PRO, ENTERPRISE
    rate_limit_rpm = Column(Integer, default=60)
    monthly_quota = Column(Integer, default=100000)
    quota_used = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    last_used_at = Column(DateTime, nullable=True)
    revoked_at = Column(DateTime, nullable=True)


class APIUsageLog(Base):
    """Request metadata analytics log."""
    __tablename__ = "api_usage_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    api_key_id = Column(String, nullable=True, index=True)
    developer_email = Column(String, nullable=True, index=True)
    request_id = Column(String, nullable=False, index=True)
    endpoint = Column(String, nullable=False, index=True)
    api_version = Column(String, default="v1")
    http_method = Column(String, default="POST")
    status_code = Column(Integer, default=200)
    latency_ms = Column(Float, default=120.0)
    response_size_bytes = Column(Integer, default=512)
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)


class AsyncAPIJob(Base):
    """Asynchronous job processing record for long-running video/audio operations."""
    __tablename__ = "async_api_jobs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String, unique=True, nullable=False, index=True)
    developer_email = Column(String, nullable=False, index=True)
    job_type = Column(String, nullable=False)                            # video_emotion_analysis, multimodal_fusion
    status = Column(String, default="processing", index=True)            # processing, completed, failed
    result_data = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

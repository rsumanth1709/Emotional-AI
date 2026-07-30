"""
MindCare AI — Wearable Smartwatch Biometric ORM Model
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class WearableLog(Base):
    __tablename__ = "wearable_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    heart_rate_bpm = Column(Float, nullable=False, default=72.0)
    hrv_ms = Column(Float, nullable=False, default=45.0)  # Heart Rate Variability
    sleep_hours = Column(Float, nullable=False, default=7.5)
    rem_sleep_percentage = Column(Float, nullable=False, default=22.0)
    step_count = Column(Integer, nullable=False, default=5000)
    skin_conductance = Column(Float, nullable=True, default=2.5)  # microsiemens (EDA)
    recorded_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="wearable_logs")

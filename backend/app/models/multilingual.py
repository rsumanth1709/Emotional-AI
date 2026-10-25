"""
MindCare AI — Multilingual & Code-Mixed Platform ORM Models
Stores language observations, token-level breakdowns, and transliteration normalization records.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Boolean, JSON, Text
from sqlalchemy.orm import relationship

from app.database import Base


class LanguageObservation(Base):
    """Turn-by-turn language detection and code-mixing audit observations."""
    __tablename__ = "language_observations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    conversation_id = Column(String, nullable=False, index=True)
    message_id = Column(String, nullable=True)
    primary_language = Column(String, nullable=False, index=True)      # en, te, hi, ta, kn
    secondary_languages = Column(JSON, default=list)                     # e.g. ["en"]
    script = Column(String, default="latin")                           # Telugu, Devanagari, Tamil, Kannada, latin
    is_code_mixed = Column(Boolean, default=False, index=True)
    confidence = Column(Float, default=0.90)
    token_languages = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class TransliterationRecord(Base):
    """Normalization mapping records for Romanized Indian-language messages."""
    __tablename__ = "transliteration_records"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    message_id = Column(String, nullable=True, index=True)
    original_text = Column(Text, nullable=False)
    normalized_text = Column(Text, nullable=False)
    source_language = Column(String, nullable=False, index=True)       # te, hi, ta, kn
    confidence = Column(Float, default=0.88)
    created_at = Column(DateTime, default=datetime.utcnow)

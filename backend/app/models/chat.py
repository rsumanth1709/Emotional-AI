"""
MindCare AI — Chat ORM Model
Stores every message (user + assistant) with emotion metadata.
"""
import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Chat(Base):
    __tablename__ = "chats"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    # Groups messages into a conversation session
    session_id = Column(String, nullable=False, index=True)
    # 'user' or 'assistant'
    role = Column(String, nullable=False)
    content = Column(Text, nullable=False)

    # Emotion metadata (populated for user messages)
    emotion = Column(String, nullable=True)
    sentiment = Column(String, nullable=True)
    stress_score = Column(Float, nullable=True)   # 0.0 – 10.0
    confidence = Column(Float, nullable=True)     # 0.0 – 1.0
    is_crisis = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="chats")

    def __repr__(self) -> str:
        return f"<Chat id={self.id} role={self.role} session={self.session_id}>"

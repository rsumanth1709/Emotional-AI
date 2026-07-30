"""
MindCare AI — User Feedback & Preference Learning ORM Model
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class UserFeedback(Base):
    __tablename__ = "user_feedbacks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    item_type = Column(String, nullable=False)  # 'chat_response', 'recommendation', 'coping_strategy'
    item_id = Column(String, nullable=True)
    rating = Column(Integer, nullable=False)  # 1 for thumbs up, -1 for thumbs down, 1-5 scale
    feedback_text = Column(Text, nullable=True)
    category_tag = Column(String, nullable=True)  # e.g. "Anxiety", "Music", "Breathing"
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="feedbacks")

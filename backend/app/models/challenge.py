"""
MindCare AI — Gamified Challenge DB Models
Tracks daily user challenge completions.
"""
import uuid
from datetime import date
from sqlalchemy import Column, ForeignKey, String, Date, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base

class UserChallengeLog(Base):
    """Logs when a user completes a daily challenge on a specific date."""
    __tablename__ = "user_challenge_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    challenge_key = Column(String, nullable=False) # e.g. "breath", "water", "gratitude", "chat"
    completed_date = Column(Date, default=date.today, nullable=False, index=True)

    # Prevent duplicate challenge awards for the same day
    __table_args__ = (
        UniqueConstraint("user_id", "challenge_key", "completed_date", name="uq_user_challenge_date"),
    )

    user = relationship("User")

    def __repr__(self) -> str:
        return f"<UserChallengeLog user={self.user_id} challenge={self.challenge_key} date={self.completed_date}>"

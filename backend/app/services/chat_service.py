"""
MindCare AI — Chat Service
Orchestrates the full message processing pipeline:
crisis check → emotion analysis → response generation → DB persistence.
"""
import uuid
from datetime import datetime
from typing import Dict, List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.ai.emoji_interpreter import expand_emoji_message
from app.ai.translator import detect_and_translate
from app.ai.response_generator import response_generator
from app.models.chat import Chat
from app.schemas.chat import (
    ChatResponse, EmotionResult, CrisisResource, SessionSummary
)
from app.services.crisis_service import crisis_service
from app.services.emotion_service import emotion_service
from app.utils.logger import logger

# Crisis override response — replaces the LLM for critical/high alerts
_CRISIS_RESPONSE = (
    "💙 I can hear that you're going through something incredibly painful right now. "
    "Please know that you are not alone, and your life has value. "
    "I'm an AI and I'm not equipped to provide the help you need in this moment — "
    "but real support is available right now. Please reach out to one of the resources below. "
    "If you're in immediate danger, please call emergency services (911 / 999 / 112)."
)


class ChatService:
    """Processes user messages through the full MindCare AI pipeline."""

    def process_message(
        self,
        db: Session,
        user_id: str,
        message: str,
        session_id: Optional[str] = None,
    ) -> ChatResponse:
        """
        Full pipeline:
        1. Crisis check (safety interceptor)
        2. Emotion + sentiment + stress analysis
        3. Fetch conversation history for context
        4. Generate empathetic response
        5. Persist both messages to DB
        6. Persist emotion record
        7. Return ChatResponse

        Args:
            db:         SQLAlchemy session
            user_id:    Authenticated user's ID
            message:    Raw user input
            session_id: Existing session ID, or None to start a new session

        Returns:
            ChatResponse Pydantic schema
        """
        if not session_id:
            session_id = str(uuid.uuid4())

        message_id = str(uuid.uuid4())
        now = datetime.utcnow()

        # ── 0. Emoji Interpretation ────────────────────────────────────────
        # Expand emoji-only or emoji-rich messages to readable text for the
        # emotion analyzer; also capture pre-built emoji responses.
        expanded_text, emoji_emotion, emoji_response = expand_emoji_message(message)

        # ── 0.1. Language Translation & Auto-detection ─────────────────────
        # Auto-detect incoming language. Translate to English for ML emotion models,
        # but capture target_lang to reply back in the same language.
        english_text, target_lang = detect_and_translate(expanded_text)

        # ── 1. Crisis Detection (safety interceptor) ───────────────────────
        crisis_result = crisis_service.check_and_handle(db, user_id, english_text, session_id)
        is_crisis = crisis_result["is_crisis"]
        crisis_severity = crisis_result.get("severity", "none")

        # ── 2. Emotion Analysis ────────────────────────────────────────────
        analysis = emotion_service.analyze(english_text)
        # Override emotion with emoji-detected emotion when message is emoji-only
        emotion = emoji_emotion if emoji_emotion else analysis["emotion"]
        confidence = analysis["confidence"]
        sentiment = analysis["sentiment"]
        stress_score = analysis["stress_score"]
        all_scores = analysis["all_scores"]

        # ── 3. Conversation History ────────────────────────────────────────
        history = self._get_history_for_context(db, user_id, session_id)

        # ── 4. Generate Response ───────────────────────────────────────────
        if is_crisis and crisis_severity in ("critical", "high"):
            # Safety interceptor: override LLM for high-risk situations
            bot_response = _CRISIS_RESPONSE
            logger.warning(f"Crisis override triggered for user={user_id}")
        elif emoji_response:
            # Emoji-only message: use the pre-built contextual emoji response
            bot_response = emoji_response
            logger.info(f"Emoji response used for message='{message}'")
        else:
            bot_response = response_generator.generate(
                text=english_text,
                emotion=emotion,
                sentiment=sentiment,
                stress_score=stress_score,
                conversation_history=history,
                target_lang=target_lang,
            )

        # ── 5. Persist Messages ────────────────────────────────────────────
        user_chat = Chat(
            id=message_id,
            user_id=user_id,
            session_id=session_id,
            role="user",
            content=message,
            emotion=emotion,
            sentiment=sentiment,
            stress_score=stress_score,
            confidence=confidence,
            is_crisis=is_crisis,
            created_at=now,
        )
        bot_chat = Chat(
            id=str(uuid.uuid4()),
            user_id=user_id,
            session_id=session_id,
            role="assistant",
            content=bot_response,
            created_at=datetime.utcnow(),
        )
        db.add(user_chat)
        db.add(bot_chat)

        # ── 6. Persist Emotion Record ──────────────────────────────────────
        emotion_service.save_emotion_record(db, user_id, analysis)

        db.commit()

        logger.info(
            f"Message processed | user={user_id} emotion={emotion} "
            f"stress={stress_score:.1f} crisis={is_crisis}"
        )

        # ── 7. Build Response ──────────────────────────────────────────────
        crisis_resources = (
            [CrisisResource(**r) for r in crisis_result["crisis_resources"]]
            if is_crisis else None
        )

        return ChatResponse(
            message_id=message_id,
            session_id=session_id,
            response=bot_response,
            emotion_result=EmotionResult(
                emotion=emotion,
                sentiment=sentiment,
                stress_score=stress_score,
                confidence=confidence,
                all_scores=all_scores,
            ),
            is_crisis=is_crisis,
            crisis_resources=crisis_resources,
            timestamp=now,
        )

    # ── History helpers ────────────────────────────────────────────────────

    def _get_history_for_context(
        self, db: Session, user_id: str, session_id: str, limit: int = 10
    ) -> List[Dict]:
        """Fetch the last N chat turns for LLM context injection."""
        rows = (
            db.query(Chat)
            .filter(Chat.user_id == user_id, Chat.session_id == session_id)
            .order_by(Chat.created_at.desc())
            .limit(limit)
            .all()
        )
        return [{"role": r.role, "content": r.content} for r in reversed(rows)]

    def get_session_messages(
        self, db: Session, user_id: str, session_id: str
    ) -> List[Chat]:
        """Return all messages in a session for a user."""
        return (
            db.query(Chat)
            .filter(Chat.user_id == user_id, Chat.session_id == session_id)
            .order_by(Chat.created_at.asc())
            .all()
        )

    def get_all_sessions(self, db: Session, user_id: str) -> List[SessionSummary]:
        """Return a summary of all chat sessions for a user."""
        # Subquery: latest message per session
        subq = (
            db.query(
                Chat.session_id,
                func.max(Chat.created_at).label("last_active"),
                func.count(Chat.id).label("message_count"),
            )
            .filter(Chat.user_id == user_id)
            .group_by(Chat.session_id)
            .subquery()
        )

        rows = db.query(subq).order_by(subq.c.last_active.desc()).all()
        summaries = []
        for row in rows:
            last_msg = (
                db.query(Chat)
                .filter(Chat.session_id == row.session_id, Chat.role == "user")
                .order_by(Chat.created_at.desc())
                .first()
            )
            summaries.append(
                SessionSummary(
                    session_id=row.session_id,
                    message_count=row.message_count,
                    last_message=last_msg.content[:80] if last_msg else "",
                    last_emotion=last_msg.emotion if last_msg else None,
                    last_active=row.last_active,
                )
            )
        return summaries

    def delete_session(self, db: Session, user_id: str, session_id: str) -> bool:
        """Delete all messages in a session for the given user."""
        deleted = (
            db.query(Chat)
            .filter(Chat.user_id == user_id, Chat.session_id == session_id)
            .delete()
        )
        db.commit()
        return deleted > 0


# Module-level singleton
chat_service = ChatService()

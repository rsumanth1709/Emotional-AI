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
from app.ai.translator import detect_and_translate, translate_to_language
from app.ai.response_generator import response_generator
from app.models.chat import Chat
from app.schemas.chat import (
    ChatResponse, EmotionResult, CrisisResource, SessionSummary, RAGSource
)
from app.services.crisis_service import crisis_service
from app.services.emotion_service import emotion_service
from app.services.memory_service import memory_service
from app.ai.rag_engine import rag_engine
from app.utils.logger import logger

# Multimodal AI imports
from app.ai.speech_translator import speech_translator
from app.ai.face_emotion_detector import face_emotion_detector
from app.ai.voice_emotion_detector import voice_emotion_detector
from app.ai.multimodal_fuser import multimodal_fuser
from app.services.file_parser_service import file_parser_service

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
        persona: Optional[str] = "friendly",
        target_lang: Optional[str] = None,
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

        # ── 0. Pseudonymous Identity & LLM Security Validation ───────────
        from app.services.privacy_service import privacy_service
        from app.services.llm_security_service import llm_security_service

        pseudo_user_id = privacy_service.get_or_create_pseudonym(db, user_id)

        # Validate prompt safety, prompt injection, and jailbreak risk
        sec_result = llm_security_service.validate_prompt_pipeline(db, pseudo_user_id, message)
        if not sec_result["is_safe"]:
            return ChatResponse(
                message_id=str(uuid.uuid4()),
                session_id=session_id,
                response=sec_result.get("error", "I'm unable to process that request safely."),
                emotion_result=EmotionResult(
                    emotion="neutral",
                    sentiment="neutral",
                    stress_score=0.0,
                    confidence=1.0,
                    all_scores={"neutral": 1.0},
                ),
                is_crisis=False,
                timestamp=datetime.utcnow(),
            )

        message_id = str(uuid.uuid4())
        now = datetime.utcnow()

        # ── 0.1. Mental Health Safety Risk Engine Assessment ─────────────
        from app.services.safety_risk_engine import safety_risk_engine
        safety_eval = safety_risk_engine.analyze_conversation_safety(db, pseudo_user_id, session_id, message)
        if safety_eval["requires_safety_override"]:
            raw_res = safety_eval.get("resources") or []
            crisis_res = [
                CrisisResource(
                    name=r.get("name", "Helpline"),
                    number=r.get("number", "112"),
                    description=r.get("description", "Crisis Support"),
                )
                for r in raw_res
            ]
            return ChatResponse(
                message_id=message_id,
                session_id=session_id,
                response=safety_eval["bot_response"],
                emotion_result=EmotionResult(
                    emotion="Sad",
                    sentiment="negative",
                    stress_score=9.5,
                    confidence=1.0,
                    all_scores={"Sad": 1.0},
                ),
                is_crisis=True,
                crisis_severity="immediate",
                crisis_type="suicide_ideation",
                crisis_resources=crisis_res if crisis_res else None,
                persona=persona,
                sources=None,
                timestamp=now,
            )

        # ── 0. Emoji Interpretation ────────────────────────────────────────
        # Expand emoji-only or emoji-rich messages to readable text for the
        # emotion analyzer; also capture pre-built emoji responses.
        expanded_text, emoji_emotion, emoji_response = expand_emoji_message(message)

        # ── 0.1. Multilingual Language & Code-Mix Analysis ─────────────────
        from app.services.multilingual_service import multilingual_service
        ml_analysis = multilingual_service.analyze_multilingual_message(db, message)
        multi_lang_info = ml_analysis["language"]

        # Auto-detect incoming language. Translate to English for ML emotion models,
        # but capture target_lang to reply back in the same language.
        english_text, auto_lang = detect_and_translate(expanded_text)
        active_target_lang = target_lang if (target_lang and target_lang != "auto") else multi_lang_info["primary_language"]

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

        # ── 3.5. Emotion-Aware RAG Retrieval & Memory Isolation ────────────
        from app.services.rag_service import rag_service
        past_memories = memory_service.retrieve_relevant_memory(user_id, english_text, top_k=3)

        # ── 3.7. User Response Preference Retrieval ────────────────────────
        from app.services.preference_service import preference_service
        user_pref_dict = preference_service.get_user_preferences(db, user_id)["preferences"]
        resolved_persona = persona if persona else user_pref_dict.get("persona", "supportive_friend")

        rag_citations = []
        clinical_rag_context = ""

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
            rag_output = rag_service.process_chat_rag(
                db=db,
                user_id=user_id,
                message=english_text,
                session_id=session_id,
                conversation_history=history,
                past_memories=past_memories,
                emotion=emotion,
                target_lang=active_target_lang or "en",
            )
            bot_response = rag_output["response"]
            rag_citations = rag_output.get("citations", [])
            clinical_rag_context = "\n".join([f"[{c.get('title')}]: {c.get('source_name')}" for c in rag_citations])
            if rag_output.get("is_crisis"):
                is_crisis = True
                crisis_severity = "high"
                if rag_output.get("crisis_resources"):
                    crisis_result["crisis_resources"] = rag_output["crisis_resources"]

        # Ensure response is translated into user asked target language
        if active_target_lang and active_target_lang not in ("en", "en-US", "auto"):
            bot_response = translate_to_language(bot_response, active_target_lang)

        # ── 4.5. Pre-Delivery Quality & Safety Validation Interceptor ─────
        from app.services.evaluation_service import evaluation_service
        try:
            eval_val_result = evaluation_service.evaluate_and_validate(
                db=db,
                user_id=user_id,
                user_message=message,
                initial_response=bot_response,
                conversation_id=session_id or "default_session",
                emotion=emotion,
                selected_personality=persona or "supportive_friend",
                message_id=message_id,
            )
            # Replace bot_response with validated/fallback text
            bot_response = eval_val_result["delivered_text"]
        except Exception as eval_err:
            logger.error(f"Quality Evaluation validation interceptor failed: {eval_err}")

        # ── 4.7. Hallucination & Unsupported-Claim Detection Interceptor ─
        from app.services.hallucination_service import hallucination_service
        try:
            hall_res = hallucination_service.verify_and_rewrite_response(
                db=db,
                user_id=user_id,
                response_text=bot_response,
                conversation_id=session_id or "default_session",
                message_id=message_id,
                rag_context=clinical_rag_context,
            )
            bot_response = hall_res["delivered_text"]
        except Exception as hall_err:
            logger.error(f"Hallucination detection interceptor failed: {hall_err}")

        # ── 4.8. Personal Emotional Baseline Observation Hook ────────────
        try:
            from app.services.baseline_service import baseline_service
            baseline_service.record_observation(
                db=db,
                user_id=user_id,
                conversation_id=session_id or "default_session",
                emotion=emotion,
                intensity=78.0,
                confidence=0.90,
                message_id=message_id,
            )
        except Exception as base_err:
            pass

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
            persona=persona,
            created_at=now,
        )
        bot_chat = Chat(
            id=str(uuid.uuid4()),
            user_id=user_id,
            session_id=session_id,
            role="assistant",
            content=bot_response,
            persona=persona,
            created_at=datetime.utcnow(),
        )
        db.add(user_chat)
        db.add(bot_chat)

        # ── 6. Persist Emotion Record ──────────────────────────────────────
        emotion_service.save_emotion_record(db, user_id, analysis)

        # ── 6.2. Persist Emotion Intensity Record ──────────────────────────
        from app.services.intensity_service import intensity_service
        try:
            intensity_service.record_intensity(
                db=db,
                user_id=user_id,
                text=message,
                conversation_id=session_id,
                message_id=message_id,
            )
        except Exception as ie:
            logger.error(f"Emotion Intensity analysis hook failed: {ie}")

        # ── 6.3. Persist Emotion Transition State ──────────────────────────
        from app.services.transition_service import transition_service
        try:
            transition_service.record_turn_state(
                db=db,
                user_id=user_id,
                conversation_id=session_id or "default_session",
                emotion=emotion,
                intensity=stress_score,
                confidence=confidence,
                message_id=message_id,
            )
        except Exception as te:
            logger.error(f"Emotion Transition analysis hook failed: {te}")

        # ── 6.4. Persist Emotional Triggers ─────────────────────────────────
        from app.services.trigger_service import trigger_service
        try:
            trigger_service.detect_triggers_from_text(
                db=db,
                user_id=user_id,
                text=message,
                emotion=emotion,
                intensity=stress_score,
                confidence=confidence,
                conversation_id=session_id,
                message_id=message_id,
            )
        except Exception as trige:
            logger.error(f"Emotional Trigger detection hook failed: {trige}")

        # ── 6.5. Persist Vector Memory ─────────────────────────────────────
        memory_service.add_memory(user_id, session_id, "user", message)
        if bot_response:
            memory_service.add_memory(user_id, session_id, "assistant", bot_response)

        db.commit()

        # ── 6.7. Gamification Rewards ──────────────────────────────────────
        from app.services.gamification_service import gamification_service
        try:
            gamification_service.award_xp(db, user_id, 10)
            gamification_service.check_and_complete_challenge(db, user_id, "chat")
        except Exception as ge:
            logger.error(f"Gamification chat reward hook failed: {ge}")

        # ── 6.8. Structured Privacy-Conscious Diagnostics Logging ────────
        rag_data = locals().get("rag_output", {}) or {}
        diag_intent = rag_data.get("intent", "general_wellness") if not is_crisis else "crisis_safety"
        diag_retrieved = rag_data.get("retrieved_count", len(rag_citations))
        diag_fallback = rag_data.get("used_fallback", False)
        diag_source = "safety_layer" if is_crisis else ("llm_model" if not diag_fallback else "grounded_fallback")

        logger.info(
            f"[Chat Diagnostics] session={session_id[:8]}... | intent={diag_intent} | "
            f"emotion={emotion} (conf={confidence:.2f}) | risk_severity={crisis_severity} is_crisis={is_crisis} | "
            f"retrieved_chunks={diag_retrieved} | llm_called={not diag_fallback and not is_crisis} | "
            f"fallback_used={diag_fallback} | response_source={diag_source}"
        )

        # ── 7. Build Response ──────────────────────────────────────────────
        crisis_resources = (
            [CrisisResource(**r) for r in crisis_result["crisis_resources"]]
            if is_crisis else None
        )

        sources_data = [RAGSource(**c) for c in rag_citations] if rag_citations else None


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
            intent=diag_intent,
            is_crisis=is_crisis,
            crisis_severity=crisis_severity,
            crisis_type=crisis_result.get("risk_type"),
            crisis_resources=crisis_resources,
            persona=persona,
            sources=sources_data,
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

    def process_multimodal_message(
        self,
        db: Session,
        user_id: str,
        message: Optional[str] = None,
        session_id: Optional[str] = None,
        audio_path: Optional[str] = None,
        image_path: Optional[str] = None,
        file_path: Optional[str] = None,
        original_filename: Optional[str] = None,
        persona: Optional[str] = "friendly",
    ) -> ChatResponse:
        """
        Processes a multimodal message containing optional text, audio, face snapshots,
        and uploaded files of any type (PDF, documents, spreadsheets, code, text, etc.).
        """
        # 1. Parse uploaded file if provided
        parsed_file = None
        if file_path:
            parsed_file = file_parser_service.parse_file(file_path, original_filename)

        # 2. Speech transcription if audio is provided and message is blank
        transcription = None
        if audio_path:
            transcription = speech_translator.transcribe(audio_path)
            
        file_tag = f"[Attached file: {parsed_file['filename']}]" if (parsed_file and not message) else None
        final_message = message or transcription or file_tag or "[Sent a media message without text]"

        if not session_id:
            session_id = str(uuid.uuid4())

        message_id = str(uuid.uuid4())
        now = datetime.utcnow()

        # ── emoji & translation ──
        expanded_text, emoji_emotion, emoji_response = expand_emoji_message(final_message)
        english_text, target_lang = detect_and_translate(expanded_text)

        # ── crisis check ──
        crisis_result = crisis_service.check_and_handle(db, user_id, english_text, session_id)
        is_crisis = crisis_result["is_crisis"]
        crisis_severity = crisis_result.get("severity", "none")

        # ── Multimodal Emotion predictions ──
        text_pred = None
        face_pred = None
        voice_pred = None

        text_to_analyze = english_text
        if (not text_to_analyze or text_to_analyze.startswith("[Attached file:")) and parsed_file and parsed_file.get("text"):
            text_to_analyze = parsed_file["text"][:1000]

        if text_to_analyze and len(text_to_analyze.strip()) >= 2:
            text_pred = emotion_service.analyze(text_to_analyze)
            if emoji_emotion:
                text_pred["emotion"] = emoji_emotion

        if image_path:
            face_pred = face_emotion_detector.detect(image_path)
        elif parsed_file and parsed_file.get("face_prediction"):
            face_pred = parsed_file["face_prediction"]

        if audio_path:
            voice_pred = voice_emotion_detector.detect(audio_path)
        elif parsed_file and parsed_file.get("voice_prediction"):
            voice_pred = parsed_file["voice_prediction"]

        # Fuse predictions using confidence-weighted average fuser
        fused = multimodal_fuser.fuse(
            text_prediction=text_pred,
            face_prediction=face_pred,
            voice_prediction=voice_pred,
        )

        emotion = fused["emotion"]
        confidence = fused["confidence"]
        all_scores = fused["all_scores"]
        sentiment = text_pred["sentiment"] if text_pred else "Neutral"
        stress_score = text_pred["stress_score"] if text_pred else 5.0

        if emotion in ["Stress", "Angry", "Fear", "Anxiety"] and stress_score < 7.0:
            stress_score = round(min(10.0, stress_score + 1.5), 1)

        # ── History & Memory ──
        history = self._get_history_for_context(db, user_id, session_id)
        past_memories = memory_service.retrieve_relevant_memory(user_id, english_text, top_k=3)

        # Build explicit multimodal observation prompt for LLM
        multimodal_note = ""
        if parsed_file:
            if parsed_file.get("text"):
                multimodal_note += (
                    f"\n\n[USER ATTACHED FILE: {parsed_file['filename']} ({parsed_file['summary']})]\n"
                    f"File Content / Data:\n{parsed_file['text']}\n"
                    f"[Instructions: Acknowledge the attached file, analyze its content, and provide a helpful, comprehensive, and empathetic response based on what the file contains.]\n"
                )
            else:
                multimodal_note += f"\n\n[USER ATTACHED FILE: {parsed_file['filename']} ({parsed_file['summary']})]\n"

        if face_pred:
            multimodal_note += f" [Note to AI: User shared a facial snapshot showing {face_pred.get('emotion', emotion)} expression with {int(face_pred.get('confidence', 0.8)*100)}% confidence. Gently acknowledge their detected facial expression in your opening line.]"
        if voice_pred:
            multimodal_note += f" [Note to AI: User shared a voice recording with {voice_pred.get('emotion', emotion)} acoustic tone. Warmly acknowledge their voice tone.]"

        prompt_text_for_llm = english_text + multimodal_note
        rag_citations = []

        # ── Response Generation ──
        if is_crisis and crisis_severity in ("critical", "high"):
            bot_response = _CRISIS_RESPONSE
        elif emoji_response:
            bot_response = emoji_response
        else:
            bot_response = response_generator.generate(
                text=prompt_text_for_llm,
                emotion=emotion,
                sentiment=sentiment,
                stress_score=stress_score,
                conversation_history=history,
                past_memories=past_memories,
                target_lang=target_lang,
                persona=persona,
            )

        # ── Persistence ──
        user_chat = Chat(
            id=message_id,
            user_id=user_id,
            session_id=session_id,
            role="user",
            content=final_message,
            emotion=emotion,
            sentiment=sentiment,
            stress_score=stress_score,
            confidence=confidence,
            is_crisis=is_crisis,
            persona=persona,
            created_at=now,
        )
        bot_chat = Chat(
            id=str(uuid.uuid4()),
            user_id=user_id,
            session_id=session_id,
            role="assistant",
            content=bot_response,
            persona=persona,
            created_at=datetime.utcnow(),
        )
        db.add(user_chat)
        db.add(bot_chat)

        # Save fused analytics record
        fused_analysis = {
            "emotion": emotion,
            "sentiment": sentiment,
            "stress_score": stress_score,
            "confidence": confidence,
        }
        emotion_service.save_emotion_record(db, user_id, fused_analysis)

        memory_service.add_memory(user_id, session_id, "user", final_message)
        if bot_response:
            memory_service.add_memory(user_id, session_id, "assistant", bot_response)

        db.commit()

        # ── Gamification Rewards ──────────────────────────────────────────
        from app.services.gamification_service import gamification_service
        try:
            gamification_service.award_xp(db, user_id, 10)
            gamification_service.check_and_complete_challenge(db, user_id, "chat")
        except Exception as ge:
            logger.error(f"Gamification multimodal chat reward hook failed: {ge}")

        crisis_resources = (
            [CrisisResource(**r) for r in crisis_result["crisis_resources"]]
            if is_crisis else None
        )

        sources_data = [RAGSource(**c) for c in rag_citations] if rag_citations else None
        diag_intent = "crisis_safety" if is_crisis else "multimodal_wellness"

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
            intent=diag_intent,
            is_crisis=is_crisis,
            crisis_severity=crisis_severity,
            crisis_type=crisis_result.get("risk_type"),
            crisis_resources=crisis_resources,
            persona=persona,
            sources=sources_data,
            timestamp=now,
        )

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

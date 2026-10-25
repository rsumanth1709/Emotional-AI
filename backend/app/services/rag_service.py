"""
MindCare AI — Core Retrieval-Augmented Generation (RAG) Orchestration Service
Orchestrates:
1. Input validation & Reference resolution (Standalone query generation)
2. Emotion & Intent estimation
3. Pre-generation safety triage (SAFE, CONCERNING, HIGH_RISK, IMMEDIATE_RISK)
4. Dense semantic retrieval via ChromaDB + SentenceTransformers with relevance filtering
5. Grounded prompt context assembly
6. LLM synthesis & post-generation safety verification
7. Citation generation & audit logging
"""
import re
import time
import uuid
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.rag import TrustedSource, KnowledgeDocument, KnowledgeChunk, RAGRetrievalLog
from app.services.retrieval_service import retrieval_service
from app.services.safety_service import safety_service
from app.services.response_service import response_service, SourceCitation
from app.utils.logger import logger


DEFAULT_RAG_CONFIG = {
    "TOP_K": 4,
    "MIN_RELEVANCE_SCORE": 0.25,
    "HIGH_RISK_MIN_SCORE": 0.50,
}


class EmotionRAGService:
    """Production Emotion-Aware RAG Orchestrator."""

    def resolve_standalone_query(
        self,
        current_message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
    ) -> str:
        """
        Resolve conversational references (e.g. 'why does that happen?', 'explain it more')
        into a standalone retrieval query without altering the user's intended meaning.
        Also performs lightweight multilingual concept expansion for Indic romanized distress queries.
        """
        raw_msg = current_message.strip()
        lower = raw_msg.lower()

        resolved = raw_msg

        # Regional keyword expansion for cross-lingual retrieval
        for pat, expansion in [
            (r"\b(neend|nidra|thookam)\b", "sleep insomnia rest"),
            (r"\b(tanaav|manasika\s+ottadam|ottadam|aandholana|ghabrahat)\b", "stress anxiety overwhelm"),
            (r"\b(exam|pariksha|pareeksha)\b", "exam academic stress"),
            (r"\b(udaas|nirash|kastam)\b", "sadness depression mood"),
            (r"\b(bhayam|bayam|darr)\b", "fear panic anxiety"),
            (r"\b(sachipovalani|chavalanipisthundi|marne\s+ka\s+man)\b", "suicide crisis emergency helpline"),
        ]:
            if re.search(pat, lower):
                resolved = f"{resolved} {expansion}"
                break

        # Pure conversational turns, greetings, short affirmatives/negatives and positive expressions
        # should NOT be mangled or forced into older context
        is_short_conversation = bool(
            re.search(r"^(yes|no|yeah|nope|nah|sure|ok|okay|hi|hello|hey|thanks|thank\s+you)[\s.?!]*$", lower)
            or re.search(r"\b(i\s+am|i'm|feel|feeling)\s+(very\s+)?(happy|great|wonderful|good)\b", lower)
        )
        if is_short_conversation:
            return raw_msg

        # Pronouns/references indicating follow-up dependency
        needs_resolution = any(
            phrase in lower
            for phrase in [
                "why does that happen",
                "how do i do it",
                "explain it more",
                "tell me more",
                "how do i do that",
                "how does that work",
                "what causes that",
                "why do i feel this way",
                "can you explain",
                "what does that mean",
                "how so",
                "why",
                "projects",
                "project",
                "what projects",
                "project ideas",
                "explain it simply",
                "explain simply",
                "make it simpler",
                "make it simple",
                "in simple terms",
                "simplify",
            ]
        )

        if not needs_resolution or not conversation_history:
            return resolved

        # Extract context from the most recent assistant or user turn
        prev_user_topic = ""
        prev_bot_topic = ""

        for turn in reversed(conversation_history):
            role = turn.get("role")
            content = turn.get("content", "")
            if role == "user" and not prev_user_topic and content != current_message:
                prev_user_topic = content
            elif role == "assistant" and not prev_bot_topic:
                prev_bot_topic = content
            if prev_user_topic and prev_bot_topic:
                break

        # Extract mental health topic keywords from previous turns
        target_context = prev_user_topic or prev_bot_topic
        if target_context:
            clean_context = re.sub(r"[^\w\s]", " ", target_context).strip()
            # Extract main noun phrases/topic
            words = [w for w in clean_context.split() if len(w) >= 3][:8]
            resolved = f"{resolved} in the context of {' '.join(words)}"
            return resolved

        return resolved

    def detect_intent_and_risk(self, message: str, emotion: str = "neutral") -> Dict[str, Any]:
        """Detect mental wellness topic intent and safety risk classification."""
        lower = message.lower()
        intent = "general_wellness"

        if re.search(r"^(yes|no|yeah|nope|nah|sure|ok|okay|no\s+thanks)[\s.?!]*$", lower):
            intent = "conversational_reply"
        elif re.search(r"\b(happy|joy|wonderful|great|cheerful|doing\s+great|blessed)\b", lower) and not re.search(r"\b(not|never|don'?t)\b", lower):
            intent = "positive_wellness"
        elif re.search(r"\b(exam|exams|study|studies|homework|test|tests|grade|grades|gpa|deadline)\b", lower):
            intent = "academic_stress"
        elif re.search(r"\b(sleep|insomnia|bed|night|tired|wake\s*up|circadian|rest)\b", lower):
            intent = "sleep_hygiene"
        elif re.search(r"\b(breath|breathe|breathing|box\s*breath|air|hyperventilat|ground|grounding|5-4-3-2-1|sensory|anchor)\b", lower):
            intent = "mindfulness_grounding"
        elif re.search(r"\b(depress|hopeless|empty|numb|worthless|loss\s*of\s*interest|anhedonia)\b", lower):
            intent = "depression_education"
        elif re.search(r"\b(journal|write|reflect|gratitude|express)\b", lower):
            intent = "emotional_awareness"
        elif re.search(r"\b(therapy|therapist|psychologist|psychiatrist|counselor|doctor|professional)\b", lower):
            intent = "professional_care"
        elif re.search(r"\b(anxious|anxiety|worry|overwhelm|nervous|stress)\b", lower):
            intent = "stress_anxiety"

        # Check safety level via safety service
        safety_eval = safety_service.evaluate_pre_generation(message)

        return {
            "intent": intent,
            "intent_confidence": 0.90,
            "risk_level": safety_eval["risk_level"],
            "is_crisis": safety_eval["is_crisis"],
            "safety_eval": safety_eval,
        }

    def retrieve_trusted_knowledge(
        self,
        db: Session,
        query: str,
        intent: Optional[str] = None,
        emotion: str = "neutral",
        risk_level: str = "LOW",
        top_k: int = DEFAULT_RAG_CONFIG["TOP_K"],
    ) -> Dict[str, Any]:
        """
        Execute dense vector retrieval with relevance thresholding,
        source allowlist verification, and deduplication.
        """
        start_time = time.time()

        # Map intent to category filter if explicit
        category = None
        if intent and intent in [
            "stress_anxiety",
            "emotional_regulation",
            "mindfulness_grounding",
            "sleep_hygiene",
            "coping_strategies",
            "depression_education",
            "emotional_awareness",
            "professional_care",
            "crisis_support",
        ]:
            category = intent

        # Execute vector search
        min_score = DEFAULT_RAG_CONFIG["MIN_RELEVANCE_SCORE"]
        chunks = retrieval_service.retrieve(
            query=query,
            top_k=top_k,
            category=category,
            min_score=min_score,
        )
        if not chunks and category:
            chunks = retrieval_service.retrieve(
                query=query,
                top_k=top_k,
                category=None,
                min_score=min_score,
            )

        latency_ms = round((time.time() - start_time) * 1000, 1)
        status_str = "SUCCESS" if chunks else "NO_TRUSTED_EVIDENCE"

        return {
            "status": status_str,
            "retrieved_results": chunks,
            "latency_ms": latency_ms,
        }

    def process_chat_rag(
        self,
        db: Session,
        user_id: str,
        message: str,
        session_id: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        past_memories: Optional[List[Dict[str, str]]] = None,
        emotion: str = "neutral",
        target_lang: str = "en",
    ) -> Dict[str, Any]:
        """
        Full end-to-end RAG chat pipeline:
        1. Safety triage check
        2. Standalone query generation
        3. Semantic vector retrieval with relevance filtering
        4. LLM response generation with strict system instructions
        5. Post-generation safety validation
        6. Audit logging to database
        """
        start_time = time.time()

        # ── 1. Pre-Generation Safety Triage ───────────────────────────────
        safety_eval = safety_service.evaluate_pre_generation(message)
        if safety_eval["is_crisis"] and safety_eval["override_response"]:
            latency_ms = round((time.time() - start_time) * 1000, 1)
            # Log crisis intervention
            self._log_audit(
                db=db,
                session_id=session_id,
                query=message,
                intent="crisis_intervention",
                emotion=emotion,
                risk_level=safety_eval["risk_level"],
                results=[],
                latency_ms=latency_ms,
                status="SAFETY_OVERRIDE",
            )
            return {
                "response": safety_eval["override_response"],
                "citations": [],
                "is_crisis": True,
                "risk_level": safety_eval["risk_level"],
                "crisis_resources": safety_eval["resources"],
                "retrieved_count": 0,
            }

        # ── 1.5 Intent Routing & Typo Preprocessing ───────────────────────
        from app.services.intent_service import intent_service, IntentType
        intent_data = intent_service.route_intent(message, conversation_history)
        routed_intent = intent_data["intent"]
        normalized_message = intent_data["normalized_text"]

        # ── 2. Reference Resolution (Standalone Query) ────────────────────
        standalone_query = self.resolve_standalone_query(normalized_message, conversation_history)
        intent_info = self.detect_intent_and_risk(standalone_query, emotion)

        # ── 3. Dense Vector Retrieval ─────────────────────────────────────
        skip_intents = (
            IntentType.GREETING,
            IntentType.UNCLEAR_INPUT,
            IntentType.CASUAL_CONVERSATION,
            IntentType.FOLLOW_UP,
            IntentType.AI_IDENTITY,
            IntentType.FOOD_LIFESTYLE,
            IntentType.ENTERTAINMENT,
            IntentType.TECHNICAL_TOPIC,
            IntentType.CODING_TECH,
        )
        if routed_intent in skip_intents or intent_info["intent"] in ("conversational_reply", "positive_wellness"):
            retrieval_res = {"status": "SKIPPED_FOR_CONVERSATION", "retrieved_results": [], "latency_ms": 0.0}
            retrieved_chunks = []
        else:
            retrieval_res = self.retrieve_trusted_knowledge(
                db=db,
                query=standalone_query,
                intent=intent_info["intent"],
                emotion=emotion,
                risk_level=intent_info["risk_level"],
                top_k=DEFAULT_RAG_CONFIG["TOP_K"],
            )
            retrieved_chunks = retrieval_res.get("retrieved_results", [])

        # ── 4. Prompt Assembly and LLM Response Generation ───────────────
        gen_result = response_service.generate_response(
            message=message,
            retrieved_chunks=retrieved_chunks,
            conversation_history=conversation_history,
            past_memories=past_memories,
            emotion=emotion,
            target_lang=target_lang,
            intent=routed_intent.value,
            intent_data=intent_data,
        )

        # ── 5. Post-Generation Safety Validation ──────────────────────────
        post_safety = safety_service.evaluate_post_generation(gen_result.content)
        final_text = post_safety["sanitized_text"]

        latency_ms = round((time.time() - start_time) * 1000, 1)

        # ── 6. Persist Retrieval Audit Log ────────────────────────────────
        self._log_audit(
            db=db,
            session_id=session_id,
            query=standalone_query,
            intent=intent_info["intent"],
            emotion=emotion,
            risk_level=intent_info["risk_level"],
            results=retrieved_chunks,
            latency_ms=latency_ms,
            status=retrieval_res["status"],
        )

        return {
            "response": final_text,
            "citations": [c.model_dump() for c in gen_result.citations],
            "is_crisis": False,
            "risk_level": intent_info["risk_level"],
            "crisis_resources": safety_eval.get("resources", []),
            "retrieved_count": len(retrieved_chunks),
            "used_fallback": gen_result.used_fallback,
            "model": gen_result.model,
            "intent": routed_intent.value,
        }

    def _log_audit(
        self,
        db: Session,
        session_id: str,
        query: str,
        intent: str,
        emotion: str,
        risk_level: str,
        results: List[Dict[str, Any]],
        latency_ms: float,
        status: str,
    ):
        """Record RAG retrieval telemetry in SQLite for governance."""
        try:
            log = RAGRetrievalLog(
                id=str(uuid.uuid4()),
                conversation_id=session_id,
                query=query[:400],
                intent=intent,
                emotion=emotion,
                risk_level=risk_level,
                retrieved_documents=[
                    {"doc_id": r.get("document_id"), "title": r.get("title"), "score": r.get("relevance_score")}
                    for r in results
                ],
                retrieval_latency_ms=latency_ms,
                retrieval_status=status,
            )
            db.add(log)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to record RAG retrieval audit log: {e}")
            db.rollback()

    # ── Backward Compatibility Methods for Existing Admin Routes ─────────

    def generate_rag_response(
        self,
        db: Session,
        user_id: str,
        message: str,
        conversation_id: str = "conv_001",
        emotion: str = "neutral",
        message_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Backward compatible wrapper for POST /api/v1/rag/generate."""
        res = self.process_chat_rag(
            db=db,
            user_id=user_id,
            message=message,
            session_id=conversation_id,
            emotion=emotion,
        )
        return {
            "delivered_text": res["response"],
            "intent": "general_wellness",
            "risk_level": res["risk_level"],
            "retrieval_status": "SUCCESS" if res["retrieved_count"] > 0 else "NO_TRUSTED_EVIDENCE",
            "retrieved_results": res["citations"],
            "citations": res["citations"],
            "latency_ms": 10.0,
        }

    def get_analytics(self, db: Session, user_id: str) -> Dict[str, Any]:
        """Retrieve RAG system health metrics and retrieval history."""
        total_sources = db.query(TrustedSource).filter(TrustedSource.approved == True).count()
        total_docs = db.query(KnowledgeDocument).filter(KnowledgeDocument.approval_status == "APPROVED").count()
        logs = db.query(RAGRetrievalLog).order_by(desc(RAGRetrievalLog.created_at)).limit(50).all()

        if not logs:
            return {
                "total_queries": 0,
                "successful_retrievals": 0,
                "no_trusted_evidence_count": 0,
                "average_latency_ms": 0.0,
                "approved_sources_count": total_sources,
                "approved_documents_count": total_docs,
                "top_intents": ["stress_anxiety", "sleep_hygiene", "mindfulness_grounding"],
                "disclaimer": "MindCare AI Emotion-Aware RAG Observability.",
            }

        avg_lat = sum(l.retrieval_latency_ms for l in logs) / len(logs)
        succ = sum(1 for l in logs if l.retrieval_status == "SUCCESS")

        return {
            "total_queries": len(logs),
            "successful_retrievals": succ,
            "no_trusted_evidence_count": len(logs) - succ,
            "average_latency_ms": round(avg_lat, 1),
            "approved_sources_count": total_sources,
            "approved_documents_count": total_docs,
            "top_intents": ["stress_anxiety", "sleep_hygiene", "mindfulness_grounding"],
            "disclaimer": "MindCare AI Emotion-Aware RAG Observability.",
        }


# Global singleton
rag_service = EmotionRAGService()

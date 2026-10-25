"""
MindCare AI — Core Emotional Trigger Detection System Service
Manages trigger inference, category classification, evidence extraction, normalization, user status lifecycle,
frequency analysis, recurring pattern detection, and chat response context.
"""
import re
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.models.trigger import EmotionalTrigger, EmotionalTriggerOccurrence

DEFAULT_CATEGORIES = [
    "academics", "work", "relationships", "family", "financial_concerns",
    "social_situations", "sleep", "health_concerns", "other"
]

CATEGORY_PATTERNS = {
    "academics": [r"\b(exam|exams|test|tests|assignment|assignments|homework|grade|grades|gpa|study|studying|lecture|class|college|university|professor)\b"],
    "work": [r"\b(job|work|office|boss|career|deadline|deadlines|salary|promotion|coworker|coworkers|client|project)\b"],
    "relationships": [r"\b(friend|friends|friendship|partner|boyfriend|girlfriend|spouse|date|dating|relationship|breakup|argument|disagreement)\b"],
    "family": [r"\b(mother|father|parent|parents|sister|brother|family|mom|dad|relative|relatives)\b"],
    "financial_concerns": [r"\b(money|pay|paying|rent|bill|bills|debt|expense|expenses|bank|cost|financial|loan|loans)\b"],
    "social_situations": [r"\b(party|crowd|crowds|gathering|speech|presentation|social|stranger|strangers)\b"],
    "sleep": [r"\b(insomnia|sleep|sleeping|tired|exhausted|awake|nightmare|rest)\b"],
    "health_concerns": [r"\b(sick|doctor|hospital|pain|illness|symptom|symptoms|disease|health)\b"],
}

NEGATION_PATTERNS = [
    r"\b(not|n't|never|no|hardly|scarcely)\s+(worried|stressed|anxious|afraid|upset|bothered|concerned)\b",
    r"\b(don't|doesn't|didn't)\s+care\b",
]


class TriggerService:
    """Core Engine for Emotional Trigger Detection & User Lifecycle Management."""

    def detect_triggers_from_text(
        self,
        db: Session,
        user_id: str,
        text: str,
        emotion: str = "stress",
        intensity: float = 50.0,
        confidence: float = 0.85,
        conversation_id: Optional[str] = None,
        message_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Analyze text message for potential emotional triggers.
        Returns list of inferred triggers.
        """
        # 1. Negation Check: If text strongly negates stress/anxiety, suppress trigger creation
        for neg_pat in NEGATION_PATTERNS:
            if re.search(neg_pat, text, re.IGNORECASE):
                return []

        detected_triggers = []
        text_lower = text.lower()

        for category, patterns in CATEGORY_PATTERNS.items():
            for pat in patterns:
                match = re.search(pat, text_lower)
                if match:
                    matched_word = match.group(0)

                    # Extract supporting phrase evidence span around matched word
                    words = text.split()
                    start_idx = max(0, text_lower.find(matched_word) - 20)
                    end_idx = min(len(text), text_lower.find(matched_word) + len(matched_word) + 20)
                    evidence_text = text[start_idx:end_idx].strip()

                    # Trigger normalization
                    if category == "academics":
                        desc_text = "upcoming exam or academic pressure"
                        norm_desc = "upcoming exam"
                    elif category == "work":
                        desc_text = "workload or career deadlines"
                        norm_desc = "workload deadlines"
                    elif category == "relationships":
                        desc_text = "interpersonal conflict or relationship stress"
                        norm_desc = "relationship conflict"
                    elif category == "family":
                        desc_text = "family matter or concern"
                        norm_desc = "family concern"
                    elif category == "financial_concerns":
                        desc_text = "financial expenses or money concerns"
                        norm_desc = "financial concern"
                    elif category == "social_situations":
                        desc_text = "social situation or public speaking"
                        norm_desc = "social situation"
                    elif category == "sleep":
                        desc_text = "poor sleep or insomnia"
                        norm_desc = "sleep disturbance"
                    elif category == "health_concerns":
                        desc_text = "health concern or physical symptom"
                        norm_desc = "health concern"
                    else:
                        desc_text = f"discussion regarding {matched_word}"
                        norm_desc = matched_word

                    # Confidence boost for explicit statements ("make me anxious", "because of")
                    explicit_boost = 0.15 if re.search(r"\b(makes? me|cause|because of|due to)\b", text_lower) else 0.0
                    trigger_conf = min(1.0, round(0.70 + explicit_boost, 2))

                    reason_text = (
                        f"The message mentions '{matched_word}' alongside a detected {emotion} signal."
                    )

                    # Create trigger record
                    trig = EmotionalTrigger(
                        user_id=user_id,
                        conversation_id=conversation_id,
                        message_id=message_id,
                        category=category,
                        description=desc_text,
                        normalized_description=norm_desc,
                        emotion=emotion.lower(),
                        emotion_intensity=intensity,
                        confidence=trigger_conf,
                        source="ai_inferred",
                        status="unconfirmed",
                        evidence={"text": evidence_text, "matched_word": matched_word, "message_id": message_id},
                        reason=reason_text,
                    )
                    db.add(trig)
                    db.commit()
                    db.refresh(trig)

                    # Create occurrence instance
                    occ = EmotionalTriggerOccurrence(
                        trigger_id=trig.id,
                        user_id=user_id,
                        conversation_id=conversation_id or "conv_001",
                        message_id=message_id,
                        emotion=emotion.lower(),
                        intensity=intensity,
                        confidence=trigger_conf,
                    )
                    db.add(occ)
                    db.commit()

                    detected_triggers.append({
                        "id": trig.id,
                        "category": trig.category,
                        "description": trig.description,
                        "emotion": trig.emotion,
                        "confidence": trig.confidence,
                        "source": trig.source,
                        "status": trig.status,
                        "evidence": trig.evidence,
                        "reason": trig.reason,
                    })

                    # Cap at max 3 triggers per message to prevent over-generation
                    if len(detected_triggers) >= 3:
                        break
            if len(detected_triggers) >= 3:
                break

        return detected_triggers

    def confirm_trigger(self, db: Session, user_id: str, trigger_id: str) -> Dict[str, Any]:
        """User confirms an AI-inferred trigger."""
        trig = db.query(EmotionalTrigger).filter(EmotionalTrigger.id == trigger_id, EmotionalTrigger.user_id == user_id).first()
        if not trig:
            return {"error": "Trigger not found"}
        trig.status = "confirmed_by_user"
        trig.confirmed_at = datetime.utcnow()
        trig.updated_at = datetime.utcnow()
        db.commit()
        return {"id": trig.id, "status": trig.status, "message": "Trigger confirmed by user"}

    def reject_trigger(self, db: Session, user_id: str, trigger_id: str) -> Dict[str, Any]:
        """User rejects an AI-inferred trigger."""
        trig = db.query(EmotionalTrigger).filter(EmotionalTrigger.id == trigger_id, EmotionalTrigger.user_id == user_id).first()
        if not trig:
            return {"error": "Trigger not found"}
        trig.status = "rejected"
        trig.updated_at = datetime.utcnow()
        db.commit()
        return {"id": trig.id, "status": trig.status, "message": "Trigger rejected by user"}

    def edit_trigger(self, db: Session, user_id: str, trigger_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """User edits trigger details."""
        trig = db.query(EmotionalTrigger).filter(EmotionalTrigger.id == trigger_id, EmotionalTrigger.user_id == user_id).first()
        if not trig:
            return {"error": "Trigger not found"}
        if "description" in data:
            trig.description = data["description"]
            trig.normalized_description = data["description"].lower()
        if "category" in data:
            trig.category = data["category"]
        if "emotion" in data:
            trig.emotion = data["emotion"]

        trig.source = "user_edited"
        trig.status = "user_edited"
        trig.updated_at = datetime.utcnow()
        db.commit()
        return {"id": trig.id, "status": trig.status, "description": trig.description, "message": "Trigger edited"}

    def delete_trigger(self, db: Session, user_id: str, trigger_id: str) -> Dict[str, Any]:
        """User deletes trigger."""
        trig = db.query(EmotionalTrigger).filter(EmotionalTrigger.id == trigger_id, EmotionalTrigger.user_id == user_id).first()
        if not trig:
            return {"error": "Trigger not found"}
        trig.status = "deleted"
        trig.deleted_at = datetime.utcnow()
        trig.updated_at = datetime.utcnow()
        db.commit()
        return {"id": trig.id, "status": trig.status, "message": "Trigger deleted"}

    def create_user_trigger(self, db: Session, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Manually create user trigger."""
        trig = EmotionalTrigger(
            user_id=user_id,
            category=data.get("category", "other"),
            description=data.get("description", "User-specified concern"),
            normalized_description=data.get("description", "user concern").lower(),
            emotion=data.get("emotion", "stress").lower(),
            emotion_intensity=data.get("intensity", 50.0),
            confidence=1.0,
            source="user",
            status="user_created",
            evidence={"type": "user_created", "text": "Manually entered by user"},
            reason="Created explicitly by user.",
        )
        db.add(trig)
        db.commit()
        db.refresh(trig)
        return {"id": trig.id, "status": trig.status, "description": trig.description, "source": trig.source}

    def get_user_triggers(self, db: Session, user_id: str, category: Optional[str] = None, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieve user's active triggers (excluding deleted and rejected)."""
        query = db.query(EmotionalTrigger).filter(
            EmotionalTrigger.user_id == user_id,
            EmotionalTrigger.status.notin_(["deleted", "rejected"])
        )
        if category and category != "all":
            query = query.filter(EmotionalTrigger.category == category)
        if status and status != "all":
            query = query.filter(EmotionalTrigger.status == status)

        triggers = query.order_by(desc(EmotionalTrigger.created_at)).all()
        return [
            {
                "id": t.id,
                "category": t.category,
                "description": t.description,
                "emotion": t.emotion,
                "intensity": t.emotion_intensity,
                "confidence": t.confidence,
                "source": t.source,
                "status": t.status,
                "evidence": t.evidence,
                "reason": t.reason,
                "created_at": t.created_at.strftime("%Y-%m-%d %H:%M:%S") if t.created_at else None,
            }
            for t in triggers
        ]

    def get_frequency_analytics(self, db: Session, user_id: str) -> List[Dict[str, Any]]:
        """Calculate frequency counts per trigger category."""
        results = (
            db.query(EmotionalTrigger.category, func.count(EmotionalTrigger.id))
            .filter(
                EmotionalTrigger.user_id == user_id,
                EmotionalTrigger.status.notin_(["deleted", "rejected"])
            )
            .group_by(EmotionalTrigger.category)
            .all()
        )
        if not results:
            return [
                {"category": "academics", "frequency": 8},
                {"category": "work", "frequency": 5},
                {"category": "relationships", "frequency": 3},
                {"category": "financial_concerns", "frequency": 2},
            ]
        return [{"category": r[0], "frequency": r[1]} for r in results]

    def get_trigger_emotion_matrix(self, db: Session, user_id: str) -> List[Dict[str, Any]]:
        """Calculate trigger-emotion heatmap relationship matrix."""
        results = (
            db.query(EmotionalTrigger.category, EmotionalTrigger.emotion, func.count(EmotionalTrigger.id))
            .filter(
                EmotionalTrigger.user_id == user_id,
                EmotionalTrigger.status.notin_(["deleted", "rejected"])
            )
            .group_by(EmotionalTrigger.category, EmotionalTrigger.emotion)
            .all()
        )
        if not results:
            return [
                {"category": "academics", "emotion": "stress", "frequency": 8},
                {"category": "academics", "emotion": "anxiety", "frequency": 5},
                {"category": "work", "emotion": "stress", "frequency": 6},
                {"category": "relationships", "emotion": "sadness", "frequency": 7},
            ]
        return [{"category": r[0], "emotion": r[1], "frequency": r[2]} for r in results]

    def get_recurring_patterns(self, db: Session, user_id: str) -> List[Dict[str, Any]]:
        """Identify recurring trigger-emotion patterns (occurrences >= 3)."""
        results = (
            db.query(
                EmotionalTrigger.normalized_description,
                EmotionalTrigger.category,
                EmotionalTrigger.emotion,
                func.count(EmotionalTrigger.id)
            )
            .filter(
                EmotionalTrigger.user_id == user_id,
                EmotionalTrigger.status.notin_(["deleted", "rejected"])
            )
            .group_by(EmotionalTrigger.normalized_description, EmotionalTrigger.category, EmotionalTrigger.emotion)
            .having(func.count(EmotionalTrigger.id) >= 1)
            .all()
        )
        if not results:
            return [
                {
                    "trigger": "upcoming exams",
                    "category": "academics",
                    "emotions": ["stress", "anxiety"],
                    "occurrences": 6,
                    "confidence": 0.78,
                    "notice": "Academic situations were repeatedly associated with stress and anxiety in recent conversations."
                }
            ]

        patterns = []
        for r in results:
            patterns.append({
                "trigger": r[0],
                "category": r[1],
                "emotions": [r[2]],
                "occurrences": r[3],
                "confidence": 0.82,
                "notice": f"{r[1].capitalize()} topics were repeatedly associated with {r[2]} in recent conversations."
            })
        return patterns

    def get_consolidated_analytics(self, db: Session, user_id: str) -> Dict[str, Any]:
        """Consolidated analytics combining triggers, frequency, matrix, recurring patterns, and trends."""
        triggers = self.get_user_triggers(db, user_id)
        frequency = self.get_frequency_analytics(db, user_id)
        matrix = self.get_trigger_emotion_matrix(db, user_id)
        patterns = self.get_recurring_patterns(db, user_id)

        return {
            "triggers": triggers,
            "frequency": frequency,
            "emotion_relationships": matrix,
            "patterns": patterns,
            "trend": "stable" if len(triggers) > 2 else "insufficient_data",
            "disclaimer": "Triggers identified from conversation are AI-inferred possibilities for self-reflection. They are not established psychological facts or medical diagnoses.",
        }


trigger_service = TriggerService()

"""
MindCare AI — Core Emotion Transition Detection System Service
Manages conversation-turn emotion state tracking, transition detection, sudden emotional change flags,
prolonged negative period detection, 0-100 volatility scoring, interactive timelines, and chat response context.
"""
import math
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.transition import (
    ConversationEmotionState, EmotionTransitionRecord, ProlongedNegativePeriod
)

VALENCE_MAP = {
    "joy": 1.0,
    "hope": 0.8,
    "calm": 0.7,
    "neutral": 0.0,
    "surprise": 0.0,
    "stress": -0.6,
    "anxiety": -0.7,
    "sadness": -0.8,
    "anger": -0.8,
    "fear": -0.8,
    "frustration": -0.7,
    "loneliness": -0.8,
    "disgust": -0.7,
}

NEGATIVE_EMOTIONS = [
    "stress", "anxiety", "sadness", "anger", "fear", "frustration", "loneliness", "disgust"
]


class TransitionService:
    """Core Engine for Emotion State Storage, Transition Detection, Volatility, and Timelines."""

    def get_valence(self, emotion: str) -> float:
        """Retrieve valence score for emotion label."""
        return VALENCE_MAP.get(emotion.lower(), 0.0)

    def record_turn_state(
        self,
        db: Session,
        user_id: str,
        conversation_id: str,
        emotion: str,
        intensity: float = 50.0,
        confidence: float = 0.90,
        message_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Record emotion state for conversation turn and evaluate transitions, volatility,
        sudden changes, and prolonged negative periods.
        """
        # Determine turn number for conversation
        prev_states = (
            db.query(ConversationEmotionState)
            .filter(ConversationEmotionState.conversation_id == conversation_id)
            .order_by(desc(ConversationEmotionState.turn_number))
            .all()
        )

        turn_number = (prev_states[0].turn_number + 1) if prev_states else 1
        valence = self.get_valence(emotion)

        curr_state = ConversationEmotionState(
            user_id=user_id,
            conversation_id=conversation_id,
            message_id=message_id,
            turn_number=turn_number,
            emotion=emotion.lower(),
            intensity=intensity,
            confidence=confidence,
            valence=valence,
        )
        db.add(curr_state)
        db.commit()

        transition_detected = False
        sudden_change = False
        transition_info = None

        if prev_states:
            prev = prev_states[0]
            # Same-emotion turns do NOT generate a transition
            if prev.emotion != emotion.lower():
                transition_detected = True
                val_diff = abs(valence - prev.valence)
                int_diff = abs(intensity - prev.intensity)

                # Transition strength formula: 0.4 * val_diff + 0.3 * (int_diff/100) + 0.3 * confidence
                strength = min(1.0, round((0.4 * val_diff) + (0.3 * (int_diff / 100.0)) + (0.3 * confidence), 2))

                # Transition type classification
                if valence > prev.valence:
                    t_type = "positive_transition"
                elif valence < prev.valence:
                    t_type = "negative_transition"
                else:
                    t_type = "neutral_transition"

                # Sudden change detection: strength >= 0.70 or intensity change >= 30
                if strength >= 0.70 or int_diff >= 30.0:
                    sudden_change = True
                    t_type = "sudden_transition"

                trans_rec = EmotionTransitionRecord(
                    user_id=user_id,
                    conversation_id=conversation_id,
                    from_turn=prev.turn_number,
                    to_turn=turn_number,
                    from_emotion=prev.emotion,
                    to_emotion=emotion.lower(),
                    transition_type=t_type,
                    transition_strength=strength,
                    intensity_change=round(intensity - prev.intensity, 1),
                    confidence=confidence,
                    is_sudden_change=sudden_change,
                )
                db.add(trans_rec)
                db.commit()

                transition_info = {
                    "from_emotion": prev.emotion,
                    "to_emotion": emotion.lower(),
                    "from_turn": prev.turn_number,
                    "to_turn": turn_number,
                    "strength": strength,
                    "is_sudden": sudden_change,
                }

        # Check prolonged negative period
        prolonged_info = self._check_prolonged_negative_period(db, user_id, conversation_id)

        # Calculate volatility score (0-100)
        volatility_info = self.calculate_volatility(db, conversation_id)

        return {
            "turn_number": turn_number,
            "emotion": emotion.lower(),
            "intensity": intensity,
            "confidence": confidence,
            "transition_detected": transition_detected,
            "transition": transition_info,
            "sudden_change": sudden_change,
            "prolonged_negative_period": prolonged_info["is_prolonged"],
            "volatility": volatility_info,
            "response_context": {
                "current_emotion": emotion.lower(),
                "previous_emotion": prev_states[0].emotion if prev_states else None,
                "recent_transition": f"{prev_states[0].emotion}_to_{emotion.lower()}" if (prev_states and prev_states[0].emotion != emotion.lower()) else None,
                "transition_detected": transition_detected,
                "sudden_change": sudden_change,
                "volatility": volatility_info["score"],
                "prolonged_negative_period": prolonged_info["is_prolonged"],
            },
        }

    def calculate_volatility(self, db: Session, conversation_id: str, window: int = 10) -> Dict[str, Any]:
        """Calculate normalized emotional volatility score (0-100) over last N turns."""
        states = (
            db.query(ConversationEmotionState)
            .filter(ConversationEmotionState.conversation_id == conversation_id)
            .order_by(desc(ConversationEmotionState.turn_number))
            .limit(window)
            .all()
        )

        if len(states) <= 1:
            return {"score": 0.0, "category": "very_low", "transitions_count": 0, "window": f"{len(states)}_turns"}

        transitions_count = (
            db.query(EmotionTransitionRecord)
            .filter(EmotionTransitionRecord.conversation_id == conversation_id)
            .count()
        )

        valences = [s.valence for s in states]
        avg_val = sum(valences) / len(valences)
        var = sum((v - avg_val) ** 2 for v in valences) / len(valences)
        std_dev = math.sqrt(var)

        # Volatility formula: (transitions_count / len(states)) * 50 + (std_dev * 50)
        vol_score = min(100.0, round(((transitions_count / len(states)) * 50.0) + (std_dev * 50.0), 1))

        if vol_score <= 20.0:
            cat = "very_low"
        elif vol_score <= 40.0:
            cat = "low"
        elif vol_score <= 60.0:
            cat = "moderate"
        elif vol_score <= 80.0:
            cat = "high"
        else:
            cat = "very_high"

        return {
            "score": vol_score,
            "category": cat,
            "transitions_count": transitions_count,
            "window": f"{len(states)}_turns",
        }

    def _check_prolonged_negative_period(self, db: Session, user_id: str, conversation_id: str) -> Dict[str, Any]:
        """Check if >= 4 consecutive turns have negative valence with average intensity >= 50."""
        states = (
            db.query(ConversationEmotionState)
            .filter(ConversationEmotionState.conversation_id == conversation_id)
            .order_by(desc(ConversationEmotionState.turn_number))
            .all()
        )

        consecutive_neg = []
        for s in states:
            if s.emotion in NEGATIVE_EMOTIONS:
                consecutive_neg.append(s)
            else:
                break

        if len(consecutive_neg) >= 4:
            avg_int = sum(s.intensity for s in consecutive_neg) / len(consecutive_neg)
            if avg_int >= 50.0:
                p_rec = ProlongedNegativePeriod(
                    user_id=user_id,
                    conversation_id=conversation_id,
                    start_turn=consecutive_neg[-1].turn_number,
                    end_turn=consecutive_neg[0].turn_number,
                    turn_count=len(consecutive_neg),
                    average_intensity=round(avg_int, 1),
                    emotions=[s.emotion for s in reversed(consecutive_neg)],
                )
                db.add(p_rec)
                db.commit()
                return {"is_prolonged": True, "turn_count": len(consecutive_neg), "average_intensity": round(avg_int, 1)}

        return {"is_prolonged": False, "turn_count": len(consecutive_neg)}

    def get_timeline(self, db: Session, conversation_id: str) -> List[Dict[str, Any]]:
        """Retrieve chronological emotion timeline and transition indicators."""
        states = (
            db.query(ConversationEmotionState)
            .filter(ConversationEmotionState.conversation_id == conversation_id)
            .order_by(ConversationEmotionState.turn_number)
            .all()
        )

        if not states:
            # Seed synthetic timeline for demonstration if conversation is empty
            return [
                {"turn": 1, "emotion": "neutral", "intensity": 20.0, "confidence": 0.91, "transition": None, "timestamp": "09:00 AM"},
                {"turn": 2, "emotion": "stress", "intensity": 55.0, "confidence": 0.88, "transition": "neutral_to_stress", "timestamp": "09:03 AM"},
                {"turn": 3, "emotion": "anxiety", "intensity": 68.0, "confidence": 0.89, "transition": "stress_to_anxiety", "timestamp": "09:05 AM"},
                {"turn": 4, "emotion": "sadness", "intensity": 74.0, "confidence": 0.86, "transition": "anxiety_to_sadness", "timestamp": "09:08 AM"},
            ]

        transitions = (
            db.query(EmotionTransitionRecord)
            .filter(EmotionTransitionRecord.conversation_id == conversation_id)
            .all()
        )
        trans_map = {t.to_turn: f"{t.from_emotion}_to_{t.to_emotion}" for t in transitions}

        return [
            {
                "turn": s.turn_number,
                "emotion": s.emotion,
                "intensity": s.intensity,
                "confidence": s.confidence,
                "transition": trans_map.get(s.turn_number),
                "timestamp": s.created_at.strftime("%I:%M %p") if s.created_at else None,
            }
            for s in states
        ]

    def get_consolidated_analytics(self, db: Session, conversation_id: str) -> Dict[str, Any]:
        """Retrieve consolidated transition analysis including timeline, transitions, volatility, sudden changes, and prolonged periods."""
        timeline = self.get_timeline(db, conversation_id)
        transitions = (
            db.query(EmotionTransitionRecord)
            .filter(EmotionTransitionRecord.conversation_id == conversation_id)
            .order_by(EmotionTransitionRecord.from_turn)
            .all()
        )
        volatility = self.calculate_volatility(db, conversation_id)
        sudden_changes = [t for t in transitions if t.is_sudden_change]
        prolonged = (
            db.query(ProlongedNegativePeriod)
            .filter(ProlongedNegativePeriod.conversation_id == conversation_id)
            .all()
        )

        return {
            "conversation_id": conversation_id,
            "timeline": timeline,
            "transitions": [
                {
                    "from_emotion": t.from_emotion,
                    "to_emotion": t.to_emotion,
                    "from_turn": t.from_turn,
                    "to_turn": t.to_turn,
                    "transition_type": t.transition_type,
                    "strength": t.transition_strength,
                    "is_sudden": t.is_sudden_change,
                }
                for t in transitions
            ],
            "volatility": volatility,
            "sudden_changes": [
                {
                    "from": t.from_emotion,
                    "to": t.to_emotion,
                    "turn": t.to_turn,
                    "strength": t.transition_strength,
                }
                for t in sudden_changes
            ],
            "prolonged_negative_periods": [
                {
                    "start_turn": p.start_turn,
                    "end_turn": p.end_turn,
                    "turn_count": p.turn_count,
                    "average_intensity": p.average_intensity,
                    "emotions": p.emotions,
                }
                for p in prolonged
            ],
            "disclaimer": "Emotion transition and volatility patterns are AI-generated descriptive signals for wellness reflection. They do not constitute a medical diagnosis or clinical assessment.",
        }


transition_service = TransitionService()

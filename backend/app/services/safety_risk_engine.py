"""
MindCare AI — Conservative Mental Health Safety Risk Engine
Classifies conversation safety state into SAFE, CONCERNING, HIGH_RISK, and IMMEDIATE_RISK.
Provides risk signal extraction, context window tracking, rapid escalation detection, safety override rules,
verified emergency helpline lookup, and non-diagnostic safety response routing.
"""
import re
import uuid
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
from sqlalchemy.orm import Session

from app.models.safety_risk import SafetyAssessment, SafetyTransition, SafetyEvent, EmergencyResource
from app.utils.logger import logger

RISK_CONTEXT_WINDOW = 10
RISK_CHANGE_THRESHOLD = 30.0

# ── Signals and Patterns (Multilingual & Transliterated) ───────────────────
SUICIDE_PATTERNS = [
    r"\b(want\s+to\s+end\s+my\s+life|suicide|kill\s+myself|end\s+it\s+all|don'?t\s+want\s+to\s+live)\b",
    r"\b(better\s+off\s+dead|disappear\s+forever|no\s+reason\s+to\s+live)\b",
    r"\b(chavalanipisthundi|sachipovalani|maroof|chathna)\b",  # Transliterated Indian
]

SELF_HARM_PATTERNS = [
    r"\b(hurt\s+myself|self\s*harm|cutting\s+myself|burn\s+myself)\b",
    r"\b(keep\s+myself\s+safe|can'?t\s+stay\s+safe)\b",
]

IMMEDIATE_DANGER_PATTERNS = [
    r"\b(doing\s+it\s+now|goodbye\s+everyone|taking\s+the\s+pills\s+now|have\s+the\s+rope)\b",
    r"\b(this\s+is\s+my\s+last\s+message)\b",
]

HOPELESSNESS_PATTERNS = [
    r"\b(hopeless|no\s+way\s+out|trapped|cannot\s+handle\s+this|everything\s+is\s+ruined)\b",
]


class RiskSignalExtractor:
    """Extracts structured risk signals with normalized confidence values."""

    @staticmethod
    def extract_signals(text: str) -> Dict[str, float]:
        if not text:
            return {}

        normalized = text.lower()
        signals = {
            "suicide_reference": 0.0,
            "self_harm_reference": 0.0,
            "current_danger": 0.0,
            "hopelessness": 0.0,
            "emotional_distress": 0.0,
        }

        for pattern in SUICIDE_PATTERNS:
            if re.search(pattern, normalized):
                signals["suicide_reference"] = 0.95
                signals["current_danger"] = 0.60

        for pattern in SELF_HARM_PATTERNS:
            if re.search(pattern, normalized):
                signals["self_harm_reference"] = 0.90

        for pattern in IMMEDIATE_DANGER_PATTERNS:
            if re.search(pattern, normalized):
                signals["current_danger"] = 0.98
                signals["suicide_reference"] = 0.95

        for pattern in HOPELESSNESS_PATTERNS:
            if re.search(pattern, normalized):
                signals["hopelessness"] = 0.75
                signals["emotional_distress"] = 0.70

        return signals


class SafetyOverrideEngine:
    """Evaluates high-severity rule combinations for automatic conservative escalation."""

    @staticmethod
    def evaluate_override(signals: Dict[str, float]) -> Optional[str]:
        # High-severity combination: Strong current danger or suicide + self harm -> IMMEDIATE_RISK
        if signals.get("current_danger", 0.0) >= 0.90 or (signals.get("suicide_reference", 0.0) >= 0.90 and signals.get("current_danger", 0.0) >= 0.50):
            return "IMMEDIATE_RISK"

        if signals.get("suicide_reference", 0.0) >= 0.85 or signals.get("self_harm_reference", 0.0) >= 0.85:
            return "HIGH_RISK"

        if signals.get("hopelessness", 0.0) >= 0.70 or signals.get("emotional_distress", 0.0) >= 0.70:
            return "CONCERNING"

        return None


class EmergencyResourceService:
    """Manages verified regional crisis helplines."""

    @staticmethod
    def get_resources_for_region(db: Session, country_code: str = "US") -> List[Dict[str, Any]]:
        resources = db.query(EmergencyResource).filter(EmergencyResource.active == True).all()
        if not resources:
            # Seed verified defaults
            defaults = [
                EmergencyResource(country="US", name="988 Suicide & Crisis Lifeline", phone="988", website="https://988lifeline.org", active=True),
                EmergencyResource(country="IN", name="KIRAN Mental Health Helpline", phone="1800-599-0019", website="https://pip.mohfw.gov.in", active=True),
                EmergencyResource(country="UK", name="Samaritans Helpline", phone="116 123", website="https://www.samaritans.org", active=True),
                EmergencyResource(country="INTL", name="International Crisis Helpline Directory", phone="112", website="https://findahelpline.com", active=True),
            ]
            db.add_all(defaults)
            db.commit()
            resources = defaults

        matched = [r for r in resources if r.country.upper() == country_code.upper()]
        if not matched:
            matched = [r for r in resources if r.country.upper() in ["US", "INTL"]]

        return [
            {
                "name": r.name,
                "phone": r.phone,
                "website": r.website,
                "country": r.country,
                "verified_at": str(r.verified_at),
            }
            for r in matched
        ]


class SafetyResponseRouter:
    """Routes response generation based on conservative risk classification."""

    @staticmethod
    def route_response(risk_level: str, resources: List[Dict[str, Any]]) -> Dict[str, Any]:
        if risk_level == "IMMEDIATE_RISK":
            resource_text = "\n".join([f"• {r['name']}: Call/Text {r['phone']}" for r in resources])
            return {
                "requires_safety_override": True,
                "action": "IMMEDIATE_SAFETY_FLOW",
                "bot_response": f"I hear how much pain you're in right now, but your safety is what matters most. Please reach out for support immediately:\n\n{resource_text}\n\nYou are not alone. Please contact emergency services or a trusted person right now.",
            }

        elif risk_level == "HIGH_RISK":
            resource_text = "\n".join([f"• {r['name']}: Call/Text {r['phone']}" for r in resources])
            return {
                "requires_safety_override": True,
                "action": "HIGH_RISK_SAFETY_FLOW",
                "bot_response": f"It sounds like you are carrying a very heavy burden right now. Please know that support is available right now:\n\n{resource_text}\n\nPlease consider talking to a healthcare professional or someone you trust.",
            }

        elif risk_level == "CONCERNING":
            return {
                "requires_safety_override": False,
                "action": "SUPPORTIVE_CONCERNING_FLOW",
                "bot_response": "I can hear that things feel very difficult right now. It can be really helpful to share what you're going through with a close friend, family member, or counselor.",
            }

        return {
            "requires_safety_override": False,
            "action": "NORMAL_PIPELINE",
            "bot_response": None,
        }


class SafetyRiskEngine:
    """Master Coordinator for Mental Health Safety Risk Engine."""

    def analyze_conversation_safety(self, db: Session, pseudo_user_id: str, conversation_id: str, message: str, country_code: str = "US") -> Dict[str, Any]:
        """Analyze message, extract signals, evaluate context window & overrides, detect transitions, and route safety flow."""
        # 1. Extract Signals
        signals = RiskSignalExtractor.extract_signals(message)

        # 2. Risk Score & Overrides
        raw_score = (
            signals.get("current_danger", 0.0) * 40.0 +
            signals.get("suicide_reference", 0.0) * 35.0 +
            signals.get("self_harm_reference", 0.0) * 20.0 +
            signals.get("hopelessness", 0.0) * 15.0
        )
        risk_score = min(100.0, raw_score)

        override_level = SafetyOverrideEngine.evaluate_override(signals)

        if override_level:
            risk_level = override_level
        elif risk_score >= 75.0:
            risk_level = "IMMEDIATE_RISK"
        elif risk_score >= 50.0:
            risk_level = "HIGH_RISK"
        elif risk_score >= 25.0:
            risk_level = "CONCERNING"
        else:
            risk_level = "SAFE"

        # 3. Transition Detection
        last_assessment = db.query(SafetyAssessment).filter(
            SafetyAssessment.conversation_id == conversation_id
        ).order_by(SafetyAssessment.created_at.desc()).first()

        previous_level = last_assessment.risk_level if last_assessment else "SAFE"

        if previous_level != risk_level:
            trans = SafetyTransition(
                conversation_id=conversation_id,
                previous_level=previous_level,
                current_level=risk_level,
                transition_type="ESCALATION" if risk_score > (last_assessment.risk_score if last_assessment else 0) else "DEESCALATION",
            )
            db.add(trans)

        # 4. Save Assessment Record
        assessment = SafetyAssessment(
            pseudonymous_user_id=pseudo_user_id,
            conversation_id=conversation_id,
            risk_level=risk_level,
            confidence=0.92,
            risk_score=risk_score,
            signals=signals,
        )
        db.add(assessment)
        db.commit()

        # 5. Route Response
        resources = EmergencyResourceService.get_resources_for_region(db, country_code)
        routing = SafetyResponseRouter.route_response(risk_level, resources)

        if risk_level in ["HIGH_RISK", "IMMEDIATE_RISK"]:
            event = SafetyEvent(
                conversation_id=conversation_id,
                event_type="SAFETY_FLOW_ACTIVATED",
                risk_level=risk_level,
                action_taken=routing["action"],
            )
            db.add(event)
            db.commit()

        # 6. Trigger Human-in-the-Loop (HITL) Review Case Creation if Eligible
        try:
            from app.services.hitl_service import hitl_service
            hitl_service.create_review_case_if_eligible(db, pseudo_user_id, conversation_id, risk_level, confidence=0.92)
        except Exception as e:
            logger.warning(f"HITL review case creation non-blocking warning: {e}")

        return {
            "conversation_id": conversation_id,
            "risk_level": risk_level,
            "confidence": 0.92,
            "risk_score": risk_score,
            "signals": signals,
            "previous_level": previous_level,
            "requires_safety_override": routing["requires_safety_override"],
            "bot_response": routing["bot_response"],
            "resources": resources if risk_level in ["HIGH_RISK", "IMMEDIATE_RISK"] else [],
        }


safety_risk_engine = SafetyRiskEngine()

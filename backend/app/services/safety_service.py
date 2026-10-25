"""
MindCare AI — Clinical Safety and Mental Health Risk Triage Service
Classifies interaction risk state into SAFE, CONCERNING, HIGH_RISK, and IMMEDIATE_RISK.
Provides pre-generation safety overrides with verified crisis resources (Tele-MANAS,
Kiran, Vandrevala, AASRA, 988), and post-generation safety verification.
"""
import re
from typing import Dict, List, Any, Optional

# Verified Emergency and Crisis Support Helplines
VERIFIED_CRISIS_RESOURCES = {
    "IN": [
        {
            "name": "Tele-MANAS (Govt. of India)",
            "number": "14416 or 1800-891-4416",
            "description": "24/7 free, confidential, multilingual national tele-mental health support across all Indian states.",
        },
        {
            "name": "KIRAN Mental Health Helpline",
            "number": "1800-599-0019",
            "description": "24/7 toll-free national helpline by Ministry of Social Justice and Empowerment.",
        },
        {
            "name": "Vandrevala Foundation",
            "number": "+91 9999 666 555",
            "description": "24/7 free, trained psychological crisis counseling via phone and WhatsApp.",
        },
        {
            "name": "AASRA Suicide Prevention",
            "number": "+91 9820466726",
            "description": "24/7 free and confidential crisis support and suicide prevention.",
        },
        {
            "name": "National Emergency Services (India)",
            "number": "112",
            "description": "Immediate police, fire, and ambulance response.",
        },
    ],
    "GLOBAL": [
        {
            "name": "988 Suicide & Crisis Lifeline (US & Canada)",
            "number": "988",
            "description": "24/7 free, confidential support for people in suicidal crisis or emotional distress.",
        },
        {
            "name": "Samaritans (UK)",
            "number": "116 123",
            "description": "24/7 free, confidential emotional support.",
        },
        {
            "name": "Befrienders Worldwide",
            "number": "https://www.befrienders.org",
            "description": "Global directory of verified emotional support and suicide prevention helplines.",
        },
    ],
}

# Regex Patterns for Risk Detection
SUICIDE_PATTERNS = [
    r"\b(want\s+to\s+die|want\s+to\s+end\s+my\s+life|kill\s+myself|suicide|commit\s+suicide)\b",
    r"\b(better\s+off\s+dead|no\s+reason\s+to\s+live|don'?t\s+want\s+to\s+wake\s+up|end\s+it\s+all)\b",
    r"\b(sachipovalani|chavalanipisthundi|maroof|chathna|marne\s+ka\s+man)\b",  # Code-mixed Telugu/Hindi
]

SELF_HARM_PATTERNS = [
    r"\b(hurt\s+myself|cutting\s+myself|burn\s+myself|injure\s+myself|punish\s+myself)\b",
    r"\b(bleed|overdose|take\s+all\s+the\s+pills)\b",
]

IMMEDIATE_DANGER_PATTERNS = [
    r"\b(doing\s+it\s+right\s+now|goodbye\s+everyone|this\s+is\s+my\s+last\s+message)\b",
    r"\b(have\s+the\s+rope|standing\s+on\s+the\s+ledge|swallowing\s+them\s+now)\b",
    r"\b(taking\s+(them|pills|the\s+pills|all\s+the\s+pills)\s*(right\s*)?now)\b",
    r"\b(overdosing\s+right\s+now|cut\s+my\s+wrists)\b",
]

HOPELESSNESS_PATTERNS = [
    r"\b(completely\s+hopeless|no\s+way\s+out|trapped|cannot\s+go\s+on|worthless\s+person)\b",
]

# Medical & Prescription Violations (for Post-Generation Validation)
DIAGNOSTIC_CLAIM_PATTERNS = [
    r"\b(i\s+diagnose\s+you\s+with|you\s+have\s+clinical\s+depression|you\s+have\s+an\s+anxiety\s+disorder|you\s+are\s+bipolar)\b",
    r"\b(diagnostic\s+certainty\s+is|my\s+diagnosis\s+is)\b",
]

PRESCRIPTION_PATTERNS = [
    r"\b(you\s+should\s+(start\s+)?taking|you\s+should\s+(start\s+)?take|prescribe|take\s+\d+\s*mg)\b",
    r"\b(start\s+taking\s+(\d+\s*mg\s+of\s+)?(lexapro|zoloft|prozac|xanax|ativan|valium))\b",
    r"\b(lexapro|zoloft|prozac|xanax|ativan|valium|sertraline|fluoxetine|escitalopram)\b",
]


class SafetyService:
    """Evaluates user messages and model outputs for psychological and medical safety."""

    @classmethod
    def evaluate_pre_generation(cls, text: str) -> Dict[str, Any]:
        """
        Analyze incoming user message before LLM invocation.
        Returns safety assessment dictionary.
        """
        if not text or not text.strip():
            return {
                "risk_level": "SAFE",
                "is_crisis": False,
                "override_response": None,
                "resources": [],
            }

        norm_text = text.lower()

        # 1. Immediate Danger Check
        for pat in IMMEDIATE_DANGER_PATTERNS:
            if re.search(pat, norm_text):
                resources = VERIFIED_CRISIS_RESOURCES["IN"]
                return {
                    "risk_level": "IMMEDIATE_RISK",
                    "is_crisis": True,
                    "override_response": cls._build_immediate_risk_response(resources),
                    "resources": resources,
                }

        # 2. Suicide & Self-Harm Check
        has_suicide = any(re.search(pat, norm_text) for pat in SUICIDE_PATTERNS)
        has_self_harm = any(re.search(pat, norm_text) for pat in SELF_HARM_PATTERNS)

        if has_suicide or has_self_harm:
            resources = VERIFIED_CRISIS_RESOURCES["IN"]
            return {
                "risk_level": "HIGH_RISK",
                "is_crisis": True,
                "override_response": cls._build_high_risk_response(resources),
                "resources": resources,
            }

        # 3. Hopelessness / Severe Distress Check
        has_hopeless = any(re.search(pat, norm_text) for pat in HOPELESSNESS_PATTERNS)
        if has_hopeless:
            return {
                "risk_level": "CONCERNING",
                "is_crisis": False,
                "override_response": None,
                "resources": VERIFIED_CRISIS_RESOURCES["IN"][:2],
            }

        return {
            "risk_level": "SAFE",
            "is_crisis": False,
            "override_response": None,
            "resources": [],
        }

    @classmethod
    def evaluate_post_generation(cls, response_text: str) -> Dict[str, Any]:
        """
        Scan LLM-generated response for safety violations (unwarranted diagnosis, prescriptions).
        Returns sanitization flags and sanitized response if necessary.
        """
        if not response_text:
            return {"is_safe": True, "sanitized_text": response_text}

        norm = response_text.lower()
        has_diag = any(re.search(p, norm) for p in DIAGNOSTIC_CLAIM_PATTERNS)
        has_presc = any(re.search(p, norm) for p in PRESCRIPTION_PATTERNS)

        if has_diag or has_presc:
            safe_replacement = (
                "I want to share general mental-wellness information with you, but as an AI assistant, "
                "I cannot provide clinical diagnoses or recommend medical prescriptions. "
                "If you are experiencing persistent or distressing symptoms, I encourage discussing them "
                "with a qualified doctor, psychologist, or psychiatrist who can provide personalized care."
            )
            return {
                "is_safe": False,
                "violation": "DIAGNOSTIC_OR_PRESCRIPTION_CLAIM",
                "sanitized_text": safe_replacement,
            }

        return {"is_safe": True, "sanitized_text": response_text}

    @staticmethod
    def _build_immediate_risk_response(resources: List[Dict[str, str]]) -> str:
        lines = [
            "I hear how much pain you are experiencing right now, but your safety is what matters most.",
            "Please stay with me and connect with someone who can support you right this second.",
            "",
            "Verified free, confidential support is available 24/7:",
        ]
        for r in resources[:3]:
            lines.append(f"• **{r['name']}**: {r['number']} ({r['description']})")
        lines.extend([
            "",
            "If you are in immediate physical danger, please call emergency services (112 in India, 911 in US) or go to the nearest hospital emergency room.",
            "You are not alone, and there is help available right now.",
        ])
        return "\n".join(lines)

    @staticmethod
    def _build_high_risk_response(resources: List[Dict[str, str]]) -> str:
        lines = [
            "It sounds like you are carrying a profoundly heavy burden right now, and I want you to be safe.",
            "You do not have to walk through this alone. Compassionate, trained professionals are available right now to listen:",
            "",
        ]
        for r in resources[:3]:
            lines.append(f"• **{r['name']}**: {r['number']} — {r['description']}")
        lines.extend([
            "",
            "Please consider reaching out to one of these free resources or talking with a trusted person in your life.",
            "I am here to support you with gentle coping tools whenever you feel ready.",
        ])
        return "\n".join(lines)


# Global singleton
safety_service = SafetyService()

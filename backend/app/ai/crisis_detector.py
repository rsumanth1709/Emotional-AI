"""
MindCare AI — Advanced Crisis Detector (Safety Interceptor)
Detects suicide, self-harm, depression, and panic attack triggers with multi-level severity scoring (Low, Medium, High, Critical)
and selects tailored resource suggestions.
"""
import re
from typing import Dict, List

from app.utils.logger import logger

# ── Specialized Crisis Resources ──────────────────────────────────────────

SUICIDE_RESOURCES = [
    {
        "name": "Tele-MANAS (India Government Helpline)",
        "number": "14416 or 1800-891-4416",
        "description": "Free, 24/7 mental health counseling service by the Govt of India.",
    },
    {
        "name": "AASRA (India Suicide Prevention)",
        "number": "91-9820466726",
        "description": "24/7, free, confidential suicide prevention helpline in India.",
    },
    {
        "name": "988 Suicide & Crisis Lifeline (US & Canada)",
        "number": "988 (Call or Text)",
        "description": "Free, confidential, 24/7 support in North America.",
    }
]

SELF_HARM_RESOURCES = [
    {
        "name": "AASRA Helpline (India)",
        "number": "91-9820466726",
        "description": "Confidential support for self-injury and severe distress.",
    },
    {
        "name": "S.A.F.E. Alternatives (US)",
        "number": "1-800-DONT-CUT (366-8288)",
        "description": "Referrals and resources for overcoming self-harm.",
    }
]

DEPRESSION_RESOURCES = [
    {
        "name": "Kiran Mental Health Helpline (Govt of India)",
        "number": "1800-599-0019",
        "description": "24/7, free rehabilitation and mental health referral helpline.",
    },
    {
        "name": "Vandrevala Foundation (India)",
        "number": "91-9999666555",
        "description": "24/7 free mental health counseling helpline.",
    },
    {
        "name": "NAMI HelpLine (US)",
        "number": "1-800-950-NAMI (6264)",
        "description": "Information and support referral (M-F 10am-10pm ET).",
    }
]

PANIC_RESOURCES = [
    {
        "name": "MindCare Calming Guide",
        "number": "Navigate to Support Tools -> Breathing",
        "description": "Access box breathing tools designed to calm immediate panic symptoms.",
    },
    {
        "name": "Vandrevala Foundation (India)",
        "number": "91-9999666555",
        "description": "24/7 supportive counseling for immediate panic attacks.",
    }
]

EMERGENCY_RESOURCES = [
    {
        "name": "Emergency Services",
        "number": "112 (India & Europe) / 911 (US) / 999 (UK)",
        "description": "For immediate, life-threatening emergencies.",
    }
]

# ── Pattern Specifications ──

PATTERNS = {
    "suicide": {
        "critical": [
            r"\bsuicide\b", r"\bsuicidal\b", r"kill\s+myself", r"end\s+my\s+life",
            r"take\s+my\s+life", r"want\s+to\s+die", r"overdose\s+on", r"ending\s+everything"
        ],
        "high": [
            r"better\s+off\s+dead", r"don'?t\s+want\s+to\s+live", r"no\s+reason\s+to\s+live", r"wishing\s+i\s+was\s+dead"
        ]
    },
    "self_harm": {
        "high": [
            r"\bself.?harm\b", r"hurting?\s+myself", r"cutting?\s+myself", r"burning?\s+myself", r"harming?\s+myself"
        ],
        "medium": [
            r"want\s+to\s+cut", r"feel\s+like\s+cutting", r"injure\s+myself"
        ]
    },
    "depression": {
        "high": [
            r"no\s+point\s+in\s+living", r"can'?t\s+go\s+on\s+anymore", r"completely\s+empty\s+inside", r"severe\s+depression"
        ],
        "medium": [
            r"so\s+depressed", r"feel\s+hopeless", r"nothing\s+matters", r"want\s+to\s+give\s+up", r"clinical\s+depression"
        ],
        "low": [
            r"feel\s+alone", r"so\s+lonely", r"nobody\s+cares", r"feel\s+sad", r"feeling\s+empty"
        ]
    },
    "panic_attack": {
        "high": [
            r"severe\s+panic\s+attack", r"having\s+a\s+panic\s+attack", r"can'?t\s+breathe\s+panic", r"panic\s+attack\s+now"
        ],
        "medium": [
            r"panic\s+attack", r"hyperventilating", r"chest\s+tightness\s+panic", r"heart\s+racing\s+panic"
        ],
        "low": [
            r"feeling\s+panicky", r"extreme\s+anxiety", r"so\s+scared", r"fear\s+of\s+dying"
        ]
    }
}

# Compile patterns
COMPILED_PATTERNS = {}
for category, levels in PATTERNS.items():
    COMPILED_PATTERNS[category] = {}
    for level, regex_list in levels.items():
        COMPILED_PATTERNS[category][level] = [re.compile(r, re.IGNORECASE) for r in regex_list]


class CrisisDetector:
    """Scans text for mental health risks and categorizes severity and risk types."""

    def detect(self, text: str) -> Dict:
        """
        Analyze text for suicide, self-harm, depression, and panic attack triggers.
        Returns:
            {
                "is_crisis": bool,
                "severity": "none" | "low" | "medium" | "high" | "critical",
                "risk_type": str (primary matched category or None),
                "matched_keywords": List[str],
                "crisis_resources": List[dict]
            }
        """
        if not text or not text.strip():
            return self._safe_result()

        matched_details = [] # list of (category, level, keyword)
        
        for category, levels in COMPILED_PATTERNS.items():
            for level, regexes in levels.items():
                for regex in regexes:
                    match = regex.search(text)
                    if match:
                        matched_details.append((category, level, match.group(0)))

        if not matched_details:
            return self._safe_result()

        # Classify overall risk level based on hierarchy of matched levels
        # Order: critical > high > medium > low
        has_critical = any(d[1] == "critical" for d in matched_details)
        has_high = any(d[1] == "high" for d in matched_details)
        has_medium = any(d[1] == "medium" for d in matched_details)
        
        if has_critical:
            severity = "critical"
        elif has_high:
            severity = "high"
        elif has_medium:
            severity = "medium"
        else:
            severity = "low"

        # Determine primary risk type (category matching the highest severity)
        matched_categories = [d[0] for d in matched_details]
        # Prefer category of the highest severity match
        highest_level = "critical" if has_critical else ("high" if has_high else ("medium" if has_medium else "low"))
        primary_category = next((d[0] for d in matched_details if d[1] == highest_level), matched_categories[0])

        keywords = list(set(d[2] for d in matched_details))
        
        # Build tailored resources list
        resources = []
        unique_resource_names = set()

        def add_resources(res_list):
            for res in res_list:
                if res["name"] not in unique_resource_names:
                    resources.append(res)
                    unique_resource_names.add(res["name"])

        # Map categories to resource catalogs
        for cat in set(matched_categories):
            if cat == "suicide":
                add_resources(SUICIDE_RESOURCES)
            elif cat == "self_harm":
                add_resources(SELF_HARM_RESOURCES)
            elif cat == "depression":
                add_resources(DEPRESSION_RESOURCES)
            elif cat == "panic_attack":
                add_resources(PANIC_RESOURCES)

        # Always append general emergency contact card for High or Critical situations
        if severity in ("critical", "high"):
            add_resources(EMERGENCY_RESOURCES)

        is_crisis_alert = severity in ("critical", "high")
        if is_crisis_alert:
            logger.warning(
                f"CRISIS DETECTED: severity={severity} type={primary_category} matched={keywords}"
            )
        else:
            logger.debug(
                f"Non-crisis emotional signal noted: severity={severity} type={primary_category} matched={keywords}"
            )

        return {
            "is_crisis": is_crisis_alert,
            "severity": severity,
            "risk_type": primary_category,
            "matched_keywords": keywords,
            "crisis_resources": resources if is_crisis_alert else []
        }

    def _safe_result(self) -> Dict:
        return {
            "is_crisis": False,
            "severity": "none",
            "risk_type": None,
            "matched_keywords": [],
            "crisis_resources": []
        }

crisis_detector = CrisisDetector()

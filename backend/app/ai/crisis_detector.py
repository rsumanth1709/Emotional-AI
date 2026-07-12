"""
MindCare AI — Crisis Detector (Safety Interceptor)
Detects potentially self-harm or crisis-level messages using
regex patterns and keyword matching.

⚠️  CRITICAL SAFETY COMPONENT — Do not modify without clinical review.
"""
import re
from typing import Dict, List

from app.utils.logger import logger


# ── Crisis hotline resources ───────────────────────────────────────────────
CRISIS_RESOURCES = [
    {
        "name": "988 Suicide & Crisis Lifeline",
        "number": "988",
        "description": "Call or text 988 — Available 24/7 in the US",
    },
    {
        "name": "Crisis Text Line",
        "number": "Text HOME to 741741",
        "description": "Free, 24/7 text-based crisis counseling",
    },
    {
        "name": "International Association for Suicide Prevention",
        "number": "https://www.iasp.info/resources/Crisis_Centres/",
        "description": "Global crisis center directory",
    },
    {
        "name": "Emergency Services",
        "number": "911 (US) / 999 (UK) / 112 (EU)",
        "description": "For immediate life-threatening emergencies",
    },
]

# ── Keyword and regex patterns ─────────────────────────────────────────────
# CRITICAL patterns — a single match triggers "critical" severity
_CRITICAL_PATTERNS = [
    r"\bsuicide\b",
    r"\bsuicidal\b",
    r"kill\s+myself",
    r"end\s+my\s+life",
    r"take\s+my\s+life",
    r"want\s+to\s+die",
    r"no\s+reason\s+to\s+live",
    r"better\s+off\s+dead",
    r"don'?t\s+want\s+to\s+live",
    r"ending\s+everything",
    r"overdose\s+on",
]

# HIGH patterns — two or more matches trigger "high" severity
_HIGH_PATTERNS = [
    r"\bself.?harm\b",
    r"hurt\s+myself",
    r"cut\s+myself",
    r"hate\s+my\s+life",
    r"can'?t\s+go\s+on",
    r"no\s+point\s+(in\s+)?living",
    r"nobody\s+cares\s+(if\s+i|about\s+me)",
    r"everyone\s+would\s+be\s+better\s+without\s+me",
]

# LOW patterns — softer distress signals that warrant attention
_LOW_PATTERNS = [
    r"feel\s+(so\s+)?alone",
    r"(feel|feeling)\s+hopeless",
    r"nothing\s+matters",
    r"give\s+up",
    r"can'?t\s+take\s+it\s+anymore",
    r"i\s+give\s+up",
]


def _compile_patterns(patterns: List[str]) -> List[re.Pattern]:
    return [re.compile(p, re.IGNORECASE) for p in patterns]


_COMPILED_CRITICAL = _compile_patterns(_CRITICAL_PATTERNS)
_COMPILED_HIGH = _compile_patterns(_HIGH_PATTERNS)
_COMPILED_LOW = _compile_patterns(_LOW_PATTERNS)


class CrisisDetector:
    """
    Scans user text for crisis signals and returns severity + resources.
    Always errs on the side of caution.
    """

    def detect(self, text: str) -> Dict:
        """
        Analyze text for crisis indicators.

        Returns:
            {
                "is_crisis":        bool,
                "severity":         "none" | "low" | "high" | "critical",
                "matched_keywords": List[str],
                "crisis_resources": List[dict],  # populated when is_crisis=True
            }
        """
        if not text or not text.strip():
            return self._safe_result()

        matched: List[str] = []

        # Check critical patterns first
        for pattern in _COMPILED_CRITICAL:
            match = pattern.search(text)
            if match:
                matched.append(match.group(0))

        if matched:
            logger.warning(f"CRISIS DETECTED [critical]: matched={matched}")
            return {
                "is_crisis": True,
                "severity": "critical",
                "matched_keywords": matched,
                "crisis_resources": CRISIS_RESOURCES,
            }

        # Check high patterns
        high_matches = []
        for pattern in _COMPILED_HIGH:
            match = pattern.search(text)
            if match:
                high_matches.append(match.group(0))

        if high_matches:
            logger.warning(f"CRISIS DETECTED [high]: matched={high_matches}")
            return {
                "is_crisis": True,
                "severity": "high",
                "matched_keywords": high_matches,
                "crisis_resources": CRISIS_RESOURCES,
            }

        # Check low patterns
        low_matches = []
        for pattern in _COMPILED_LOW:
            match = pattern.search(text)
            if match:
                low_matches.append(match.group(0))

        if low_matches:
            logger.info(f"Distress signal detected [low]: matched={low_matches}")
            return {
                "is_crisis": True,
                "severity": "low",
                "matched_keywords": low_matches,
                "crisis_resources": CRISIS_RESOURCES,
            }

        return self._safe_result()

    def _safe_result(self) -> Dict:
        return {
            "is_crisis": False,
            "severity": "none",
            "matched_keywords": [],
            "crisis_resources": [],
        }


# Module-level singleton
crisis_detector = CrisisDetector()

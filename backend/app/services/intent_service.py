"""
MindCare AI — Intent Understanding & Routing Service
Supports 12 comprehensive conversational, clinical, practical, technical, and educational categories:
- GREETING: Social hello/welcome, greetings with informal spelling ('how aer yoiu').
- CASUAL_CONVERSATION: Small talk, social check-in replies ('good', 'doing well').
- GENERAL_KNOWLEDGE: Conceptual non-technical explanations (science, psychology, definitions).
- STUDY_HELP: Study planning, exam preparation, standalone study topics ('exams').
- TECHNICAL_TOPIC: Technical and AI concepts, algorithms ('machine learning', 'supervised learning').
- INTERVIEW_PREPARATION: Standalone or specific interview/review topics ('interview', 'internship review').
- PRACTICAL_PROBLEM: Real-world deadlines, time crunches ('but there is no time for me').
- EMOTIONAL_SUPPORT: Explicit emotional distress or anxiety self-reports ('I feel anxious about tomorrow's interview').
- PHYSICAL_SYMPTOM: Physiological bodily signs (dizziness, nausea, headache).
- FOLLOW_UP: Short answers ('yes', 'no'), topic continuations.
- UNCLEAR_INPUT: Typos ('ih'), keyboard mash, ambiguous fragments.
- POTENTIAL_CRISIS: Explicit or credible self-harm/suicide danger.
"""
import re
from enum import Enum
from typing import Any, Dict, List, Optional
from app.utils.logger import logger


class IntentType(str, Enum):
    GREETING = "GREETING"
    CASUAL_CONVERSATION = "CASUAL_CONVERSATION"
    AI_IDENTITY = "AI_IDENTITY"
    FOOD_LIFESTYLE = "FOOD_LIFESTYLE"
    GENERAL_KNOWLEDGE = "GENERAL_KNOWLEDGE"
    CODING_TECH = "CODING_TECH"
    TECHNICAL_TOPIC = "TECHNICAL_TOPIC"
    STUDY_HELP = "STUDY_HELP"
    INTERVIEW_PREPARATION = "INTERVIEW_PREPARATION"
    CAREER_ADVICE = "CAREER_ADVICE"
    PRACTICAL_PROBLEM = "PRACTICAL_PROBLEM"
    EMOTIONAL_SUPPORT = "EMOTIONAL_SUPPORT"
    PHYSICAL_SYMPTOM = "PHYSICAL_SYMPTOM"
    ENTERTAINMENT = "ENTERTAINMENT"
    FOLLOW_UP = "FOLLOW_UP"
    UNCLEAR_INPUT = "UNCLEAR_INPUT"
    POTENTIAL_CRISIS = "POTENTIAL_CRISIS"
    # Backwards-compatibility aliases
    POSITIVE_EXPERIENCE = "POSITIVE_EXPERIENCE"
    FACTUAL_QUESTION = "FACTUAL_QUESTION"


# Conservative high-confidence spelling mistake mappings
TYPO_CORRECTIONS = {
    # Greetings & basic pronouns/auxiliaries
    "aer": "are",
    "r": "are",
    "yoiu": "you",
    "yuo": "you",
    "yu": "you",
    "u": "you",
    "hwo": "how",
    "hw": "how",
    "wht": "what",
    "wat": "what",
    "whatbis": "what is",
    "whatis": "what is",
    "ap": "up",
    "sup": "what's up",
    "wassup": "what's up",
    "wazzup": "what's up",
    "watsup": "what's up",
    "wats": "what's",
    "mee": "me",
    "ur": "your",
    # Food & lifestyle
    "hungr": "hungry",
    "hungy": "hungry",
    "recpie": "recipe",
    "recipie": "recipe",
    # Feelings & state
    "felling": "feeling",
    "fel": "feel",
    "noting": "nothing",
    "nothin": "nothing",
    "hury": "hurry",
    "hlep": "help",
    # Timing & calendar
    "tommorow": "tomorrow",
    "tommorrow": "tomorrow",
    "tomorow": "tomorrow",
    "sechudeled": "scheduled",
    "schedualed": "scheduled",
    "schelduled": "scheduled",
    # Technical & career
    "machne": "machine",
    "machin": "machine",
    "lerning": "learning",
    "learnin": "learning",
    "learing": "learning",
    "learaning": "learning",
    "artifical": "artificial",
    "artifitial": "artificial",
    "inteligence": "intelligence",
    "intellegence": "intelligence",
    "intelignt": "intelligent",
    "projct": "project",
    "projcts": "projects",
    "projets": "projects",
    "prject": "project",
    "algoritm": "algorithm",
    "supervized": "supervised",
    "explian": "explain",
    "explan": "explain",
    "smple": "simple",
    "simpl": "simple",
    "simpy": "simply",
    "pytn": "python",
    "pyton": "python",
    "interveiw": "interview",
    "inteview": "interview",
    "interv": "interview",
    "reivew": "review",
    "reveiw": "review",
    "internshp": "internship",
    "intership": "internship",
    # Study & wellness
    "examms": "exams",
    "exms": "exams",
    "exm": "exam",
    "dizy": "dizzy",
    "dizzyy": "dizzy",
    "headeache": "headache",
    "headach": "headache",
    "anxiet": "anxiety",
    "anxity": "anxiety",
    "depresion": "depression",
    "techique": "technique",
    "brething": "breathing",
}

# Physical symptoms regex pattern
PHYSICAL_SYMPTOMS_PATTERN = re.compile(
    r"\b("
    r"dizzy|dizziness|lightheaded|light-headed|vertigo|faint|fainting|passed out|"
    r"nausea|nauseous|vomiting|vomit|throwing up|"
    r"headache|migraine|head pain|"
    r"chest pain|chest tightness|pressure in my chest|"
    r"shortness of breath|trouble breathing|difficulty breathing|cannot breathe|can't breathe|"
    r"heart palpitations|racing heart|irregular heartbeat|"
    r"stomach ache|stomach pain|abdominal pain|"
    r"blurred vision|double vision|loss of balance|loss of sensation|"
    r"numbness|tingling|shaking hands|tremors"
    r")\b",
    re.IGNORECASE,
)

# Potential crisis self-harm patterns
CRISIS_PATTERN = re.compile(
    r"\b("
    r"hurt myself|kill myself|end my life|commit suicide|want to die|"
    r"cutting myself|cut myself|hang myself|take all my pills|overdose|"
    r"better off dead|life isn't worth living|suicidal"
    r")\b",
    re.IGNORECASE,
)

# Technical AI / CS / Engineering concepts
TECHNICAL_TOPICS_PATTERN = re.compile(
    r"\b("
    r"ai|genai|agi|artificial intelligence|machine learning|supervised learning|unsupervised learning|reinforcement learning|"
    r"deep learning|neural networks?|data science|computer vision|"
    r"natural language processing|nlp|transformers?|large language models?|llms?|"
    r"algorithms?|data structures?|python|fastapi|react|javascript|typescript|"
    r"system design|cloud computing|database|sql|nosql|docker|kubernetes"
    r")\b",
    re.IGNORECASE,
)

# Follow-up requests to simplify an explanation
SIMPLIFY_PATTERN = re.compile(
    r"\b("
    r"explain\s+it\s+simply|explain\s+simply|make\s+it\s+simpler|make\s+it\s+simple|"
    r"in\s+simple\s+terms|eli5|simplify|simpler\s+explanation|can\s+you\s+make\s+it\s+simple"
    r")\b",
    re.IGNORECASE,
)

# Study and exam keywords
STUDY_HELP_PATTERN = re.compile(
    r"\b("
    r"exams?|finals?|midterms?|study tips|how to study|studying|study plan|"
    r"revision|test prep|prepare for my test|prepare for my exam"
    r")\b",
    re.IGNORECASE,
)

# Interview & presentation preparation keywords
INTERVIEW_PREP_PATTERN = re.compile(
    r"\b("
    r"interviews?|job interview|technical interview|coding interview|mock interview|"
    r"internship review|performance review|code review|hr round|behavioral interview|"
    r"presentation tomorrow|interview tomorrow|review tomorrow|review is tomorrow"
    r")\b",
    re.IGNORECASE,
)

# Explicit emotional distress self-reports
EMOTIONAL_DISTRESS_PATTERN = re.compile(
    r"\b("
    r"i am feeling|i'm feeling|i feel|feeling\s+(so|very|really)?|"
    r"i am so|i am really|i'm so|i'm really"
    r")\s*("
    r"anxious|anxiety|worried|nervous|scared|terrified|panicking|panic|"
    r"sad|depressed|down|hopeless|worthless|lonely|heartbroken|miserable|crying|"
    r"overwhelmed|stressed out|burnt out|burnout|frustrated|angry|upset"
    r")\b",
    re.IGNORECASE,
)

# Questions about the AI assistant itself
AI_IDENTITY_PATTERN = re.compile(
    r"\b("
    r"what\s+is\s+your\s+food|whatbis\s+your\s+food|what\s+do\s+you\s+eat|do\s+you\s+eat|"
    r"who\s+are\s+you|what\s+are\s+you|who\s+made\s+you|what\s+can\s+you\s+do|"
    r"are\s+you\s+(an\s+)?ai|are\s+you\s+human|do\s+you\s+sleep|do\s+you\s+have\s+a\s+body"
    r")\b",
    re.IGNORECASE,
)

# Food, hunger, cooking, and lifestyle
FOOD_LIFESTYLE_PATTERN = re.compile(
    r"\b("
    r"hungry|hungr|starving|thirsty|food|snack|lunch|dinner|breakfast|meal|"
    r"feeling\s+(hungr|hungry|starving|thirsty)|i('m| am)\s+(hungr|hungry|starving|thirsty)|"
    r"what\s+should\s+i\s+eat|recipe|cook|cooking|baking|recommend\s+(a\s+)?(meal|food|snack|restaurant)|"
    r"pasta|pizza|sandwich|noodles"
    r")\b",
    re.IGNORECASE,
)

# Entertainment, jokes, and hobbies
ENTERTAINMENT_PATTERN = re.compile(
    r"\b(tell\s+me\s+a\s+joke|tell\s+a\s+joke|say\s+something\s+funny|joke|hobbies|hobby|recommend\s+a\s+hobby)\b",
    re.IGNORECASE,
)


class IntentService:
    """Lightweight deterministic & context-aware intent routing engine."""

    def normalize_typos(self, text: str) -> str:
        """
        Conservative phrase- and token-level spelling normalization.
        Preserves original casing, punctuation structure, and intended meaning.
        """
        cleaned = text
        phrase_map = [
            (r"\bwhat'?s\s+ap\b", "what's up"),
            (r"\bwhats\s+ap\b", "what's up"),
            (r"\bwhat\s+ap\b", "what's up"),
            (r"\bwats\s+ap\b", "what's up"),
            (r"\bwats\s+up\b", "what's up"),
            (r"\bartifical\s+inteligence\b", "artificial intelligence"),
            (r"\bartifical\s+intelligence\b", "artificial intelligence"),
            (r"\bartificial\s+inteligence\b", "artificial intelligence"),
            (r"\bmachine\s+learing\b", "machine learning"),
            (r"\bmachine\s+lerning\b", "machine learning"),
        ]
        for pattern, replacement in phrase_map:
            cleaned = re.sub(pattern, replacement, cleaned, flags=re.IGNORECASE)

        words = cleaned.split()
        normalized_words = []
        for word in words:
            # Strip trailing/leading punctuation for dictionary lookup
            core = re.sub(r"^[^\w]+|[^\w]+$", "", word).lower()
            if core in TYPO_CORRECTIONS:
                replacement = TYPO_CORRECTIONS[core]
                prefix = re.match(r"^[^\w]+", word)
                suffix = re.search(r"[^\w]+$", word)
                p_str = prefix.group(0) if prefix else ""
                s_str = suffix.group(0) if suffix else ""
                # Preserve capitalized first letter if original was capitalized
                if word and word[0].isupper() and len(replacement) > 1:
                    replacement = replacement[0].upper() + replacement[1:]
                normalized_words.append(f"{p_str}{replacement}{s_str}")
            else:
                normalized_words.append(word)
        return " ".join(normalized_words)

    def route_intent(
        self,
        message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        """
        Route message into primary intent using current message and conversation context.
        """
        normalized = self.normalize_typos(message).strip()
        lower = normalized.lower()

        # ── 1. Detect Potential Immediate Crisis ───────────────────────────
        if CRISIS_PATTERN.search(lower):
            return {
                "intent": IntentType.POTENTIAL_CRISIS,
                "confidence": 0.99,
                "normalized_text": normalized,
                "context_entity": "immediate_safety",
                "is_continuation": False,
            }

        # ── 2. Detect Unclear / Ambiguous Input ─────────────────────────────
        # Specific check for 'ih' (common transposition of 'hi')
        if re.search(r"^ih[\s.?!]*$", lower):
            return {
                "intent": IntentType.UNCLEAR_INPUT,
                "confidence": 0.95,
                "normalized_text": normalized,
                "suggested_clarification": "hi",
                "context_entity": "greeting_typo",
                "is_continuation": False,
            }

        # General keyboard mash / single random consonants
        clean_alphanumeric = re.sub(r"[^\w]", "", lower)
        if len(clean_alphanumeric) >= 4 and not re.search(r"[aeiouy]", clean_alphanumeric):
            return {
                "intent": IntentType.UNCLEAR_INPUT,
                "confidence": 0.90,
                "normalized_text": normalized,
                "suggested_clarification": None,
                "context_entity": "gibberish",
                "is_continuation": False,
            }

        # ── 3. Physical Bodily Symptoms (Priority Health Safety) ───────────
        if PHYSICAL_SYMPTOMS_PATTERN.search(lower):
            match = PHYSICAL_SYMPTOMS_PATTERN.search(lower).group(0)
            return {
                "intent": IntentType.PHYSICAL_SYMPTOM,
                "confidence": 0.95,
                "normalized_text": normalized,
                "context_entity": match.lower(),
                "is_continuation": False,
            }

        # ── 4. Explicit Emotional Distress & Anxiety Reports ───────────────
        # Note: If user says 'I feel anxious about tomorrow's interview', this is an
        # emotional self-report that needs validation + practical interview support
        if EMOTIONAL_DISTRESS_PATTERN.search(lower):
            entity = "interview_anxiety" if "interview" in lower else "exam_anxiety" if ("exam" in lower or "test" in lower) else "general_distress"
            return {
                "intent": IntentType.EMOTIONAL_SUPPORT,
                "confidence": 0.95,
                "normalized_text": normalized,
                "context_entity": entity,
                "is_continuation": False,
            }

        # ── 5. Conversation History Context Extraction ─────────────────────
        last_assistant_msg = ""
        last_user_msg = ""
        if conversation_history:
            for turn in reversed(conversation_history):
                role = str(turn.get("role", "")).lower()
                content = str(turn.get("content", "")).strip()
                if not last_assistant_msg and role in ("assistant", "ai", "mindcare ai", "system", "bot"):
                    last_assistant_msg = content
                elif not last_user_msg and role == "user" and content != message:
                    last_user_msg = content
                if last_assistant_msg and last_user_msg:
                    break

        last_asst_lower = last_assistant_msg.lower()

        # ── 6. Follow-up & Short Replies ───────────────────────────────────
        is_short_affirmative = bool(re.search(r"^(yes|yeah|yep|sure|ok|okay|yup|please|go\s+ahead|i\s+would)[\s.!,]*$", lower))
        is_short_negative = bool(re.search(r"^(no|nope|nah|not\s+really|no\s+thanks|no\s+thank\s+you|neither|dont\s+want\s+to)[\s.!,]*$", lower))
        is_short_good = bool(re.search(r"^(good|i'?m\s+good|im\s+good|feeling\s+good|pretty\s+good|doing\s+well|fine|i'?m\s+fine)[\s.!,]*$", lower))
        is_short_nothing = bool(re.search(r"^(nothing|nothing\s+much|not\s+much|none)[\s.!,]*$", lower))
        is_short_hurry = bool(re.search(r"^(hurry|fast|be\s+quick|make\s+it\s+quick|in\s+a\s+rush)[\s.!,]*$", lower))

        if is_short_affirmative or is_short_negative:
            return {
                "intent": IntentType.FOLLOW_UP,
                "confidence": 0.95,
                "normalized_text": normalized,
                "context_entity": "short_choice",
                "is_continuation": bool(last_assistant_msg),
            }

        if is_short_nothing:
            return {
                "intent": IntentType.FOLLOW_UP,
                "confidence": 0.95,
                "normalized_text": normalized,
                "context_entity": "nothing",
                "is_continuation": bool(last_assistant_msg),
            }

        if is_short_hurry:
            return {
                "intent": IntentType.FOLLOW_UP,
                "confidence": 0.95,
                "normalized_text": normalized,
                "context_entity": "hurry",
                "is_continuation": bool(last_assistant_msg),
            }

        # Short project inquiry follow-up (e.g. 'projects', 'project', 'what projects')
        is_short_project = bool(re.search(r"^(projects?|what\s+projects?|project\s+ideas?|give\s+me\s+projects?)[\s.?!]*$", lower))
        if is_short_project:
            prev_context_str = f"{last_asst_lower} {last_user_msg.lower()}"
            if any(kw in prev_context_str for kw in ["machine learning", "ml", "neural network", "deep learning", "artificial intelligence", "data science"]):
                return {
                    "intent": IntentType.TECHNICAL_TOPIC,
                    "confidence": 0.96,
                    "normalized_text": normalized,
                    "context_entity": "machine_learning_projects",
                    "is_continuation": True,
                }
            elif "python" in prev_context_str:
                return {
                    "intent": IntentType.CODING_TECH,
                    "confidence": 0.96,
                    "normalized_text": normalized,
                    "context_entity": "python_projects",
                    "is_continuation": True,
                }
            return {
                "intent": IntentType.PRACTICAL_PROBLEM,
                "confidence": 0.90,
                "normalized_text": normalized,
                "context_entity": "software_projects",
                "is_continuation": bool(last_assistant_msg),
            }

        # Follow-up request to simplify previous explanation ('explain it simply', 'eli5', etc.)
        if SIMPLIFY_PATTERN.search(lower):
            return {
                "intent": IntentType.FOLLOW_UP,
                "confidence": 0.96,
                "normalized_text": normalized,
                "context_entity": "simplify",
                "is_continuation": bool(last_assistant_msg),
            }

        if is_short_good:
            if any(kw in last_asst_lower for kw in ["how are you", "how are you doing", "doing today", "how's your day"]):
                return {
                    "intent": IntentType.CASUAL_CONVERSATION,
                    "confidence": 0.95,
                    "normalized_text": normalized,
                    "context_entity": "greeting_reply",
                    "is_continuation": True,
                }
            return {
                "intent": IntentType.FOLLOW_UP,
                "confidence": 0.90,
                "normalized_text": normalized,
                "context_entity": "good_state",
                "is_continuation": bool(last_assistant_msg),
            }

        # ── 6.5 Questions About AI Identity & Capabilities ─────────────────
        if AI_IDENTITY_PATTERN.search(lower):
            return {
                "intent": IntentType.AI_IDENTITY,
                "confidence": 0.96,
                "normalized_text": normalized,
                "context_entity": "ai_identity",
                "is_continuation": False,
            }

        # ── 6.6 Food, Hunger, Cooking & Lifestyle ──────────────────────────
        if FOOD_LIFESTYLE_PATTERN.search(lower):
            return {
                "intent": IntentType.FOOD_LIFESTYLE,
                "confidence": 0.95,
                "normalized_text": normalized,
                "context_entity": "food_lifestyle",
                "is_continuation": False,
            }

        # ── 6.7 Entertainment & Jokes ──────────────────────────────────────
        if ENTERTAINMENT_PATTERN.search(lower):
            return {
                "intent": IntentType.ENTERTAINMENT,
                "confidence": 0.95,
                "normalized_text": normalized,
                "context_entity": "entertainment",
                "is_continuation": False,
            }

        # ── 7. Practical Time Constraint Following Prior Preparation ────────
        # e.g. 'But there is no time for me', 'there is no time'
        if re.search(r"\b(but\s+there\s+is\s+no\s+time|there\s+is\s+no\s+time|no\s+time\s+for\s+me|not\s+enough\s+time|time\s+is\s+too\s+short)\b", lower):
            is_review_context = any(
                kw in last_asst_lower or kw in last_user_msg.lower()
                for kw in ["review", "interview", "presentation", "exam", "test", "project", "prepare"]
            )
            return {
                "intent": IntentType.PRACTICAL_PROBLEM,
                "confidence": 0.96,
                "normalized_text": normalized,
                "context_entity": "time_constrained_review" if is_review_context else "time_constraint",
                "is_continuation": True,
            }

        # ── 8. Technical Topic (Standalone or Inquiries) ─────────────────────
        # e.g. 'machine learning', 'supervised learning', 'Explain machine learning'
        if TECHNICAL_TOPICS_PATTERN.search(lower):
            match = TECHNICAL_TOPICS_PATTERN.search(lower).group(0)
            is_proj = any(kw in lower for kw in ["project", "projects", "repo", "app", "ideas"])
            chosen_intent = IntentType.CODING_TECH if "python" in lower else IntentType.TECHNICAL_TOPIC
            entity = f"{match.lower()}_project" if is_proj else match.lower()
            return {
                "intent": chosen_intent,
                "confidence": 0.96,
                "normalized_text": normalized,
                "context_entity": entity,
                "is_continuation": False,
            }

        # ── 9. Interview Preparation (Standalone or Specific Queries) ───────
        # e.g. 'interview', 'job interview', 'My internship review is tomorrow'
        if INTERVIEW_PREP_PATTERN.search(lower):
            entity = "internship_review" if "review" in lower else "job_interview"
            return {
                "intent": IntentType.INTERVIEW_PREPARATION,
                "confidence": 0.95,
                "normalized_text": normalized,
                "context_entity": entity,
                "is_continuation": False,
            }

        # ── 10. Study Help & Exam Planning (Standalone 'exams' or Queries) ──
        # e.g. 'exams', 'exam', 'finals', 'study tips'
        if STUDY_HELP_PATTERN.search(lower):
            return {
                "intent": IntentType.STUDY_HELP,
                "confidence": 0.95,
                "normalized_text": normalized,
                "context_entity": "exam_preparation",
                "is_continuation": False,
            }

        # ── 11. General Knowledge & Conceptual Inquiries ────────────────────
        # e.g. 'What is gravity?', 'Why is the sky blue?', 'Explain photosynthesis'
        if re.search(r"\b(explain\s+[a-z0-9\s]+|what\s+is\s+[a-z0-9\s]+|what\s+are\s+[a-z0-9\s]+|why\s+is\s+[a-z0-9\s]+|how\s+does\s+[a-z0-9\s]+\s+work|who\s+was\s+[a-z0-9\s]+|define\s+[a-z0-9\s]+|can\s+you\s+explain\s+[a-z0-9\s]+)\b", lower) and not any(
            self_ref in lower for self_ref in ["my", "i feel", "i am", "hurt", "die"]
        ):
            match = re.search(r"\b(?:explain|what\s+is|what\s+are|why\s+is|who\s+was|define|can\s+you\s+explain)\s+([a-z0-9\s]{2,40})", lower)
            concept = match.group(1).strip() if match else "concept"
            return {
                "intent": IntentType.GENERAL_KNOWLEDGE,
                "confidence": 0.92,
                "normalized_text": normalized,
                "context_entity": concept,
                "is_continuation": False,
            }

        # ── 12. Greetings (Including Typos like 'how aer yoiu' & 'what's ap') ─────────
        if (
            re.search(r"^(hi|hello|hey|howdy|good\s+(morning|afternoon|evening)|what'?s\s+(up|ap|app)|whats\s+(up|ap|app)|wats\s+(up|ap)|sup|wassup|wazzup)([\s,!.]*how\s+are\s+you[\s?!]*)?$", lower)
            or re.search(r"^(how\s+(are|aer|r)\s+(you|yoiu|yuo|u)|what'?s\s+(up|ap|app)|whats\s+(up|ap|app)|sup|wassup)[\s?!]*$", lower)
            or re.search(r"^how\s+are\s+you[\s?!]*$", lower)
            or (re.search(r"\b(hi|hello|hey|what'?s\s+up|sup)\b", lower) and len(lower.split()) <= 4 and not any(k in lower for k in ["sad", "depress", "anxious", "stress", "die", "kill", "hurt"]))
        ):
            return {
                "intent": IntentType.GREETING,
                "confidence": 0.95,
                "normalized_text": normalized,
                "context_entity": "greeting",
                "is_continuation": False,
            }

        # ── 13. Casual Conversation ─────────────────────────────────────────
        return {
            "intent": IntentType.CASUAL_CONVERSATION,
            "confidence": 0.80,
            "normalized_text": normalized,
            "context_entity": "general_chat",
            "is_continuation": bool(conversation_history),
        }


# Global singleton
intent_service = IntentService()

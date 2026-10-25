"""
MindCare AI — Core Personalized Wellness Content Generator Service
Orchestrates generation of affirmations, guided breathing scripts, mindfulness exercises,
journal prompts, and daily wellness plans using multimodal emotion signals, confidence thresholds,
companion personality modes, and safety validation.
"""
import random
from datetime import datetime
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session

from app.models.wellness import WellnessContentRecord
from app.services.wellness_safety_service import wellness_safety_service


# ── Content Templates & Generation Libraries ───────────────────────────────

AFFIRMATIONS_DB = {
    "stress": [
        "I can focus on one manageable step at a time.",
        "I can pause, reset, and approach this situation calmly.",
        "I give myself permission to take a breath and slow down.",
        "I am capable of handling this moment step by step.",
    ],
    "sadness": [
        "It is okay to give myself time and treat myself with kindness.",
        "My feelings are valid, and I can take space to heal.",
        "I am deserving of comfort, care, and quiet understanding.",
        "Each small step forward is a victory today.",
    ],
    "frustration": [
        "I can pause, reset, and focus on what is within my control.",
        "I can choose my response calmly and thoughtfully.",
        "I release what I cannot change and focus on my next action.",
        "My peace of mind matters more than perfection.",
    ],
    "positive": [
        "I appreciate the positive moments and strength within me.",
        "I cultivate gratitude for the progress I am making.",
        "I embrace good energy and share kindness with others.",
        "I am creating space for balance, joy, and peace.",
    ],
    "neutral": [
        "I am grounded, present, and ready for today.",
        "I treat myself and others with gentle respect.",
        "I navigate today at my own steady pace.",
        "I focus on what matters most to me.",
    ],
}

BREATHING_PATTERNS = {
    "4-6": {"title": "Relaxing 4-6 Breathing", "inhale": 4, "hold": 0, "exhale": 6, "safety": "Stop if you feel dizzy or uncomfortable."},
    "4-4": {"title": "Balanced 4-4 Breathing", "inhale": 4, "hold": 0, "exhale": 4, "safety": "Stop if you feel dizzy or uncomfortable."},
    "4-2-6": {"title": "Calming 4-2-6 Rhythm", "inhale": 4, "hold": 2, "exhale": 6, "safety": "Stop if you feel dizzy or uncomfortable."},
    "box": {"title": "Box Breathing Reset", "inhale": 4, "hold": 4, "exhale": 4, "hold_after_exhale": 4, "safety": "Stop if you feel dizzy or uncomfortable."},
}

MINDFULNESS_TEMPLATES = [
    {
        "title": "5-Senses Grounding Reset",
        "duration_minutes": 3,
        "type": "5-senses",
        "instructions": [
            "1. Notice five things you can see around you.",
            "2. Notice four things you can physically feel.",
            "3. Notice three distinct sounds around you.",
            "4. Notice two scents in your environment.",
            "5. Notice one taste or sensation in your mouth.",
        ],
        "completion_message": "Take a moment to notice how you feel right now.",
    },
    {
        "title": "Present-Moment Body Scan",
        "duration_minutes": 5,
        "type": "body_scan",
        "instructions": [
            "1. Sit comfortably and uncross your legs.",
            "2. Bring your awareness down to your feet on the floor.",
            "3. Gently scan upward through your calves, knees, and hips.",
            "4. Notice any tension in your shoulders or jaw and let them soften.",
            "5. Take a deep, gentle breath into your whole body.",
        ],
        "completion_message": "Acknowledge your body and carry this gentle awareness with you.",
    },
]

JOURNAL_PROMPTS_DB = {
    "stress": [
        "What is currently taking up most of your mental energy?",
        "What is one part of this situation that is within your direct control?",
        "What would help you feel 10% lighter right now?",
    ],
    "sadness": [
        "What has felt particularly difficult today?",
        "What is one small thing that gave you comfort or peace recently?",
        "What kindness would you offer a close friend feeling this way?",
    ],
    "frustration": [
        "What happened, and what part of it affected you most?",
        "What would you like to handle differently next time?",
        "What boundary or action would protect your peace of mind?",
    ],
    "positive": [
        "What contributed to how good you are feeling today?",
        "What would you like to remember about today's experience?",
        "How can you share this positive energy with someone else?",
    ],
    "neutral": [
        "What is one thing you would like to make easier for yourself today?",
        "What are three small things you are grateful for right now?",
        "What is a priority that deserves your focus today?",
    ],
}


class WellnessGeneratorService:
    """Orchestrates generation, safety validation, and DB persistence for wellness content."""

    def determine_confidence_level(self, confidence: float) -> str:
        """Classify confidence into High (>=0.75), Medium (0.50-0.74), or Low (<0.50)."""
        if confidence >= 0.75:
            return "high"
        elif confidence >= 0.50:
            return "medium"
        return "low"

    def generate_affirmation(
        self, db: Optional[Session], user_id: str, emotion: str = "neutral", confidence: float = 0.75, style: str = "calm"
    ) -> Dict[str, Any]:
        """Generate a realistic, supportive affirmation."""
        conf_level = self.determine_confidence_level(confidence)
        ctx = emotion.lower() if conf_level != "low" and emotion.lower() in AFFIRMATIONS_DB else "neutral"

        options = AFFIRMATIONS_DB.get(ctx, AFFIRMATIONS_DB["neutral"])
        aff_text = random.choice(options)

        content_schema = {
            "type": "affirmation",
            "title": f"A Gentle Reminder ({style.capitalize()})",
            "content": aff_text,
            "duration_minutes": 1,
            "style": style,
            "emotion_context": ctx,
            "confidence_level": conf_level,
        }

        # Validate Safety
        val = wellness_safety_service.validate_content_safety(aff_text)
        if not val["valid"]:
            aff_text = "I can focus on one manageable step at a time."
            content_schema["content"] = aff_text

        rec_id = self._persist_record(db, user_id, "affirmation", content_schema["title"], content_schema, 1, ctx, confidence)
        content_schema["id"] = rec_id
        return content_schema

    def generate_breathing_script(
        self, db: Optional[Session], user_id: str, pattern_key: str = "4-6", duration_minutes: int = 2, emotion: str = "neutral", confidence: float = 0.75
    ) -> Dict[str, Any]:
        """Generate guided breathing exercise script with structured animation schema."""
        pat = BREATHING_PATTERNS.get(pattern_key, BREATHING_PATTERNS["4-6"])

        instructions = [
            "Sit comfortably and relax your shoulders.",
            f"Breathe in slowly for {pat['inhale']} seconds.",
        ]
        if pat.get("hold", 0) > 0:
            instructions.append(f"Hold gently for {pat['hold']} seconds.")
        instructions.append(f"Breathe out slowly for {pat['exhale']} seconds.")
        instructions.append("Repeat at a comfortable pace.")

        content_schema = {
            "type": "breathing",
            "title": pat["title"],
            "duration_minutes": duration_minutes,
            "pattern": pat,
            "instructions": instructions,
            "safety_note": pat["safety"],
            "emotion_context": emotion,
        }

        rec_id = self._persist_record(db, user_id, "breathing", pat["title"], content_schema, duration_minutes, emotion, confidence)
        content_schema["id"] = rec_id
        return content_schema

    def generate_mindfulness_exercise(
        self, db: Optional[Session], user_id: str, duration_minutes: int = 3, emotion: str = "neutral", confidence: float = 0.75
    ) -> Dict[str, Any]:
        """Generate structured mindfulness exercise."""
        template = random.choice(MINDFULNESS_TEMPLATES)

        content_schema = {
            "type": "mindfulness",
            "title": template["title"],
            "duration_minutes": duration_minutes,
            "instructions": template["instructions"],
            "completion_message": template["completion_message"],
            "emotion_context": emotion,
        }

        rec_id = self._persist_record(db, user_id, "mindfulness", template["title"], content_schema, duration_minutes, emotion, confidence)
        content_schema["id"] = rec_id
        return content_schema

    def generate_journal_prompt(
        self, db: Optional[Session], user_id: str, emotion: str = "neutral", confidence: float = 0.75
    ) -> Dict[str, Any]:
        """Generate personalized journal prompt with follow-up questions."""
        conf_level = self.determine_confidence_level(confidence)
        ctx = emotion.lower() if conf_level != "low" and emotion.lower() in JOURNAL_PROMPTS_DB else "neutral"

        prompts = JOURNAL_PROMPTS_DB.get(ctx, JOURNAL_PROMPTS_DB["neutral"])
        main_prompt = random.choice(prompts)

        content_schema = {
            "type": "journal_prompt",
            "title": "Today's Reflective Journal Prompt",
            "prompt": main_prompt,
            "follow_up_prompts": [
                "Why is this important to you right now?",
                "What is one small step you could take next?",
            ],
            "duration_minutes": 5,
            "emotion_context": ctx,
        }

        rec_id = self._persist_record(db, user_id, "journal_prompt", content_schema["title"], content_schema, 5, ctx, confidence)
        content_schema["id"] = rec_id
        return content_schema

    def generate_daily_wellness_plan(
        self, db: Optional[Session], user_id: str, emotion: str = "neutral", confidence: float = 0.75
    ) -> Dict[str, Any]:
        """Generate optional 3-part daily check-in card (Morning, Afternoon, Evening)."""
        aff = self.generate_affirmation(None, user_id, emotion, confidence)
        breath = self.generate_breathing_script(None, user_id, "4-6", 2, emotion, confidence)
        journal = self.generate_journal_prompt(None, user_id, emotion, confidence)

        content_schema = {
            "type": "daily_plan",
            "title": "Today's MindCare Check-In & Wellness Card",
            "morning_affirmation": aff["content"],
            "afternoon_breathing": breath,
            "evening_journal": journal,
            "non_clinical_notice": "Supportive daily wellness plan. Not a medical treatment.",
        }

        rec_id = self._persist_record(db, user_id, "daily_plan", content_schema["title"], content_schema, 8, emotion, confidence)
        content_schema["id"] = rec_id
        return content_schema

    def _persist_record(
        self, db: Optional[Session], user_id: str, content_type: str, title: str, content_data: Dict[str, Any], duration: int, emotion: str, confidence: float
    ) -> Optional[str]:
        """Save generated content record to DB if session provided."""
        if db is None:
            return None
        rec = WellnessContentRecord(
            user_id=user_id,
            content_type=content_type,
            title=title,
            content_data=content_data,
            duration_minutes=duration,
            emotion_context=emotion,
            confidence=confidence,
            status="generated",
        )
        db.add(rec)
        db.commit()
        db.refresh(rec)
        return rec.id


wellness_generator_service = WellnessGeneratorService()

"""
MindCare AI — Core AI Emotional Storytelling Engine Service
Orchestrates story planning, character generation, emotion-aware theme mapping,
interactive choice-based narratives, story continuation, and safety validation.
"""
import random
from datetime import datetime
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session

from app.models.story import StoryRecord, StorySession, StoryFeedback
from app.services.story_safety_service import story_safety_service


EMOTION_THEME_MAPPING = {
    "sadness": ["hope", "friendship", "new_beginning", "self_compassion"],
    "sad": ["hope", "friendship", "new_beginning", "self_compassion"],
    "frustration": ["resilience", "patience", "problem_solving", "growth"],
    "angry": ["resilience", "patience", "calm", "growth"],
    "stress": ["calm", "slowing_down", "balance", "perspective"],
    "fear": ["confidence", "courage", "calm", "grounding"],
    "loneliness": ["connection", "friendship", "community", "belonging"],
    "positive": ["gratitude", "celebration", "growth", "adventure"],
    "happy": ["gratitude", "celebration", "growth", "adventure"],
    "neutral": ["hope", "resilience", "calm", "self_growth"],
}

STORY_TEMPLATES = {
    "hope": {
        "title": "The First Ray of Dawn",
        "content": (
            "Kiran sat on the porch step as the morning mist hovered over the valley. "
            "The recent week had brought unexpected setbacks, and for a long time, the path ahead seemed obscure.\n\n"
            "Instead of pushing himself to have all the answers at once, Kiran decided to sit with his morning tea. "
            "He watched a small sparrow systematically gather twigs for its nest, unbothered by the chilly breeze. "
            "It reminded him that renewal doesn't happen in a single dramatic leap, but in small, persistent efforts.\n\n"
            "By the time the golden sunlight broke through the clouds, Kiran felt a quiet sense of clarity. "
            "He opened his notebook and wrote down just one small goal for the morning, knowing that hope begins with taking the next step."
        ),
        "reflection_prompt": "What is one small sign of hope or progress you can acknowledge in your day?",
    },
    "resilience": {
        "title": "The Turning Point",
        "content": (
            "Maya had worked for weeks on her project proposal, only to have key assumptions challenged during the review. "
            "Her initial instinct was frustration, feeling that her hard work had been dismissed.\n\n"
            "Taking a walk away from her screen, she let the fresh air clear her thoughts. "
            "She realized that feedback wasn't a rejection of her effort, but an opportunity to make the final outcome stronger. "
            "She returned to her desk, broke the revision process into three manageable sections, and began reworking the first part with renewed focus."
        ),
        "reflection_prompt": "How can a recent setback be reframed as an opportunity to build strength?",
    },
    "calm": {
        "title": "The Quiet River",
        "content": (
            "Leo stood by the edge of the forest stream, listening to the steady, rhythmic sound of water flowing over polished stones. "
            "His mind had been racing with tasks and deadlines all week.\n\n"
            "He took a deep breath, aligning his inhalation with the rhythm of the water. "
            "He noticed that the river didn't rush or fight against obstacles; it simply found its way around them gently. "
            "Taking that lesson to heart, Leo let his shoulders drop and embraced the quiet peace of the moment."
        ),
        "reflection_prompt": "Where in your day can you allow yourself two minutes of unhurried stillness?",
    },
    "interactive_opening": {
        "title": "The Crossroad in the Woods",
        "content": (
            "You are walking along a quiet forest trail when the path splits into two distinct directions. "
            "To your left, a sunlit path leads toward a gentle hill with a view of the open valley. "
            "To your right, a shaded pathway winds deeper into a quiet, peaceful grove where a stream can be heard."
        ),
        "choices": [
            "Take the sunlit path toward the open valley view.",
            "Follow the shaded pathway toward the tranquil stream.",
            "Pause at the wooden bench to rest and observe your surroundings.",
        ],
        "reflection_prompt": "Which choice feels most aligned with what you need right now?",
    },
}


class StoryGeneratorService:
    """Core Engine generating uplifting, context-aware, and interactive stories."""

    def select_theme_for_emotion(self, emotion: str, confidence: float, requested_theme: Optional[str] = None) -> str:
        """Select appropriate story theme based on user request or emotion mapping."""
        if requested_theme and requested_theme.strip():
            return requested_theme.strip().lower()

        if confidence < 0.50:
            return "hope"

        mapped = EMOTION_THEME_MAPPING.get(emotion.lower(), EMOTION_THEME_MAPPING["neutral"])
        return random.choice(mapped)

    def generate_story(
        self,
        db: Optional[Session],
        user_id: str,
        theme: Optional[str] = None,
        genre: str = "realistic",
        length: str = "short",
        is_interactive: bool = False,
        emotion: str = "neutral",
        confidence: float = 0.75,
        user_goal: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate a personalized emotional story.
        """
        selected_theme = self.select_theme_for_emotion(emotion, confidence, theme)
        tmpl_key = "interactive_opening" if is_interactive else (selected_theme if selected_theme in STORY_TEMPLATES else "hope")
        tmpl = STORY_TEMPLATES.get(tmpl_key, STORY_TEMPLATES["hope"])

        title = tmpl.get("title", f"A Journey of {selected_theme.capitalize()}")
        content = tmpl["content"]
        reflection_prompt = tmpl.get("reflection_prompt", "What reflection does this story inspire for you?")
        choices = tmpl.get("choices", [])

        # Goal personalization
        if user_goal:
            content += f"\n\n(Contextual Note: Inspired by your goal to '{user_goal}')"

        # Validate Safety
        val = story_safety_service.validate_story_safety(content)
        if not val["valid"]:
            fallback = story_safety_service.get_safe_fallback_story(selected_theme)
            title = fallback["title"]
            content = fallback["content"]
            reflection_prompt = fallback["reflection_prompt"]
            is_interactive = False

        personalization_meta = {
            "theme_used": selected_theme,
            "emotion_used": emotion,
            "confidence": confidence,
            "genre": genre,
            "length": length,
            "user_goal": user_goal,
        }

        # Persist Story
        story_id = None
        session_id = None
        if db is not None:
            story_rec = StoryRecord(
                user_id=user_id,
                title=title,
                genre=genre,
                theme=selected_theme,
                tone="uplifting",
                length=length,
                content=content,
                reflection_prompt=reflection_prompt,
                is_interactive=is_interactive,
                personalization_meta=personalization_meta,
            )
            db.add(story_rec)
            db.commit()
            db.refresh(story_rec)
            story_id = story_rec.id

            if is_interactive:
                sess = StorySession(
                    story_id=story_rec.id,
                    user_id=user_id,
                    current_chapter=1,
                    story_state={"location": "Forest Crossroad", "current_theme": selected_theme},
                    decisions=[],
                )
                db.add(sess)
                db.commit()
                db.refresh(sess)
                session_id = sess.id

        return {
            "success": True,
            "id": story_id,
            "session_id": session_id,
            "title": title,
            "genre": genre,
            "theme": selected_theme,
            "length": length,
            "content": content,
            "reflection_prompt": reflection_prompt,
            "is_interactive": is_interactive,
            "choices": choices if is_interactive else [],
            "personalization": personalization_meta,
        }

    def process_interactive_choice(
        self, db: Session, user_id: str, story_id: str, choice_index: int, choice_text: str
    ) -> Dict[str, Any]:
        """Advance an interactive story to the next chapter based on user choice."""
        sess = db.query(StorySession).filter(StorySession.story_id == story_id, StorySession.user_id == user_id).first()
        story = db.query(StoryRecord).filter(StoryRecord.id == story_id, StoryRecord.user_id == user_id).first()

        if not sess or not story:
            raise ValueError("Interactive story session not found.")

        # Update Session Decisions
        decisions = sess.decisions or []
        decisions.append({"chapter": sess.current_chapter, "choice": choice_text})
        sess.current_chapter += 1
        sess.decisions = decisions

        # Generate Next Chapter
        next_chapter_num = sess.current_chapter
        next_content = (
            f"--- Chapter {next_chapter_num} ---\n\n"
            f"You chose to: {choice_text}\n\n"
            "As you take this step forward, the path expands into a welcoming clearing. "
            "You feel a quiet confidence growing within you, knowing that each choice shapes your journey."
        )

        sess.updated_at = datetime.utcnow()
        db.commit()

        return {
            "success": True,
            "story_id": story_id,
            "chapter": next_chapter_num,
            "choice_made": choice_text,
            "content": next_content,
            "choices": [
                "Continue walking forward toward the summit.",
                "Take a moment to write a reflection in your journal.",
            ] if next_chapter_num < 3 else [],
        }


story_generator_service = StoryGeneratorService()

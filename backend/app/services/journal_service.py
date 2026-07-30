"""
MindCare AI — Journal Service
Handles AI emotion analysis, journal entry summaries, interactive writing suggestions,
monthly analytics & AI retrospectives, and entry search/filtering.
"""
import json
import re
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from collections import Counter

from sqlalchemy.orm import Session
from sqlalchemy import extract, or_

from app.models.journal import JournalEntry
from app.services.emotion_service import emotion_service
from app.ai.response_generator import response_generator
from app.utils.logger import logger


# ── Daily Journal Prompts Library ───────────────────────────────────────────
DAILY_PROMPTS = [
    "What is one emotion you felt strongly today, and what triggered it?",
    "Describe a moment today when you felt calm or grounded.",
    "What is one thing you did today to take care of yourself?",
    "If your day had a color or a weather pattern, what would it be and why?",
    "What was a challenging situation today, and how did you handle it?",
    "Write down 3 small things that brought you comfort or joy today.",
    "What is a thought that's been occupying your mind? Let's break it down together.",
    "How did your body feel today? Where did you store tension or ease?",
    "What is one positive reminder or affirmation you need to hear right now?",
    "What are you looking forward to tomorrow, even if it's small?"
]


class JournalService:
    """Service layer for AI Journaling capabilities."""

    def analyze_journal_entry(self, content: str, title: str = "") -> Dict[str, Any]:
        """
        Run multi-dimensional emotion analysis on a journal entry,
        generate a summary, and derive therapeutic tags.
        """
        if not content.strip():
            return {
                "emotion": "Neutral",
                "confidence": 0.5,
                "sentiment": "neutral",
                "stress_score": 3.0,
                "all_scores": {"Neutral": 1.0},
                "summary": "Empty entry.",
                "keywords": [],
                "suggested_tags": ["journal"],
                "mood_score": 5,
            }

        # 1. Primary emotion analysis pipeline
        analysis = emotion_service.analyze(content)
        emotion = analysis["emotion"]
        confidence = analysis["confidence"]
        sentiment = analysis["sentiment"]
        stress_score = analysis["stress_score"]
        all_scores = analysis["all_scores"]
        compound = analysis["sentiment_compound"]

        # Derive recommended mood score (1 - 10)
        base_mood = 5.0 + (compound * 3.5) - (stress_score * 0.2)
        mood_score = int(max(1, min(10, round(base_mood))))

        # 2. Extract top keywords
        words = re.findall(r'\b[a-zA-Z]{4,}\b', content.lower())
        stopwords = {
            "this", "that", "with", "from", "have", "been", "were", "what", "when",
            "where", "today", "yesterday", "feel", "feeling", "felt", "just", "like",
            "about", "would", "could", "should", "there", "their", "them", "some"
        }
        filtered = [w for w in words if w not in stopwords]
        top_keywords = [item[0] for item in Counter(filtered).most_common(5)]

        # 3. Generate entry summary using Gemini or Smart fallback
        summary = self._generate_entry_summary(title, content, emotion, sentiment, stress_score)

        # 4. Suggested tags
        suggested_tags = list(set([emotion, sentiment, "daily-journal"] + top_keywords[:2]))

        return {
            "emotion": emotion,
            "confidence": round(confidence, 2),
            "sentiment": sentiment,
            "stress_score": round(stress_score, 1),
            "all_scores": {k: round(v, 2) for k, v in all_scores.items()},
            "summary": summary,
            "keywords": top_keywords,
            "suggested_tags": suggested_tags,
            "mood_score": mood_score,
        }

    def _generate_entry_summary(
        self, title: str, content: str, emotion: str, sentiment: str, stress_score: float
    ) -> str:
        """Generate a concise AI summary & therapeutic takeaway for a journal entry."""
        if response_generator._model is not None:
            try:
                prompt = (
                    "Summarize the following user journal entry in 2-3 empathetic sentences. "
                    "Acknowledge the core feelings and state one constructive takeaway.\n\n"
                    f"Title: {title}\nContent: {content}\n"
                    f"Detected Emotion: {emotion}, Sentiment: {sentiment}, Stress Level: {stress_score}/10"
                )
                res = response_generator._model.generate_content(prompt)
                if res and res.text:
                    return res.text.strip()
            except Exception as e:
                logger.warning(f"Journal summary LLM fallback: {e}")

        # Smart Fallback summary
        sentences = [s.strip() for s in re.split(r'[.!?]', content) if len(s.strip()) > 10]
        first_part = sentences[0] if sentences else content[:100]
        return (
            f"Reflection centered on key experiences ('{first_part[:80]}...'). "
            f"Predominant emotional tone was {emotion.lower()} ({sentiment}) with a stress rating of {stress_score:.1f}/10."
        )

    def generate_writing_suggestions(
        self, content: str, suggestion_type: str, title: str = ""
    ) -> Dict[str, Any]:
        """
        Generate AI writing assistance: continuation, therapeutic reframing,
        reflection questions, or daily prompt.
        """
        if suggestion_type == "prompt":
            idx = int(datetime.utcnow().timestamp()) % len(DAILY_PROMPTS)
            return {
                "suggestion_type": "prompt",
                "title": "Daily Journal Prompt",
                "text": DAILY_PROMPTS[idx],
                "reflection_questions": [
                    "What emotions come up as you consider this prompt?",
                    "What detail stands out most to you today?"
                ]
            }

        # For continuation, reframing, reflection
        if response_generator._model is not None and content.strip():
            try:
                if suggestion_type == "continue":
                    prompt = (
                        "You are an empathetic therapeutic journaling assistant. "
                        "The user wrote this partial entry:\n"
                        f"Title: {title}\nContent: {content}\n\n"
                        "Provide a natural, warm, 2-3 sentence continuation to help them keep writing their thoughts."
                    )
                    res = response_generator._model.generate_content(prompt)
                    return {
                        "suggestion_type": "continue",
                        "title": "AI Thought Continuation",
                        "text": res.text.strip() if res and res.text else "As you reflect on this, notice what feelings arise in your body and allow yourself space to process them without judgment."
                    }
                elif suggestion_type == "reframe":
                    prompt = (
                        "You are a Cognitive Behavioral Therapy (CBT) informed companion. "
                        "The user wrote this journal entry:\n"
                        f"Content: {content}\n\n"
                        "Offer a gentle, empowering cognitive reframe in 2-3 sentences. Validate their feelings while offering a balanced, hopeful perspective."
                    )
                    res = response_generator._model.generate_content(prompt)
                    return {
                        "suggestion_type": "reframe",
                        "title": "Therapeutic Perspective Reframe",
                        "text": res.text.strip() if res and res.text else "While this experience is challenging, your willingness to express it shows your strength and self-awareness."
                    }
                elif suggestion_type == "reflect":
                    prompt = (
                        "The user wrote this journal entry:\n"
                        f"Content: {content}\n\n"
                        "Generate 3 deep, self-compassionate reflection questions to help them dive deeper into their thoughts."
                    )
                    res = response_generator._model.generate_content(prompt)
                    text_resp = res.text.strip() if res and res.text else ""
                    lines = [line.strip("- *123456789.") for line in text_resp.split("\n") if "?" in line]
                    questions = lines[:3] if len(lines) >= 3 else [
                        "What part of this experience feels most significant to you right now?",
                        "What would you tell a dear friend going through the exact same situation?",
                        "What is one small boundary or act of kindness you can give yourself today?"
                    ]
                    return {
                        "suggestion_type": "reflect",
                        "title": "Deep Reflection Prompts",
                        "text": "Here are 3 tailored questions to explore further:",
                        "reflection_questions": questions
                    }
            except Exception as e:
                logger.warning(f"AI Writing Suggestions LLM fallback: {e}")

        # Heuristic fallbacks
        if suggestion_type == "continue":
            return {
                "suggestion_type": "continue",
                "title": "AI Thought Continuation",
                "text": "Looking ahead, I can focus on what lies within my control while honoring how I felt in this moment."
            }
        elif suggestion_type == "reframe":
            return {
                "suggestion_type": "reframe",
                "title": "Therapeutic Perspective Reframe",
                "text": "Acknowledging these feelings is a vital part of growth. Everyday brings new opportunities to reset and nurture peace."
            }
        else:
            return {
                "suggestion_type": "reflect",
                "title": "Deep Reflection Prompts",
                "text": "Consider exploring these questions:",
                "reflection_questions": [
                    "What part of this entry holds the most emotional weight for you?",
                    "How can you offer yourself comfort right now?",
                    "What step can you take tomorrow to support your well-being?"
                ]
            }

    def get_monthly_insights(
        self, db: Session, user_id: str, year: int, month: int
    ) -> Dict[str, Any]:
        """
        Compute monthly mood distribution, mood score daily timeline,
        dominant emotion, streak count, and AI monthly retrospective.
        """
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)

        entries = (
            db.query(JournalEntry)
            .filter(
                JournalEntry.user_id == user_id,
                JournalEntry.created_at >= start_date,
                JournalEntry.created_at < end_date
            )
            .order_by(JournalEntry.created_at.asc())
            .all()
        )

        total_entries = len(entries)
        if total_entries == 0:
            return {
                "year": year,
                "month": month,
                "total_entries": 0,
                "current_streak": self._compute_streak(db, user_id),
                "avg_mood_score": 0.0,
                "dominant_emotion": "None",
                "emotion_distribution": [],
                "daily_timeline": [],
                "ai_retrospective": "No journal entries recorded for this month yet. Start writing daily to generate insights!",
                "growth_highlights": ["Begin your journaling journey today"],
                "self_care_tips": ["Set aside 5 minutes each evening for quiet reflection"],
            }

        # Calculate averages and distributions
        mood_scores = [e.mood_score for e in entries]
        avg_mood = sum(mood_scores) / float(total_entries)

        emotions = [e.emotion_tag or "Neutral" for e in entries]
        emotion_counts = Counter(emotions)
        dominant_emotion = emotion_counts.most_common(1)[0][0]

        distribution = [
            {
                "emotion": emo,
                "count": cnt,
                "percentage": round((cnt / total_entries) * 100, 1)
            }
            for emo, cnt in emotion_counts.items()
        ]

        # Group by day for daily timeline
        by_day: Dict[str, List[JournalEntry]] = {}
        for e in entries:
            day_str = e.created_at.strftime("%Y-%m-%d")
            by_day.setdefault(day_str, []).append(e)

        daily_timeline = []
        for day_str, day_entries in by_day.items():
            day_avg = sum(de.mood_score for de in day_entries) / float(len(day_entries))
            day_emos = Counter([de.emotion_tag or "Neutral" for de in day_entries])
            daily_timeline.append({
                "date": day_str,
                "mood_score": round(day_avg, 1),
                "dominant_emotion": day_emos.most_common(1)[0][0],
                "entry_count": len(day_entries)
            })

        streak = self._compute_streak(db, user_id)
        ai_retro = self._generate_monthly_retrospective(year, month, total_entries, avg_mood, dominant_emotion, distribution)

        return {
            "year": year,
            "month": month,
            "total_entries": total_entries,
            "current_streak": streak,
            "avg_mood_score": round(avg_mood, 1),
            "dominant_emotion": dominant_emotion,
            "emotion_distribution": distribution,
            "daily_timeline": daily_timeline,
            "ai_retrospective": ai_retro["retrospective"],
            "growth_highlights": ai_retro["highlights"],
            "self_care_tips": ai_retro.get("self_care_tips", []),
        }

    def _compute_streak(self, db: Session, user_id: str) -> int:
        """Compute consecutive daily journal streak."""
        entries = (
            db.query(JournalEntry.created_at)
            .filter(JournalEntry.user_id == user_id)
            .order_by(JournalEntry.created_at.desc())
            .all()
        )
        if not entries:
            return 0

        dates = sorted(list({e[0].date() for e in entries}), reverse=True)
        today = datetime.utcnow().date()
        yesterday = today - timedelta(days=1)

        if dates[0] != today and dates[0] != yesterday:
            return 0

        streak = 1
        current = dates[0]
        for d in dates[1:]:
            if d == current - timedelta(days=1):
                streak += 1
                current = d
            elif d == current:
                continue
            else:
                break
        return streak

    def _generate_monthly_retrospective(
        self, year: int, month: int, count: int, avg_mood: float, dominant_emotion: str, distribution: List[Dict]
    ) -> Dict[str, Any]:
        """Generate monthly retrospective narrative."""
        month_name = datetime(year, month, 1).strftime("%B %Y")

        if response_generator._model is not None:
            try:
                prompt = (
                    f"Write a monthly therapeutic retrospective for {month_name}.\n"
                    f"Data: Total Journal Entries: {count}, Average Mood Score: {avg_mood:.1f}/10, "
                    f"Dominant Emotion: {dominant_emotion}.\n"
                    f"Emotion Distribution: {json.dumps(distribution)}\n\n"
                    "Provide:\n"
                    "1. Retrospective summary (3-4 sentences)\n"
                    "2. 2 growth highlights\n"
                    "3. 2 self-care recommendations"
                )
                res = response_generator._model.generate_content(prompt)
                if res and res.text:
                    text_content = res.text.strip()
                    return {
                        "retrospective": text_content,
                        "highlights": [f"Consistent emotional tracking throughout {month_name}", f"Strong awareness of {dominant_emotion.lower()} patterns"],
                        "self_care_tips": ["Maintain regular sleep routine", "Practice box breathing during stress spikes"]
                    }
            except Exception as e:
                logger.warning(f"Monthly retro LLM fallback: {e}")

        retrospective = (
            f"Throughout {month_name}, you logged {count} journal entries with an average mood rating of {avg_mood:.1f}/10. "
            f"Your most frequent emotional state was '{dominant_emotion}'. "
            f"Writing regularly has helped you gain greater clarity over your daily thought patterns and emotional responses."
        )

        return {
            "retrospective": retrospective,
            "highlights": [
                f"Logged {count} reflective entries in {month_name}",
                f"Maintained emotional self-awareness with average mood score of {avg_mood:.1f}/10"
            ],
            "self_care_tips": [
                f"Continue journaling during {dominant_emotion.lower()} moments to process triggers",
                "Integrate 5-minute breathing resets to maintain high mood scores"
            ]
        }

    def search_entries(
        self,
        db: Session,
        user_id: str,
        query: Optional[str] = None,
        emotion: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> List[JournalEntry]:
        """Search and filter user journal entries."""
        q = db.query(JournalEntry).filter(JournalEntry.user_id == user_id)

        if query and query.strip():
            search_pattern = f"%{query.strip()}%"
            q = q.filter(
                or_(
                    JournalEntry.title.ilike(search_pattern),
                    JournalEntry.content.ilike(search_pattern),
                    JournalEntry.tags.ilike(search_pattern),
                    JournalEntry.summary.ilike(search_pattern),
                )
            )

        if emotion and emotion.strip() and emotion != "All":
            q = q.filter(JournalEntry.emotion_tag.ilike(f"%{emotion.strip()}%"))

        if start_date and start_date.strip():
            try:
                dt_start = datetime.strptime(start_date, "%Y-%m-%d")
                q = q.filter(JournalEntry.created_at >= dt_start)
            except ValueError:
                pass

        if end_date and end_date.strip():
            try:
                dt_end = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
                q = q.filter(JournalEntry.created_at < dt_end)
            except ValueError:
                pass

        return q.order_by(JournalEntry.created_at.desc()).all()


# Module-level singleton
journal_service = JournalService()

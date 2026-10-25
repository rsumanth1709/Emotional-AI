"""
MindCare AI — Emotion Cause Detection Service
Extracts emotional triggers & underlying causes from user conversations/journals,
categorizes triggers (work, family, health, studies, finances, relationships, lifestyle),
tracks recurrence frequencies, and builds emotional trigger network graphs.
"""
import re
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.models.cause import EmotionCauseTrigger
from app.models.chat import Chat
from app.models.journal import JournalEntry
from app.models.emotion import EmotionRecord
from app.utils.logger import logger


CATEGORY_KEYWORDS = {
    "work": [
        "work", "job", "office", "manager", "boss", "deadline", "workload",
        "client", "project", "career", "shift", "colleague", "promotion", "overtime"
    ],
    "family": [
        "family", "mother", "mom", "father", "dad", "parents", "brother",
        "sister", "sibling", "relative", "daughter", "son", "household"
    ],
    "health": [
        "health", "sleep", "insomnia", "fatigue", "pain", "headache", "sick",
        "exhaustion", "doctor", "hospital", "body", "diet", "stomach"
    ],
    "studies": [
        "exam", "test", "assignment", "college", "university", "school",
        "homework", "grades", "gpa", "thesis", "professor", "study", "studies"
    ],
    "finances": [
        "money", "bills", "rent", "debt", "expenses", "salary", "budget",
        "financial", "savings", "loan", "cost", "bank", "credit"
    ],
    "relationships": [
        "relationship", "partner", "boyfriend", "girlfriend", "spouse", "husband",
        "wife", "breakup", "dating", "friend", "lonely", "argument", "fight", "trust"
    ],
    "lifestyle": [
        "burnout", "schedule", "traffic", "overwhelmed", "routine", "time",
        "busy", "chores", "noise", "commute", "travel"
    ],
}


CATEGORY_LABELS = {
    "work": "Work & Career",
    "family": "Family & Home",
    "health": "Health & Vitality",
    "studies": "Academic & Studies",
    "finances": "Finances & Bills",
    "relationships": "Relationships & Friends",
    "lifestyle": "Lifestyle & Routine",
}


DEFAULT_SEED_TRIGGERS = [
    {
        "emotion": "Stress",
        "category": "work",
        "cause_phrase": "Tight project deadlines & heavy workload",
        "confidence_score": 0.92,
        "frequency_count": 5,
        "sample_quotes": ["I have so many project deadlines due this Friday, feeling totally overwhelmed."],
    },
    {
        "emotion": "Anxiety",
        "category": "studies",
        "cause_phrase": "Upcoming exam pressures & grades",
        "confidence_score": 0.88,
        "frequency_count": 4,
        "sample_quotes": ["Really anxious about my upcoming exams next week."],
    },
    {
        "emotion": "Sad",
        "category": "relationships",
        "cause_phrase": "Feeling disconnected & lonely",
        "confidence_score": 0.85,
        "frequency_count": 3,
        "sample_quotes": ["Felt a bit isolated and lonely over the weekend."],
    },
    {
        "emotion": "Stress",
        "category": "health",
        "cause_phrase": "Irregular sleep patterns & insomnia",
        "confidence_score": 0.89,
        "frequency_count": 4,
        "sample_quotes": ["Couldn't sleep well last night, feeling exhausted today."],
    },
    {
        "emotion": "Anxiety",
        "category": "finances",
        "cause_phrase": "Monthly expenses & budget planning",
        "confidence_score": 0.82,
        "frequency_count": 2,
        "sample_quotes": ["Worried about upcoming bills and rent expenses."],
    },
]


class CauseDetectionService:
    """Service layer for Emotion Cause Detection."""

    def extract_causes_from_text(self, text: str, emotion: str = "Stress") -> List[Dict[str, Any]]:
        """Extract cause phrases and classify categories from a conversation or text snippet."""
        text_lower = text.lower()
        extracted = []

        # Find matching categories based on keyword presence
        matched_categories = []
        for cat, keywords in CATEGORY_KEYWORDS.items():
            for kw in keywords:
                if re.search(r'\b' + re.escape(kw) + r'\b', text_lower):
                    matched_categories.append((cat, kw))
                    break

        if not matched_categories:
            matched_categories.append(("lifestyle", "overwhelmed"))

        for cat, kw in matched_categories:
            # Extract sentence containing keyword
            sentences = re.split(r'[.!?]', text)
            matching_sentence = text
            for s in sentences:
                if kw in s.lower():
                    matching_sentence = s.strip()
                    break

            phrase = f"{kw.capitalize()} related stressor: {matching_sentence[:60]}..."
            if len(matching_sentence) < 50:
                phrase = matching_sentence

            extracted.append({
                "emotion": emotion,
                "category": cat,
                "cause_phrase": phrase,
                "confidence_score": 0.88,
                "quote": text,
            })

        return extracted

    def get_user_triggers(self, db: Session, user_id: str) -> List[Dict[str, Any]]:
        """Fetch all extracted emotional triggers for a user sorted by frequency."""
        triggers = (
            db.query(EmotionCauseTrigger)
            .filter(EmotionCauseTrigger.user_id == user_id)
            .order_by(EmotionCauseTrigger.frequency_count.desc())
            .all()
        )

        # If no triggers recorded yet, automatically extract causes from user's authentic chat history
        if not triggers:
            triggers = self.auto_extract_from_chat_history(db, user_id)

        results = []
        for t in triggers:
            results.append({
                "id": t.id,
                "emotion": t.emotion,
                "category": t.category,
                "category_label": CATEGORY_LABELS.get(t.category, t.category.capitalize()),
                "cause_phrase": t.cause_phrase,
                "confidence_score": t.confidence_score,
                "frequency_count": t.frequency_count,
                "last_occurred": t.last_occurred.isoformat() if t.last_occurred else None,
                "sample_quotes": t.sample_quotes or [],
            })

        return results

    def auto_extract_from_chat_history(self, db: Session, user_id: str) -> List[EmotionCauseTrigger]:
        """Scan real user chat messages and extract authentic cause phrases."""
        user_chats = (
            db.query(Chat)
            .filter(Chat.user_id == user_id, Chat.role == "user")
            .order_by(Chat.created_at.desc())
            .limit(30)
            .all()
        )

        if not user_chats:
            return []

        extracted_triggers = []
        for chat in user_chats:
            causes = self.extract_causes_from_text(chat.content, emotion=chat.emotion or "Stress")
            for c in causes:
                trig = self.record_or_update_trigger(
                    db=db,
                    user_id=user_id,
                    emotion=c["emotion"],
                    category=c["category"],
                    cause_phrase=c["cause_phrase"],
                    quote=c["quote"],
                )
                if trig not in extracted_triggers:
                    extracted_triggers.append(trig)

        return extracted_triggers

    def record_or_update_trigger(
        self,
        db: Session,
        user_id: str,
        emotion: str,
        category: str,
        cause_phrase: str,
        quote: Optional[str] = None,
    ) -> EmotionCauseTrigger:
        """Record a new trigger or increment frequency if similar phrase exists."""
        existing = (
            db.query(EmotionCauseTrigger)
            .filter(
                EmotionCauseTrigger.user_id == user_id,
                EmotionCauseTrigger.category == category,
                EmotionCauseTrigger.cause_phrase == cause_phrase,
            )
            .first()
        )

        if existing:
            existing.frequency_count += 1
            existing.last_occurred = datetime.utcnow()
            if quote and quote not in (existing.sample_quotes or []):
                quotes = list(existing.sample_quotes or [])
                quotes.append(quote)
                existing.sample_quotes = quotes[:5]  # Keep max 5 quotes
            db.commit()
            db.refresh(existing)
            return existing
        else:
            trig = EmotionCauseTrigger(
                user_id=user_id,
                emotion=emotion,
                category=category,
                cause_phrase=cause_phrase,
                confidence_score=0.87,
                frequency_count=1,
                sample_quotes=[quote] if quote else [],
            )
            db.add(trig)
            db.commit()
            db.refresh(trig)
            return trig

    def get_category_distribution(self, db: Session, user_id: str) -> List[Dict[str, Any]]:
        """Calculate frequency breakdown and percentage across all 7 categories."""
        triggers = self.get_user_triggers(db, user_id)
        total_freq = sum(t["frequency_count"] for t in triggers) or 1

        cat_counts: Dict[str, int] = {cat: 0 for cat in CATEGORY_KEYWORDS.keys()}
        for t in triggers:
            cat = t["category"]
            cat_counts[cat] = cat_counts.get(cat, 0) + t["frequency_count"]

        results = []
        for cat, count in cat_counts.items():
            pct = round((count / total_freq) * 100, 1)
            results.append({
                "category": cat,
                "label": CATEGORY_LABELS.get(cat, cat.capitalize()),
                "count": count,
                "percentage": pct,
            })

        results.sort(key=lambda x: x["count"], reverse=True)
        return results

    def generate_trigger_network(self, db: Session, user_id: str) -> Dict[str, Any]:
        """
        Generate graph nodes and edges for visualizing emotional cause networks.
        Node types: "emotion" (root), "category" (hub), "trigger" (leaf).
        """
        triggers = self.get_user_triggers(db, user_id)

        nodes = []
        edges = []
        node_ids = set()

        # 1. Emotion Nodes
        emotions_found = {t["emotion"] for t in triggers}
        for emo in emotions_found:
            node_id = f"emo_{emo.lower()}"
            if node_id not in node_ids:
                nodes.append({
                    "id": node_id,
                    "label": f"Emotion: {emo}",
                    "type": "emotion",
                    "color": "#a855f7" if emo in ["Anxiety", "Stress"] else "#3b82f6",
                    "val": 25,
                })
                node_ids.add(node_id)

        # 2. Category Nodes
        categories_found = {t["category"] for t in triggers}
        for cat in categories_found:
            node_id = f"cat_{cat}"
            if node_id not in node_ids:
                nodes.append({
                    "id": node_id,
                    "label": CATEGORY_LABELS.get(cat, cat.capitalize()),
                    "type": "category",
                    "color": "#06b6d4",
                    "val": 18,
                })
                node_ids.add(node_id)

        # 3. Trigger Nodes & Edges
        for t in triggers:
            trig_id = f"trig_{t['id'][:8]}"
            emo_id = f"emo_{t['emotion'].lower()}"
            cat_id = f"cat_{t['category']}"

            if trig_id not in node_ids:
                nodes.append({
                    "id": trig_id,
                    "label": t["cause_phrase"],
                    "type": "trigger",
                    "frequency": t["frequency_count"],
                    "color": "#f43f5e" if t["frequency_count"] >= 4 else "#eab308",
                    "val": 10 + t["frequency_count"] * 2,
                })
                node_ids.add(trig_id)

            # Link Emotion -> Category
            edge_ec = f"{emo_id}->{cat_id}"
            if not any(e["id"] == edge_ec for e in edges):
                edges.append({
                    "id": edge_ec,
                    "source": emo_id,
                    "target": cat_id,
                    "weight": 2,
                })

            # Link Category -> Trigger
            edge_ct = f"{cat_id}->{trig_id}"
            if not any(e["id"] == edge_ct for e in edges):
                edges.append({
                    "id": edge_ct,
                    "source": cat_id,
                    "target": trig_id,
                    "weight": t["frequency_count"],
                })

        return {
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "nodes": nodes,
            "edges": edges,
        }

    def delete_trigger(self, db: Session, user_id: str, trigger_id: str) -> bool:
        """Delete a cause trigger."""
        t = (
            db.query(EmotionCauseTrigger)
            .filter(EmotionCauseTrigger.id == trigger_id, EmotionCauseTrigger.user_id == user_id)
            .first()
        )
        if not t:
            return False

        db.delete(t)
        db.commit()
        return True


# Singleton instance
cause_detection_service = CauseDetectionService()

"""
MindCare AI — Emotion-Aware RAG Engine
Retrieves grounded clinical counseling guidelines & therapeutic dialogue patterns
re-ranked dynamically by the user's current emotional state.
"""
import os
import json
from typing import Any, Dict, List
import numpy as np

from app.utils.logger import logger

# Sample Clinical Counseling Knowledge Corpus
CLINICAL_KNOWLEDGE_BASE = [
    {
        "id": "cbt-anxiety-01",
        "title": "Cognitive Behavioral Therapy for Anxiety & Panic",
        "category": "Anxiety",
        "content": "Identify catastrophic automatic thoughts, examine evidence for and against the thought, and substitute balanced rational reframes. Utilize 5-4-3-2-1 sensory grounding to interrupt panic loops.",
        "emotions": ["Anxiety", "Fear", "Stress"]
    },
    {
        "id": "dbt-emotion-02",
        "title": "Dialectical Behavior Therapy TIPP Skills",
        "category": "Emotional Regulation",
        "content": "TIPP skills rapidly reduce high emotional arousal: Temperature (cold water splash), Intense exercise (60s jumping jacks), Paced breathing (4-7-8 method), Paired muscle relaxation.",
        "emotions": ["Angry", "Stress", "Anxiety", "Fear"]
    },
    {
        "id": "act-mindfulness-03",
        "title": "Acceptance and Commitment Therapy (ACT) Defusion",
        "category": "Mindfulness",
        "content": "Practice cognitive defusion by observing thoughts as floating leaves on a stream rather than literal truths. Acknowledge painful emotions with radical self-compassion without fighting them.",
        "emotions": ["Sad", "Lonely", "Stress", "Neutral"]
    },
    {
        "id": "positive-psych-04",
        "title": "Positive Psychology & Gratitude Reinforcement",
        "category": "Upliftment",
        "content": "Savor positive affective states by writing down 3 specific daily wins, expressing appreciation to others, and anchoring micro-achievements into long-term self-efficacy memory.",
        "emotions": ["Happy", "Hopeful", "Excited"]
    },
    {
        "id": "sleep-hygiene-05",
        "title": "Clinical Sleep Hygiene Protocol for Restorative Sleep",
        "category": "Wellness",
        "content": "Maintain a strict sleep schedule, dim ambient lighting 60 minutes before bed, limit blue light screens, and reserve the bed exclusively for sleep to re-associate space with rest.",
        "emotions": ["Stress", "Anxiety", "Sad"]
    }
]


class EmotionAwareRAG:
    """Emotion-Aware RAG Pipeline."""

    def __init__(self):
        self.corpus = CLINICAL_KNOWLEDGE_BASE

    def retrieve(self, query: str, emotion_context: str = "Neutral", top_k: int = 3) -> Dict[str, Any]:
        """
        Retrieves clinical passages relevant to query and re-ranks them based on user emotion context.
        """
        results = []
        query_words = set(query.lower().split())

        for doc in self.corpus:
            doc_text = (doc["title"] + " " + doc["content"]).lower()
            doc_words = set(doc_text.split())

            # Keyword overlap score
            overlap = len(query_words.intersection(doc_words))
            base_score = float(overlap) / (len(query_words) + 1.0) + 0.35

            # Emotion Alignment Boost (+0.30 if document targets user's emotion)
            emotion_boost = 0.30 if emotion_context in doc["emotions"] else 0.0
            total_score = min(0.99, base_score + emotion_boost)

            results.append({
                "id": doc["id"],
                "title": doc["title"],
                "category": doc["category"],
                "content": doc["content"],
                "target_emotions": doc["emotions"],
                "relevance_score": round(total_score, 2),
                "emotion_boosted": emotion_boost > 0.0
            })

        # Sort descending by relevance score
        results.sort(key=lambda x: x["relevance_score"], reverse=True)
        top_passages = results[:top_k]

        return {
            "query": query,
            "emotion_context": emotion_context,
            "total_retrieved": len(top_passages),
            "passages": top_passages,
            "rag_prompt_context": "\n".join([f"[{p['title']}]: {p['content']}" for p in top_passages])
        }


# Singleton instance
rag_engine = EmotionAwareRAG()

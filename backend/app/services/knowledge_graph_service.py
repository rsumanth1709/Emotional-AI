"""
MindCare AI — Therapeutic Knowledge Graph Engine
Full directed graph: Emotions → Triggers → Coping Strategies → Outcomes → Progress Milestones.
Includes user-personalized subgraph generation from journal/chat history.
"""
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc


# ─── Node Definitions ────────────────────────────────────────────────────────

GRAPH_NODES = [
    # ── Emotions ──────────────────────────────────────────────────────────────
    {"id": "emo_anxiety",     "label": "Anxiety",        "type": "Emotion",          "color": "#ec4899", "description": "Persistent worry and unease, often future-focused."},
    {"id": "emo_stress",      "label": "Stress",         "type": "Emotion",          "color": "#eab308", "description": "Overwhelm from external demands exceeding perceived resources."},
    {"id": "emo_sadness",     "label": "Sadness",        "type": "Emotion",          "color": "#8b5cf6", "description": "Emotional pain from loss, disappointment, or helplessness."},
    {"id": "emo_fear",        "label": "Fear",           "type": "Emotion",          "color": "#f97316", "description": "Instinctive response to perceived threat or danger."},
    {"id": "emo_anger",       "label": "Anger",          "type": "Emotion",          "color": "#ef4444", "description": "Emotional reaction to perceived injustice or boundary violation."},
    {"id": "emo_loneliness",  "label": "Loneliness",     "type": "Emotion",          "color": "#6366f1", "description": "Distress from perceived social disconnection."},
    {"id": "emo_joy",         "label": "Joy",            "type": "Emotion",          "color": "#10b981", "description": "Positive emotional state associated with contentment and flourishing."},
    {"id": "emo_burnout",     "label": "Burnout",        "type": "Emotion",          "color": "#dc2626", "description": "Chronic exhaustion from prolonged, unrelieved stress."},
    {"id": "emo_guilt",       "label": "Guilt",          "type": "Emotion",          "color": "#9333ea", "description": "Moral self-judgment for perceived wrongdoing."},
    {"id": "emo_shame",       "label": "Shame",          "type": "Emotion",          "color": "#7c3aed", "description": "Global negative self-evaluation, often hidden."},

    # ── Triggers ──────────────────────────────────────────────────────────────
    {"id": "trig_workload",   "label": "Work Overload",       "type": "Trigger", "color": "#ef4444", "description": "Excessive task demands without adequate recovery."},
    {"id": "trig_sleep",      "label": "Sleep Deprivation",   "type": "Trigger", "color": "#f97316", "description": "Insufficient or poor-quality rest degrading emotional regulation."},
    {"id": "trig_selftalk",   "label": "Negative Self-Talk",  "type": "Trigger", "color": "#6366f1", "description": "Inner critical voice amplifying emotional distress."},
    {"id": "trig_social",     "label": "Social Rejection",    "type": "Trigger", "color": "#db2777", "description": "Perceived exclusion or disapproval from social groups."},
    {"id": "trig_financial",  "label": "Financial Pressure",  "type": "Trigger", "color": "#b45309", "description": "Monetary strain creating existential threat perception."},
    {"id": "trig_health",     "label": "Health Anxiety",      "type": "Trigger", "color": "#991b1b", "description": "Excessive worry about physical health or illness."},
    {"id": "trig_trauma",     "label": "Trauma Recall",       "type": "Trigger", "color": "#7c2d12", "description": "Intrusive memories or flashbacks of past adverse events."},
    {"id": "trig_isolation",  "label": "Social Isolation",    "type": "Trigger", "color": "#4338ca", "description": "Lack of meaningful social contact and belonging."},
    {"id": "trig_rumination", "label": "Rumination",          "type": "Trigger", "color": "#5b21b6", "description": "Repetitive, passive focus on distress symptoms and causes."},
    {"id": "trig_perfectionism", "label": "Perfectionism",   "type": "Trigger", "color": "#1d4ed8", "description": "Unrealistic self-standards causing fear of failure."},

    # ── Coping Strategies ─────────────────────────────────────────────────────
    {"id": "strat_breathe",   "label": "Box Breathing 4-4-4-4",     "type": "Coping Strategy", "color": "#3b82f6", "description": "Paced breathing activating the parasympathetic nervous system."},
    {"id": "strat_grounding", "label": "5-4-3-2-1 Grounding",       "type": "Coping Strategy", "color": "#06b6d4", "description": "Sensory anchoring technique interrupting anxiety spirals."},
    {"id": "strat_reframe",   "label": "CBT Cognitive Reframe",      "type": "Coping Strategy", "color": "#a855f7", "description": "Identifying and restructuring cognitive distortions."},
    {"id": "strat_journal",   "label": "Reflective Journaling",      "type": "Coping Strategy", "color": "#14b8a6", "description": "Expressive writing for emotional processing and insight."},
    {"id": "strat_pmr",       "label": "Progressive Muscle Relax.",  "type": "Coping Strategy", "color": "#0891b2", "description": "Systematic tension-release reducing somatic stress."},
    {"id": "strat_mindfulness","label": "Mindfulness Meditation",    "type": "Coping Strategy", "color": "#7c3aed", "description": "Non-judgmental present-moment awareness practice."},
    {"id": "strat_movement",  "label": "Physical Exercise",          "type": "Coping Strategy", "color": "#16a34a", "description": "Aerobic movement releasing endorphins and reducing cortisol."},
    {"id": "strat_social",    "label": "Social Connection",          "type": "Coping Strategy", "color": "#e11d48", "description": "Intentional engagement with trusted support networks."},
    {"id": "strat_sleep_hygiene", "label": "Sleep Hygiene Protocol", "type": "Coping Strategy", "color": "#4f46e5", "description": "Structured sleep routine improving recovery quality."},
    {"id": "strat_selfcompassion", "label": "Self-Compassion (MSC)","type": "Coping Strategy", "color": "#d946ef", "description": "Mindful Self-Compassion training reducing shame and self-criticism."},
    {"id": "strat_act",       "label": "ACT Value Clarification",   "type": "Coping Strategy", "color": "#0d9488", "description": "Acceptance & Commitment Therapy identifying core values."},
    {"id": "strat_behavact",  "label": "Behavioral Activation",     "type": "Coping Strategy", "color": "#065f46", "description": "Scheduling positive activities to counter depression."},

    # ── Outcomes ──────────────────────────────────────────────────────────────
    {"id": "out_calm",        "label": "Physiological Calm",         "type": "Outcome",  "color": "#22c55e", "description": "Reduced BPM, HRV recovery, lowered cortisol."},
    {"id": "out_clarity",     "label": "Cognitive Clarity",          "type": "Outcome",  "color": "#10b981", "description": "Improved focus, reduced cognitive distortions."},
    {"id": "out_connection",  "label": "Social Reconnection",        "type": "Outcome",  "color": "#34d399", "description": "Restored sense of belonging and support."},
    {"id": "out_resilience",  "label": "Emotional Resilience",       "type": "Outcome",  "color": "#6ee7b7", "description": "Greater capacity to recover from adversity."},
    {"id": "out_sleep_quality","label": "Improved Sleep Quality",    "type": "Outcome",  "color": "#4ade80", "description": "Longer REM cycles, reduced sleep latency."},

    # ── Progress Milestones ───────────────────────────────────────────────────
    {"id": "prog_7day",       "label": "7-Day Consistency",          "type": "Progress", "color": "#f59e0b", "description": "One week of daily check-ins and practice."},
    {"id": "prog_stress_down","label": "Stress Score ↓ 30%",         "type": "Progress", "color": "#d97706", "description": "Measurable reduction in reported stress levels."},
    {"id": "prog_sleep_8h",   "label": "8h Sleep Streak",            "type": "Progress", "color": "#b45309", "description": "Five consecutive nights of adequate rest."},
    {"id": "prog_mood_stable","label": "Mood Stability (2 weeks)",   "type": "Progress", "color": "#92400e", "description": "Reduced emotional volatility over 14 days."},
]

# ─── Edge Definitions ─────────────────────────────────────────────────────────

GRAPH_EDGES = [
    # Triggers → Emotions
    {"source": "trig_workload",    "target": "emo_stress",    "weight": 0.88, "label": "triggers"},
    {"source": "trig_workload",    "target": "emo_burnout",   "weight": 0.79, "label": "escalates to"},
    {"source": "trig_sleep",       "target": "emo_anxiety",   "weight": 0.82, "label": "exacerbates"},
    {"source": "trig_sleep",       "target": "emo_anger",     "weight": 0.70, "label": "contributes to"},
    {"source": "trig_selftalk",    "target": "emo_sadness",   "weight": 0.91, "label": "causes"},
    {"source": "trig_selftalk",    "target": "emo_shame",     "weight": 0.86, "label": "deepens"},
    {"source": "trig_social",      "target": "emo_loneliness","weight": 0.94, "label": "causes"},
    {"source": "trig_social",      "target": "emo_shame",     "weight": 0.74, "label": "triggers"},
    {"source": "trig_financial",   "target": "emo_stress",    "weight": 0.85, "label": "amplifies"},
    {"source": "trig_financial",   "target": "emo_fear",      "weight": 0.80, "label": "causes"},
    {"source": "trig_health",      "target": "emo_anxiety",   "weight": 0.87, "label": "amplifies"},
    {"source": "trig_trauma",      "target": "emo_fear",      "weight": 0.93, "label": "reactivates"},
    {"source": "trig_trauma",      "target": "emo_sadness",   "weight": 0.88, "label": "compounds"},
    {"source": "trig_isolation",   "target": "emo_loneliness","weight": 0.96, "label": "intensifies"},
    {"source": "trig_isolation",   "target": "emo_sadness",   "weight": 0.83, "label": "leads to"},
    {"source": "trig_rumination",  "target": "emo_sadness",   "weight": 0.89, "label": "sustains"},
    {"source": "trig_rumination",  "target": "emo_anxiety",   "weight": 0.85, "label": "fuels"},
    {"source": "trig_perfectionism","target": "emo_anxiety",  "weight": 0.84, "label": "generates"},
    {"source": "trig_perfectionism","target": "emo_guilt",    "weight": 0.78, "label": "creates"},

    # Emotions → Coping Strategies
    {"source": "emo_stress",     "target": "strat_breathe",      "weight": 0.93, "label": "alleviated by"},
    {"source": "emo_stress",     "target": "strat_movement",     "weight": 0.88, "label": "reduced by"},
    {"source": "emo_stress",     "target": "strat_reframe",      "weight": 0.84, "label": "reframed by"},
    {"source": "emo_anxiety",    "target": "strat_grounding",    "weight": 0.91, "label": "stabilized by"},
    {"source": "emo_anxiety",    "target": "strat_mindfulness",  "weight": 0.87, "label": "dissolved by"},
    {"source": "emo_anxiety",    "target": "strat_breathe",      "weight": 0.89, "label": "reduced by"},
    {"source": "emo_sadness",    "target": "strat_journal",      "weight": 0.85, "label": "processed via"},
    {"source": "emo_sadness",    "target": "strat_behavact",     "weight": 0.82, "label": "counteracted by"},
    {"source": "emo_sadness",    "target": "strat_social",       "weight": 0.79, "label": "eased by"},
    {"source": "emo_fear",       "target": "strat_grounding",    "weight": 0.90, "label": "anchored by"},
    {"source": "emo_fear",       "target": "strat_act",          "weight": 0.83, "label": "defused by"},
    {"source": "emo_anger",      "target": "strat_pmr",          "weight": 0.87, "label": "released via"},
    {"source": "emo_anger",      "target": "strat_movement",     "weight": 0.84, "label": "discharged by"},
    {"source": "emo_loneliness", "target": "strat_social",       "weight": 0.95, "label": "healed by"},
    {"source": "emo_loneliness", "target": "strat_act",          "weight": 0.78, "label": "addressed by"},
    {"source": "emo_burnout",    "target": "strat_sleep_hygiene","weight": 0.91, "label": "restored by"},
    {"source": "emo_burnout",    "target": "strat_mindfulness",  "weight": 0.86, "label": "recovered via"},
    {"source": "emo_guilt",      "target": "strat_selfcompassion","weight": 0.93, "label": "healed by"},
    {"source": "emo_guilt",      "target": "strat_reframe",      "weight": 0.80, "label": "restructured by"},
    {"source": "emo_shame",      "target": "strat_selfcompassion","weight": 0.95, "label": "dissolved by"},
    {"source": "emo_shame",      "target": "strat_journal",      "weight": 0.82, "label": "processed via"},

    # Coping Strategies → Outcomes
    {"source": "strat_breathe",      "target": "out_calm",        "weight": 0.95, "label": "produces"},
    {"source": "strat_grounding",    "target": "out_calm",        "weight": 0.92, "label": "produces"},
    {"source": "strat_pmr",          "target": "out_calm",        "weight": 0.90, "label": "produces"},
    {"source": "strat_mindfulness",  "target": "out_clarity",     "weight": 0.93, "label": "cultivates"},
    {"source": "strat_reframe",      "target": "out_clarity",     "weight": 0.89, "label": "generates"},
    {"source": "strat_journal",      "target": "out_clarity",     "weight": 0.86, "label": "generates"},
    {"source": "strat_act",          "target": "out_clarity",     "weight": 0.91, "label": "builds"},
    {"source": "strat_social",       "target": "out_connection",  "weight": 0.97, "label": "restores"},
    {"source": "strat_behavact",     "target": "out_connection",  "weight": 0.84, "label": "fosters"},
    {"source": "strat_movement",     "target": "out_resilience",  "weight": 0.88, "label": "builds"},
    {"source": "strat_selfcompassion","target": "out_resilience", "weight": 0.92, "label": "cultivates"},
    {"source": "strat_sleep_hygiene","target": "out_sleep_quality","weight": 0.94, "label": "improves"},

    # Outcomes → Progress Milestones
    {"source": "out_calm",         "target": "prog_stress_down", "weight": 0.87, "label": "enables"},
    {"source": "out_clarity",      "target": "prog_7day",        "weight": 0.84, "label": "supports"},
    {"source": "out_sleep_quality","target": "prog_sleep_8h",   "weight": 0.95, "label": "achieves"},
    {"source": "out_resilience",   "target": "prog_mood_stable", "weight": 0.89, "label": "leads to"},
    {"source": "out_connection",   "target": "prog_mood_stable", "weight": 0.82, "label": "contributes to"},
    {"source": "prog_7day",        "target": "prog_stress_down", "weight": 0.80, "label": "accelerates"},
    {"source": "prog_stress_down", "target": "prog_mood_stable", "weight": 0.85, "label": "leads to"},
]

NODE_TYPE_ORDER = ["Trigger", "Emotion", "Coping Strategy", "Outcome", "Progress"]


class KnowledgeGraphService:
    """Full Therapeutic Knowledge Graph with traversal, subgraph, and path queries."""

    def get_full_graph(self) -> Dict[str, Any]:
        """Returns full node & edge structure with Mermaid diagram."""
        mermaid_lines = ["graph LR"]
        for edge in GRAPH_EDGES:
            s = next((n for n in GRAPH_NODES if n["id"] == edge["source"]), None)
            t = next((n for n in GRAPH_NODES if n["id"] == edge["target"]), None)
            if s and t:
                mermaid_lines.append(
                    f'    {s["id"]}["{s["label"]}"] -->|{edge["label"]}| {t["id"]}["{t["label"]}"]'
                )
        return {
            "nodes": GRAPH_NODES,
            "edges": GRAPH_EDGES,
            "total_nodes": len(GRAPH_NODES),
            "total_edges": len(GRAPH_EDGES),
            "node_types": NODE_TYPE_ORDER,
            "mermaid_code": "\n".join(mermaid_lines),
        }

    def get_emotion_subgraph(self, emotion_id: str) -> Dict[str, Any]:
        """
        Return 3-hop subgraph anchored at an emotion node:
        Triggers → Emotion → Coping Strategies → Outcomes
        """
        relevant_ids = {emotion_id}

        # Incoming: triggers that lead to this emotion
        for e in GRAPH_EDGES:
            if e["target"] == emotion_id:
                relevant_ids.add(e["source"])

        # Outgoing: coping strategies and their outcomes
        for e in GRAPH_EDGES:
            if e["source"] == emotion_id:
                relevant_ids.add(e["target"])
                strat_id = e["target"]
                for e2 in GRAPH_EDGES:
                    if e2["source"] == strat_id:
                        relevant_ids.add(e2["target"])
                        # Include progress milestones
                        for e3 in GRAPH_EDGES:
                            if e3["source"] == e2["target"]:
                                relevant_ids.add(e3["target"])

        sub_nodes = [n for n in GRAPH_NODES if n["id"] in relevant_ids]
        sub_edges = [e for e in GRAPH_EDGES if e["source"] in relevant_ids and e["target"] in relevant_ids]

        return {
            "anchor_emotion": emotion_id,
            "nodes": sub_nodes,
            "edges": sub_edges,
            "total_nodes": len(sub_nodes),
            "total_edges": len(sub_edges),
        }

    def get_path(self, from_id: str, to_id: str) -> Dict[str, Any]:
        """BFS shortest path between two nodes."""
        from collections import deque
        adj: Dict[str, List[str]] = {}
        for e in GRAPH_EDGES:
            adj.setdefault(e["source"], []).append(e["target"])

        queue = deque([[from_id]])
        visited = {from_id}
        while queue:
            path = queue.popleft()
            node = path[-1]
            if node == to_id:
                node_details = [next((n for n in GRAPH_NODES if n["id"] == nid), {"id": nid}) for nid in path]
                edges_on_path = []
                for i in range(len(path) - 1):
                    edge = next((e for e in GRAPH_EDGES if e["source"] == path[i] and e["target"] == path[i+1]), None)
                    if edge:
                        edges_on_path.append(edge)
                return {"found": True, "path_ids": path, "path_nodes": node_details, "path_edges": edges_on_path}
            for neighbor in adj.get(node, []):
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(path + [neighbor])
        return {"found": False, "path_ids": [], "path_nodes": [], "path_edges": []}

    def recommend_strategy_for_emotion(self, emotion: str) -> List[Dict[str, Any]]:
        """Traverse graph to find top coping strategies for given emotion label."""
        target = next(
            (n for n in GRAPH_NODES if n["type"] == "Emotion" and n["label"].lower() == emotion.lower()),
            None
        )
        target_id = target["id"] if target else "emo_stress"

        recommendations = []
        for edge in GRAPH_EDGES:
            if edge["source"] == target_id:
                strat = next((n for n in GRAPH_NODES if n["id"] == edge["target"] and n["type"] == "Coping Strategy"), None)
                if strat:
                    out_edges = [oe for oe in GRAPH_EDGES if oe["source"] == strat["id"]]
                    out_label = "Improved Wellbeing"
                    if out_edges:
                        out_node = next((n for n in GRAPH_NODES if n["id"] == out_edges[0]["target"]), None)
                        if out_node:
                            out_label = out_node["label"]
                    recommendations.append({
                        "strategy_id": strat["id"],
                        "strategy": strat["label"],
                        "description": strat.get("description", ""),
                        "efficacy_score": int(edge["weight"] * 100),
                        "expected_outcome": out_label,
                        "color": strat["color"],
                    })

        return sorted(recommendations, key=lambda x: -x["efficacy_score"])

    def get_user_personalized_graph(self, db: Session, user_id: str) -> Dict[str, Any]:
        """
        Build a personalized subgraph based on user's most frequent emotions
        from their chat history and journal entries.
        """
        from app.models.emotion import EmotionRecord
        from app.models.journal import JournalEntry

        emotion_map = {
            "anxiety": "emo_anxiety", "anxious": "emo_anxiety",
            "stress": "emo_stress", "stressed": "emo_stress",
            "sad": "emo_sadness", "sadness": "emo_sadness", "depressed": "emo_sadness",
            "fear": "emo_fear", "scared": "emo_fear",
            "angry": "emo_anger", "anger": "emo_anger", "frustrated": "emo_anger",
            "lonely": "emo_loneliness", "loneliness": "emo_loneliness",
            "happy": "emo_joy", "joy": "emo_joy", "excited": "emo_joy",
            "burnout": "emo_burnout", "exhausted": "emo_burnout",
            "guilt": "emo_guilt", "guilty": "emo_guilt",
            "shame": "emo_shame", "ashamed": "emo_shame",
            "neutral": "emo_stress",  # fallback
        }

        # Gather recent emotion records (last 30)
        records = (
            db.query(EmotionRecord)
            .filter(EmotionRecord.user_id == user_id)
            .order_by(desc(EmotionRecord.created_at))
            .limit(30)
            .all()
        )
        emotion_counts: Dict[str, int] = {}
        for rec in records:
            if rec.emotion:
                emo_key = rec.emotion.lower()
                node_id = emotion_map.get(emo_key, "emo_stress")
                emotion_counts[node_id] = emotion_counts.get(node_id, 0) + 1

        # Also check journal entries
        entries = (
            db.query(JournalEntry)
            .filter(JournalEntry.user_id == user_id)
            .order_by(desc(JournalEntry.created_at))
            .limit(20)
            .all()
        )
        for entry in entries:
            if entry.emotion_tag:
                emo_key = entry.emotion_tag.lower()
                node_id = emotion_map.get(emo_key, "emo_stress")
                emotion_counts[node_id] = emotion_counts.get(node_id, 0) + 2  # Weight journal higher

        if not emotion_counts:
            # Default: show stress + anxiety subgraph
            emotion_counts = {"emo_stress": 5, "emo_anxiety": 3}

        # Build subgraph anchored on top 3 user emotions
        top_emotions = sorted(emotion_counts.items(), key=lambda x: -x[1])[:3]
        relevant_ids: set = set()
        for emo_id, _ in top_emotions:
            relevant_ids.add(emo_id)
            # Add triggers
            for e in GRAPH_EDGES:
                if e["target"] == emo_id:
                    relevant_ids.add(e["source"])
            # Add strategies + outcomes
            for e in GRAPH_EDGES:
                if e["source"] == emo_id:
                    relevant_ids.add(e["target"])
                    for e2 in GRAPH_EDGES:
                        if e2["source"] == e["target"]:
                            relevant_ids.add(e2["target"])

        sub_nodes = [n for n in GRAPH_NODES if n["id"] in relevant_ids]
        sub_edges = [e for e in GRAPH_EDGES if e["source"] in relevant_ids and e["target"] in relevant_ids]

        return {
            "top_emotions": [
                {"emotion_id": eid, "label": next((n["label"] for n in GRAPH_NODES if n["id"] == eid), eid), "frequency": cnt}
                for eid, cnt in top_emotions
            ],
            "nodes": sub_nodes,
            "edges": sub_edges,
            "total_nodes": len(sub_nodes),
            "total_edges": len(sub_edges),
            "personalized": True,
        }


# Singleton instance
knowledge_graph_service = KnowledgeGraphService()

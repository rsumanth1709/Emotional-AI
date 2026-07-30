"""
MindCare AI — Personalized Recommendation Engine
Recommends Meditations, Music, Podcasts, Books, Videos, Breathing Exercises, and Yoga Routines
tailored to detected emotions and user preferences.
"""
from typing import Dict, List, Optional

RECOMMENDATION_CATALOG = [
    # ── 1. MEDITATION ────────────────────────────────────────────────────────
    {
        "id": "med-1",
        "category": "meditation",
        "title": "Guided Body Scan for Anxiety Relief",
        "author": "MindCare Wellness",
        "description": "A calming 10-minute session focusing on progressive muscle relaxation to relieve physical panic and stress.",
        "link": "https://www.youtube.com/results?search_query=guided+body+scan+anxiety+relief",
        "emotions": ["Anxiety", "Fear", "Stress"],
        "mood_effect": "soothe",
        "duration": "10 mins",
    },
    {
        "id": "med-2",
        "category": "meditation",
        "title": "Loving-Kindness Meditation for Loneliness",
        "author": "Tara Brach",
        "description": "Open your heart and cultivate self-compassion to ease feelings of isolation and solitude.",
        "link": "https://www.youtube.com/results?search_query=tara+brach+loving+kindness+meditation",
        "emotions": ["Lonely", "Sad"],
        "mood_effect": "uplift",
        "duration": "15 mins",
    },
    {
        "id": "med-3",
        "category": "meditation",
        "title": "5-Minute Emergency Mindfulness Reset",
        "author": "Headspace",
        "description": "Quick grounding exercise to regain composure when anger or overwhelming frustration strikes.",
        "link": "https://www.youtube.com/results?search_query=headspace+5+minute+reset",
        "emotions": ["Angry", "Stress"],
        "mood_effect": "ground",
        "duration": "5 mins",
    },
    {
        "id": "med-4",
        "category": "meditation",
        "title": "Gratitude & Joy Affirmations",
        "author": "Deepak Chopra",
        "description": "Harness your positive momentum and expand joy through high-frequency gratitude meditation.",
        "link": "https://www.youtube.com/results?search_query=deepak+chopra+gratitude+meditation",
        "emotions": ["Happy", "Hopeful", "Neutral"],
        "mood_effect": "energize",
        "duration": "12 mins",
    },

    # ── 2. RELAXATION MUSIC ──────────────────────────────────────────────────
    {
        "id": "mus-1",
        "category": "music",
        "title": "Weightless (528Hz Binaural Soundscape)",
        "author": "Marconi Union",
        "description": "Scientifically proven ambient music track engineered to reduce heart rate and blood pressure.",
        "link": "https://www.youtube.com/results?search_query=marconi+union+weightless",
        "emotions": ["Anxiety", "Stress", "Fear"],
        "mood_effect": "soothe",
        "duration": "8 mins",
    },
    {
        "id": "mus-2",
        "category": "music",
        "title": "Lofi Rain Beats for Quiet Solitude",
        "author": "Lofi Girl",
        "description": "Soft chillhop melodies combined with soothing rain audio for comfort during lonely evenings.",
        "link": "https://www.youtube.com/results?search_query=lofi+girl+rain+beats",
        "emotions": ["Lonely", "Sad", "Neutral"],
        "mood_effect": "soothe",
        "duration": "30 mins",
    },
    {
        "id": "mus-3",
        "category": "music",
        "title": "Deep Focus Delta Waves",
        "author": "Brainwave Music",
        "description": "Pure sound frequencies to stabilize chaotic thoughts and restore emotional clarity.",
        "link": "https://www.youtube.com/results?search_query=deep+focus+delta+waves",
        "emotions": ["Angry", "Stress"],
        "mood_effect": "ground",
        "duration": "20 mins",
    },
    {
        "id": "mus-4",
        "category": "music",
        "title": "Uplifting Acoustic Sunshine Resonance",
        "author": "Acoustic Morning",
        "description": "Bright guitar chords and warm rhythms to celebrate happiness and energize your mood.",
        "link": "https://www.youtube.com/results?search_query=uplifting+acoustic+sunshine",
        "emotions": ["Happy", "Hopeful"],
        "mood_effect": "energize",
        "duration": "15 mins",
    },

    # ── 3. PODCASTS ──────────────────────────────────────────────────────────
    {
        "id": "pod-1",
        "category": "podcasts",
        "title": "The Anxiety Toolkit Episode #42: Breaking Panic Cycles",
        "author": "Dr. Alice Boyes",
        "description": "Cognitive Strategies for taming intrusive thoughts and soothing nervous system hyperarousal.",
        "link": "https://www.google.com/search?q=The+Anxiety+Toolkit+Dr.+Alice+Boyes+podcast",
        "emotions": ["Anxiety", "Fear"],
        "mood_effect": "soothe",
        "duration": "25 mins",
    },
    {
        "id": "pod-2",
        "category": "podcasts",
        "title": "Ten Percent Happier: Taming Your Inner Critic",
        "author": "Dan Harris",
        "description": "Practical wisdom on self-kindness when feeling inadequate or down.",
        "link": "https://www.tenpercent.com/podcast",
        "emotions": ["Sad", "Lonely"],
        "mood_effect": "uplift",
        "duration": "35 mins",
    },
    {
        "id": "pod-3",
        "category": "podcasts",
        "title": "Huberman Lab: Controlling Stress & Managing Frustration",
        "author": "Dr. Andrew Huberman",
        "description": "Neuroscience-backed tools for physiological sighing and rapid stress reduction.",
        "link": "https://hubermanlab.com",
        "emotions": ["Stress", "Angry"],
        "mood_effect": "ground",
        "duration": "45 mins",
    },
    {
        "id": "pod-4",
        "category": "podcasts",
        "title": "On Purpose: How to Build Lasting Daily Joy",
        "author": "Jay Shetty",
        "description": "Inspiring stories and actionable habits to amplify your positive momentum.",
        "link": "https://jayshetty.me/podcast",
        "emotions": ["Happy", "Hopeful", "Neutral"],
        "mood_effect": "energize",
        "duration": "30 mins",
    },

    # ── 4. BOOKS ─────────────────────────────────────────────────────────────
    {
        "id": "bok-1",
        "category": "books",
        "title": "The Antidote: Happiness for People Who Can't Stand Positive Thinking",
        "author": "Oliver Burkeman",
        "description": "A refreshing look at embracing uncertainty and processing difficult emotions realistically.",
        "link": "https://www.google.com/search?q=The+Antidote+Oliver+Burkeman",
        "emotions": ["Anxiety", "Stress", "Sad"],
        "mood_effect": "ground",
        "duration": "6 hrs read",
    },
    {
        "id": "bok-2",
        "category": "books",
        "title": "The Boy, the Mole, the Fox and the Horse",
        "author": "Charlie Mackesy",
        "description": "A heart-warming illustrated tale offering deep comfort, warmth, and healing during lonely times.",
        "link": "https://www.google.com/search?q=The+Boy+the+Mole+the+Fox+and+the+Horse",
        "emotions": ["Lonely", "Sad"],
        "mood_effect": "soothe",
        "duration": "1 hr read",
    },
    {
        "id": "bok-3",
        "category": "books",
        "title": "Man's Search for Meaning",
        "author": "Viktor E. Frankl",
        "description": "Psychiatrist Viktor Frankl's profound memoir on finding purpose and strength through any hardship.",
        "link": "https://www.google.com/search?q=Man%27s+Search+for+Meaning+Viktor+Frankl",
        "emotions": ["Hopeful", "Sad", "Neutral"],
        "mood_effect": "uplift",
        "duration": "4 hrs read",
    },

    # ── 5. MOTIVATIONAL VIDEOS ───────────────────────────────────────────────
    {
        "id": "vid-1",
        "category": "videos",
        "title": "The Power of Vulnerability (TED Talk)",
        "author": "Brené Brown",
        "description": "Insights on courage, connection, and empathy to help overcome feelings of isolation.",
        "link": "https://www.youtube.com/results?search_query=brene+brown+ted+talk+vulnerability",
        "emotions": ["Lonely", "Sad", "Fear"],
        "mood_effect": "uplift",
        "duration": "20 mins",
    },
    {
        "id": "vid-2",
        "category": "videos",
        "title": "How to Make Stress Your Friend (TED Talk)",
        "author": "Kelly McGonigal",
        "description": "Reframe how you perceive stress and turn nervous energy into resilience.",
        "link": "https://www.youtube.com/results?search_query=kelly+mcgonigal+ted+talk+stress",
        "emotions": ["Stress", "Anxiety"],
        "mood_effect": "ground",
        "duration": "14 mins",
    },
    {
        "id": "vid-3",
        "category": "videos",
        "title": "Why Mindfulness is a Superpower",
        "author": "Happify",
        "description": "An engaging 3-minute animation explaining how mindfulness rewires your brain for joy.",
        "link": "https://www.youtube.com/results?search_query=mindfulness+is+a+superpower+happify",
        "emotions": ["Happy", "Hopeful", "Neutral"],
        "mood_effect": "energize",
        "duration": "3 mins",
    },

    # ── 6. BREATHING EXERCISES ───────────────────────────────────────────────
    {
        "id": "brt-1",
        "category": "breathing",
        "title": "Physiological Sigh (Rapid Calming Technique)",
        "author": "MindCare Protocol",
        "description": "Two quick inhales through the nose followed by a long exhale. Immediately lowers heart rate.",
        "link": "https://www.youtube.com/results?search_query=physiological+sigh+breathing",
        "emotions": ["Anxiety", "Stress", "Angry"],
        "mood_effect": "soothe",
        "duration": "2 mins",
    },
    {
        "id": "brt-2",
        "category": "breathing",
        "title": "4-7-8 Deep Relaxation Breathing",
        "author": "Dr. Andrew Weil",
        "description": "Inhale for 4s, hold for 7s, exhale slowly for 8s to soothe severe tension and induce calm.",
        "link": "https://www.youtube.com/results?search_query=4-7-8+breathing+technique",
        "emotions": ["Anxiety", "Fear", "Sad"],
        "mood_effect": "soothe",
        "duration": "5 mins",
    },
    {
        "id": "brt-3",
        "category": "breathing",
        "title": "Box Breathing (Navy SEAL Focus Protocol)",
        "author": "MindCare Protocol",
        "description": "Equal 4-second counts for inhale, hold, exhale, hold. Restores clarity and emotional control.",
        "link": "https://www.youtube.com/results?search_query=box+breathing+technique",
        "emotions": ["Angry", "Stress", "Neutral"],
        "mood_effect": "ground",
        "duration": "4 mins",
    },

    # ── 7. YOGA ROUTINES ─────────────────────────────────────────────────────
    {
        "id": "yog-1",
        "category": "yoga",
        "title": "Gentle Restorative Yoga for Stress Relief",
        "author": "Yoga With Adriene",
        "description": "Nurturing floor poses designed to release physical tension from hips, neck, and shoulders.",
        "link": "https://www.youtube.com/results?search_query=yoga+with+adriene+stress+relief",
        "emotions": ["Stress", "Anxiety", "Sad"],
        "mood_effect": "soothe",
        "duration": "20 mins",
    },
    {
        "id": "yog-2",
        "category": "yoga",
        "title": "Grounding Flow for Anger & Frustration",
        "author": "Yoga With Kassandra",
        "description": "Deep hip openers and standing poses to channel heavy energy into strength and peace.",
        "link": "https://www.youtube.com/results?search_query=yoga+with+kassandra+grounding",
        "emotions": ["Angry", "Fear"],
        "mood_effect": "ground",
        "duration": "15 mins",
    },
    {
        "id": "yog-3",
        "category": "yoga",
        "title": "Morning Vinyasa Flow for Joy & Vitality",
        "author": "Move With Nicole",
        "description": "Dynamic postures to elevate heart rate, release endorphins, and celebrate vitality.",
        "link": "https://www.youtube.com/results?search_query=move+with+nicole+morning+vinyasa",
        "emotions": ["Happy", "Hopeful", "Neutral"],
        "mood_effect": "energize",
        "duration": "25 mins",
    },
]


class RecommendationEngine:
    """Matches emotions and preferences to personalized wellness activities and media."""

    def get_recommendations(
        self,
        emotion: str,
        category: Optional[str] = None,
        mood_target: Optional[str] = None,
        limit: int = 12,
        affinity_multipliers: Optional[Dict[str, float]] = None,
    ) -> List[Dict]:
        """
        Rank catalog items based on emotion match, category filter, target mood effect,
        personalized category affinity multipliers from user feedback, and daily calendar rotation.
        """
        from datetime import date
        import random

        # Seed pseudo-random generator with today's date to rotate content daily
        today_seed = date.today().isoformat()
        rng = random.Random(f"{today_seed}_{emotion}_{category}_{mood_target}")

        scored_items = []
        multipliers = affinity_multipliers or {}

        for item in RECOMMENDATION_CATALOG:
            # Category filter
            if category and category.lower() != "all" and item["category"].lower() != category.lower():
                continue

            # Base score
            score = 0.0

            # Direct emotion match
            if emotion in item["emotions"]:
                score += 5.0
            elif emotion == "Neutral":
                score += 3.0
            else:
                score += 1.0

            # Mood target match (e.g. user wants "soothe" or "uplift")
            if mood_target and mood_target.lower() == item["mood_effect"].lower():
                score += 3.0

            # Apply fine-tuned category affinity multiplier (from thumbs up/down learning)
            cat_multiplier = multipliers.get(item["category"].lower(), 1.0)
            score *= cat_multiplier

            # Add daily calendar rotation offset (0.00 to 0.99) so order changes day-to-day
            daily_jitter = rng.uniform(0.0, 0.99)
            scored_items.append((score + daily_jitter, item))

        # Sort by score descending
        scored_items.sort(key=lambda x: x[0], reverse=True)

        # Return top N item dicts
        return [item for _, item in scored_items[:limit]]

    def get_categories(self) -> List[Dict[str, str]]:
        """Return available recommendation categories."""
        return [
            {"key": "all", "label": "All Recommendations", "icon": "Sparkles"},
            {"key": "meditation", "label": "Meditation Sessions", "icon": "Brain"},
            {"key": "music", "label": "Relaxation Music", "icon": "Music"},
            {"key": "podcasts", "label": "Podcasts & Audio", "icon": "Headphones"},
            {"key": "books", "label": "Books & Reading", "icon": "BookOpen"},
            {"key": "videos", "label": "Motivational Videos", "icon": "Video"},
            {"key": "breathing", "label": "Breathing Exercises", "icon": "Wind"},
            {"key": "yoga", "label": "Yoga Routines", "icon": "Activity"},
        ]


recommendation_engine = RecommendationEngine()

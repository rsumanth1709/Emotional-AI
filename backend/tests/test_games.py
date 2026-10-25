"""
MindCare AI — Emotional Wellness Games Backend Tests
Tests:
- Game session recording and scoring.
- Gamification XP and level progression integration (+10 XP per correct answer).
- User isolation: users can only view their own game history.
- Unauthenticated rejection for private history.
- Dataset integrity checks for Emotion Detective scenarios.
"""
import uuid
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from app.database import SessionLocal, init_db
from app.main import app
from app.models.user import User
from app.models.game import GameSession
from app.utils.security import create_access_token, hash_password

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    init_db()


def create_test_user(email: str) -> dict:
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                email=email,
                username=f"u_{uuid.uuid4().hex[:8]}",
                full_name="Game Tester",
                hashed_password=hash_password("GamePass#2026!"),
                is_active=True,
                account_status="ACTIVE",
                email_verified=True,
                xp=100,
                level=1,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        token = create_access_token({"sub": user.email})
        return {
            "id": user.id,
            "email": user.email,
            "token": token,
            "headers": {"Authorization": f"Bearer {token}"},
        }
    finally:
        db.close()


def test_record_game_session_and_xp_reward():
    """Verify recording a game session saves to DB and awards XP."""
    u = create_test_user(f"gamer_{uuid.uuid4().hex[:8]}@example.com")

    payload = {
        "game_slug": "emotion-detective",
        "score": 80,
        "total_questions": 10,
        "correct_count": 8,
        "difficulty": "medium",
        "duration_seconds": 120,
    }

    res = client.post("/api/games/sessions", json=payload, headers=u["headers"])
    assert res.status_code == 200
    data = res.json()
    assert data["game_slug"] == "emotion-detective"
    assert data["score"] == 80
    assert data["correct_count"] == 8
    assert data["xp_awarded"] == 80
    assert data["new_total_xp"] == 180  # Initial 100 + 80
    assert data["current_level"] == 1


def test_game_history_user_isolation():
    """Verify user can only view their own game history."""
    u1 = create_test_user(f"player1_{uuid.uuid4().hex[:8]}@example.com")
    u2 = create_test_user(f"player2_{uuid.uuid4().hex[:8]}@example.com")

    # Record session for user 1
    client.post(
        "/api/games/sessions",
        json={"game_slug": "emotion-detective", "score": 90, "total_questions": 10, "correct_count": 9, "difficulty": "hard"},
        headers=u1["headers"],
    )

    # Record session for user 2
    client.post(
        "/api/games/sessions",
        json={"game_slug": "emotion-detective", "score": 50, "total_questions": 10, "correct_count": 5, "difficulty": "easy"},
        headers=u2["headers"],
    )

    # User 1 history should only contain u1's session
    h1 = client.get("/api/games/history", headers=u1["headers"])
    assert h1.status_code == 200
    h1_data = h1.json()
    assert h1_data["total_sessions"] >= 1
    for s in h1_data["items"]:
        assert s["user_id"] == u1["id"]

    # User 2 history should only contain u2's session
    h2 = client.get("/api/games/history", headers=u2["headers"])
    assert h2.status_code == 200
    h2_data = h2.json()
    for s in h2_data["items"]:
        assert s["user_id"] == u2["id"]


def test_unauthenticated_game_history_blocked():
    """Verify unauthenticated requests cannot access game history."""
    res = client.get("/api/games/history")
    assert res.status_code == 401


def test_emotion_detective_dataset_integrity():
    """Verify scenario dataset contains at least 30 scenarios covering all 10 required emotions."""
    import re
    from pathlib import Path

    dataset_path = Path(__file__).resolve().parent.parent.parent / "frontend" / "lib" / "games" / "emotionDetectiveData.ts"
    assert dataset_path.exists(), "emotionDetectiveData.ts must exist"

    content = dataset_path.read_text(encoding="utf-8")

    # Match each scenario id
    scenario_ids = re.findall(r'id:\s*"([^"]+)"', content)
    assert len(scenario_ids) >= 30, f"Expected at least 30 scenarios, found {len(scenario_ids)}"

    # Match correctEmotion
    correct_emotions = set(re.findall(r'correctEmotion:\s*"([^"]+)"', content))
    required_emotions = {
        "Happiness", "Sadness", "Anger", "Fear", "Anxiety",
        "Surprise", "Calmness", "Loneliness", "Excitement", "Frustration"
    }

    missing = required_emotions - correct_emotions
    assert not missing, f"Missing required emotions in dataset: {missing}"

    # Match difficulties
    difficulties = set(re.findall(r'difficulty:\s*"([^"]+)"', content))
    assert {"easy", "medium", "hard"}.issubset(difficulties)


def test_empathy_builder_session_and_dataset_integrity():
    """Verify Empathy Builder session recording and 30+ scenario dataset integrity."""
    import re
    from pathlib import Path

    # 1. Test session recording
    u = create_test_user(f"empath_{uuid.uuid4().hex[:8]}@example.com")
    payload = {
        "game_slug": "empathy-builder",
        "score": 90,
        "total_questions": 10,
        "correct_count": 9,
        "difficulty": "workplace",
        "duration_seconds": 150,
    }
    res = client.post("/api/games/sessions", json=payload, headers=u["headers"])
    assert res.status_code == 200
    data = res.json()
    assert data["game_slug"] == "empathy-builder"
    assert data["score"] == 90
    assert data["xp_awarded"] == 90

    # 2. Test dataset integrity
    dataset_path = Path(__file__).resolve().parent.parent.parent / "frontend" / "lib" / "games" / "empathyBuilderData.ts"
    assert dataset_path.exists(), "empathyBuilderData.ts must exist"

    content = dataset_path.read_text(encoding="utf-8")

    # Match each scenario id
    scenario_ids = re.findall(r'id:\s*"emp-\d+"', content)
    assert len(scenario_ids) >= 30, f"Expected at least 30 scenarios, found {len(scenario_ids)}"

    # Match archetypes
    archetypes = set(re.findall(r'archetype:\s*"([^"]+)"', content))
    required_archetypes = {"empathetic", "toxic_positivity", "premature_fixing", "minimizing"}
    assert required_archetypes.issubset(archetypes), f"Missing archetypes: {required_archetypes - archetypes}"

    # Match true best responses
    best_responses = re.findall(r'isBestResponse:\s*true', content)
    assert len(best_responses) == len(scenario_ids), "Each scenario must have exactly 1 true best response"


def test_mindful_breath_odyssey_session_and_dataset_integrity():
    """Verify Mindful Breath Odyssey session recording, XP progression, and 4 clinical pattern configurations."""
    import re
    from pathlib import Path

    # 1. Test session recording & XP reward
    u = create_test_user(f"yogi_{uuid.uuid4().hex[:8]}@example.com")
    payload = {
        "game_slug": "mindful-breath-odyssey",
        "score": 80,
        "total_questions": 8,
        "correct_count": 8,
        "difficulty": "coherence",
        "duration_seconds": 88,
    }
    res = client.post("/api/games/sessions", json=payload, headers=u["headers"])
    assert res.status_code == 200
    data = res.json()
    assert data["game_slug"] == "mindful-breath-odyssey"
    assert data["score"] == 80
    assert data["correct_count"] == 8
    assert data["xp_awarded"] == 80

    # 2. Test dataset and clinical pattern configuration integrity
    dataset_path = Path(__file__).resolve().parent.parent.parent / "frontend" / "lib" / "games" / "breathingOdysseyData.ts"
    assert dataset_path.exists(), "breathingOdysseyData.ts must exist"

    content = dataset_path.read_text(encoding="utf-8")

    # Match pattern IDs
    pattern_ids = set(re.findall(r'id:\s*"([^"]+)"', content))
    required_patterns = {"coherence", "box", "relax_478", "balance"}
    assert required_patterns.issubset(pattern_ids), f"Missing breathing patterns: {required_patterns - pattern_ids}"

    # Match respiration phases
    phase_names = set(re.findall(r'name:\s*"([^"]+)"', content))
    assert {"Inhale", "Exhale"}.issubset(phase_names)

    # Match vagal mechanisms
    vagal_mentions = re.findall(r'vagalMechanism:', content)
    assert len(vagal_mentions) >= 4, "Each pattern must define a scientific vagal mechanism"


def test_trigger_detective_session_and_dataset_integrity():
    """Verify Trigger Detective session persistence, XP rewards, and 30+ CBT thought-record cases."""
    import re
    from pathlib import Path

    # 1. Test session recording & XP reward
    u = create_test_user(f"cbt_sleuth_{uuid.uuid4().hex[:8]}@example.com")
    payload = {
        "game_slug": "trigger-detective",
        "score": 100,
        "total_questions": 10,
        "correct_count": 10,
        "difficulty": "workplace",
        "duration_seconds": 135,
    }
    res = client.post("/api/games/sessions", json=payload, headers=u["headers"])
    assert res.status_code == 200
    data = res.json()
    assert data["game_slug"] == "trigger-detective"
    assert data["score"] == 100
    assert data["correct_count"] == 10
    assert data["xp_awarded"] == 100

    # 2. Test dataset and 30+ scenario integrity
    dataset_path = Path(__file__).resolve().parent.parent.parent / "frontend" / "lib" / "games" / "triggerDetectiveData.ts"
    assert dataset_path.exists(), "triggerDetectiveData.ts must exist"

    content = dataset_path.read_text(encoding="utf-8")

    # Match scenario IDs
    scenario_ids = re.findall(r'id:\s*"trg-\d+"', content)
    assert len(scenario_ids) >= 30, f"Expected at least 30 trigger scenarios, found {len(scenario_ids)}"

    # Match all 8 cognitive distortion types
    distortions = set(re.findall(r'distortion:\s*"([^"]+)"', content))
    required_distortions = {
        "Catastrophizing", "Mind Reading", "All-or-Nothing", "Emotional Reasoning",
        "Personalization", "Mental Filter", "Should Statements", "Fortune Telling"
    }
    assert required_distortions.issubset(distortions), f"Missing distortions: {required_distortions - distortions}"

    # Match all 5 categories
    categories = set(re.findall(r'category:\s*"([^"]+)"', content))
    required_categories = {"workplace", "relationships", "social", "academics_finance", "health_body"}
    assert required_categories.issubset(categories), f"Missing categories: {required_categories - categories}"

    # Match 4 reframe archetypes
    archetypes = set(re.findall(r'archetype:\s*"([^"]+)"', content))
    required_archetypes = {"cognitive_reframe", "catastrophic_spiral", "toxic_positivity", "avoidant_suppression"}
    assert required_archetypes.issubset(archetypes), f"Missing archetypes: {required_archetypes - archetypes}"

    # Match exactly 1 best reframe per scenario
    best_reframes = re.findall(r'isBestReframe:\s*true', content)
    assert len(best_reframes) == len(scenario_ids), "Each trigger scenario must have exactly 1 true best reframe"


def test_somatic_grounding_quest_session_and_dataset_integrity():
    """Verify Somatic Grounding Quest session recording, XP progression, and 5-4-3-2-1 realms."""
    import re
    from pathlib import Path

    # 1. Test session recording & XP reward
    u = create_test_user(f"grounded_{uuid.uuid4().hex[:8]}@example.com")
    payload = {
        "game_slug": "grounding-quest",
        "score": 150,
        "total_questions": 15,
        "correct_count": 15,
        "difficulty": "forest",
        "duration_seconds": 180,
    }
    res = client.post("/api/games/sessions", json=payload, headers=u["headers"])
    assert res.status_code == 200
    data = res.json()
    assert data["game_slug"] == "grounding-quest"
    assert data["score"] == 150
    assert data["correct_count"] == 15
    assert data["xp_awarded"] == 150

    # 2. Test dataset and 4 grounding realms
    dataset_path = Path(__file__).resolve().parent.parent.parent / "frontend" / "lib" / "games" / "groundingQuestData.ts"
    assert dataset_path.exists(), "groundingQuestData.ts must exist"

    content = dataset_path.read_text(encoding="utf-8")

    # Match realm IDs
    realm_ids = set(re.findall(r'id:\s*"([^"]+)"', content))
    required_realms = {"forest", "cabin", "ocean", "real_world"}
    assert required_realms.issubset(realm_ids), f"Missing realms: {required_realms - realm_ids}"

    # Match all 5 senses
    senses = set(re.findall(r'sense:\s*"([^"]+)"', content))
    required_senses = {"see", "touch", "hear", "smell", "taste"}
    assert required_senses.issubset(senses), f"Missing senses: {required_senses - senses}"

    # Match sensory items count (each realm has 15 items, so 4 * 15 = 60 items)
    anchor_prompts = re.findall(r'prompt:\s*"([^"]+)"', content)
    assert len(anchor_prompts) >= 60, f"Expected at least 60 sensory anchors across 4 realms, found {len(anchor_prompts)}"


def test_values_compass_navigator_session_and_dataset_integrity():
    """Verify Values Compass Navigator session recording, XP progression, and 30 ACT dilemmas."""
    import re
    from pathlib import Path

    # 1. Test session recording & XP reward
    u = create_test_user(f"navigator_{uuid.uuid4().hex[:8]}@example.com")
    payload = {
        "game_slug": "values-navigator",
        "score": 100,
        "total_questions": 10,
        "correct_count": 10,
        "difficulty": "growth",
        "duration_seconds": 150,
    }
    res = client.post("/api/games/sessions", json=payload, headers=u["headers"])
    assert res.status_code == 200
    data = res.json()
    assert data["game_slug"] == "values-navigator"
    assert data["score"] == 100
    assert data["correct_count"] == 10
    assert data["xp_awarded"] == 100

    # 2. Test dataset and 30 dilemma integrity
    dataset_path = Path(__file__).resolve().parent.parent.parent / "frontend" / "lib" / "games" / "valuesNavigatorData.ts"
    assert dataset_path.exists(), "valuesNavigatorData.ts must exist"

    content = dataset_path.read_text(encoding="utf-8")

    # Match dilemma IDs
    dilemma_ids = re.findall(r'id:\s*"val-\d+"', content)
    assert len(dilemma_ids) >= 30, f"Expected at least 30 values dilemmas, found {len(dilemma_ids)}"

    # Match all 4 cardinal domains
    domains = set(re.findall(r'domain:\s*"([^"]+)"', content))
    required_domains = {"growth", "relationships", "purpose", "vitality"}
    assert required_domains.issubset(domains), f"Missing domains: {required_domains - domains}"

    # Match all 4 action archetypes
    archetypes = set(re.findall(r'archetype:\s*"([^"]+)"', content))
    required_archetypes = {"value_aligned", "experiential_avoidance", "people_pleasing", "rigid_perfectionism"}
    assert required_archetypes.issubset(archetypes), f"Missing archetypes: {required_archetypes - archetypes}"

    # Match exactly 1 best value-aligned action per dilemma
    aligned_actions = re.findall(r'isValueAligned:\s*true', content)
    assert len(aligned_actions) == len(dilemma_ids), "Each dilemma must have exactly 1 value-aligned action"

    # Match ACT rationales and internal obstacles
    obstacles = re.findall(r'internalObstacle:', content)
    assert len(obstacles) >= 30, "Each dilemma must define an internal emotional obstacle"


def test_calm_bubble_session_and_config_integrity():
    """Verify Calm Bubble session persistence, XP progression, and gentle breathing cadence configurations."""
    import re
    from pathlib import Path

    # 1. Test session recording & XP reward
    u = create_test_user(f"bubble_{uuid.uuid4().hex[:8]}@example.com")
    payload = {
        "game_slug": "calm-bubble",
        "score": 30,
        "total_questions": 3,
        "correct_count": 3,
        "difficulty": "gentle",
        "duration_seconds": 180,
    }
    res = client.post("/api/games/sessions", json=payload, headers=u["headers"])
    assert res.status_code == 200
    data = res.json()
    assert data["game_slug"] == "calm-bubble"
    assert data["score"] == 30
    assert data["correct_count"] == 3
    assert data["xp_awarded"] == 30

    # 2. Test configuration file integrity
    config_path = Path(__file__).resolve().parent.parent.parent / "frontend" / "lib" / "games" / "calmBubbleConfig.ts"
    assert config_path.exists(), "calmBubbleConfig.ts must exist"

    content = config_path.read_text(encoding="utf-8")

    # Match cadence rhythm IDs
    rhythm_ids = set(re.findall(r'id:\s*"([^"]+)"', content))
    assert {"gentle", "deep", "release"}.issubset(rhythm_ids), f"Missing rhythms: {rhythm_ids}"

    # Match duration settings
    assert "seconds: 60" in content, "Missing 1 minute duration"
    assert "seconds: 180" in content, "Missing 3 minutes duration"
    assert "seconds: 300" in content, "Missing 5 minutes duration"

    # Match calming messages
    calming_msgs = re.findall(r'"([^"]+)"', content)
    assert len(calming_msgs) >= 5, "Must provide multiple calming messages for completion"


def test_sleep_sanctuary_session_and_dataset_integrity():
    """Verify Mindful Sleep Sanctuary session recording, XP progression, and CBT-I chronobiology dataset."""
    import re
    from pathlib import Path

    # 1. Test session recording & XP reward
    u = create_test_user(f"sleeper_{uuid.uuid4().hex[:8]}@example.com")
    payload = {
        "game_slug": "sleep-sanctuary",
        "score": 100,
        "total_questions": 10,
        "correct_count": 10,
        "difficulty": "nightfall",
        "duration_seconds": 180,
    }
    res = client.post("/api/games/sessions", json=payload, headers=u["headers"])
    assert res.status_code == 200
    data = res.json()
    assert data["game_slug"] == "sleep-sanctuary"
    assert data["score"] == 100
    assert data["correct_count"] == 10
    assert data["xp_awarded"] == 100

    # 2. Test dataset integrity
    dataset_path = Path(__file__).resolve().parent.parent.parent / "frontend" / "lib" / "games" / "sleepSanctuaryData.ts"
    assert dataset_path.exists(), "sleepSanctuaryData.ts must exist"

    content = dataset_path.read_text(encoding="utf-8")

    # Match worry IDs (wry-01 to wry-05)
    worry_ids = re.findall(r'id:\s*"wry-\d+"', content)
    assert len(worry_ids) >= 5, f"Expected at least 5 common worries, found {len(worry_ids)}"

    # Match sanctuary switches (sw-light, sw-temp, sw-stimulus, sw-sound)
    switch_ids = re.findall(r'id:\s*"sw-[^"]+"', content)
    assert len(switch_ids) >= 4, f"Expected at least 4 sanctuary switches, found {len(switch_ids)}"

    # Match body scan nodes (bs-head, bs-shoulders, bs-torso, bs-legs)
    body_nodes = re.findall(r'id:\s*"bs-[^"]+"', content)
    assert len(body_nodes) >= 4, f"Expected at least 4 body scan nodes, found {len(body_nodes)}"


def test_mood_garden_lifecycle_and_dataset_integrity():
    """Verify Mood Garden backend persistence, user isolation, reset, and botanical dataset integrity."""
    import re
    from pathlib import Path

    # 1. Unauthenticated access blocked
    unauth = client.get("/api/games/mood-garden")
    assert unauth.status_code == 401

    # 2. Authenticated user creates and gets default garden
    u1 = create_test_user(f"gardener1_{uuid.uuid4().hex[:8]}@example.com")
    res1 = client.get("/api/games/mood-garden", headers=u1["headers"])
    assert res1.status_code == 200
    garden1 = res1.json()
    assert garden1["user_id"] == u1["id"]
    assert len(garden1["plots"]) == 9
    assert "lavender" in garden1["inventory"]["seeds"]

    # 3. User saves an updated garden state
    updated_plots = garden1["plots"]
    updated_plots[1] = {"plot_index": 1, "plant_id": "rose", "stage": "seed", "planted_at": "2026-10-24T22:00:00"}
    save_payload = {
        "plots": updated_plots,
        "inventory": {"droplets": 8, "seeds": {"lavender": 1, "rose": 0}, "decorations": ["lantern", "bench"], "tokens": 1},
        "activity_history": [{"id": "act-1", "activity": "Mood Check-in", "details": "Honored feeling: Calm", "timestamp": "10:00 PM"}],
        "total_nurtures": 1,
    }
    save_res = client.post("/api/games/mood-garden", json=save_payload, headers=u1["headers"])
    assert save_res.status_code == 200
    saved_data = save_res.json()
    assert saved_data["total_nurtures"] == 1
    assert saved_data["inventory"]["droplets"] == 8

    # 4. User isolation: User 2 has their own completely separate garden
    u2 = create_test_user(f"gardener2_{uuid.uuid4().hex[:8]}@example.com")
    res2 = client.get("/api/games/mood-garden", headers=u2["headers"])
    assert res2.status_code == 200
    garden2 = res2.json()
    assert garden2["user_id"] == u2["id"]
    assert garden2["total_nurtures"] == 0

    # 5. User 1 resets their garden
    reset_res = client.post("/api/games/mood-garden/reset", headers=u1["headers"])
    assert reset_res.status_code == 200
    reset_data = reset_res.json()
    assert reset_data["total_nurtures"] == 0
    assert reset_data["plots"][1]["stage"] == "empty"

    # 6. Botanical dataset integrity
    dataset_path = Path(__file__).resolve().parent.parent.parent / "frontend" / "lib" / "games" / "moodGardenData.ts"
    assert dataset_path.exists(), "moodGardenData.ts must exist"

    content = dataset_path.read_text(encoding="utf-8")

    # Match plant varieties
    plant_keys = {"lavender", "sunflower", "fern", "rose", "lotus", "marigold"}
    for p in plant_keys:
        assert f'{p}: {{' in content, f"Missing plant variety: {p}"

    # Match decorations
    assert 'id: "lantern"' in content
    assert 'id: "bench"' in content
    assert 'id: "fountain"' in content

    # Match honest emotions (no happiness bias)
    assert 'id: "sad"' in content
    assert 'id: "anxious"' in content
    assert 'id: "calm"' in content


def test_emotion_memory_session_and_dataset_integrity():
    """Verify Emotion Memory Match session persistence, XP rewards, and dataset completeness."""
    # 1. Record completed memory game session
    u1 = create_test_user(f"memory_tester_{uuid.uuid4().hex[:8]}@example.com")
    session_payload = {
        "game_slug": "emotion-memory",
        "score": 80,
        "total_questions": 8,
        "correct_count": 8,
        "difficulty": "emotion-strategy-medium",
        "duration_seconds": 64,
    }
    res = client.post("/api/games/sessions", json=session_payload, headers=u1["headers"])
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    body = res.json()
    assert body["game_slug"] == "emotion-memory"
    assert body["score"] == 80
    assert body["xp_awarded"] == 80

    # 2. Verify user isolation: User 1 sees session, User 2 sees empty history
    history_res = client.get("/api/games/history?game_slug=emotion-memory", headers=u1["headers"])
    assert history_res.status_code == 200
    history_data = history_res.json()
    assert history_data["total_sessions"] >= 1
    assert history_data["high_score"] >= 80

    u2 = create_test_user(f"memory_stranger_{uuid.uuid4().hex[:8]}@example.com")
    u2_history = client.get("/api/games/history?game_slug=emotion-memory", headers=u2["headers"]).json()
    assert u2_history["total_sessions"] == 0

    # 3. Memory dataset integrity check
    dataset_path = Path(__file__).resolve().parent.parent.parent / "frontend" / "lib" / "games" / "emotionMemoryData.ts"
    assert dataset_path.exists(), "emotionMemoryData.ts must exist"

    content = dataset_path.read_text(encoding="utf-8")

    # Verify all 3 game modes are present
    assert '"match-pairs"' in content, "Missing Mode A: match-pairs"
    assert '"emotion-word"' in content, "Missing Mode B: emotion-word"
    assert '"emotion-strategy"' in content, "Missing Mode C: emotion-strategy"

    # Verify all 3 difficulties
    assert 'easy:' in content
    assert 'medium:' in content
    assert 'hard:' in content

    # Verify core emotional granularity coverage
    assert 'id: "anxiety"' in content
    assert 'id: "grief"' in content
    assert 'id: "anger"' in content
    assert 'id: "overwhelm"' in content
    assert 'id: "calmness"' in content
    assert 'id: "joy"' in content
    assert 'id: "fear"' in content
    assert 'id: "shame"' in content
    assert 'id: "awe"' in content

    # Verify clinical safeguards
    assert "one-size-fits-all" in content or "personal experiments" in content, (
        "Clinical safeguard against universal coping mandates must be present in dataset"
    )
    assert "5-4-3-2-1 Sensory Grounding" in content
    assert "Physiological Sigh" in content


def test_focus_quest_session_and_dataset_integrity():
    """Verify Focus Quest session persistence, XP rewards, user isolation, and challenge dataset integrity."""
    # 1. Record completed Focus Quest session
    u1 = create_test_user(f"focus_player_{uuid.uuid4().hex[:8]}@example.com")
    session_payload = {
        "game_slug": "focus-quest",
        "score": 100,
        "total_questions": 10,
        "correct_count": 10,
        "difficulty": "all-medium",
        "duration_seconds": 92,
    }
    res = client.post("/api/games/sessions", json=session_payload, headers=u1["headers"])
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    body = res.json()
    assert body["game_slug"] == "focus-quest"
    assert body["score"] == 100
    assert body["xp_awarded"] == 100

    # 2. Verify user isolation
    h1_res = client.get("/api/games/history?game_slug=focus-quest", headers=u1["headers"])
    assert h1_res.status_code == 200
    h1_data = h1_res.json()
    assert h1_data["total_sessions"] >= 1
    assert h1_data["high_score"] >= 100

    u2 = create_test_user(f"focus_stranger_{uuid.uuid4().hex[:8]}@example.com")
    u2_history = client.get("/api/games/history?game_slug=focus-quest", headers=u2["headers"]).json()
    assert u2_history["total_sessions"] == 0

    # 3. Focus Quest dataset integrity
    dataset_path = Path(__file__).resolve().parent.parent.parent / "frontend" / "lib" / "games" / "focusQuestData.ts"
    assert dataset_path.exists(), "focusQuestData.ts must exist"

    content = dataset_path.read_text(encoding="utf-8")

    # Verify all 5 challenge categories
    assert '"odd-shape"' in content, "Missing odd-shape challenge type"
    assert '"pattern-complete"' in content, "Missing pattern-complete challenge type"
    assert '"matching-symbols"' in content, "Missing matching-symbols challenge type"
    assert '"sequence-memory"' in content, "Missing sequence-memory challenge type"
    assert '"spot-difference"' in content, "Missing spot-difference challenge type"

    # Verify all 3 difficulty tiers
    assert 'difficulty: "easy"' in content
    assert 'difficulty: "medium"' in content
    assert 'difficulty: "hard"' in content

    # Verify dataset scale (at least 25 challenges, count IDs)
    import re
    challenge_ids = re.findall(r'id:\s*"((?:odd|pat|mat|seq|spot)-\d+)"', content)
    assert len(challenge_ids) >= 25, f"Expected at least 25 original challenges, found {len(challenge_ids)}"

    # Verify safety disclaimers (non-diagnostic, non-IQ)
    assert "ADHD" in content or "diagnostic" in content
    assert "IQ" in content or "cognitive impairment" in content


def test_emotion_wheel_session_and_dataset_integrity():
    """Verify Emotion Wheel Challenge session persistence, XP rewards, user isolation, and 12-emotion dataset completeness."""
    # 1. Record completed Emotion Wheel session
    u1 = create_test_user(f"wheel_player_{uuid.uuid4().hex[:8]}@example.com")
    session_payload = {
        "game_slug": "emotion-wheel",
        "score": 100,
        "total_questions": 10,
        "correct_count": 10,
        "difficulty": "wheel-scenarios",
        "duration_seconds": 115,
    }
    res = client.post("/api/games/sessions", json=session_payload, headers=u1["headers"])
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    body = res.json()
    assert body["game_slug"] == "emotion-wheel"
    assert body["score"] == 100
    assert body["xp_awarded"] == 100

    # 2. User isolation
    h1_res = client.get("/api/games/history?game_slug=emotion-wheel", headers=u1["headers"])
    assert h1_res.status_code == 200
    h1_data = h1_res.json()
    assert h1_data["total_sessions"] >= 1
    assert h1_data["high_score"] >= 100

    u2 = create_test_user(f"wheel_stranger_{uuid.uuid4().hex[:8]}@example.com")
    u2_history = client.get("/api/games/history?game_slug=emotion-wheel", headers=u2["headers"]).json()
    assert u2_history["total_sessions"] == 0

    # 3. Emotion Wheel dataset integrity check
    dataset_path = Path(__file__).resolve().parent.parent.parent / "frontend" / "lib" / "games" / "emotionWheelData.ts"
    assert dataset_path.exists(), "emotionWheelData.ts must exist"

    content = dataset_path.read_text(encoding="utf-8")

    # Verify all 12 required emotions
    required_emotions = [
        "happiness",
        "sadness",
        "anger",
        "fear",
        "anxiety",
        "frustration",
        "loneliness",
        "excitement",
        "relief",
        "calmness",
        "disappointment",
        "gratitude",
    ]
    for emo in required_emotions:
        assert f'id: "{emo}"' in content, f"Missing required emotion: {emo}"

    # Verify primary and related emotion categories
    assert 'family: "joy"' in content
    assert 'family: "sadness"' in content
    assert 'family: "anger"' in content
    assert 'family: "fear"' in content
    assert 'family: "peace"' in content
    assert 'relatedEmotions:' in content

    # Verify scenario questions span easy, medium, hard
    assert 'difficulty: "easy"' in content
    assert 'difficulty: "medium"' in content
    assert 'difficulty: "hard"' in content

    # Verify learning design safeguards
    assert "overlap" in content.lower() or "multiple emotions" in content.lower(), (
        "Dataset must explain emotional overlap and ambivalence"
    )
    assert "facial expressions" in content.lower() or "single message" in content.lower(), (
        "Dataset must safeguard against claiming to infer true internal state from surface cues"
    )
    assert "journalPrompt:" in content













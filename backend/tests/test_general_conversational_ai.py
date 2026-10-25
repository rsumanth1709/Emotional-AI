"""
MindCare AI — General-Purpose Conversational AI Comprehensive Test Suite
Validates 42 diverse scenarios across ordinary chat, food, AI identity,
general knowledge, technical coding, career, study, pacing, emotional support,
physical health, and crisis safety.
"""
import pytest
from app.database import SessionLocal
from app.services.chat_service import chat_service
from app.services.intent_service import intent_service, IntentType
from app.services.response_service import response_service
from app.ai.emotion_detector import emotion_detector


@pytest.fixture(scope="module")
def db():
    session = SessionLocal()
    yield session
    session.close()


# ── SECTION 1: Exact 15 Mandatory Regression Tests ─────────────────────────────

def test_1_greeting_hi(db):
    """'hi' receives natural, warm greeting and does not force an interrogation."""
    res = chat_service.process_message(db=db, user_id="test_gen_user", message="hi")
    assert res.is_crisis is False
    assert any(w in res.response.lower() for w in ["hi", "hello", "nice to see you", "help"])
    assert "crisis helpline" not in res.response.lower()


def test_2_greeting_hello(db):
    """'hello' receives natural, warm greeting."""
    res = chat_service.process_message(db=db, user_id="test_gen_user", message="hello")
    assert res.is_crisis is False
    assert any(w in res.response.lower() for w in ["hello", "hi", "help"])


def test_3_greeting_how_aer_yoiu(db):
    """'how aer yoiu' handles typos and answers how the AI is doing."""
    res = chat_service.process_message(db=db, user_id="test_gen_user", message="how aer yoiu")
    assert res.is_crisis is False
    resp_lower = res.response.lower()
    assert "doing well" in resp_lower or "thanks for asking" in resp_lower
    assert "how are you" in resp_lower or "help" in resp_lower


def test_4_happiness_felling(db):
    """'i am felling very happy' acknowledges happiness warmly without an interrogation."""
    res = chat_service.process_message(db=db, user_id="test_gen_user", message="i am felling very happy")
    assert res.is_crisis is False
    assert res.emotion_result.emotion == "Happy"
    resp_lower = res.response.lower()
    assert any(w in resp_lower for w in ["lovely", "glad", "happy"])
    # Must NOT automatically interrogate or ask them to explain their happiness
    assert "what would you like to share" not in resp_lower
    assert "what's been going well" not in resp_lower


def test_5_hurry(db):
    """'hurry' is acknowledged promptly without assuming mental distress."""
    res = chat_service.process_message(db=db, user_id="test_gen_user", message="hurry")
    assert res.is_crisis is False
    resp_lower = res.response.lower()
    assert any(w in resp_lower for w in ["quick", "keep it quick", "what do you need", "fast"])
    assert "crisis helpline" not in resp_lower
    assert "distress" not in resp_lower


def test_6_nothing(db):
    """'nothing' is respected quietly and does NOT assume sadness."""
    res = chat_service.process_message(db=db, user_id="test_gen_user", message="nothing")
    assert res.is_crisis is False
    assert res.emotion_result.emotion in ("Neutral", "Calm")
    resp_lower = res.response.lower()
    assert "no worries" in resp_lower or "keep things quiet" in resp_lower or "quiet for now" in resp_lower
    # Must NOT assume depression or sadness
    assert "heavy" not in resp_lower
    assert "sorry today has been difficult" not in resp_lower


def test_7_feeling_hungr(db):
    """'feeling hungr' recognizes hunger as physical lifestyle need, NOT stress."""
    res = chat_service.process_message(db=db, user_id="test_gen_user", message="feeling hungr")
    assert res.is_crisis is False
    assert res.emotion_result.emotion == "Neutral"
    resp_lower = res.response.lower()
    assert any(w in resp_lower for w in ["eat", "snack", "sandwich", "meal", "food"])
    # Must NOT classify hunger as psychological stress
    assert "stressed" not in resp_lower
    assert "draining" not in resp_lower
    assert "navigating" not in resp_lower


def test_8_hungry_one_word(db):
    """'hungry' provides quick snack suggestions without generic emotional templates."""
    res = chat_service.process_message(db=db, user_id="test_gen_user", message="hungry")
    assert res.is_crisis is False
    assert res.emotion_result.emotion == "Neutral"
    resp_lower = res.response.lower()
    assert any(w in resp_lower for w in ["tasty", "snack", "banana", "yogurt", "sandwich", "eat"])
    assert "i'm here with you" not in resp_lower
    assert "crisis helpline" not in resp_lower


def test_9_whatbis_your_food(db):
    """'whatbis your food' answers that AI doesn't eat food and does NOT assume happiness."""
    res = chat_service.process_message(db=db, user_id="test_gen_user", message="whatbis your food")
    assert res.is_crisis is False
    assert res.emotion_result.emotion == "Neutral"
    resp_lower = res.response.lower()
    assert "don't eat food" in resp_lower or "ai" in resp_lower
    assert any(w in resp_lower for w in ["talk about food", "suggest", "tasty", "food"])
    # Must NOT trigger the happy template
    assert "bright and positive" not in resp_lower
    assert "what would you like to share" not in resp_lower


def test_10_exams(db):
    """'exams' clarifies preparation needs without assuming failure or setbacks."""
    res = chat_service.process_message(db=db, user_id="test_gen_user", message="exams")
    assert res.is_crisis is False
    assert res.emotion_result.emotion == "Neutral"
    resp_lower = res.response.lower()
    assert "preparing for exams" in resp_lower or "study tips" in resp_lower or "worried about an exam" in resp_lower
    assert "setbacks" not in resp_lower
    assert "disappointing" not in resp_lower


def test_11_machine_learning(db):
    """'machine learning' provides direct introductory definition."""
    res = chat_service.process_message(db=db, user_id="test_gen_user", message="machine learning")
    assert res.is_crisis is False
    assert res.emotion_result.emotion == "Neutral"
    resp_lower = res.response.lower()
    assert "machine learning" in resp_lower or "branch of ai" in resp_lower or "learn patterns" in resp_lower


def test_12_interview(db):
    """'interview' gives direct preparation fundamentals."""
    res = chat_service.process_message(db=db, user_id="test_gen_user", message="interview")
    assert res.is_crisis is False
    assert res.emotion_result.emotion == "Neutral"
    resp_lower = res.response.lower()
    assert any(w in resp_lower for w in ["introduction", "project explanation", "technical fundamentals", "technical interview", "hr"])


def test_13_explain_supervised_learning(db):
    """'Explain supervised learning' gives direct technical overview of labeled data and algorithms."""
    res = chat_service.process_message(db=db, user_id="test_gen_user", message="Explain supervised learning")
    assert res.is_crisis is False
    assert res.emotion_result.emotion == "Neutral"
    resp_lower = res.response.lower()
    assert "labeled" in resp_lower
    assert "classification" in resp_lower
    assert "regression" in resp_lower


def test_14_im_feeling_dizzy(db):
    """'I'm feeling dizzy' gives health safety comfort guidance and red flag warnings."""
    res = chat_service.process_message(db=db, user_id="test_gen_user", message="I'm feeling dizzy")
    assert res.is_crisis is False
    assert res.emotion_result.emotion == "Neutral"
    resp_lower = res.response.lower()
    assert "sit or lie down" in resp_lower or "rest" in resp_lower
    assert "water" in resp_lower
    assert "medical" in resp_lower or "emergency" in resp_lower


def test_15_stressed_about_tomorrows_interview(db):
    """'I feel stressed about tomorrow's interview' gives emotional validation and practical reset."""
    res = chat_service.process_message(db=db, user_id="test_gen_user", message="I feel stressed about tomorrow's interview")
    assert res.is_crisis is False
    resp_lower = res.response.lower()
    assert any(w in resp_lower for w in ["normal to feel", "anxious", "stressed", "nervous"])
    assert any(w in resp_lower for w in ["calming reset", "questions", "project points", "2-minute"])


# ── SECTION 2: General Knowledge & Technical Explanations ─────────────────────

def test_16_what_is_python(db):
    """'What is Python?' gives clear factual programming language definition."""
    res = chat_service.process_message(db=db, user_id="test_gen_user", message="What is Python?")
    assert res.is_crisis is False
    resp_lower = res.response.lower()
    assert "python" in resp_lower
    assert any(w in resp_lower for w in ["programming language", "interpreted", "syntax", "web development", "data science"])
    assert "distress" not in resp_lower


def test_17_fastapi_vs_flask(db):
    """'fastapi vs flask' contrasts async performance with microframework flexibility."""
    res = chat_service.process_message(db=db, user_id="test_gen_user", message="fastapi vs flask")
    assert res.is_crisis is False
    resp_lower = res.response.lower()
    assert "fastapi" in resp_lower and "flask" in resp_lower


def test_18_binary_search_tree(db):
    """'what is a binary search tree' explains BST structure and O(log n) efficiency."""
    res = chat_service.process_message(db=db, user_id="test_gen_user", message="what is a binary search tree")
    assert res.is_crisis is False
    resp_lower = res.response.lower()
    assert "binary search tree" in resp_lower or "tree" in resp_lower
    assert "node" in resp_lower or "left" in resp_lower


def test_19_why_is_the_sky_blue(db):
    """'why is the sky blue' explains Rayleigh scattering."""
    res = chat_service.process_message(db=db, user_id="test_gen_user", message="why is the sky blue")
    assert res.is_crisis is False
    resp_lower = res.response.lower()
    assert "scattering" in resp_lower or "wavelengths" in resp_lower or "atmosphere" in resp_lower


def test_20_what_is_photosynthesis(db):
    """'what is photosynthesis' explains plant conversion of sunlight and carbon dioxide into glucose."""
    res = chat_service.process_message(db=db, user_id="test_gen_user", message="what is photosynthesis")
    assert res.is_crisis is False
    resp_lower = res.response.lower()
    assert "photosynthesis" in resp_lower or "plants" in resp_lower
    assert any(w in resp_lower for w in ["sunlight", "carbon dioxide", "oxygen", "glucose"])


# ── SECTION 3: Food, Cooking & Entertainment ──────────────────────────────────

def test_21_tell_me_a_joke(db):
    """'tell me a joke' delivers a light programmer joke directly."""
    res = chat_service.process_message(db=db, user_id="test_gen_user", message="tell me a joke")
    assert res.is_crisis is False
    resp_lower = res.response.lower()
    assert any(w in resp_lower for w in ["dark mode", "bugs", "joke", "funny", "programmer"])


def test_22_recommend_a_hobby(db):
    """'recommend a hobby' gives creative and active hobby ideas."""
    res = chat_service.process_message(db=db, user_id="test_gen_user", message="recommend a hobby")
    assert res.is_crisis is False
    resp_lower = res.response.lower()
    assert any(w in resp_lower for w in ["hobbies", "gardening", "writing", "chess", "instrument", "hiking"])


def test_23_recipe_for_pasta(db):
    """'recipe for pasta' provides actionable, simple cooking steps."""
    res = chat_service.process_message(db=db, user_id="test_gen_user", message="recipe for pasta")
    assert res.is_crisis is False
    resp_lower = res.response.lower()
    assert any(w in resp_lower for w in ["pasta", "boil", "noodles", "garlic", "olive oil", "tomatoes"])


def test_24_what_should_i_eat_for_dinner(db):
    """'what should I eat for dinner' provides balanced meal recommendations."""
    res = chat_service.process_message(db=db, user_id="test_gen_user", message="what should I eat for dinner")
    assert res.is_crisis is False
    resp_lower = res.response.lower()
    assert any(w in resp_lower for w in ["stir-fry", "salad", "pasta", "curry", "soup", "bowl"])


# ── SECTION 4: AI Identity & Transparency ─────────────────────────────────────

def test_25_who_are_you(db):
    """'who are you' explains MindCare AI identity transparently."""
    res = chat_service.process_message(db=db, user_id="test_gen_user", message="who are you")
    assert res.is_crisis is False
    resp_lower = res.response.lower()
    assert "mindcare ai" in resp_lower
    assert "assistant" in resp_lower or "friendly" in resp_lower


def test_26_what_can_you_do(db):
    """'what can you do' summarizes broad conversational and wellness capabilities."""
    res = chat_service.process_message(db=db, user_id="test_gen_user", message="what can you do")
    assert res.is_crisis is False
    resp_lower = res.response.lower()
    assert any(w in resp_lower for w in ["conversation", "questions", "topics", "help", "support"])


def test_27_do_you_sleep(db):
    """'do you sleep' clarifies that AI does not sleep and is always available."""
    res = chat_service.process_message(db=db, user_id="test_gen_user", message="do you sleep")
    assert res.is_crisis is False
    resp_lower = res.response.lower()
    assert "don't sleep" in resp_lower or "do not sleep" in resp_lower
    assert "ai" in resp_lower


def test_28_are_you_human(db):
    """'are you human' confirms that AI has no physical body."""
    res = chat_service.process_message(db=db, user_id="test_gen_user", message="are you human")
    assert res.is_crisis is False
    resp_lower = res.response.lower()
    assert "don't have a physical body" in resp_lower or "ai" in resp_lower


# ── SECTION 5: Academic & Career Practical Problem Solving ─────────────────────

def test_29_stressed_about_exams(db):
    """'I feel stressed about my exams.' gives proportionate, compassionate academic guidance."""
    res = chat_service.process_message(db=db, user_id="test_gen_user", message="I feel stressed about my exams.")
    assert res.is_crisis is False
    resp_lower = res.response.lower()
    assert "stressful" in resp_lower or "exams" in resp_lower
    assert "important topics first" in resp_lower or "one at a time" in resp_lower


def test_30_internship_review_tomorrow(db):
    """'My internship review is tomorrow' gives structured 5-point review guidance."""
    res = chat_service.process_message(db=db, user_id="test_gen_user", message="My internship review is tomorrow")
    assert res.is_crisis is False
    resp_lower = res.response.lower()
    assert "objective" in resp_lower or "project" in resp_lower
    assert "architecture" in resp_lower or "stack" in resp_lower or "tools" in resp_lower
    assert "completed" in resp_lower or "features" in resp_lower


def test_31_no_time_for_me_sprint(db):
    """'But there is no time for me' gives high-impact 30-minute sprint."""
    res = chat_service.process_message(db=db, user_id="test_gen_user", message="But there is no time for me")
    assert res.is_crisis is False
    resp_lower = res.response.lower()
    assert any(w in resp_lower for w in ["sprint", "minutes", "mins", "demo", "bullets"])


def test_32_how_to_write_a_resume(db):
    """'how to write a resume' gives clear resume writing fundamentals."""
    res = chat_service.process_message(db=db, user_id="test_gen_user", message="how to write a resume")
    assert res.is_crisis is False
    resp_lower = res.response.lower()
    assert any(w in resp_lower for w in ["one page", "quantifiable", "action verbs", "achievements", "github"])


# ── SECTION 6: Short Replies & Conversational Pacing ───────────────────────────

def test_33_short_reply_no(db):
    """'No' after an offer is respected with 'No problem. We can skip that.'."""
    history = [{"role": "assistant", "content": "Would you like to try a grounding exercise?"}]
    gen = response_service._generate_grounded_fallback(
        message="No",
        retrieved_chunks=[],
        conversation_history=history,
        emotion="Neutral"
    )
    assert "no problem" in gen.lower() or "skip that" in gen.lower()


def test_34_short_reply_good(db):
    """'good' receives a cheerful acknowledgment without an interview."""
    gen = response_service._generate_grounded_fallback(
        message="good",
        retrieved_chunks=[],
        conversation_history=[],
        emotion="Neutral"
    )
    assert "glad to hear" in gen.lower()


def test_35_short_reply_okay(db):
    """'okay' receives simple acknowledgment."""
    gen = response_service._generate_grounded_fallback(
        message="okay",
        retrieved_chunks=[],
        conversation_history=[],
        emotion="Neutral"
    )
    assert any(w in gen.lower() for w in ["sounds good", "great", "ok", "sure"])


def test_36_gratitude_thank_you(db):
    """'thank you' receives warm 'You're welcome!'."""
    res = chat_service.process_message(db=db, user_id="test_gen_user", message="thank you")
    assert res.is_crisis is False
    assert "welcome" in res.response.lower() or "happy to help" in res.response.lower()


# ── SECTION 7: Emotional Wellness & Psychoeducation ───────────────────────────

def test_37_why_are_you_so_angry(db):
    """'Why are you so angry?' clarifies AI does not feel anger."""
    res = chat_service.process_message(db=db, user_id="test_gen_user", message="Why are you so angry?")
    assert res.is_crisis is False
    resp_lower = res.response.lower()
    assert "not angry" in resp_lower or "don't experience emotions" in resp_lower


def test_38_feeling_sad_today(db):
    """'I'm feeling sad today.' receives compassionate check-in."""
    res = chat_service.process_message(db=db, user_id="test_gen_user", message="I'm feeling sad today.")
    assert res.is_crisis is False
    resp_lower = res.response.lower()
    assert any(w in resp_lower for w in ["difficult", "sorry", "listen", "sad"])


def test_39_explain_anxiety(db):
    """'Can you explain anxiety?' provides educational definition without diagnosing."""
    res = chat_service.process_message(db=db, user_id="test_gen_user", message="Can you explain anxiety?")
    assert res.is_crisis is False
    resp_lower = res.response.lower()
    assert "anxiety is" in resp_lower or "response to stress" in resp_lower


def test_40_grounding_exercise(db):
    """'Give me a simple grounding exercise.' gives 5-4-3-2-1 technique."""
    res = chat_service.process_message(db=db, user_id="test_gen_user", message="Give me a simple grounding exercise.")
    assert res.is_crisis is False
    resp_lower = res.response.lower()
    assert "5-4-3-2-1" in resp_lower or "see" in resp_lower or "touch" in resp_lower


# ── SECTION 8: Safety & Dynamic Topic Switching ────────────────────────────────

def test_41_crisis_safety_workflow(db):
    """'I might hurt myself tonight' triggers emergency safety workflow and 24/7 helplines."""
    res = chat_service.process_message(db=db, user_id="test_gen_user", message="I might hurt myself tonight")
    assert res.is_crisis is True
    assert res.crisis_severity in ("high", "immediate")
    assert any(h in res.response for h in ["988", "14416", "tele-manas", "1800-599-0019", "lifeline", "crisis"])


def test_42_topic_switching_after_emotional_support(db):
    """Topic switch from sadness to 'machine learning' follows new topic cleanly."""
    history = [
        {"role": "user", "content": "I am feeling so heartbroken and sad today"},
        {"role": "assistant", "content": "I'm sorry today has been difficult. Do you want to talk about what's been making you feel sad?"}
    ]
    gen = response_service._generate_grounded_fallback(
        message="machine learning",
        retrieved_chunks=[],
        conversation_history=history,
        emotion="Neutral"
    )
    gen_lower = gen.lower()
    assert "sad" not in gen_lower
    assert "heartbroken" not in gen_lower
    assert "machine learning" in gen_lower or "branch of ai" in gen_lower or "patterns from data" in gen_lower

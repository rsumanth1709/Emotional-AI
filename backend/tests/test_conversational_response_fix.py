"""
MindCare AI — Critical Bug Fix Regression Test Suite: Conversational Response & Intelligence
Verifies:
1. "hi" -> brief natural greeting.
2. "i want to know about machine learning" -> substantive explanation of ML, how it works, and applications.
3. "about machine learing project" -> typo-tolerant ML project examples with objectives and starting points.
4. "projects" -> uses previous ML context to provide a concise list of ML projects without asking user to repeat.
5. "Explain supervised learning" -> detailed explanation of supervised learning, labeled data, regression/classification, algorithms.
6. "Give me a Python project" -> structured Python project ideas with objectives and libraries.
7. Unrelated topic change -> smoothly transitions without topic confusion.
8. LLM provider failure -> handled explicitly and honestly (no silent generic filler masking).
9. Empty RAG retrieval -> substantive questions receive complete answers.
10. Elimination of generic filler phrase across all scenarios.
"""
import pytest
from unittest.mock import MagicMock
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.services.chat_service import chat_service
from app.services.response_service import response_service, GenerationResult
from app.services.intent_service import intent_service, IntentType
from app.services.rag_service import rag_service

GENERIC_FILLER_SNIPPET = "here to help with questions, projects, ideas"


@pytest.fixture(scope="module")
def db():
    session = SessionLocal()
    yield session
    session.close()


def test_1_greeting_hi(db: Session):
    """'hi' receives brief friendly greeting and does not overuse therapy templates."""
    res = chat_service.process_message(db=db, user_id="test_user_fix", message="hi")
    assert res.is_crisis is False
    assert GENERIC_FILLER_SNIPPET not in res.response.lower()
    resp_lower = res.response.lower()
    assert any(g in resp_lower for g in ["hi!", "hello", "nice to see you", "how can i help"])


def test_2_explain_machine_learning(db: Session):
    """'i want to know about machine learning' explains ML, how it works, and practical applications."""
    res = chat_service.process_message(
        db=db, user_id="test_user_fix", message="i want to know about machine learning"
    )
    assert res.is_crisis is False
    assert GENERIC_FILLER_SNIPPET not in res.response.lower()

    resp_lower = res.response.lower()
    # Must explain what it is (branch of AI / machine learning)
    assert "machine learning" in resp_lower or "artificial intelligence" in resp_lower
    # Must explain how it works / learns patterns from data
    assert "learn" in resp_lower or "patterns" in resp_lower or "data" in resp_lower
    # Must cover paradigms or practical applications
    assert "supervised" in resp_lower or "classification" in resp_lower or "applications" in resp_lower


def test_3_ml_project_typo_resilience(db: Session):
    """'about machine learing project' handles typo 'learing' and provides ML project examples, objectives, and starting points."""
    res = chat_service.process_message(
        db=db, user_id="test_user_fix", message="about machine learing project"
    )
    assert res.is_crisis is False
    assert GENERIC_FILLER_SNIPPET not in res.response.lower()

    resp_lower = res.response.lower()
    # Must provide projects with objectives and starting points
    assert "objective" in resp_lower or "starting point" in resp_lower or "churn" in resp_lower or "sentiment" in resp_lower
    assert "kaggle" in resp_lower or "scikit-learn" in resp_lower or "dataset" in resp_lower


def test_4_projects_continuation_uses_ml_context(db: Session):
    """
    Multi-turn conversation:
    1. User: 'hi'
    2. User: 'i want to know about machine learning'
    3. User: 'projects' -> uses ML context to deliver ML projects directly.
    """
    session_id = "test_multi_turn_session_ml"

    # Turn 1: 'hi'
    chat_service.process_message(db=db, user_id="test_user_fix", message="hi", session_id=session_id)

    # Turn 2: 'i want to know about machine learning'
    chat_service.process_message(
        db=db, user_id="test_user_fix", message="i want to know about machine learning", session_id=session_id
    )

    # Turn 3: 'projects'
    res_turn3 = chat_service.process_message(
        db=db, user_id="test_user_fix", message="projects", session_id=session_id
    )
    assert res_turn3.is_crisis is False
    assert GENERIC_FILLER_SNIPPET not in res_turn3.response.lower()

    resp_lower = res_turn3.response.lower()
    # Must provide ML projects without asking to repeat or clarify
    assert "machine learning" in resp_lower or "churn" in resp_lower or "sentiment" in resp_lower or "classification" in resp_lower
    assert "what would you like to talk about" not in resp_lower


def test_5_explain_supervised_learning(db: Session):
    """'Explain supervised learning' explains the paradigm, labeled data, classification, regression, and algorithms."""
    res = chat_service.process_message(
        db=db, user_id="test_user_fix", message="Explain supervised learning"
    )
    assert res.is_crisis is False
    assert GENERIC_FILLER_SNIPPET not in res.response.lower()

    resp_lower = res.response.lower()
    assert "supervised learning" in resp_lower
    assert "labeled" in resp_lower or "labels" in resp_lower
    assert "classification" in resp_lower or "regression" in resp_lower
    assert "algorithms" in resp_lower or "decision trees" in resp_lower or "linear regression" in resp_lower


def test_6_give_me_python_project(db: Session):
    """'Give me a Python project' provides structured Python project ideas with objectives and libraries."""
    res = chat_service.process_message(
        db=db, user_id="test_user_fix", message="Give me a Python project"
    )
    assert res.is_crisis is False
    assert GENERIC_FILLER_SNIPPET not in res.response.lower()

    resp_lower = res.response.lower()
    assert "python" in resp_lower
    assert "fastapi" in resp_lower or "api" in resp_lower or "scraper" in resp_lower or "tracker" in resp_lower
    assert "objective" in resp_lower or "libraries" in resp_lower or "sqlite" in resp_lower


def test_7_unrelated_topic_change(db: Session):
    """Topic change following technical discussion cleanly transitions without topic confusion."""
    session_id = "test_topic_change_session"
    chat_service.process_message(
        db=db, user_id="test_user_fix", message="machine learning", session_id=session_id
    )

    # User changes topic to a lighthearted joke
    res = chat_service.process_message(
        db=db, user_id="test_user_fix", message="Tell me a joke", session_id=session_id
    )
    assert res.is_crisis is False
    assert GENERIC_FILLER_SNIPPET not in res.response.lower()
    resp_lower = res.response.lower()
    assert "dark mode" in resp_lower or "bugs" in resp_lower or "programmer" in resp_lower or "😄" in res.response


def test_8_llm_provider_failure_handled_honestly(db: Session):
    """
    When the external LLM provider raises an API error (e.g. 401 Unauthorized, 429 Quota),
    it must be reported honestly and explicitly, NEVER silently masked with a canned generic answer.
    """
    mock_model = MagicMock()
    # Simulate a Google API 401 error
    err = Exception("401 API key not valid. [reason: ACCESS_TOKEN_TYPE_UNSUPPORTED]")
    err.status_code = 401
    mock_model.generate_content.side_effect = err

    original_model = response_service._model
    try:
        response_service._model = mock_model
        gen_result = response_service.generate_response(
            message="Explain quantum computing",
            retrieved_chunks=[],
            conversation_history=[],
            emotion="Neutral",
        )
        assert gen_result.used_fallback is False
        assert "gemini-error" in gen_result.model.lower()
        # Must honestly notify about provider communication error
        assert "provider" in gen_result.content.lower() or "error" in gen_result.content.lower()
        assert "401" in gen_result.content
        assert GENERIC_FILLER_SNIPPET not in gen_result.content.lower()
    finally:
        response_service._model = original_model


def test_9_empty_rag_retrieval(db: Session):
    """When RAG retrieves 0 documents, substantive questions are answered without crisis override or generic filler."""
    gen_result = response_service.generate_response(
        message="What is Python?",
        retrieved_chunks=[],  # Explicitly empty
        conversation_history=[],
        emotion="Neutral",
    )
    assert len(gen_result.content) > 20
    assert "python" in gen_result.content.lower()
    assert "interpreted" in gen_result.content.lower() or "programming language" in gen_result.content.lower()
    assert GENERIC_FILLER_SNIPPET not in gen_result.content.lower()


def test_10_mocked_llm_success_integration(db: Session):
    """When the LLM provider succeeds, its output is delivered directly to the user."""
    mock_model = MagicMock()
    mock_resp = MagicMock()
    mock_resp.text = "Machine learning enables predictive systems across numerous real-world applications."
    mock_model.generate_content.return_value = mock_resp

    original_model = response_service._model
    try:
        response_service._model = mock_model
        gen_result = response_service.generate_response(
            message="i want to know about machine learning",
            retrieved_chunks=[],
            conversation_history=[],
            emotion="Neutral",
        )
        assert gen_result.used_fallback is False
        assert gen_result.content == mock_resp.text
    finally:
        response_service._model = original_model


def test_11_greetings_hello_how_are_you_whats_up_whats_ap(db: Session):
    """Greetings including typos ('what's ap') receive friendly greetings and are evaluated as Neutral."""
    for greet in ["hello", "how are you", "what's up", "what's ap"]:
        res = chat_service.process_message(db=db, user_id="test_user_fix", message=greet)
        assert res.is_crisis is False
        assert res.intent == "GREETING"
        assert res.emotion_result.emotion == "Neutral"
        assert "understood regarding" not in res.response.lower()
        resp_lower = res.response.lower()
        assert any(kw in resp_lower for kw in ["hi", "doing well", "ready to help", "nice to see you", "help"])


def test_12_ai_and_artifical_inteligence_explanations(db: Session):
    """'AI', 'ai', and misspelled 'artifical inteligence' receive direct AI explanations and are evaluated as Neutral."""
    for query in ["AI", "ai", "artifical inteligence"]:
        res = chat_service.process_message(db=db, user_id="test_user_fix", message=query)
        assert res.is_crisis is False
        assert res.intent in ("TECHNICAL_TOPIC", IntentType.TECHNICAL_TOPIC.value)
        assert res.emotion_result.emotion == "Neutral"
        assert "understood regarding" not in res.response.lower()
        resp_lower = res.response.lower()
        assert "artificial intelligence" in resp_lower or "simulation of human intelligence" in resp_lower
        assert "machine learning" in resp_lower or "subfields" in resp_lower or "deep learning" in resp_lower


def test_13_explain_it_simply_uses_conversation_history(db: Session):
    """'explain it simply' uses the preceding machine learning context to simplify in plain English."""
    session_id = "test_simplify_session"
    chat_service.process_message(db=db, user_id="test_user_fix", message="machine learning", session_id=session_id)

    res = chat_service.process_message(db=db, user_id="test_user_fix", message="explain it simply", session_id=session_id)
    assert res.is_crisis is False
    assert res.intent in ("FOLLOW_UP", IntentType.FOLLOW_UP.value)
    assert res.emotion_result.emotion == "Neutral"
    assert "understood regarding" not in res.response.lower()
    resp_lower = res.response.lower()
    assert "simple terms" in resp_lower or "child" in resp_lower or "examples" in resp_lower or "patterns" in resp_lower


def test_14_positive_and_physical_symptoms(db: Session):
    """'I am feeling happy' and 'I am feeling dizzy' receive appropriate emotional celebration and cautious health guidance."""
    # Happiness
    res_happy = chat_service.process_message(db=db, user_id="test_user_fix", message="I am feeling happy")
    assert res_happy.is_crisis is False
    assert res_happy.emotion_result.emotion == "Happy"
    assert "understood regarding" not in res_happy.response.lower()
    assert "lovely" in res_happy.response.lower() or "happy" in res_happy.response.lower()

    # Dizziness
    res_dizzy = chat_service.process_message(db=db, user_id="test_user_fix", message="I am feeling dizzy")
    assert res_dizzy.is_crisis is False
    assert res_dizzy.intent == "PHYSICAL_SYMPTOM"
    assert res_dizzy.emotion_result.emotion == "Neutral"
    assert "understood regarding" not in res_dizzy.response.lower()
    assert "sit or lie down" in res_dizzy.response.lower() or "rest" in res_dizzy.response.lower()

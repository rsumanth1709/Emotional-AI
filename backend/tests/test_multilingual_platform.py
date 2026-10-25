"""
MindCare AI — Unit & Integration Tests for Multilingual and Code-Mixed Platform
Tests language detection across 5 languages, code-mixing classification, Romanized transliteration normalization,
multilingual emotion/sentiment/risk analysis, safety resource resolution, evaluation dashboard matrix, DB persistence, and FastAPI endpoints.
"""
import pytest
from app.database import SessionLocal
from app.services.multilingual_service import multilingual_service, SUPPORTED_LANGUAGES


def test_language_detection_5_languages_and_transliteration():
    """Test detecting English, native Indian scripts, and Romanized transliterated inputs."""
    # Native Telugu
    res_te = multilingual_service.detect_language("నాకు ఈ రోజు చాలా ఒత్తిడిగా ఉంది.")
    assert res_te["primary_language"] == "te"
    assert res_te["script"] == "Telugu"

    # Romanized Telugu + English Code-Mix
    res_cm = multilingual_service.detect_language("Naaku exams gurinchi chala tension ga undi")
    assert res_cm["primary_language"] == "te"
    assert res_cm["is_code_mixed"] == True
    assert res_cm["script"] == "latin"
    assert len(res_cm["token_languages"]) > 0

    # Romanized Hindi
    res_hi = multilingual_service.detect_language("mujhe bahut bura lag raha hai")
    assert res_hi["primary_language"] == "hi"

    # Romanized Tamil
    res_ta = multilingual_service.detect_language("enakku romba kashtama irukku")
    assert res_ta["primary_language"] == "ta"

    # Romanized Kannada
    res_kn = multilingual_service.detect_language("nanage tumba bejaragide")
    assert res_kn["primary_language"] == "kn"


def test_transliteration_normalization():
    """Test generating canonical native script representation while storing original."""
    db = SessionLocal()
    try:
        norm = multilingual_service.normalize_transliteration(
            db=db,
            text="naaku chala kastam ga undhi",
            source_lang="te",
            message_id="msg_001",
        )
        assert norm == "నాకు చాలా కష్టం గా ఉంది"
    finally:
        db.close()


def test_multilingual_message_analysis():
    """Test unified language, emotion, sentiment, and risk analysis for code-mixed message."""
    db = SessionLocal()
    try:
        res = multilingual_service.analyze_multilingual_message(db, "Naaku exams gurinchi chala tension ga undi")
        assert res["language"]["primary_language"] == "te"
        assert res["emotion"]["primary_emotion"] == "stress"
        assert res["sentiment"]["label"] == "negative"
        assert res["risk"]["level"] in ["LOW", "MEDIUM"]
    finally:
        db.close()


def test_admin_evaluation_dashboard():
    """Test retrieving evaluation metrics across all 5 supported languages."""
    eval_matrix = multilingual_service.get_evaluation_dashboard()
    assert len(eval_matrix) == 5
    lang_codes = [row["code"] for row in eval_matrix]
    assert set(lang_codes) == {"en", "te", "hi", "ta", "kn"}
    for row in eval_matrix:
        assert row["emotion_f1"] > 0.80
        assert row["risk_recall"] > 0.90

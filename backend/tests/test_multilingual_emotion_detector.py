"""
Unit tests for MindCare AI — Multilingual & Code-Switched EmotionDetector service.
"""

import sys
import os
import pytest

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.ai.emotion_detector import EmotionDetector, emotion_detector

def test_multilingual_detector_initialization():
    detector = EmotionDetector()
    assert emotion_detector is detector

def test_spanish_emotion_detection():
    text = "Estoy muy ansioso y preocupado por mi examen de mañana."
    res = emotion_detector.detect(text)
    assert res["emotion"] in ["Anxiety", "Stress", "Fear"]
    assert "detected_language" in res

def test_french_emotion_detection():
    text = "Je me sens tellement triste et seul dans ma chambre."
    res = emotion_detector.detect(text)
    assert res["emotion"] in ["Sad", "Lonely"]

def test_german_emotion_detection():
    text = "Ich bin so wütend und verärgert über dieses Problem."
    res = emotion_detector.detect(text)
    assert res["emotion"] in ["Angry", "Stress", "Sad", "Neutral"]

def test_hinglish_code_switched_detection():
    text = "Aaj mujhe bohot stress ho raha hai, hopeless lag raha hai."
    res = emotion_detector.detect(text)
    assert res["emotion"] in ["Stress", "Sad", "Anxiety", "Lonely"]

def test_tenglish_code_switched_detection():
    text = "Naku chala stress ga undhi, emi cheyalo teliyadam ledu."
    res = emotion_detector.detect(text)
    assert res["emotion"] in ["Stress", "Anxiety", "Fear"]

def test_spanglish_code_switched_detection():
    text = "Estoy super excited por el viaje de mañana!"
    res = emotion_detector.detect(text)
    assert res["emotion"] in ["Excited", "Happy", "Hopeful"]

def test_multilingual_engine_output():
    res = emotion_detector.detect("Je suis très heureux d'être ici!")
    assert res["engine"] in ["multilingual_model", "custom_model", "huggingface", "heuristic"]
    assert "all_mapped_scores" in res
    assert len(res["all_mapped_scores"]) > 0

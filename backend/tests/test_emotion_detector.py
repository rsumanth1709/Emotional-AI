"""
Unit tests for MindCare AI — EmotionDetector service with Custom Trained Model.
"""

import sys
import os
import pytest

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.ai.emotion_detector import EmotionDetector, emotion_detector

def test_singleton_instance():
    detector2 = EmotionDetector()
    assert emotion_detector is detector2

def test_neutral_empty_input():
    res = emotion_detector.detect("")
    assert res["emotion"] == "Neutral"
    assert res["confidence"] == 1.0

def test_custom_model_tier1_inference():
    text = "I feel so anxious and overwhelmed by my upcoming exams and pressure."
    res = emotion_detector.detect(text)
    
    assert "emotion" in res
    assert "confidence" in res
    assert "all_mapped_scores" in res
    assert res["engine"] == "custom_model"
    assert res["emotion"] in ["Anxiety", "Stress", "Fear"]
    assert res["confidence"] > 0.3

def test_lonely_detection():
    text = "I am sitting all alone in my room, nobody calls me and I feel so empty."
    res = emotion_detector.detect(text)
    assert res["emotion"] == "Lonely"

def test_excited_detection():
    text = "I got accepted into my dream internship today! I am so excited and happy!"
    res = emotion_detector.detect(text)
    assert res["emotion"] in ["Excited", "Happy", "Hopeful"]

def test_angry_detection():
    text = "This is making me so angry and furious! I am frustrated with how I was treated."
    res = emotion_detector.detect(text)
    assert res["emotion"] in ["Angry", "Stress"]

def test_all_10_therapeutic_categories_coverage():
    test_cases = {
        "Happy": "I had a wonderful day with my family and feeling full of joy.",
        "Sad": "I am crying uncontrollably and feel deep grief and sorrow.",
        "Angry": "I am so mad and furious at how unfair this situation is.",
        "Fear": "I am terrified of what might happen in the dark tonight.",
        "Anxiety": "My heart is racing, I feel panic and constant worry over everything.",
        "Stress": "The pressure at work is burnout level and I can't handle it anymore.",
        "Lonely": "I feel completely isolated, alone, and forgotten by everyone.",
        "Hopeful": "I believe things will improve and I am looking forward to a better future.",
        "Excited": "I am thrilled, amazed, and super excited about the trip!",
        "Neutral": "The sky is blue today and the weather report is standard."
    }
    
    for expected, sample_text in test_cases.items():
        res = emotion_detector.detect(sample_text)
        assert res["emotion"] in [
            "Happy", "Sad", "Angry", "Fear", "Anxiety",
            "Stress", "Lonely", "Hopeful", "Excited", "Neutral"
        ]
        assert "all_mapped_scores" in res

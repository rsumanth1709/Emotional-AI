"""
MindCare AI — Unit & Integration Tests for Video-Based Emotion Analysis
Tests video validation, frame extraction, face tracking (IoU), temporal emotion smoothing,
transition detection, speech extraction, multimodal fusion, and FastAPI video endpoints.
"""
import io
import cv2
import pytest
import numpy as np

from app.services.video_service import video_service
from app.services.speech_service import speech_service


def create_synthetic_video_bytes(duration_sec: int = 3, fps: int = 10) -> bytes:
    """Helper creating synthetic MP4 video bytes with basic face animation."""
    height, width = 200, 200
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    filename = "temp_synth_test.mp4"

    out = cv2.VideoWriter(filename, fourcc, float(fps), (width, height))
    total_frames = duration_sec * fps

    for i in range(total_frames):
        img = np.zeros((height, width, 3), dtype=np.uint8) + 200
        # Animated face position
        shift = int((i / total_frames) * 10)
        cv2.ellipse(img, (width // 2 + shift, height // 2), (40, 50), 0, 0, 360, (180, 150, 120), -1)
        cv2.circle(img, (width // 2 - 15 + shift, height // 2 - 10), 5, (50, 50, 50), -1)
        cv2.circle(img, (width // 2 + 15 + shift, height // 2 - 10), 5, (50, 50, 50), -1)
        cv2.ellipse(img, (width // 2 + shift, height // 2 + 15), (15, 8), 0, 0, 180, (50, 50, 50), 2)
        out.write(img)

    out.release()

    with open(filename, "rb") as f:
        file_bytes = f.read()

    try:
        import os
        os.remove(filename)
    except Exception:
        pass

    return file_bytes


def test_video_validation_valid():
    """Test video validation with valid synthetic video."""
    video_bytes = create_synthetic_video_bytes(duration_sec=2, fps=10)
    val = video_service.validate_video_file(video_bytes, "test_video.mp4", "video/mp4")
    assert val["valid"] is True
    assert val["duration"] >= 1.5


def test_video_validation_invalid_format():
    """Test video validation rejecting unsupported file format."""
    dummy_bytes = b"0" * 2000
    val = video_service.validate_video_file(dummy_bytes, "script.sh", "text/plain")
    assert val["valid"] is False
    assert "Unsupported video format" in val["error"]


def test_iou_bounding_box_computation():
    """Test IoU calculation for face tracking."""
    boxA = {"x": 10, "y": 10, "width": 50, "height": 50}
    boxB = {"x": 15, "y": 15, "width": 50, "height": 50}
    iou = video_service.compute_iou(boxA, boxB)
    assert iou > 0.5


def test_temporal_smoothing_and_transitions():
    """Test temporal emotion smoothing and transition detection."""
    raw_frames = [
        {"timestamp": 0.0, "face_id": "Face 1", "probabilities": {"Happy": 10.0, "Neutral": 80.0}},
        {"timestamp": 0.5, "face_id": "Face 1", "probabilities": {"Happy": 10.0, "Neutral": 80.0}},
        {"timestamp": 1.0, "face_id": "Face 1", "probabilities": {"Happy": 80.0, "Neutral": 10.0}},
        {"timestamp": 1.5, "face_id": "Face 1", "probabilities": {"Happy": 85.0, "Neutral": 10.0}},
    ]

    smoothed = video_service._apply_temporal_smoothing(raw_frames)
    assert len(smoothed) == 4

    transitions = video_service._detect_emotion_transitions(smoothed)
    assert len(transitions) >= 1
    assert transitions[0]["from_emotion"] == "Neutral"
    assert transitions[0]["to_emotion"] == "Happy"


def test_speech_extraction_and_transcription():
    """Test speech-to-text transcription and transcript emotion analysis."""
    res = speech_service.extract_and_transcribe_audio(b"dummy_bytes", 10.0)
    assert res["has_audio"] is True
    assert len(res["transcript_segments"]) >= 2
    assert "emotion" in res["transcript_segments"][0]
    assert "sentence_index" in res["transcript_segments"][0]
    assert "confidence" in res["transcript_segments"][0]


def test_extended_video_duration_limits():
    """Test that video duration limit is increased to 3600s and 523.3s video is supported."""
    from app.services.video_service import MAX_VIDEO_DURATION_SECONDS, MAX_VIDEO_SIZE_BYTES
    assert MAX_VIDEO_DURATION_SECONDS == 3600
    assert MAX_VIDEO_SIZE_BYTES == 500 * 1024 * 1024
    assert 523.3 <= MAX_VIDEO_DURATION_SECONDS


def test_sentence_splitting_and_sentence_emotions():
    """Test that text is split into distinct sentences and each sentence receives an emotion."""
    text = "I am extremely grateful and excited. However, earlier I was feeling so stressed and anxious."
    sentences = speech_service._split_into_sentences(text)
    assert len(sentences) == 2
    assert "grateful and excited" in sentences[0]
    assert "stressed and anxious" in sentences[1]

    from app.ai.emotion_detector import emotion_detector
    emo1 = emotion_detector.detect(sentences[0])
    emo2 = emotion_detector.detect(sentences[1])
    assert emo1["emotion"] in ["Happy", "Excited", "Hopeful", "Joy"]
    assert emo2["emotion"] in ["Stress", "Anxiety", "Fear", "Sad"]


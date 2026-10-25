"""
MindCare AI — Unit & Integration Tests for Facial Emotion Recognition & Multimodal Fusion
Tests image validation, face detection, 7-class facial emotion classification,
multimodal weighted fusion, confidence threshold warnings, and security constraints.
"""
import io
import cv2
import pytest
import numpy as np
from PIL import Image

from app.services.face_detector_service import face_detector_service
from app.services.facial_emotion_service import facial_emotion_service
from app.services.multimodal_fusion_service import multimodal_fusion_service


def create_synthetic_face_image_bytes(width: int = 200, height: int = 200) -> bytes:
    """Helper function creating a synthetic image with a basic face structure."""
    img = np.zeros((height, width, 3), dtype=np.uint8) + 200  # Light background
    # Draw face oval
    cv2.ellipse(img, (width // 2, height // 2), (width // 3, height // 2 - 10), 0, 0, 360, (180, 150, 120), -1)
    # Draw eyes
    cv2.circle(img, (width // 2 - 25, height // 2 - 20), 8, (50, 50, 50), -1)
    cv2.circle(img, (width // 2 + 25, height // 2 - 20), 8, (50, 50, 50), -1)
    # Draw mouth
    cv2.ellipse(img, (width // 2, height // 2 + 25), (20, 10), 0, 0, 180, (50, 50, 50), 3)

    is_success, buffer = cv2.imencode(".jpg", img)
    return buffer.tobytes() if is_success else b""


def test_image_validation_valid():
    """Test validation with a valid JPEG image."""
    img_bytes = create_synthetic_face_image_bytes()
    val = face_detector_service.validate_image_file(img_bytes, "test_face.jpg", "image/jpeg")
    assert val["valid"] is True
    assert val["width"] > 0


def test_image_validation_oversized():
    """Test validation rejecting files exceeding 10MB limit."""
    huge_bytes = b"0" * (11 * 1024 * 1024)
    val = face_detector_service.validate_image_file(huge_bytes, "huge.jpg", "image/jpeg")
    assert val["valid"] is False
    assert "10MB" in val["error"]


def test_image_validation_invalid_format():
    """Test validation rejecting unsupported file extensions."""
    dummy_bytes = b"0" * 500
    val = face_detector_service.validate_image_file(dummy_bytes, "script.exe", "application/x-msdownload")
    assert val["valid"] is False
    assert "Unsupported file extension" in val["error"]


def test_face_detection_synthetic():
    """Test face detection on synthetic image."""
    img_bytes = create_synthetic_face_image_bytes(300, 300)
    detection = face_detector_service.detect_and_crop_faces(img_bytes)
    assert "faces_detected" in detection
    assert "faces" in detection


def test_facial_emotion_classification():
    """Test facial emotion classification across 7 taxonomy classes."""
    dummy_bgr = np.zeros((100, 100, 3), dtype=np.uint8) + 150
    dummy_gray = np.zeros((100, 100), dtype=np.uint8) + 150

    face_data = {
        "face_id": "face_1",
        "label": "Face 1",
        "cropped_bgr": dummy_bgr,
        "cropped_gray": dummy_gray,
        "bounding_box": {"x": 10, "y": 10, "width": 100, "height": 100},
    }

    result = facial_emotion_service.predict_face_emotion(face_data)
    assert result["predicted_emotion"] in ["Happy", "Sad", "Angry", "Fear", "Surprise", "Disgust", "Neutral"]
    assert "probabilities" in result
    assert len(result["probabilities"]) == 7
    assert "confidence_percentage" in result


def test_multimodal_fusion_agreement():
    """Test multimodal fusion when text and visual signals agree."""
    text_analysis = {"emotion": "Happy", "confidence": 0.85, "sentiment": "positive"}
    image_analysis = {"faces_detected": 1, "primary_face_emotion": "Happy", "primary_confidence": 90.0}

    fusion = multimodal_fusion_service.fuse_modalities(text_analysis, image_analysis)
    assert fusion["multimodal_emotion"] == "Happy"
    assert fusion["agreement"] is True
    assert fusion["confidence_percentage"] == 87.0  # (85*0.6) + (90*0.4) = 51 + 36 = 87.0
    assert "fully agree" in fusion["note"]


def test_multimodal_fusion_disagreement():
    """Test multimodal fusion when text and visual signals disagree."""
    text_analysis = {"emotion": "Sad", "confidence": 0.80, "sentiment": "negative"}
    image_analysis = {"faces_detected": 1, "primary_face_emotion": "Neutral", "primary_confidence": 70.0}

    fusion = multimodal_fusion_service.fuse_modalities(text_analysis, image_analysis)
    assert fusion["agreement"] is False
    assert fusion["multimodal_emotion"] in ["Sad", "Neutral"]
    assert "do not completely agree" in fusion["note"]

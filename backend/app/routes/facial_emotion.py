"""
MindCare AI — Facial Emotion Recognition & Multimodal Fusion Routes
Endpoints for image-based face detection, facial emotion classification,
multimodal fusion with text analysis, and emotion history trends.
"""
from typing import Annotated, Optional, List
from pydantic import BaseModel
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.user import User
from app.models.emotion import EmotionRecord
from app.services.face_detector_service import face_detector_service
from app.services.facial_emotion_service import facial_emotion_service
from app.services.multimodal_fusion_service import multimodal_fusion_service
from app.ai.emotion_detector import emotion_detector
from app.ai.sentiment_analyzer import sentiment_analyzer
from app.utils.security import get_current_active_user
from app.utils.logger import logger

router = APIRouter(prefix="/facial-emotion", tags=["Facial Emotion Recognition & Multimodal AI"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


class FusionConfigUpdateRequest(BaseModel):
    text_weight: Optional[float] = 0.60
    image_weight: Optional[float] = 0.40
    confidence_threshold: Optional[float] = 60.0


@router.post("/analyze")
@router.post("/image", include_in_schema=True)
async def analyze_facial_and_multimodal_emotion(
    current_user: CurrentUser,
    db: DBDep,
    image: UploadFile = File(...),
    text: Optional[str] = Form(None),
):
    """
    Multimodal Facial Emotion Recognition Endpoint:
    1. Validates uploaded image (format, size < 10MB, corruption).
    2. Detects human faces & bounding boxes using computer vision.
    3. Classifies facial expressions across 7 emotions (Happy, Sad, Angry, Fear, Surprise, Disgust, Neutral).
    4. Computes per-face probability distributions & confidence scores.
    5. Fuses visual prediction with text emotion/sentiment analysis (if text supplied).
    6. Returns structured JSON with non-diagnostic mental health guidance.
    """
    # 1. Read file in memory (zero permanent disk storage of raw image)
    file_bytes = await image.read()
    filename = image.filename or "uploaded_image.jpg"
    content_type = image.content_type

    # Validate image file
    val_res = face_detector_service.validate_image_file(file_bytes, filename, content_type)
    if not val_res["valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=val_res["error"]
        )

    # 2. Detect & Crop Faces
    detection_res = face_detector_service.detect_and_crop_faces(file_bytes)
    if not detection_res["success"]:
        return {
            "success": False,
            "faces_detected": 0,
            "error_message": detection_res["message"],
            "image_emotion": None,
            "text_emotion": None,
            "multimodal_result": None,
            "non_diagnostic_statement": "No usable face detected for visual emotion analysis. Please upload an image with a clear face."
        }

    # 3. Analyze Facial Expressions across all detected faces
    facial_analysis = facial_emotion_service.analyze_all_faces(detection_res["faces"])

    # 4. Analyze Text Emotion (if text provided)
    text_analysis = None
    if text and text.strip():
        emo_res = emotion_detector.detect(text)
        sent_res = sentiment_analyzer.analyze(text)
        text_analysis = {
            "text": text.strip(),
            "emotion": emo_res["emotion"],
            "confidence": emo_res["confidence"],
            "sentiment": sent_res["sentiment"],
            "compound": sent_res.get("compound_score", 0.0),
        }

    # 5. Multimodal Fusion
    multimodal_res = multimodal_fusion_service.fuse_modalities(
        text_analysis=text_analysis,
        image_analysis=facial_analysis,
    )

    # 6. Save Record to Database (Storing metadata only; zero raw image stored)
    primary_emo = facial_analysis["primary_face_emotion"]
    primary_conf = facial_analysis["primary_confidence"]
    final_emo = multimodal_res["multimodal_emotion"]
    final_conf = multimodal_res["confidence"]

    record = EmotionRecord(
        user_id=current_user.id,
        emotion=final_emo,
        sentiment=text_analysis["sentiment"] if text_analysis else "neutral",
        stress_score=8.0 if final_emo in ("Angry", "Fear", "Sadness") else 3.0,
        confidence=final_conf,
        source="multimodal" if text_analysis else "image",
        face_count=facial_analysis["faces_detected"],
        visual_emotion=primary_emo,
        visual_confidence=round(primary_conf / 100.0, 3),
        multimodal_emotion=final_emo,
        multimodal_confidence=final_conf,
        agreement=multimodal_res.get("agreement"),
    )
    db.add(record)
    db.commit()

    # 7. Format clean JSON response
    # Format face bounding box results (without raw BGR arrays)
    clean_faces = []
    for f in facial_analysis["face_results"]:
        clean_faces.append({
            "face_id": f["face_id"],
            "label": f["label"],
            "bounding_box": f["bounding_box"],
            "predicted_emotion": f["predicted_emotion"],
            "confidence_percentage": f["confidence_percentage"],
            "probabilities": f["probabilities"],
            "is_low_confidence": f["is_low_confidence"],
            "warning_message": f["warning_message"],
        })

    return {
        "success": True,
        "faces_detected": facial_analysis["faces_detected"],
        "faces": clean_faces,
        "image_emotion": {
            "emotion": primary_emo.lower(),
            "confidence": round(primary_conf / 100.0, 3),
            "confidence_percentage": primary_conf,
            "probabilities": facial_analysis["overall_probabilities"],
            "is_low_confidence": facial_analysis["is_low_confidence"],
            "warning_message": facial_analysis["warning_message"],
        },
        "text_emotion": {
            "emotion": text_analysis["emotion"].lower(),
            "confidence": text_analysis["confidence"],
            "sentiment": text_analysis["sentiment"],
        } if text_analysis else None,
        "multimodal_result": {
            "emotion": final_emo.lower(),
            "confidence": final_conf,
            "confidence_percentage": multimodal_res["confidence_percentage"],
            "confidence_level": multimodal_res["confidence_level"],
            "agreement": multimodal_res["agreement"],
            "note": multimodal_res["note"],
        },
        "non_diagnostic_statement": multimodal_res["non_diagnostic_statement"],
    }


@router.get("/history")
def get_facial_and_multimodal_history(
    current_user: CurrentUser,
    db: DBDep,
    limit: int = Query(30, ge=1, le=100),
):
    """
    Retrieve user's historical image-based and multimodal emotion records for dashboard trends.
    """
    records = (
        db.query(EmotionRecord)
        .filter(EmotionRecord.user_id == current_user.id)
        .order_by(desc(EmotionRecord.recorded_at))
        .limit(limit)
        .all()
    )

    return [
        {
            "id": r.id,
            "source": r.source or "text",
            "emotion": r.emotion,
            "confidence": r.confidence,
            "visual_emotion": r.visual_emotion,
            "visual_confidence": r.visual_confidence,
            "multimodal_emotion": r.multimodal_emotion,
            "multimodal_confidence": r.multimodal_confidence,
            "face_count": r.face_count,
            "agreement": r.agreement,
            "recorded_at": r.recorded_at.isoformat(),
        }
        for r in records
    ]


@router.get("/config")
def get_fusion_and_confidence_config(current_user: CurrentUser):
    """
    Retrieve current backend multimodal fusion weights and confidence thresholds.
    """
    return {
        "text_weight": multimodal_fusion_service.text_weight,
        "image_weight": multimodal_fusion_service.image_weight,
        "confidence_threshold": facial_emotion_service.confidence_threshold,
        "supported_emotions": ["Happy", "Sad", "Angry", "Fear", "Surprise", "Disgust", "Neutral"],
    }


@router.post("/config")
def update_fusion_and_confidence_config(
    current_user: CurrentUser,
    request: FusionConfigUpdateRequest,
):
    """
    Update configurable fusion weights or confidence threshold settings.
    """
    if request.text_weight is not None and request.image_weight is not None:
        multimodal_fusion_service.update_fusion_weights(request.text_weight, request.image_weight)

    if request.confidence_threshold is not None:
        facial_emotion_service.set_confidence_threshold(request.confidence_threshold)

    return {
        "message": "Multimodal fusion configuration updated successfully.",
        "text_weight": multimodal_fusion_service.text_weight,
        "image_weight": multimodal_fusion_service.image_weight,
        "confidence_threshold": facial_emotion_service.confidence_threshold,
    }

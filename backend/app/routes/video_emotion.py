"""
MindCare AI — Video Emotion Analysis Routes
Endpoints for video upload, asynchronous job processing, timeline retrieval,
transcript segments, and privacy deletion.
"""
from typing import Annotated, Optional, List
from pydantic import BaseModel
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.user import User
from app.models.video import VideoAnalysis, VideoEmotionSegment, VideoTranscriptSegment
from app.services.video_service import video_service
from app.services.video_analysis_service import video_analysis_service
from app.services.face_detector_service import face_detector_service
from app.services.facial_emotion_service import facial_emotion_service
from app.services.emotion_service import emotion_service
from app.utils.security import get_current_active_user

router = APIRouter(prefix="/video-emotion", tags=["Video Emotion Analysis"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


@router.post("/analyze")
@router.post("/upload", include_in_schema=True)
async def analyze_video_emotion(
    current_user: CurrentUser,
    db: DBDep,
    video: UploadFile = File(...),
):
    """
    Video Emotion Analysis Endpoint:
    1. Validates uploaded video file (format, size < 500MB, duration < 3600s).
    2. Samples frames and tracks faces across frames (IoU).
    3. Classifies frame-by-frame facial expressions and applies temporal smoothing.
    4. Transcribes audio speech track with timestamps and analyzes transcript NLP emotion for each sentence.
    5. Performs multimodal speech + visual fusion and generates multi-layer timeline and final emotion.
    6. Zero raw video disk retention.
    """
    file_bytes = await video.read()
    filename = video.filename or "uploaded_video.mp4"
    content_type = video.content_type

    # Validate video
    val = video_service.validate_video_file(file_bytes, filename, content_type)
    if not val["valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=val["error"]
        )

    # Create Analysis Job
    job = VideoAnalysis(
        user_id=current_user.id,
        filename=filename,
        status="processing",
        progress=10,
        duration_seconds=val["duration"],
        fps=val["fps"],
        resolution=val["resolution"],
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Process Video Job
    res = video_analysis_service.process_video_job(
        db=db, analysis_id=job.id, file_bytes=file_bytes, filename=filename, content_type=content_type
    )

    if not res["success"]:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=res.get("error", "Video processing failed.")
        )

    db.refresh(job)

    dom_speech = res.get("dominant_speech_emotion", "Neutral")
    dom_facial = res.get("dominant_facial_emotion", "Neutral")
    s_count = res.get("sentence_count", 0)

    return {
        "success": True,
        "analysis_id": job.id,
        "status": job.status,
        "progress": job.progress,
        "duration_seconds": job.duration_seconds,
        "dominant_emotion": job.dominant_emotion.lower(),
        "overall_confidence": job.overall_confidence,
        "faces_tracked_count": job.faces_tracked_count,
        "transitions_count": job.transitions_count,
        "has_audio": job.has_audio,
        "dominant_speech_emotion": dom_speech.lower(),
        "dominant_facial_emotion": dom_facial.lower(),
        "sentence_count": s_count,
        "sentences": res.get("sentences", []),
        "speech_emotion_distribution": res.get("speech_emotion_distribution", {}),
        "non_diagnostic_statement": (
            f"Across {job.duration_seconds}s of video, analysis identified {s_count} spoken sentence(s) "
            f"with dominant speech tone '{dom_speech}' and facial expressions reflecting '{dom_facial}'. "
            f"The synthesized final emotional state is '{job.dominant_emotion.title()}'. "
            "This supportive analysis is for self-reflection and does not constitute a medical diagnosis."
        ),
    }


@router.get("/status/{analysis_id}")
def get_video_analysis_status(analysis_id: str, current_user: CurrentUser, db: DBDep):
    """Get status and progress % for a video analysis job."""
    job = db.query(VideoAnalysis).filter(VideoAnalysis.id == analysis_id, VideoAnalysis.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis job not found.")

    return {
        "analysis_id": job.id,
        "status": job.status,
        "progress": job.progress,
        "dominant_emotion": job.dominant_emotion,
        "error_message": job.error_message,
    }


@router.get("/{analysis_id}")
def get_video_analysis_details(analysis_id: str, current_user: CurrentUser, db: DBDep):
    """Retrieve complete video analysis details and non-diagnostic summary."""
    job = db.query(VideoAnalysis).filter(VideoAnalysis.id == analysis_id, VideoAnalysis.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis job not found.")

    return {
        "analysis_id": job.id,
        "filename": job.filename,
        "status": job.status,
        "duration_seconds": job.duration_seconds,
        "fps": job.fps,
        "resolution": job.resolution,
        "faces_tracked_count": job.faces_tracked_count,
        "dominant_emotion": job.dominant_emotion,
        "overall_confidence": job.overall_confidence,
        "transitions_count": job.transitions_count,
        "has_audio": job.has_audio,
        "created_at": job.created_at.isoformat() if job.created_at else None,
        "completed_at": job.completed_at.isoformat() if job.completed_at else None,
        "non_diagnostic_statement": (
            f"The video contains facial and speech signals that appear consistent with {job.dominant_emotion.lower()}. "
            "Supportive non-diagnostic observation."
        ),
    }


@router.get("/{analysis_id}/timeline")
def get_video_emotion_timeline(analysis_id: str, current_user: CurrentUser, db: DBDep):
    """Retrieve multi-layer timeline (Facial Layer, Speech Layer, Combined Layer)."""
    segments = (
        db.query(VideoEmotionSegment)
        .filter(VideoEmotionSegment.analysis_id == analysis_id)
        .order_by(VideoEmotionSegment.start_time.asc())
        .all()
    )

    return [
        {
            "id": s.id,
            "face_id": s.face_id,
            "start_time": s.start_time,
            "end_time": s.end_time,
            "facial_emotion": s.facial_emotion,
            "facial_confidence": s.facial_confidence,
            "speech_emotion": s.speech_emotion,
            "speech_confidence": s.speech_confidence,
            "combined_emotion": s.combined_emotion,
            "combined_confidence": s.combined_confidence,
            "agreement": s.agreement,
            "probabilities": s.probabilities,
        }
        for s in segments
    ]


@router.get("/{analysis_id}/transcript")
def get_video_transcript(analysis_id: str, current_user: CurrentUser, db: DBDep):
    """Retrieve timestamped speech transcript segments."""
    segments = (
        db.query(VideoTranscriptSegment)
        .filter(VideoTranscriptSegment.analysis_id == analysis_id)
        .order_by(VideoTranscriptSegment.start_time.asc())
        .all()
    )

    return [
        {
            "id": s.id,
            "start_time": s.start_time,
            "end_time": s.end_time,
            "text": s.text,
            "emotion": s.emotion,
            "confidence": s.confidence,
            "sentiment": s.sentiment,
        }
        for s in segments
    ]


@router.delete("/{analysis_id}")
def delete_video_analysis(analysis_id: str, current_user: CurrentUser, db: DBDep):
    """Delete stored video analysis and timeline records for privacy compliance."""
    job = db.query(VideoAnalysis).filter(VideoAnalysis.id == analysis_id, VideoAnalysis.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis job not found.")

    db.delete(job)
    db.commit()

    return {
        "success": True,
        "message": "Video analysis record and timeline data deleted successfully.",
        "analysis_id": analysis_id,
    }


@router.post("/live-frame")
async def analyze_live_video_frame(
    current_user: CurrentUser,
    frame: UploadFile = File(...),
    speech_text: Optional[str] = Form(None),
):
    """
    Real-time Live Video Emotion Detection endpoint:
    - Analyzes incoming live webcam frame in memory with zero disk retention
    - Detects face bounding box and real-time facial emotion probabilities
    - If speech_text is provided, analyzes live sentence emotion & sentiment
    - Performs live multimodal fusion of facial and speech signals
    """
    file_bytes = await frame.read()
    detection_res = face_detector_service.detect_and_crop_faces(file_bytes)

    facial_data = None
    if detection_res.get("success") and detection_res.get("faces_detected", 0) > 0:
        analysis = facial_emotion_service.analyze_all_faces(detection_res["faces"])
        primary = analysis["face_results"][0] if analysis["face_results"] else None
        facial_data = {
            "faces_detected": analysis["faces_detected"],
            "dominant_facial_emotion": analysis["primary_face_emotion"],
            "confidence": analysis["primary_confidence"],
            "bounding_box": primary["bounding_box"] if primary else None,
            "probabilities": analysis["overall_probabilities"],
            "is_low_confidence": analysis["is_low_confidence"],
        }

    speech_data = None
    if speech_text and len(speech_text.strip()) > 1:
        s_res = emotion_service.analyze(speech_text.strip())
        speech_data = {
            "text": speech_text.strip(),
            "emotion": s_res["emotion"],
            "confidence": round(s_res["confidence"] * 100, 1),
            "sentiment": s_res.get("sentiment", "neutral"),
        }

    dominant_emotion = "Neutral"
    dominant_confidence = 50.0
    if facial_data and speech_data:
        if facial_data["confidence"] >= speech_data["confidence"]:
            dominant_emotion = facial_data["dominant_facial_emotion"]
            dominant_confidence = facial_data["confidence"]
        else:
            dominant_emotion = speech_data["emotion"]
            dominant_confidence = speech_data["confidence"]
    elif facial_data:
        dominant_emotion = facial_data["dominant_facial_emotion"]
        dominant_confidence = facial_data["confidence"]
    elif speech_data:
        dominant_emotion = speech_data["emotion"]
        dominant_confidence = speech_data["confidence"]

    return {
        "success": True,
        "face_detected": facial_data is not None,
        "facial": facial_data,
        "speech": speech_data,
        "dominant_emotion": dominant_emotion,
        "overall_confidence": dominant_confidence,
    }


class SaveLiveSessionRequest(BaseModel):
    duration_seconds: float
    dominant_emotion: str
    overall_confidence: float
    transitions_count: int = 0
    has_audio: bool = False
    timeline: List[dict] = []
    transcripts: List[dict] = []


@router.post("/live-session/save")
def save_live_session(
    data: SaveLiveSessionRequest,
    current_user: CurrentUser,
    db: DBDep
):
    """Saves a completed live webcam check-in session into historical records."""
    import uuid
    from datetime import datetime

    job_id = str(uuid.uuid4())
    job = VideoAnalysis(
        id=job_id,
        user_id=current_user.id,
        filename="Live Webcam Emotion Check-in",
        status="completed",
        progress=100,
        duration_seconds=data.duration_seconds,
        fps=15.0,
        resolution="Live Webcam",
        faces_tracked_count=1,
        dominant_emotion=data.dominant_emotion,
        overall_confidence=data.overall_confidence,
        transitions_count=data.transitions_count,
        has_audio=data.has_audio,
        created_at=datetime.utcnow(),
        completed_at=datetime.utcnow(),
    )
    db.add(job)
    db.commit()

    for seg in data.timeline:
        s = VideoEmotionSegment(
            id=str(uuid.uuid4()),
            analysis_id=job_id,
            face_id="face_1",
            start_time=seg.get("start_time", 0.0),
            end_time=seg.get("end_time", 1.0),
            facial_emotion=seg.get("facial_emotion", "Neutral"),
            facial_confidence=seg.get("facial_confidence", 50.0),
            speech_emotion=seg.get("speech_emotion"),
            speech_confidence=seg.get("speech_confidence"),
            combined_emotion=seg.get("combined_emotion", "Neutral"),
            combined_confidence=seg.get("combined_confidence", 50.0),
            probabilities=seg.get("probabilities", {}),
        )
        db.add(s)

    for tr in data.transcripts:
        t = VideoTranscriptSegment(
            id=str(uuid.uuid4()),
            analysis_id=job_id,
            start_time=tr.get("start_time", 0.0),
            end_time=tr.get("end_time", 1.0),
            text=tr.get("text", ""),
            emotion=tr.get("emotion", "Neutral"),
            confidence=tr.get("confidence", 50.0),
            sentiment=tr.get("sentiment", "neutral"),
        )
        db.add(t)

    db.commit()
    return {"success": True, "analysis_id": job_id}


# ── Hardware Camera Direct Bridge (DirectShow / Windows Camera Fix) ─────────
import base64
import threading
import cv2


class SystemCameraManager:
    def __init__(self):
        self.cap = None
        self.lock = threading.Lock()
        self.is_active = False

    def start(self):
        with self.lock:
            if self.cap is None or not self.cap.isOpened():
                try:
                    # CAP_DSHOW solves Windows Media Foundation error -1072873822 on HP TrueVision HD Cameras
                    if hasattr(cv2, 'CAP_DSHOW'):
                        self.cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
                    else:
                        self.cap = cv2.VideoCapture(0)
                except Exception:
                    self.cap = cv2.VideoCapture(0)

                if self.cap and not self.cap.isOpened():
                    self.cap = cv2.VideoCapture(0)

            if self.cap and self.cap.isOpened():
                try:
                    self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
                    self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
                    self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                except Exception:
                    pass
                self.is_active = True
            else:
                self.is_active = False

            return self.is_active

    def stop(self):
        with self.lock:
            self.is_active = False
            if self.cap is not None:
                try:
                    self.cap.release()
                except Exception:
                    pass
                self.cap = None

    def read_frame(self):
        with self.lock:
            if self.cap is None or not self.cap.isOpened():
                return False, None
            return self.cap.read()


system_camera = SystemCameraManager()


@router.post("/system-camera/start")
def start_system_camera():
    """Starts local system hardware camera with DirectShow backend."""
    success = system_camera.start()
    return {
        "success": success,
        "device_name": "HP TrueVision HD Camera / System Hardware Webcam" if success else "Unavailable",
        "message": "Hardware camera active via DirectShow bridge." if success else "Could not open hardware camera."
    }


@router.post("/system-camera/stop")
def stop_system_camera():
    """Stops and releases system hardware camera."""
    system_camera.stop()
    return {"success": True, "message": "Hardware camera released."}


@router.post("/system-camera/frame")
def grab_system_camera_frame(
    speech_text: Optional[str] = Form(None),
):
    """Grabs a frame directly from hardware camera, performs facial emotion AI, and returns telemetry + base64 image."""
    if not system_camera.is_active:
        started = system_camera.start()
        if not started:
            return {"success": False, "error": "Hardware camera not started."}

    ret, frame = system_camera.read_frame()
    if not ret or frame is None:
        return {"success": False, "error": "Could not grab frame from hardware camera."}

    # Encode to JPEG
    encode_ret, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 72])
    if not encode_ret:
        return {"success": False, "error": "Frame encoding failed."}

    file_bytes = buffer.tobytes()
    frame_b64 = "data:image/jpeg;base64," + base64.b64encode(file_bytes).decode("utf-8")

    # Run facial detection
    detection_res = face_detector_service.detect_and_crop_faces(file_bytes)
    facial_data = None
    if detection_res.get("success") and detection_res.get("faces_detected", 0) > 0:
        analysis = facial_emotion_service.analyze_all_faces(detection_res["faces"])
        primary = analysis["face_results"][0] if analysis["face_results"] else None
        facial_data = {
            "faces_detected": analysis["faces_detected"],
            "dominant_facial_emotion": analysis["primary_face_emotion"],
            "confidence": analysis["primary_confidence"],
            "bounding_box": primary["bounding_box"] if primary else None,
            "probabilities": analysis["overall_probabilities"],
            "is_low_confidence": analysis["is_low_confidence"],
        }

    # Run speech emotion analysis if snippet provided
    speech_data = None
    if speech_text and len(speech_text.strip()) > 1:
        s_res = emotion_service.analyze(speech_text.strip())
        speech_data = {
            "text": speech_text.strip(),
            "emotion": s_res["emotion"],
            "confidence": round(s_res["confidence"] * 100, 1),
            "sentiment": s_res.get("sentiment", "neutral"),
        }

    dominant_emotion = "Neutral"
    dominant_confidence = 50.0
    if facial_data and speech_data:
        if facial_data["confidence"] >= speech_data["confidence"]:
            dominant_emotion = facial_data["dominant_facial_emotion"]
            dominant_confidence = facial_data["confidence"]
        else:
            dominant_emotion = speech_data["emotion"]
            dominant_confidence = speech_data["confidence"]
    elif facial_data:
        dominant_emotion = facial_data["dominant_facial_emotion"]
        dominant_confidence = facial_data["confidence"]
    elif speech_data:
        dominant_emotion = speech_data["emotion"]
        dominant_confidence = speech_data["confidence"]

    return {
        "success": True,
        "frame_data": frame_b64,
        "face_detected": facial_data is not None,
        "facial": facial_data,
        "speech": speech_data,
        "dominant_emotion": dominant_emotion,
        "overall_confidence": dominant_confidence,
    }


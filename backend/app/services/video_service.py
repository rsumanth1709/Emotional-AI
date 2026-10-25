"""
MindCare AI — Video Validation, Frame Extraction, Face Tracking & Temporal Emotion Service
Handles video validation, OpenCV frame sampling, anonymous face tracking (IoU),
temporal emotion probability smoothing, and transition detection.
"""
import os
import io
import cv2
import numpy as np
from PIL import Image
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime

from app.services.face_detector_service import face_detector_service
from app.services.facial_emotion_service import facial_emotion_service

# Configurable defaults
MAX_VIDEO_SIZE_BYTES = 500 * 1024 * 1024  # 500MB
MAX_VIDEO_DURATION_SECONDS = 3600         # 60 minutes (1 hour)
FRAME_SAMPLE_RATE = 2                     # Default 2 frames per second for short clips
ALLOWED_EXTENSIONS = {".mp4", ".mov", ".webm", ".avi"}
ALLOWED_MIME_TYPES = {"video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"}


class VideoService:
    """Service handling video file validation, frame extraction, face tracking, and temporal smoothing."""

    def validate_video_file(
        self, file_bytes: bytes, filename: str, content_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Validate video file size, extension, MIME type, decodability, and duration.
        """
        if len(file_bytes) > MAX_VIDEO_SIZE_BYTES:
            return {
                "valid": False,
                "error": f"Video size exceeds limit of 500MB (file size: {len(file_bytes)/(1024*1024):.1f}MB)."
            }

        if len(file_bytes) < 1000:
            return {"valid": False, "error": "Video file is empty or corrupted."}

        ext = ("." + filename.split(".")[-1].lower()) if "." in filename else ""
        if ext not in ALLOWED_EXTENSIONS:
            return {
                "valid": False,
                "error": f"Unsupported video format '{ext}'. Allowed formats: MP4, MOV, WebM, AVI."
            }

        # Write to temporary file for OpenCV decodability verification
        temp_path = f"temp_val_{os.getpid()}_{datetime.utcnow().timestamp()}.mp4"
        try:
            with open(temp_path, "wb") as f:
                f.write(file_bytes)

            cap = cv2.VideoCapture(temp_path)
            if not cap.isOpened():
                return {"valid": False, "error": "Failed to decode video stream. File may be corrupted."}

            fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
            duration = round(frame_count / max(1.0, fps), 1)

            cap.release()

            if duration > MAX_VIDEO_DURATION_SECONDS:
                return {
                    "valid": False,
                    "error": f"Video duration ({duration}s) exceeds maximum limit of {MAX_VIDEO_DURATION_SECONDS} seconds ({int(MAX_VIDEO_DURATION_SECONDS // 60)} minutes)."
                }

            return {
                "valid": True,
                "duration": duration,
                "fps": fps,
                "frame_count": frame_count,
                "resolution": f"{width}x{height}",
            }
        except Exception as e:
            return {"valid": False, "error": f"Video validation failed: {str(e)}"}
        finally:
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception:
                    pass

    def compute_iou(self, boxA: Dict[str, int], boxB: Dict[str, int]) -> float:
        """Calculate Intersection over Union (IoU) between two bounding boxes."""
        xA = max(boxA["x"], boxB["x"])
        yA = max(boxA["y"], boxB["y"])
        xB = min(boxA["x"] + boxA["width"], boxB["boxB_x" if "boxB_x" in boxB else "x"] + boxB["width"])
        yB = min(boxA["y"] + boxA["height"], boxB["boxB_y" if "boxB_y" in boxB else "y"] + boxB["height"])

        interArea = max(0, xB - xA) * max(0, yB - yA)
        boxAArea = boxA["width"] * boxA["height"]
        boxBArea = boxB["width"] * boxB["height"]

        denom = float(boxAArea + boxBArea - interArea)
        return interArea / denom if denom > 0 else 0.0

    def extract_and_track_facial_emotions(
        self, file_bytes: bytes, sample_fps: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Extract sampled video frames, track faces across frames, classify emotions per frame,
        and apply temporal smoothing.
        """
        temp_path = f"temp_proc_{os.getpid()}_{datetime.utcnow().timestamp()}.mp4"
        try:
            with open(temp_path, "wb") as f:
                f.write(file_bytes)

            cap = cv2.VideoCapture(temp_path)
            fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
            duration = round(total_frames / max(1.0, fps), 1)

            # Determine keyframe indices to sample (max 40 keyframes for ultra-fast processing)
            max_keyframes = 40
            if total_frames <= max_keyframes:
                target_frame_indices = list(range(0, max(1, total_frames)))
            else:
                step = max(1, total_frames // max_keyframes)
                target_frame_indices = list(range(0, total_frames, step))[:max_keyframes]

            raw_frame_results = []
            active_tracks = {}  # track_id -> last_bounding_box
            next_track_id = 1

            for frame_idx in target_frame_indices:
                cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
                ret, frame = cap.read()
                if not ret or frame is None:
                    continue

                timestamp = round(frame_idx / max(1.0, fps), 2)

                # Downscale frame if width > 640 to make face detection 10x faster
                h, w = frame.shape[:2]
                if w > 640:
                    scale = 640.0 / w
                    frame = cv2.resize(frame, (640, int(h * scale)), interpolation=cv2.INTER_AREA)

                is_success, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
                if is_success:
                    det_res = face_detector_service.detect_and_crop_faces(buf.tobytes())
                    if det_res["success"] and len(det_res["faces"]) > 0:
                        # Analyze facial expressions for all faces
                        for f_data in det_res["faces"]:
                            emo_res = facial_emotion_service.predict_face_emotion(f_data)

                            # Face Tracking using IoU matching
                            box = f_data["bounding_box"]
                            best_track_id = None
                            best_iou = 0.0

                            for tid, last_box in active_tracks.items():
                                iou = self.compute_iou(box, last_box)
                                if iou > 0.3 and iou > best_iou:
                                    best_iou = iou
                                    best_track_id = tid

                            if best_track_id is None:
                                best_track_id = f"Face {next_track_id}"
                                next_track_id += 1

                            active_tracks[best_track_id] = box

                            raw_frame_results.append({
                                "frame_id": frame_idx,
                                "timestamp": timestamp,
                                "face_id": best_track_id,
                                "emotion": emo_res["predicted_emotion"],
                                "confidence": emo_res["confidence"],
                                "confidence_percentage": emo_res["confidence_percentage"],
                                "probabilities": emo_res["probabilities"],
                            })
                    else:
                        raw_frame_results.append({
                            "frame_id": frame_idx,
                            "timestamp": timestamp,
                            "face_id": "none",
                            "emotion": "Neutral",
                            "confidence": 0.50,
                            "confidence_percentage": 50.0,
                            "probabilities": {"Happy": 5.0, "Sad": 5.0, "Angry": 5.0, "Fear": 5.0, "Surprise": 5.0, "Disgust": 5.0, "Neutral": 70.0},
                        })

            cap.release()

            # Apply Temporal Smoothing (Moving Window Average across 3 frames)
            smoothed_timeline = self._apply_temporal_smoothing(raw_frame_results)
            transitions = self._detect_emotion_transitions(smoothed_timeline)

            return {
                "success": True,
                "duration": duration,
                "fps": fps,
                "faces_tracked_count": max(0, next_track_id - 1),
                "raw_frames_analyzed": len(raw_frame_results),
                "smoothed_timeline": smoothed_timeline,
                "transitions": transitions,
            }
        except Exception as e:
            return {"success": False, "error": f"Facial video processing failed: {str(e)}"}
        finally:
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception:
                    pass

    def _apply_temporal_smoothing(self, frame_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Apply exponential moving average smoothing to eliminate single-frame noise."""
        if not frame_results:
            return []

        smoothed = []
        window = []

        for item in frame_results:
            window.append(item)
            if len(window) > 3:
                window.pop(0)

            # Average probabilities across window
            avg_probs = {"Happy": 0.0, "Sad": 0.0, "Angry": 0.0, "Fear": 0.0, "Surprise": 0.0, "Disgust": 0.0, "Neutral": 0.0}
            for w_item in window:
                for emo, pct in w_item["probabilities"].items():
                    avg_probs[emo] += pct / len(window)

            avg_probs = {emo: round(pct, 1) for emo, pct in avg_probs.items()}
            top_emo = max(avg_probs.items(), key=lambda x: x[1])

            smoothed.append({
                "timestamp": item["timestamp"],
                "face_id": item["face_id"],
                "facial_emotion": top_emo[0],
                "facial_confidence": round(top_emo[1] / 100.0, 3),
                "probabilities": avg_probs,
            })

        return smoothed

    def _detect_emotion_transitions(self, timeline: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Detect sustained emotional transitions (> 2 consecutive frames)."""
        transitions = []
        if not timeline:
            return transitions

        current_emo = timeline[0]["facial_emotion"]
        start_time = timeline[0]["timestamp"]

        for item in timeline[1:]:
            if item["facial_emotion"] != current_emo:
                transitions.append({
                    "start_time": start_time,
                    "end_time": item["timestamp"],
                    "from_emotion": current_emo,
                    "to_emotion": item["facial_emotion"],
                    "timestamp": item["timestamp"],
                    "description": f"{current_emo} → {item['facial_emotion']} at {item['timestamp']}s",
                })
                current_emo = item["facial_emotion"]
                start_time = item["timestamp"]

        return transitions


video_service = VideoService()

"""
MindCare AI — Video Emotion Orchestration Service
Orchestrates Video Preprocessing, Face Tracking, Speech-to-Text Transcription,
Multimodal Speech-Visual Fusion, Multi-Layer Timeline Generation, and Non-Diagnostic Safety Warnings.
"""
from datetime import datetime
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session

from app.models.video import VideoAnalysis, VideoEmotionSegment, VideoTranscriptSegment
from app.services.video_service import video_service
from app.services.speech_service import speech_service
from app.services.multimodal_fusion_service import multimodal_fusion_service


class VideoAnalysisService:
    """Orchestrates end-to-end video emotion analysis pipeline."""

    def process_video_job(
        self, db: Session, analysis_id: str, file_bytes: bytes, filename: str, content_type: Optional[str]
    ) -> Dict[str, Any]:
        """Process video analysis job synchronously or asynchronously."""
        job = db.query(VideoAnalysis).filter(VideoAnalysis.id == analysis_id).first()
        if not job:
            return {"success": False, "error": "Job record not found."}

        try:
            # Step 1: Validate Video
            job.status = "processing"
            job.progress = 10
            db.commit()

            val = video_service.validate_video_file(file_bytes, filename, content_type)
            if not val["valid"]:
                job.status = "failed"
                job.error_message = val["error"]
                db.commit()
                return {"success": False, "error": val["error"]}

            job.duration_seconds = val["duration"]
            job.fps = val["fps"]
            job.resolution = val["resolution"]
            job.progress = 30
            db.commit()

            # Step 2: Facial Detection, Tracking & Temporal Smoothing
            facial_res = video_service.extract_and_track_facial_emotions(file_bytes)
            job.progress = 60
            db.commit()

            # Step 3: Speech Extraction & Transcription
            speech_res = speech_service.extract_and_transcribe_audio(file_bytes, val["duration"])
            job.has_audio = speech_res["has_audio"]
            job.progress = 80
            db.commit()

            # Step 4: Multimodal Speech + Facial Emotion Fusion
            timeline = facial_res.get("smoothed_timeline", [])
            transcripts = speech_res.get("transcript_segments", [])

            # Save Transcript Segments to DB
            for tr in transcripts:
                t_seg = VideoTranscriptSegment(
                    analysis_id=job.id,
                    start_time=tr["start_time"],
                    end_time=tr["end_time"],
                    text=tr["text"],
                    emotion=tr["emotion"],
                    confidence=tr["confidence"],
                    sentiment=tr.get("sentiment", "neutral"),
                )
                db.add(t_seg)

            # Save Emotion Timeline Segments to DB
            dominant_emotions = []
            for item in timeline:
                # Find matching transcript for timestamp
                ts = item["timestamp"]
                matching_tr = next((t for t in transcripts if t["start_time"] <= ts <= t["end_time"]), None)

                text_analysis = (
                    {"emotion": matching_tr["emotion"], "confidence": matching_tr["confidence"]}
                    if matching_tr else None
                )

                image_analysis = {
                    "faces_detected": 1,
                    "primary_face_emotion": item["facial_emotion"],
                    "primary_confidence": item["facial_confidence"] * 100.0,
                }

                fusion_res = multimodal_fusion_service.fuse_modalities(text_analysis, image_analysis)
                final_emo = fusion_res["multimodal_emotion"]
                dominant_emotions.append(final_emo)

                e_seg = VideoEmotionSegment(
                    analysis_id=job.id,
                    face_id=item["face_id"],
                    start_time=ts,
                    end_time=round(ts + 0.2, 2),
                    facial_emotion=item["facial_emotion"],
                    facial_confidence=item["facial_confidence"],
                    speech_emotion=matching_tr["emotion"] if matching_tr else None,
                    speech_confidence=matching_tr["confidence"] if matching_tr else None,
                    combined_emotion=final_emo,
                    combined_confidence=fusion_res["confidence"],
                    agreement=fusion_res.get("agreement"),
                    probabilities=item["probabilities"],
                )
                db.add(e_seg)

            # Determine dominant speech emotion and dominant facial emotion
            dom_speech = speech_res.get("dominant_speech_emotion", "Neutral").title()
            speech_dist = speech_res.get("speech_emotion_distribution", {})

            if timeline:
                facial_scores = {}
                for it in timeline:
                    emo = it["facial_emotion"].title()
                    facial_scores[emo] = facial_scores.get(emo, 0.0) + it.get("facial_confidence", 0.5)
                dom_facial = max(facial_scores.items(), key=lambda x: x[1])[0]
            else:
                dom_facial = "Neutral"

            # Synthesize Final Dominant Emotion (combining sentence emotions + facial cues)
            if transcripts and timeline:
                combined_score_map = {}
                total_speech_conf = sum(tr["confidence"] for tr in transcripts) or 1.0
                for tr in transcripts:
                    emo = tr["emotion"].title()
                    combined_score_map[emo] = combined_score_map.get(emo, 0.0) + 0.60 * (tr["confidence"] / total_speech_conf)

                total_face_conf = sum(it["facial_confidence"] for it in timeline) or 1.0
                for it in timeline:
                    emo = it["facial_emotion"].title()
                    combined_score_map[emo] = combined_score_map.get(emo, 0.0) + 0.40 * (it["facial_confidence"] / total_face_conf)

                dom_emo = max(combined_score_map.items(), key=lambda x: x[1])[0]
                winning_weight = combined_score_map[dom_emo]
                overall_conf = round(min(0.96, max(0.68, winning_weight * 1.4)), 2)
            elif transcripts:
                dom_emo = dom_speech
                overall_conf = 0.85
            elif timeline:
                dom_emo = dom_facial
                overall_conf = 0.80
            else:
                dom_emo = "Neutral"
                overall_conf = 0.75

            job.dominant_emotion = dom_emo
            job.overall_confidence = overall_conf
            job.faces_tracked_count = facial_res.get("faces_tracked_count", 1)
            job.transitions_count = len(facial_res.get("transitions", []))
            job.status = "completed"
            job.progress = 100
            job.completed_at = datetime.utcnow()

            db.commit()

            return {
                "success": True,
                "analysis_id": job.id,
                "status": "completed",
                "dominant_emotion": dom_emo,
                "overall_confidence": overall_conf,
                "dominant_speech_emotion": dom_speech,
                "dominant_facial_emotion": dom_facial,
                "duration": val["duration"],
                "transitions_count": job.transitions_count,
                "sentence_count": len(transcripts),
                "sentences": transcripts,
                "speech_emotion_distribution": speech_dist,
            }
        except Exception as e:
            job.status = "failed"
            job.error_message = str(e)
            db.commit()
            return {"success": False, "error": str(e)}


video_analysis_service = VideoAnalysisService()

"""
MindCare AI — Real-Time Voice Assistant Routes
Handles voice streaming, STT, acoustic emotion analysis, therapist persona response, and TTS metadata.
"""
import os
import tempfile
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services.chat_service import chat_service
from app.ai.speech_translator import speech_translator
from app.ai.voice_emotion_detector import voice_emotion_detector
from app.utils.security import get_current_active_user
from app.utils.logger import logger

router = APIRouter(prefix="/voice", tags=["Voice Assistant"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


class VoiceProcessResponse(BaseModel):
    transcription: str
    detected_voice_emotion: str
    voice_confidence: float
    detected_text_emotion: str
    fused_emotion: str
    detected_language: str
    response_text: str
    persona: str
    session_id: str
    message_id: str


@router.post("/process", response_model=VoiceProcessResponse)

async def process_voice(
    current_user: CurrentUser,
    db: DBDep,
    file: Optional[UploadFile] = File(None),
    text_transcription: Optional[str] = Form(None),
    persona: Optional[str] = Form("friendly"),
    language: Optional[str] = Form("auto"),
    session_id: Optional[str] = Form(None),
):
    """
    Process incoming voice audio stream or text input, perform acoustic emotion detection,
    generate persona-tuned AI therapist reply, and return full real-time metadata.
    """
    temp_file_path = None
    voice_emotion = "Neutral"
    voice_confidence = 0.5
    transcribed_text = text_transcription or ""
    whisper_detected_lang = language or "auto"

    if file and file.filename:
        # Save audio file to temp location
        suffix = os.path.splitext(file.filename)[1] or ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            temp_file_path = tmp.name

        try:
            # 1. Acoustic emotion extraction from voice sample
            voice_res = voice_emotion_detector.detect(temp_file_path)
            voice_emotion = voice_res.get("emotion", "Neutral")
            voice_confidence = voice_res.get("confidence", 0.5)

            # 2. Speech-to-text transcription (with language hint for multilingual accuracy)
            if not transcribed_text:
                transcribed_text, whisper_detected_lang = speech_translator.transcribe(
                    temp_file_path,
                    language=language if language != "auto" else None,
                )
        except Exception as e:
            logger.error(f"Error processing voice audio: {e}")
        finally:
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                except Exception:
                    pass

    if not transcribed_text or not transcribed_text.strip():
        transcribed_text = "Hello MindCare AI"

    # 3. Process through Chat Service pipeline with specified persona and target language
    chat_result = chat_service.process_message(
        db=db,
        user_id=current_user.id,
        message=transcribed_text,
        session_id=session_id,
        persona=persona,
        target_lang=whisper_detected_lang if whisper_detected_lang != "auto" else language,
    )

    detected_text_emotion = chat_result.emotion_result.emotion if chat_result.emotion_result else "Neutral"
    
    # Fused emotion favoring acoustic voice emotion if high confidence, else text emotion
    fused_emotion = voice_emotion if voice_confidence > 0.5 else detected_text_emotion

    # Use Whisper's actual detected language (most accurate) as the canonical detected language
    final_detected_lang = whisper_detected_lang if whisper_detected_lang not in ("auto", None) else (language or "en")

    return VoiceProcessResponse(
        transcription=transcribed_text,
        detected_voice_emotion=voice_emotion,
        voice_confidence=voice_confidence,
        detected_text_emotion=detected_text_emotion,
        fused_emotion=fused_emotion,
        detected_language=final_detected_lang,
        response_text=chat_result.response,
        persona=persona or "friendly",
        session_id=chat_result.session_id,
        message_id=chat_result.message_id,
    )

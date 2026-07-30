"""
MindCare AI — Chat Routes
POST /chat, GET /chat/sessions, GET /chat/sessions/{session_id}, DELETE /chat/sessions/{session_id}
"""
import uuid
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, Query, Form, File, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.chat import (
    ChatRequest, ChatResponse, ChatHistoryItem, SessionSummary,
    JournalCreate, JournalResponse, BreathingSessionCreate, BreathingSessionResponse,
)
from app.services.chat_service import chat_service
from app.utils.security import get_current_active_user

router = APIRouter(prefix="/chat", tags=["Chat"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


@router.post("", response_model=ChatResponse)
def send_message(request: ChatRequest, current_user: CurrentUser, db: DBDep):
    """
    Main chat endpoint. Processes a user message through the full AI pipeline
    and returns an empathetic response with emotion metadata.
    """
    return chat_service.process_message(
        db=db,
        user_id=current_user.id,
        message=request.message,
        session_id=request.session_id,
        persona=request.persona,
    )


@router.get("/personas")
def get_therapist_personas(current_user: CurrentUser):
    """Retrieve all available AI therapist support personas."""
    from app.ai.personas import PERSONAS
    return PERSONAS


@router.get("/sessions", response_model=List[SessionSummary])
def list_sessions(current_user: CurrentUser, db: DBDep):
    """List all chat sessions for the authenticated user."""
    return chat_service.get_all_sessions(db, current_user.id)


@router.get("/sessions/{session_id}", response_model=List[ChatHistoryItem])
def get_session(session_id: str, current_user: CurrentUser, db: DBDep):
    """Get all messages in a specific chat session."""
    messages = chat_service.get_session_messages(db, current_user.id, session_id)
    return [ChatHistoryItem.model_validate(m) for m in messages]


@router.delete("/sessions/{session_id}")
def delete_session(session_id: str, current_user: CurrentUser, db: DBDep):
    """Delete a chat session and all its messages."""
    deleted = chat_service.delete_session(db, current_user.id, session_id)
    if not deleted:
        return {"message": "Session not found or already deleted."}
    return {"message": "Session deleted successfully."}


@router.post("/multimodal", response_model=ChatResponse)
def send_multimodal_message(
    db: DBDep,
    current_user: CurrentUser,
    message: Optional[str] = Form(None),
    session_id: Optional[str] = Form(None),
    audio: Optional[UploadFile] = File(None),
    image: Optional[UploadFile] = File(None),
):
    """
    Multimodal chat endpoint. Accepts optional message text, voice recording, 
    and webcam snapshot, performing emotion analysis on all inputs before 
    generating the assistant response.
    """
    import tempfile
    import shutil
    import os

    audio_path = None
    if audio:
        suffix = "." + audio.filename.split(".")[-1] if audio.filename and "." in audio.filename else ".wav"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(audio.file, tmp)
            audio_path = tmp.name

    image_path = None
    if image:
        suffix = "." + image.filename.split(".")[-1] if image.filename and "." in image.filename else ".jpg"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(image.file, tmp)
            image_path = tmp.name

    try:
        return chat_service.process_multimodal_message(
            db=db,
            user_id=current_user.id,
            message=message,
            session_id=session_id,
            audio_path=audio_path,
            image_path=image_path,
        )
    finally:
        if audio_path and os.path.exists(audio_path):
            os.unlink(audio_path)
        if image_path and os.path.exists(image_path):
            os.unlink(image_path)

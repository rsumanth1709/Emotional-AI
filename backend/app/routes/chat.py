"""
MindCare AI — Chat Routes
POST /chat, GET /chat/sessions, GET /chat/sessions/{session_id}, DELETE /chat/sessions/{session_id}
"""
import uuid
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Form, File, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.chat import Chat
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
    """Get all messages in a specific chat session with strict resource ownership."""
    session_exists = (
        db.query(Chat)
        .filter(Chat.user_id == current_user.id, Chat.session_id == session_id)
        .first()
    )
    if not session_exists:
        raise HTTPException(status_code=404, detail="Chat session not found")
    messages = chat_service.get_session_messages(db, current_user.id, session_id)
    return [ChatHistoryItem.model_validate(m) for m in messages]


@router.delete("/sessions/{session_id}")
def delete_session(session_id: str, current_user: CurrentUser, db: DBDep):
    """Delete a chat session and all its messages with strict resource ownership."""
    session_exists = (
        db.query(Chat)
        .filter(Chat.user_id == current_user.id, Chat.session_id == session_id)
        .first()
    )
    if not session_exists:
        raise HTTPException(status_code=404, detail="Chat session not found")
    chat_service.delete_session(db, current_user.id, session_id)
    return {"message": "Session deleted successfully."}


@router.post("/multimodal", response_model=ChatResponse)
def send_multimodal_message(
    db: DBDep,
    current_user: CurrentUser,
    message: Optional[str] = Form(None),
    session_id: Optional[str] = Form(None),
    persona: Optional[str] = Form("friendly"),
    audio: Optional[UploadFile] = File(None),
    image: Optional[UploadFile] = File(None),
    file: Optional[UploadFile] = File(None),
):
    """
    Multimodal chat endpoint. Accepts optional message text, voice recording, 
    webcam snapshot, and any uploaded file (PDF, documents, spreadsheets, images, code, audio, etc.),
    performing deep content extraction and emotion analysis before generating the assistant response.
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

    file_path = None
    file_name = None
    target_upload = file or image
    if file:
        file_name = file.filename or "uploaded_file"
        suffix = "." + file_name.split(".")[-1] if "." in file_name else ".bin"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            file_path = tmp.name
    elif image and not (image.filename or "").lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
        # If passed as 'image' but is actually another file format
        file_name = image.filename or "uploaded_file"
        file_path = image_path

    try:
        return chat_service.process_multimodal_message(
            db=db,
            user_id=current_user.id,
            message=message,
            session_id=session_id,
            audio_path=audio_path,
            image_path=image_path,
            file_path=file_path,
            original_filename=file_name,
            persona=persona,
        )
    finally:
        if audio_path and os.path.exists(audio_path):
            try:
                os.unlink(audio_path)
            except Exception:
                pass
        if image_path and os.path.exists(image_path) and image_path != file_path:
            try:
                os.unlink(image_path)
            except Exception:
                pass
        if file_path and os.path.exists(file_path):
            try:
                os.unlink(file_path)
            except Exception:
                pass

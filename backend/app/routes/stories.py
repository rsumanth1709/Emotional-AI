"""
MindCare AI — Dedicated AI Emotional Storytelling Engine Routes
Endpoints for generating uplifting stories, interactive choice processing, chapter continuations,
alternative endings, story history, favorites, and user feedback.
"""
from typing import Annotated, Optional, Dict, Any, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.user import User
from app.models.story import StoryRecord, StorySession, StoryFeedback
from app.services.story_generator import story_generator_service
from app.utils.security import get_current_active_user

router = APIRouter(prefix="/stories", tags=["AI Emotional Storytelling Engine"])

DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


class StoryGenerateRequest(BaseModel):
    theme: Optional[str] = "hope"
    genre: Optional[str] = "realistic"
    length: Optional[str] = "short"
    is_interactive: Optional[bool] = False
    use_emotion: Optional[bool] = True
    emotion: Optional[str] = "neutral"
    confidence: Optional[float] = 0.75
    user_goal: Optional[str] = None


class InteractiveChoiceRequest(BaseModel):
    choice_index: int = Field(0, ge=0)
    choice_text: str


class StoryFeedbackRequest(BaseModel):
    rating: str = Field("helpful", description="helpful, liked, somewhat, not_helpful")
    theme_feedback: Optional[str] = None
    comments: Optional[str] = None


@router.post("/generate")
@router.post("", include_in_schema=True)
def generate_story_endpoint(
    data: StoryGenerateRequest, current_user: CurrentUser, db: DBDep
):
    """
    AI Emotional Storytelling Engine Endpoint:
    Generates personalized, safe, uplifting stories across 13 story types,
    multiple genres, configurable lengths, and optional interactive choice modes.
    """
    emo = data.emotion if data.use_emotion else "neutral"
    conf = data.confidence if data.use_emotion else 0.75

    res = story_generator_service.generate_story(
        db=db,
        user_id=current_user.id,
        theme=data.theme,
        genre=data.genre or "realistic",
        length=data.length or "short",
        is_interactive=data.is_interactive or False,
        emotion=emo,
        confidence=conf,
        user_goal=data.user_goal,
    )
    return res


@router.post("/{story_id}/interactive-choice")
def process_interactive_choice_endpoint(
    story_id: str, data: InteractiveChoiceRequest, current_user: CurrentUser, db: DBDep
):
    """Submit an interactive choice and advance story chapter."""
    try:
        return story_generator_service.process_interactive_choice(
            db=db,
            user_id=current_user.id,
            story_id=story_id,
            choice_index=data.choice_index,
            choice_text=data.choice_text,
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))


@router.post("/{story_id}/continue")
def continue_story_endpoint(story_id: str, current_user: CurrentUser, db: DBDep):
    """Continue story to the next chapter."""
    story = db.query(StoryRecord).filter(StoryRecord.id == story_id, StoryRecord.user_id == current_user.id).first()
    if not story:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found.")

    next_content = (
        f"\n\n--- Continued Chapter ---\n\n"
        "As time passed, the insights gained began to take root. "
        "Each small decision reinforced the character's sense of confidence and direction."
    )
    story.content += next_content
    db.commit()

    return {"success": True, "story_id": story.id, "content": story.content}


@router.post("/{story_id}/ending")
def generate_alternative_ending_endpoint(
    story_id: str, style: Optional[str] = "hopeful", current_user: CurrentUser = None, db: DBDep = None
):
    """Generate an alternative ending for the story."""
    story = db.query(StoryRecord).filter(StoryRecord.id == story_id, StoryRecord.user_id == current_user.id).first()
    if not story:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found.")

    alt_ending = (
        f"\n\n--- Alternative {style.capitalize()} Ending ---\n\n"
        "Looking back at the journey, the character realized that every step had contributed to their growth. "
        "With a quiet smile, they welcomed tomorrow with hope."
    )
    story.content += alt_ending
    db.commit()

    return {"success": True, "story_id": story.id, "content": story.content}


@router.get("/daily")
def get_daily_story_endpoint(current_user: CurrentUser, db: DBDep):
    """Retrieve optional Daily Story check-in card."""
    return story_generator_service.generate_story(
        db=db, user_id=current_user.id, theme="hope", genre="realistic", length="short", is_interactive=False
    )


@router.get("/history")
def get_story_history_endpoint(
    current_user: CurrentUser,
    db: DBDep,
    favorites_only: bool = Query(False),
    limit: int = Query(30, ge=1, le=100),
):
    """Retrieve user's story history and saved favorites."""
    query = db.query(StoryRecord).filter(StoryRecord.user_id == current_user.id)
    if favorites_only:
        query = query.filter(StoryRecord.is_favorite == True)

    records = query.order_by(desc(StoryRecord.created_at)).limit(limit).all()

    return [
        {
            "id": r.id,
            "title": r.title,
            "genre": r.genre,
            "theme": r.theme,
            "length": r.length,
            "content": r.content,
            "reflection_prompt": r.reflection_prompt,
            "is_interactive": r.is_interactive,
            "is_favorite": r.is_favorite,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in records
    ]


@router.post("/{story_id}/favorite")
def toggle_story_favorite(story_id: str, current_user: CurrentUser, db: DBDep):
    """Toggle story favorite status."""
    story = db.query(StoryRecord).filter(StoryRecord.id == story_id, StoryRecord.user_id == current_user.id).first()
    if not story:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found.")

    story.is_favorite = not story.is_favorite
    db.commit()
    return {"success": True, "story_id": story.id, "is_favorite": story.is_favorite}


@router.post("/{story_id}/feedback")
def submit_story_feedback(
    story_id: str, data: StoryFeedbackRequest, current_user: CurrentUser, db: DBDep
):
    """Submit user feedback for a story."""
    story = db.query(StoryRecord).filter(StoryRecord.id == story_id, StoryRecord.user_id == current_user.id).first()
    if not story:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found.")

    fb = StoryFeedback(
        story_id=story.id,
        user_id=current_user.id,
        rating=data.rating,
        theme_feedback=data.theme_feedback,
        comments=data.comments,
    )
    db.add(fb)
    db.commit()

    return {"success": True, "message": "Feedback recorded successfully."}


@router.delete("/{story_id}")
def delete_story_endpoint(story_id: str, current_user: CurrentUser, db: DBDep):
    """Delete a stored story record for privacy compliance."""
    story = db.query(StoryRecord).filter(StoryRecord.id == story_id, StoryRecord.user_id == current_user.id).first()
    if not story:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found.")

    db.delete(story)
    db.commit()
    return {"success": True, "message": "Story deleted successfully."}

from typing import Annotated, List, Dict
from fastapi import APIRouter, Depends, HTTPException
from app.services.memory_service import memory_service
from app.utils.security import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/memory", tags=["Memory"])
CurrentUser = Annotated[User, Depends(get_current_active_user)]

@router.get("")
def get_memories(current_user: CurrentUser) -> List[Dict]:
    """Get all memories for the authenticated user."""
    memories = memory_service.get_all_memories(current_user.id)
    return memories

@router.delete("")
def delete_all_memories(current_user: CurrentUser):
    """Clear all memories for the authenticated user."""
    success = memory_service.delete_memory(current_user.id)
    if success:
        return {"message": "All memories cleared successfully."}
    raise HTTPException(status_code=500, detail="Failed to clear memories.")

@router.delete("/{memory_id}")
def delete_memory(memory_id: str, current_user: CurrentUser):
    """Delete a specific memory."""
    success = memory_service.delete_memory(current_user.id, memory_id)
    if success:
        return {"message": "Memory deleted successfully."}
    raise HTTPException(status_code=500, detail="Failed to delete memory.")

"""
MindCare AI — Auth Routes
Handles /auth/* endpoints: signup, login, profile management.
"""
from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.auth import Token, UserCreate, UserLogin, UserResponse, UserUpdate
from app.services.auth_service import auth_service
from app.utils.security import create_access_token, get_current_active_user
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Convenience type aliases
DBDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
def signup(data: UserCreate, db: DBDep):
    """Register a new user and return a JWT token."""
    user = auth_service.create_user(db, data)
    token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return Token(access_token=token, token_type="bearer", user=UserResponse.model_validate(user))


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: DBDep):
    """Authenticate and return a JWT token."""
    user = auth_service.authenticate_user(db, data.email, data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")

    token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return Token(access_token=token, token_type="bearer", user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
def get_me(current_user: CurrentUser):
    """Return the authenticated user's profile."""
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
def update_me(data: UserUpdate, current_user: CurrentUser, db: DBDep):
    """Update the authenticated user's profile."""
    updated = auth_service.update_user(db, current_user.id, data)
    return UserResponse.model_validate(updated)


@router.post("/logout")
def logout():
    """
    JWT is stateless — logout is handled client-side by discarding the token.
    This endpoint exists for API consistency and future token blacklist support.
    """
    return {"message": "Successfully logged out. Please clear your token on the client."}


@router.delete("/me", status_code=status.HTTP_200_OK)
def delete_account(current_user: CurrentUser, db: DBDep):
    """Deactivate and soft-delete the user account and all related data."""
    auth_service.delete_user(db, current_user.id)
    return {"message": "Account successfully deactivated. Your data will be deleted within 30 days."}

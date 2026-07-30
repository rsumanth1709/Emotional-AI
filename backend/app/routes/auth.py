"""
MindCare AI — Authentication Routes

Handles:
- User Registration
- User Login
- Current User Profile
- Profile Update
- Logout
- Account Deletion
"""

from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    Token,
    UserCreate,
    UserLogin,
    UserResponse,
    UserUpdate,
)
from app.services.auth_service import auth_service
from app.utils.security import (
    create_access_token,
    get_current_active_user,
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)

# ---------------------------------------------------------------------
# Dependencies
# ---------------------------------------------------------------------

DBSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


# ---------------------------------------------------------------------
# Register
# ---------------------------------------------------------------------
@router.post(
    "/signup",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
def signup(user_data: UserCreate, db: DBSession) -> Token:
    """
    Register a new user and return an access token.
    """

    user = auth_service.create_user(db, user_data)

    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        ),
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


# ---------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------
@router.post(
    "/login",
    response_model=Token,
    summary="User Login",
)
def login(credentials: UserLogin, db: DBSession) -> Token:
    """
    Authenticate user using email and password.
    """

    user = auth_service.authenticate_user(
        db,
        credentials.email,
        credentials.password,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated.",
        )

    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        ),
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


# ---------------------------------------------------------------------
# Current User
# ---------------------------------------------------------------------
@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get Current User",
)
def read_current_user(current_user: CurrentUser) -> UserResponse:
    """
    Return the authenticated user's profile.
    """

    return UserResponse.model_validate(current_user)


# ---------------------------------------------------------------------
# Update Profile
# ---------------------------------------------------------------------
@router.put(
    "/me",
    response_model=UserResponse,
    summary="Update Current User",
)
def update_current_user(
    user_data: UserUpdate,
    current_user: CurrentUser,
    db: DBSession,
) -> UserResponse:
    """
    Update the authenticated user's profile.
    """

    updated_user = auth_service.update_user(
        db=db,
        user_id=current_user.id,
        user_data=user_data,
    )

    return UserResponse.model_validate(updated_user)


# ---------------------------------------------------------------------
# Logout
# ---------------------------------------------------------------------
@router.post(
    "/logout",
    summary="Logout",
)
def logout(current_user: CurrentUser):
    """
    JWT authentication is stateless.

    Logout simply instructs the client to remove the stored token.
    This endpoint exists for future refresh-token revocation or
    token blacklisting support.
    """

    return {
        "success": True,
        "message": "Logged out successfully.",
    }


# ---------------------------------------------------------------------
# Delete Account
# ---------------------------------------------------------------------
@router.delete(
    "/me",
    status_code=status.HTTP_200_OK,
    summary="Delete Account",
)
def delete_account(
    current_user: CurrentUser,
    db: DBSession,
):
    """
    Soft delete the authenticated user's account.
    """

    auth_service.delete_user(
        db=db,
        user_id=current_user.id,
    )

    return {
        "success": True,
        "message": (
            "Your account has been deactivated and scheduled "
            "for permanent deletion within 30 days."
        ),
    }
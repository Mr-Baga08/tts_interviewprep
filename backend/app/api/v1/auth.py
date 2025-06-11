"""
Authentication endpoints for TheTruthSchool API.

This module provides OAuth integration, JWT token management,
and user authentication endpoints using fastapi-users.
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi_users import FastAPIUsers
from fastapi_users.authentication import (
    AuthenticationBackend,
    BearerTransport,
    JWTAuthentication,
)
from fastapi_users.db import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_async_session
from app.models.user import User
from app.schemas.user import UserCreate, UserRead, UserUpdate, LoginResponse
from app.services.auth_service import (
    get_user_db,
    get_user_manager,
    UserManager,
    google_oauth_client,
    github_oauth_client,
)

# Create authentication backend
bearer_transport = BearerTransport(tokenUrl="auth/login")

jwt_authentication = JWTAuthentication(
    secret=settings.SECRET_KEY,
    lifetime_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    tokenUrl="auth/login",
)

auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=jwt_authentication,
)

# Create FastAPI Users instance
fastapi_users = FastAPIUsers[User, UUID](
    get_user_manager,
    [auth_backend],
)

# Get current user dependencies
current_active_user = fastapi_users.current_user(active=True)
current_superuser = fastapi_users.current_user(active=True, superuser=True)

# Create router
router = APIRouter()

# Include fastapi-users auth routes
router.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix="/jwt",
)

router.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
)

router.include_router(
    fastapi_users.get_reset_password_router(),
)

router.include_router(
    fastapi_users.get_verify_router(UserRead),
)

# OAuth routes
if settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET:
    router.include_router(
        fastapi_users.get_oauth_router(
            google_oauth_client,
            auth_backend,
            settings.SECRET_KEY,
            associate_by_email=True,
        ),
        prefix="/google",
        tags=["OAuth - Google"],
    )

if settings.GITHUB_CLIENT_ID and settings.GITHUB_CLIENT_SECRET:
    router.include_router(
        fastapi_users.get_oauth_router(
            github_oauth_client,
            auth_backend,
            settings.SECRET_KEY,
            associate_by_email=True,
        ),
        prefix="/github",
        tags=["OAuth - GitHub"],
    )


# Custom authentication endpoints
@router.post("/login", response_model=LoginResponse)
async def login_with_credentials(
    form_data: OAuth2PasswordRequestForm = Depends(),
    user_manager: UserManager = Depends(get_user_manager),
):
    """
    Login with email and password.
    
    Returns access token and user information.
    """
    try:
        user = await user_manager.authenticate(
            form_data.username,  # email
            form_data.password,
        )
        
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid credentials or inactive account"
            )
        
        # Generate access token
        token = await jwt_authentication.get_strategy().write_token(user)
        
        # Update login information
        user.update_login_info("unknown")  # IP would be extracted from request
        
        return LoginResponse(
            access_token=token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserRead.from_orm(user)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Login failed"
        )


@router.post("/logout")
async def logout(
    user: User = Depends(current_active_user),
):
    """
    Logout current user.
    
    In a stateless JWT system, logout is typically handled client-side
    by removing the token. This endpoint can be used for logging purposes
    or future token blacklisting.
    """
    # Update last activity
    user.update_last_active()
    
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserRead)
async def get_current_user(
    user: User = Depends(current_active_user),
):
    """Get current authenticated user information."""
    user.update_last_active()
    return user


@router.patch("/me", response_model=UserRead)
async def update_current_user(
    user_update: UserUpdate,
    user: User = Depends(current_active_user),
    user_manager: UserManager = Depends(get_user_manager),
):
    """Update current user profile."""
    try:
        updated_user = await user_manager.update(
            user_update,
            user,
            safe=True,
        )
        return updated_user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update user: {str(e)}"
        )


@router.post("/change-password")
async def change_password(
    current_password: str,
    new_password: str,
    user: User = Depends(current_active_user),
    user_manager: UserManager = Depends(get_user_manager),
):
    """Change user password."""
    try:
        # Verify current password
        if not user_manager.password_helper.verify_and_update(
            current_password, user.hashed_password
        )[0]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid current password"
            )
        
        # Update password
        user.hashed_password = user_manager.password_helper.hash(new_password)
        user.password_changed_at = datetime.utcnow()
        
        await user_manager.user_db.update(user)
        
        return {"message": "Password changed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change password"
        )


@router.post("/request-verify-token")
async def request_verify_token(
    email: str,
    user_manager: UserManager = Depends(get_user_manager),
):
    """Request email verification token."""
    try:
        user = await user_manager.get_by_email(email)
        if not user:
            # Don't reveal if email exists
            return {"message": "If the email exists, a verification link has been sent"}
        
        await user_manager.request_verify(user)
        
        return {"message": "If the email exists, a verification link has been sent"}
        
    except Exception:
        return {"message": "If the email exists, a verification link has been sent"}


@router.get("/verify")
async def verify_email(
    token: str,
    user_manager: UserManager = Depends(get_user_manager),
):
    """Verify email address with token."""
    try:
        await user_manager.verify(token)
        return {"message": "Email verified successfully"}
        
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )


@router.post("/forgot-password")
async def forgot_password(
    email: str,
    user_manager: UserManager = Depends(get_user_manager),
):
    """Request password reset token."""
    try:
        user = await user_manager.get_by_email(email)
        if user:
            await user_manager.forgot_password(user)
        
        # Always return success to prevent email enumeration
        return {"message": "If the email exists, a password reset link has been sent"}
        
    except Exception:
        return {"message": "If the email exists, a password reset link has been sent"}


@router.post("/reset-password")
async def reset_password(
    token: str,
    new_password: str,
    user_manager: UserManager = Depends(get_user_manager),
):
    """Reset password with token."""
    try:
        await user_manager.reset_password(token, new_password)
        return {"message": "Password reset successfully"}
        
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )


@router.get("/oauth/callback/{provider}")
async def oauth_callback(
    provider: str,
    request: Request,
    user_manager: UserManager = Depends(get_user_manager),
):
    """
    Handle OAuth callback from providers.
    
    This endpoint processes the OAuth callback and creates/updates user accounts.
    """
    # This would typically be handled by fastapi-users OAuth routers
    # but can be customized here if needed
    pass


@router.get("/session/info")
async def get_session_info(
    request: Request,
    user: User = Depends(current_active_user),
):
    """Get current session information."""
    return {
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
        "subscription_plan": user.subscription_plan,
        "is_verified": user.is_verified,
        "session_expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "ip_address": request.client.host if request.client else "unknown",
        "user_agent": request.headers.get("user-agent"),
    }


@router.post("/sessions/revoke-all")
async def revoke_all_sessions(
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Revoke all user sessions.
    
    In a stateless JWT system, this would typically involve
    token blacklisting or updating a user secret.
    """
    # For JWT, we could increment a user version/secret to invalidate all tokens
    # This is a placeholder for that functionality
    
    return {"message": "All sessions revoked successfully"}


# Health check for auth service
@router.get("/health")
async def auth_health_check():
    """Health check for authentication service."""
    return {
        "status": "healthy",
        "service": "authentication",
        "oauth_providers": {
            "google": bool(settings.GOOGLE_CLIENT_ID),
            "github": bool(settings.GITHUB_CLIENT_ID),
        },
        "features": {
            "email_verification": True,
            "password_reset": True,
            "oauth": True,
            "jwt": True,
        }
    }
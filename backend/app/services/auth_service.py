"""
Authentication service for TheTruthSchool.

This module provides user management, OAuth integration,
and authentication utilities using fastapi-users.
"""

import uuid
from typing import Optional

from fastapi import Depends, Request
from fastapi_users import BaseUserManager, UUIDIDMixin
from fastapi_users.db import SQLAlchemyUserDatabase
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase
from httpx_oauth.clients.github import GitHubOAuth2
from httpx_oauth.clients.google import GoogleOAuth2
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_async_session
from app.models.user import User


class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    """
    User manager for handling user operations.
    
    Extends fastapi-users BaseUserManager with custom logic
    for TheTruthSchool-specific requirements.
    """
    
    reset_password_token_secret = settings.SECRET_KEY
    verification_token_secret = settings.SECRET_KEY

    async def on_after_register(self, user: User, request: Optional[Request] = None):
        """
        Hook called after user registration.
        
        Customize this to add welcome emails, initial setup, etc.
        """
        print(f"User {user.id} has registered.")
        
        # Set default preferences
        user.onboarding_completed = False
        user.email_notifications = True
        user.interview_reminders = True
        user.progress_reports = True
        
        # Track registration method
        if request:
            user.sign_up_method = "email"
            # Extract UTM parameters if available
            if hasattr(request, 'query_params'):
                user.utm_source = request.query_params.get('utm_source')
                user.utm_medium = request.query_params.get('utm_medium')
                user.utm_campaign = request.query_params.get('utm_campaign')

    async def on_after_login(
        self,
        user: User,
        request: Optional[Request] = None,
        response = None,
    ):
        """
        Hook called after successful login.
        
        Update login tracking and security information.
        """
        ip_address = "unknown"
        if request and request.client:
            ip_address = request.client.host
        
        user.update_login_info(ip_address)
        print(f"User {user.id} logged in from {ip_address}")

    async def on_after_forgot_password(
        self, user: User, token: str, request: Optional[Request] = None
    ):
        """
        Hook called after password reset request.
        
        Customize this to send password reset emails.
        """
        print(f"User {user.id} has forgot their password. Reset token: {token}")
        
        # Here you would typically send an email with the reset link
        # Email service integration would go here

    async def on_after_request_verify(
        self, user: User, token: str, request: Optional[Request] = None
    ):
        """
        Hook called after email verification request.
        
        Customize this to send verification emails.
        """
        print(f"Verification requested for user {user.id}. Verification token: {token}")
        
        # Here you would typically send a verification email
        # Email service integration would go here

    async def on_after_verify(
        self, user: User, request: Optional[Request] = None
    ):
        """
        Hook called after successful email verification.
        """
        print(f"User {user.id} has been verified")
        user.email_verified = True

    async def authenticate(
        self, email: str, password: str
    ) -> Optional[User]:
        """
        Authenticate user with email and password.
        
        Enhanced with account locking and security features.
        """
        try:
            user = await self.get_by_email(email)
            if not user:
                return None
            
            # Check if account is locked
            if user.is_account_locked():
                print(f"Login attempt for locked account: {email}")
                return None
            
            # Verify password
            verified, updated_password_hash = self.password_helper.verify_and_update(
                password, user.hashed_password
            )
            
            if not verified:
                # Increment failed login attempts
                user.increment_failed_login()
                await self.user_db.update(user)
                return None
            
            # Update password hash if needed
            if updated_password_hash is not None:
                user.hashed_password = updated_password_hash
                await self.user_db.update(user)
            
            return user
            
        except Exception as e:
            print(f"Authentication error for {email}: {str(e)}")
            return None

    async def create_user(
        self,
        user_create,
        safe: bool = False,
        request: Optional[Request] = None,
    ) -> User:
        """
        Create a new user with enhanced validation and setup.
        """
        user = await super().create(user_create, safe=safe, request=request)
        
        # Initialize user statistics
        user.interviews_completed = 0
        user.challenges_solved = 0
        user.tests_taken = 0
        user.total_practice_time = 0
        user.average_score = 0.0
        user.best_score = 0.0
        user.current_streak = 0
        user.longest_streak = 0
        
        # Set up skill progression tracking
        user.skill_progression = {}
        
        await self.user_db.update(user)
        return user


async def get_user_db(session: AsyncSession = Depends(get_async_session)):
    """Get user database instance."""
    yield SQLAlchemyUserDatabase(session, User)


async def get_user_manager(user_db: SQLAlchemyUserDatabase = Depends(get_user_db)):
    """Get user manager instance."""
    yield UserManager(user_db)


# OAuth2 clients
google_oauth_client = GoogleOAuth2(
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
) if settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET else None

github_oauth_client = GitHubOAuth2(
    client_id=settings.GITHUB_CLIENT_ID,
    client_secret=settings.GITHUB_CLIENT_SECRET,
) if settings.GITHUB_CLIENT_ID and settings.GITHUB_CLIENT_SECRET else None


# Custom OAuth handlers
async def on_after_oauth_register(
    user: User,
    oauth_name: str,
    access_token: str,
    account_id: str,
    account_email: str,
    request: Optional[Request] = None,
):
    """
    Handle user registration via OAuth.
    
    This function is called after a user registers via OAuth.
    """
    print(f"User {user.id} registered via {oauth_name}")
    
    # Set OAuth-specific defaults
    user.sign_up_method = oauth_name
    user.email_verified = True  # OAuth emails are typically verified
    
    # Extract additional profile information from OAuth provider
    if oauth_name == "google":
        # Google provides verified email by default
        user.email_verified = True
    elif oauth_name == "github":
        # GitHub username could be stored
        user.github_url = f"https://github.com/{account_id}"


# Security utilities
def generate_secure_token() -> str:
    """Generate a secure random token."""
    return uuid.uuid4().hex


def validate_password_strength(password: str) -> bool:
    """
    Validate password strength.
    
    Returns True if password meets security requirements.
    """
    if len(password) < 8:
        return False
    
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password)
    
    return has_upper and has_lower and has_digit and has_special


# Role and permission utilities
def check_user_permission(user: User, permission: str) -> bool:
    """
    Check if user has specific permission.
    
    This can be extended with more complex RBAC logic.
    """
    if user.is_superuser:
        return True
    
    # Basic role-based permissions
    if user.role == "admin":
        return permission in [
            "read_users", "create_users", "update_users", "delete_users",
            "read_challenges", "create_challenges", "update_challenges", "delete_challenges",
            "read_interviews", "create_interviews", "update_interviews", "delete_interviews",
            "read_analytics", "create_reports",
        ]
    elif user.role == "professional":
        return permission in [
            "read_challenges", "submit_challenges",
            "read_interviews", "create_interviews",
            "read_tests", "take_tests",
            "read_resumes", "create_resumes", "update_resumes",
            "read_feedback",
        ]
    elif user.role == "student":
        return permission in [
            "read_challenges", "submit_challenges",
            "read_interviews", "create_interviews",
            "read_tests", "take_tests",
            "read_resumes", "create_resumes", "update_resumes",
            "read_feedback",
        ]
    
    return False


def require_permission(permission: str):
    """
    Dependency factory for requiring specific permissions.
    
    Usage: @router.get("/endpoint", dependencies=[Depends(require_permission("read_users"))])
    """
    def permission_checker(user: User = Depends(get_user_manager)):
        if not check_user_permission(user, permission):
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission '{permission}' required"
            )
        return user
    
    return permission_checker


def require_role(role: str):
    """
    Dependency factory for requiring specific role.
    
    Usage: @router.get("/admin", dependencies=[Depends(require_role("admin"))])
    """
    def role_checker(user: User = Depends(get_user_manager)):
        if user.role != role and not user.is_superuser:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{role}' required"
            )
        return user
    
    return role_checker


# Session management
async def invalidate_user_sessions(user_id: uuid.UUID):
    """
    Invalidate all sessions for a user.
    
    In a JWT system, this would typically involve updating a user secret
    or maintaining a blacklist.
    """
    # This is a placeholder for session invalidation logic
    # In production, you might:
    # 1. Update a user-specific secret used in JWT signing
    # 2. Maintain a blacklist of tokens
    # 3. Use a token versioning system
    pass


# Account security
async def check_suspicious_activity(user: User, request: Request) -> bool:
    """
    Check for suspicious login activity.
    
    Returns True if activity seems suspicious.
    """
    # Simple checks - can be enhanced with more sophisticated logic
    current_ip = request.client.host if request.client else "unknown"
    
    # Check for rapid login attempts
    if user.failed_login_attempts >= 3:
        return True
    
    # Check for login from new location (simplified)
    if user.last_login_ip and user.last_login_ip != current_ip:
        # Could implement geolocation checking here
        pass
    
    return False


# Two-factor authentication helpers
async def setup_2fa(user: User) -> str:
    """
    Set up two-factor authentication for user.
    
    Returns the secret key for QR code generation.
    """
    import pyotp
    
    secret = pyotp.random_base32()
    user.two_factor_secret = secret
    user.two_factor_enabled = False  # Enabled after verification
    
    return secret


async def verify_2fa_token(user: User, token: str) -> bool:
    """
    Verify two-factor authentication token.
    """
    if not user.two_factor_secret:
        return False
    
    import pyotp
    totp = pyotp.TOTP(user.two_factor_secret)
    return totp.verify(token)


async def enable_2fa(user: User, token: str) -> bool:
    """
    Enable two-factor authentication after token verification.
    """
    if await verify_2fa_token(user, token):
        user.two_factor_enabled = True
        return True
    return False
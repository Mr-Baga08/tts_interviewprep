"""
User schemas for TheTruthSchool API.

This module defines Pydantic models for user data validation,
serialization, and API documentation.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID

from fastapi_users import schemas
from pydantic import BaseModel, EmailStr, Field, validator

from app.models.user import UserRole, ExperienceLevel, SubscriptionPlan, SubscriptionStatus


# Base User Schemas (fastapi-users integration)
class UserRead(schemas.BaseUser[UUID]):
    """Schema for reading user data."""
    id: UUID
    email: EmailStr
    is_active: bool = True
    is_superuser: bool = False
    is_verified: bool = False
    
    # Extended profile fields
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    
    # Contact information
    phone: Optional[str] = None
    location: Optional[str] = None
    timezone: str = "UTC"
    website: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    
    # System fields
    role: UserRole = UserRole.STUDENT
    preferred_language: str = "en"
    onboarding_completed: bool = False
    email_verified: bool = False
    
    # Career information
    current_role: Optional[str] = None
    experience_level: Optional[ExperienceLevel] = None
    industries: List[str] = []
    skills: List[str] = []
    target_roles: List[str] = []
    
    # Statistics
    interviews_completed: int = 0
    challenges_solved: int = 0
    tests_taken: int = 0
    total_practice_time: int = 0
    average_score: float = 0.0
    best_score: float = 0.0
    current_streak: int = 0
    
    # Subscription
    subscription_plan: SubscriptionPlan = SubscriptionPlan.FREE
    subscription_status: SubscriptionStatus = SubscriptionStatus.ACTIVE
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    last_active_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class UserCreate(schemas.BaseUserCreate):
    """Schema for creating new users."""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    is_active: Optional[bool] = True
    is_superuser: Optional[bool] = False
    is_verified: Optional[bool] = False
    
    # Optional profile fields during registration
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)
    role: Optional[UserRole] = UserRole.STUDENT
    
    @validator('password')
    def validate_password(cls, v):
        """Validate password strength."""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        
        has_upper = any(c.isupper() for c in v)
        has_lower = any(c.islower() for c in v)
        has_digit = any(c.isdigit() for c in v)
        
        if not (has_upper and has_lower and has_digit):
            raise ValueError('Password must contain uppercase, lowercase, and numeric characters')
        
        return v


class UserUpdate(schemas.BaseUserUpdate):
    """Schema for updating user data."""
    password: Optional[str] = Field(None, min_length=8, max_length=128)
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None
    is_verified: Optional[bool] = None
    
    # Profile updates
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)
    display_name: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)
    avatar_url: Optional[str] = None
    
    # Contact information
    phone: Optional[str] = Field(None, max_length=20)
    location: Optional[str] = Field(None, max_length=100)
    timezone: Optional[str] = Field(None, max_length=50)
    website: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    
    # Preferences
    preferred_language: Optional[str] = Field(None, max_length=10)
    email_notifications: Optional[bool] = None
    interview_reminders: Optional[bool] = None
    progress_reports: Optional[bool] = None
    
    # Career information
    current_role: Optional[str] = Field(None, max_length=100)
    experience_level: Optional[ExperienceLevel] = None
    industries: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    target_roles: Optional[List[str]] = None
    
    # Salary expectations
    salary_min: Optional[int] = Field(None, ge=0)
    salary_max: Optional[int] = Field(None, ge=0)
    salary_currency: Optional[str] = Field(None, max_length=3)
    
    @validator('salary_max')
    def validate_salary_range(cls, v, values):
        """Validate salary range is logical."""
        if v is not None and 'salary_min' in values and values['salary_min'] is not None:
            if v < values['salary_min']:
                raise ValueError('Maximum salary must be greater than minimum salary')
        return v


# Extended User Schemas
class UserProfile(BaseModel):
    """Detailed user profile schema."""
    id: UUID
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    
    # Contact and social
    phone: Optional[str] = None
    location: Optional[str] = None
    timezone: str = "UTC"
    website: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    
    # Career details
    current_role: Optional[str] = None
    experience_level: Optional[ExperienceLevel] = None
    industries: List[str] = []
    skills: List[str] = []
    target_roles: List[str] = []
    
    # Salary information
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_currency: str = "USD"
    
    # System information
    role: UserRole
    onboarding_completed: bool = False
    email_verified: bool = False
    subscription_plan: SubscriptionPlan
    subscription_status: SubscriptionStatus
    
    # Computed fields
    full_name: Optional[str] = None
    is_premium: bool = False
    
    class Config:
        from_attributes = True


class UserStats(BaseModel):
    """User statistics and progress."""
    user_id: UUID
    interviews_completed: int = 0
    challenges_solved: int = 0
    tests_taken: int = 0
    total_practice_time: int = 0  # minutes
    average_score: float = 0.0
    best_score: float = 0.0
    current_streak: int = 0
    longest_streak: int = 0
    
    # Skill progression
    skill_progression: Dict[str, float] = {}
    
    # Recent activity
    last_active_at: Optional[datetime] = None
    
    # Performance trends
    weekly_progress: Optional[Dict[str, Any]] = None
    monthly_progress: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True


class UserActivity(BaseModel):
    """User activity log entry."""
    id: UUID
    user_id: UUID
    activity_type: str  # interview, challenge, test, resume_review
    activity_id: UUID
    activity_title: str
    score: Optional[float] = None
    duration: Optional[int] = None  # seconds
    completed_at: datetime
    
    class Config:
        from_attributes = True


class UserPreferences(BaseModel):
    """User preferences and settings."""
    user_id: UUID
    preferred_language: str = "en"
    timezone: str = "UTC"
    
    # Notification preferences
    email_notifications: bool = True
    interview_reminders: bool = True
    progress_reports: bool = True
    marketing_emails: bool = False
    
    # Privacy settings
    profile_visibility: str = "private"  # public, private, limited
    show_real_name: bool = False
    show_progress: bool = False
    
    class Config:
        from_attributes = True


class OnboardingData(BaseModel):
    """Schema for onboarding process data."""
    # Career goals
    target_roles: List[str] = []
    target_industries: List[str] = []
    experience_level: ExperienceLevel
    current_role: Optional[str] = None
    
    # Skills assessment
    technical_skills: List[str] = []
    skill_confidence: Dict[str, int] = {}  # skill -> confidence (1-5)
    
    # Learning preferences
    learning_goals: List[str] = []
    time_commitment: str  # light, moderate, intensive
    preferred_difficulty: str  # easy, medium, hard
    
    # Background information
    education_level: Optional[str] = None
    years_of_experience: Optional[int] = Field(None, ge=0, le=50)
    previous_interview_experience: bool = False
    
    # Optional additional info
    motivation: Optional[str] = None
    specific_challenges: List[str] = []
    
    class Config:
        from_attributes = True


class UserSearch(BaseModel):
    """Schema for user search and filtering."""
    query: Optional[str] = None
    role: Optional[UserRole] = None
    experience_level: Optional[ExperienceLevel] = None
    subscription_plan: Optional[SubscriptionPlan] = None
    location: Optional[str] = None
    skills: Optional[List[str]] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    is_active: Optional[bool] = None
    
    # Pagination
    page: int = Field(1, ge=1)
    limit: int = Field(20, ge=1, le=100)
    
    # Sorting
    sort_by: Optional[str] = Field(None, regex="^(created_at|updated_at|last_active_at|email)$")
    sort_order: Optional[str] = Field("desc", regex="^(asc|desc)$")


class UserSearchResult(BaseModel):
    """Schema for user search results."""
    users: List[UserRead]
    total: int
    page: int
    limit: int
    total_pages: int
    
    class Config:
        from_attributes = True


# OAuth and Authentication Schemas
class OAuthAccount(BaseModel):
    """OAuth account information."""
    id: UUID
    user_id: UUID
    provider: str
    provider_user_id: str
    provider_username: Optional[str] = None
    provider_email: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    """Response schema for successful login."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserRead
    
    class Config:
        from_attributes = True


class PasswordReset(BaseModel):
    """Schema for password reset request."""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Schema for password reset confirmation."""
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)
    
    @validator('new_password')
    def validate_password(cls, v):
        """Validate password strength."""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        
        has_upper = any(c.isupper() for c in v)
        has_lower = any(c.islower() for c in v)
        has_digit = any(c.isdigit() for c in v)
        
        if not (has_upper and has_lower and has_digit):
            raise ValueError('Password must contain uppercase, lowercase, and numeric characters')
        
        return v


class EmailVerification(BaseModel):
    """Schema for email verification."""
    token: str


# Admin Schemas
class UserAdminView(UserRead):
    """Extended user view for administrators."""
    # Security information
    last_login_at: Optional[datetime] = None
    last_login_ip: Optional[str] = None
    failed_login_attempts: int = 0
    account_locked_until: Optional[datetime] = None
    two_factor_enabled: bool = False
    
    # Metadata
    sign_up_method: Optional[str] = None
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    
    # Admin actions
    is_superuser: bool = False
    is_active: bool = True
    
    class Config:
        from_attributes = True


class UserAdminUpdate(BaseModel):
    """Schema for admin user updates."""
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None
    is_verified: Optional[bool] = None
    role: Optional[UserRole] = None
    subscription_plan: Optional[SubscriptionPlan] = None
    subscription_status: Optional[SubscriptionStatus] = None
    
    # Admin notes
    admin_notes: Optional[str] = None
    
    class Config:
        from_attributes = True
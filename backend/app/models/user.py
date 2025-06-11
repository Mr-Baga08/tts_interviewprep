"""
User model for TheTruthSchool application.

This module defines the User model and related authentication models
using SQLAlchemy and integrates with fastapi-users for authentication.
"""

import uuid
from datetime import datetime
from typing import Optional

from fastapi_users.db import SQLAlchemyBaseUserTableUUID
from sqlalchemy import (
    Boolean, 
    Column, 
    DateTime, 
    Enum, 
    Integer, 
    JSON, 
    String, 
    Text,
    Float,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class UserRole(str, Enum):
    """User role enumeration."""
    STUDENT = "student"
    PROFESSIONAL = "professional" 
    ADMIN = "admin"


class SubscriptionPlan(str, Enum):
    """Subscription plan enumeration."""
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class SubscriptionStatus(str, Enum):
    """Subscription status enumeration."""
    ACTIVE = "active"
    CANCELED = "canceled"
    EXPIRED = "expired"


class ExperienceLevel(str, Enum):
    """Experience level enumeration."""
    ENTRY = "entry"
    JUNIOR = "junior"
    MID = "mid"
    SENIOR = "senior"
    STAFF = "staff"
    PRINCIPAL = "principal"
    DIRECTOR = "director"


class User(SQLAlchemyBaseUserTableUUID, Base):
    """
    User model extending fastapi-users base model.
    
    This model includes all the standard authentication fields plus
    additional profile and career information specific to TheTruthSchool.
    """
    
    __tablename__ = "users"
    
    # Basic profile information (extending fastapi-users fields)
    first_name: str = Column(String(50), nullable=True)
    last_name: str = Column(String(50), nullable=True)
    display_name: str = Column(String(100), nullable=True)
    bio: str = Column(Text, nullable=True)
    avatar_url: str = Column(String(500), nullable=True)
    
    # Contact and social information
    phone: str = Column(String(20), nullable=True)
    location: str = Column(String(100), nullable=True)
    timezone: str = Column(String(50), default="UTC")
    website: str = Column(String(500), nullable=True)
    linkedin_url: str = Column(String(500), nullable=True)
    github_url: str = Column(String(500), nullable=True)
    portfolio_url: str = Column(String(500), nullable=True)
    
    # System and preferences
    role: UserRole = Column(Enum(UserRole), default=UserRole.STUDENT, nullable=False)
    preferred_language: str = Column(String(10), default="en")
    onboarding_completed: bool = Column(Boolean, default=False)
    email_verified: bool = Column(Boolean, default=False)
    phone_verified: bool = Column(Boolean, default=False)
    
    # Notification preferences
    email_notifications: bool = Column(Boolean, default=True)
    interview_reminders: bool = Column(Boolean, default=True)
    progress_reports: bool = Column(Boolean, default=True)
    marketing_emails: bool = Column(Boolean, default=False)
    
    # Career information
    current_role: str = Column(String(100), nullable=True)
    experience_level: ExperienceLevel = Column(
        Enum(ExperienceLevel), 
        default=ExperienceLevel.ENTRY,
        nullable=True
    )
    industries: list = Column(JSON, default=list)  # List of industry strings
    skills: list = Column(JSON, default=list)  # List of skill strings
    target_roles: list = Column(JSON, default=list)  # List of target role strings
    
    # Salary expectations
    salary_min: int = Column(Integer, nullable=True)
    salary_max: int = Column(Integer, nullable=True)
    salary_currency: str = Column(String(3), default="USD")
    
    # Statistics and progress tracking
    interviews_completed: int = Column(Integer, default=0)
    challenges_solved: int = Column(Integer, default=0)
    tests_taken: int = Column(Integer, default=0)
    total_practice_time: int = Column(Integer, default=0)  # in minutes
    average_score: float = Column(Float, default=0.0)
    best_score: float = Column(Float, default=0.0)
    current_streak: int = Column(Integer, default=0)  # consecutive days
    longest_streak: int = Column(Integer, default=0)
    
    # Skill progression tracking
    skill_progression: dict = Column(JSON, default=dict)  # skill -> proficiency score
    
    # Subscription information
    subscription_plan: SubscriptionPlan = Column(
        Enum(SubscriptionPlan), 
        default=SubscriptionPlan.FREE
    )
    subscription_status: SubscriptionStatus = Column(
        Enum(SubscriptionStatus), 
        default=SubscriptionStatus.ACTIVE
    )
    subscription_expires_at: datetime = Column(DateTime, nullable=True)
    subscription_features: list = Column(JSON, default=list)
    
    # Security and audit fields
    last_login_at: datetime = Column(DateTime, nullable=True)
    last_login_ip: str = Column(String(45), nullable=True)  # IPv6 compatible
    password_changed_at: datetime = Column(DateTime, nullable=True)
    failed_login_attempts: int = Column(Integer, default=0)
    account_locked_until: datetime = Column(DateTime, nullable=True)
    two_factor_enabled: bool = Column(Boolean, default=False)
    two_factor_secret: str = Column(String(32), nullable=True)
    
    # Metadata and tracking
    sign_up_method: str = Column(String(20), nullable=True)  # oauth, email, etc.
    referral_code: str = Column(String(20), nullable=True)
    referred_by_user_id: UUID = Column(UUID(as_uuid=True), nullable=True)
    utm_source: str = Column(String(100), nullable=True)
    utm_medium: str = Column(String(100), nullable=True)
    utm_campaign: str = Column(String(100), nullable=True)
    
    # Timestamps (fastapi-users provides created_at via its mixin)
    updated_at: datetime = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )
    last_active_at: datetime = Column(DateTime, nullable=True)
    deleted_at: datetime = Column(DateTime, nullable=True)  # Soft delete
    
    # Relationships (will be defined when other models are created)
    # resumes = relationship("Resume", back_populates="user")
    # interviews = relationship("Interview", back_populates="user") 
    # submissions = relationship("Submission", back_populates="user")
    # test_attempts = relationship("TestAttempt", back_populates="user")
    # feedback = relationship("Feedback", back_populates="user")
    
    def __repr__(self) -> str:
        return f"<User {self.email} ({self.role})>"
    
    @property
    def full_name(self) -> str:
        """Get user's full name."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.display_name:
            return self.display_name
        else:
            return self.email.split("@")[0]
    
    @property
    def is_premium(self) -> bool:
        """Check if user has premium subscription."""
        return (
            self.subscription_plan in [SubscriptionPlan.PRO, SubscriptionPlan.ENTERPRISE]
            and self.subscription_status == SubscriptionStatus.ACTIVE
            and (not self.subscription_expires_at or self.subscription_expires_at > datetime.utcnow())
        )
    
    @property
    def is_admin(self) -> bool:
        """Check if user is an admin."""
        return self.role == UserRole.ADMIN
    
    @property
    def is_active_subscriber(self) -> bool:
        """Check if user has an active subscription."""
        return (
            self.subscription_status == SubscriptionStatus.ACTIVE
            and (not self.subscription_expires_at or self.subscription_expires_at > datetime.utcnow())
        )
    
    def update_last_active(self) -> None:
        """Update last active timestamp."""
        self.last_active_at = datetime.utcnow()
    
    def update_login_info(self, ip_address: str) -> None:
        """Update login information."""
        self.last_login_at = datetime.utcnow()
        self.last_login_ip = ip_address
        self.failed_login_attempts = 0
        self.account_locked_until = None
    
    def increment_failed_login(self) -> None:
        """Increment failed login attempts."""
        self.failed_login_attempts += 1
        # Lock account after 5 failed attempts for 15 minutes
        if self.failed_login_attempts >= 5:
            from datetime import timedelta
            self.account_locked_until = datetime.utcnow() + timedelta(minutes=15)
    
    def is_account_locked(self) -> bool:
        """Check if account is currently locked."""
        if not self.account_locked_until:
            return False
        return datetime.utcnow() < self.account_locked_until
    
    def add_skill_progress(self, skill: str, score: float) -> None:
        """Add or update skill progression."""
        if not self.skill_progression:
            self.skill_progression = {}
        self.skill_progression[skill] = score
    
    def get_skill_progress(self, skill: str) -> float:
        """Get skill progression score."""
        if not self.skill_progression:
            return 0.0
        return self.skill_progression.get(skill, 0.0)


class UserOAuthAccount(Base):
    """
    OAuth account information for users.
    
    This model stores OAuth provider information for users who sign up
    or login using OAuth providers like Google, GitHub, etc.
    """
    
    __tablename__ = "user_oauth_accounts"
    
    id: UUID = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: UUID = Column(
        UUID(as_uuid=True), 
        nullable=False,
        index=True
    )
    provider: str = Column(String(50), nullable=False)  # google, github, etc.
    provider_user_id: str = Column(String(255), nullable=False)
    provider_username: str = Column(String(255), nullable=True)
    provider_email: str = Column(String(255), nullable=True)
    access_token: str = Column(Text, nullable=True)
    refresh_token: str = Column(Text, nullable=True)
    token_expires_at: datetime = Column(DateTime, nullable=True)
    provider_data: dict = Column(JSON, nullable=True)  # Additional provider data
    
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: datetime = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )
    
    def __repr__(self) -> str:
        return f"<UserOAuthAccount {self.provider}:{self.provider_user_id}>"


class UserSession(Base):
    """
    User session tracking for security and analytics.
    """
    
    __tablename__ = "user_sessions"
    
    id: UUID = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: UUID = Column(
        UUID(as_uuid=True), 
        nullable=False,
        index=True
    )
    session_token: str = Column(String(255), nullable=False, unique=True, index=True)
    ip_address: str = Column(String(45), nullable=True)
    user_agent: str = Column(Text, nullable=True)
    location: dict = Column(JSON, nullable=True)  # Geolocation data
    is_active: bool = Column(Boolean, default=True)
    
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now())
    last_accessed_at: datetime = Column(DateTime(timezone=True), server_default=func.now())
    expires_at: datetime = Column(DateTime, nullable=False)
    ended_at: datetime = Column(DateTime, nullable=True)
    
    def __repr__(self) -> str:
        return f"<UserSession {self.user_id} active={self.is_active}>"
    
    def is_expired(self) -> bool:
        """Check if session is expired."""
        return datetime.utcnow() > self.expires_at
    
    def end_session(self) -> None:
        """End the session."""
        self.is_active = False
        self.ended_at = datetime.utcnow()
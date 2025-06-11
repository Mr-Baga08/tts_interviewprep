"""
Configuration settings for TheTruthSchool backend application.

This module uses Pydantic settings to manage environment variables
and application configuration in a type-safe manner.
"""

import secrets
from typing import Any, Dict, List, Optional, Union

from pydantic import AnyHttpUrl, BaseSettings, EmailStr, PostgresDsn, validator


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Core application settings
    PROJECT_NAME: str = "TheTruthSchool API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Security settings
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    ALGORITHM: str = "HS256"
    
    # Server settings
    SERVER_NAME: str = "localhost"
    SERVER_HOST: AnyHttpUrl = "http://localhost"
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1"]
    
    # CORS settings
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://localhost:3000",
        "https://localhost:3001",
    ]
    
    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    # Database settings
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "truthschool_user"
    POSTGRES_PASSWORD: str = "truthschool_password"
    POSTGRES_DB: str = "truthschool_dev"
    POSTGRES_PORT: str = "5432"
    
    DATABASE_URL: Optional[PostgresDsn] = None
    
    @validator("DATABASE_URL", pre=True)
    def assemble_db_connection(cls, v: Optional[str], values: Dict[str, Any]) -> Any:
        if isinstance(v, str):
            return v
        return PostgresDsn.build(
            scheme="postgresql+asyncpg",
            user=values.get("POSTGRES_USER"),
            password=values.get("POSTGRES_PASSWORD"),
            host=values.get("POSTGRES_SERVER"),
            port=values.get("POSTGRES_PORT"),
            path=f"/{values.get('POSTGRES_DB') or ''}",
        )
    
    # Redis settings (for caching and sessions)
    REDIS_URL: str = "redis://localhost:6379"
    
    # Email settings
    SMTP_TLS: bool = True
    SMTP_PORT: Optional[int] = None
    SMTP_HOST: Optional[str] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[EmailStr] = None
    EMAILS_FROM_NAME: Optional[str] = None
    
    # External API settings
    
    # OpenAI settings
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4"
    OPENAI_MAX_TOKENS: int = 2000
    
    # Google Generative AI settings  
    GOOGLE_GENERATIVE_AI_API_KEY: Optional[str] = None
    GOOGLE_MODEL: str = "gemini-pro"
    
    # LiveKit settings
    LIVEKIT_API_KEY: Optional[str] = None
    LIVEKIT_API_SECRET: Optional[str] = None
    LIVEKIT_URL: str = "wss://truthschool.livekit.cloud"
    
    # Judge0 settings
    JUDGE0_URL: str = "https://api.judge0.com"
    JUDGE0_API_KEY: Optional[str] = None
    JUDGE0_RAPID_API_KEY: Optional[str] = None
    
    # Google Cloud settings (for storage and deployment)
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None
    GCS_BUCKET_NAME: Optional[str] = None
    
    # OAuth settings
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GITHUB_CLIENT_ID: Optional[str] = None
    GITHUB_CLIENT_SECRET: Optional[str] = None
    
    # File upload settings
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_FILE_TYPES: List[str] = ["pdf", "docx", "doc", "txt"]
    UPLOAD_DIR: str = "uploads"
    
    # AI Processing settings
    AI_PROCESSING_TIMEOUT: int = 300  # 5 minutes
    MAX_CONCURRENT_AI_REQUESTS: int = 10
    
    # Interview settings
    DEFAULT_INTERVIEW_DURATION: int = 30  # minutes
    MAX_INTERVIEW_DURATION: int = 120  # minutes
    
    # Coding challenge settings
    DEFAULT_CODE_EXECUTION_TIMEOUT: int = 10  # seconds
    MAX_CODE_EXECUTION_TIMEOUT: int = 30  # seconds
    
    # Rate limiting settings
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000
    
    # Monitoring and logging settings
    LOG_LEVEL: str = "INFO"
    SENTRY_DSN: Optional[str] = None
    
    # Testing settings
    TESTING: bool = False
    TEST_DATABASE_URL: Optional[str] = None
    
    @validator("TEST_DATABASE_URL", pre=True)
    def assemble_test_db_connection(cls, v: Optional[str], values: Dict[str, Any]) -> Any:
        if isinstance(v, str):
            return v
        if values.get("TESTING"):
            return f"sqlite:///./test_truthschool.db"
        return None
    
    # Admin user settings (for initial setup)
    FIRST_SUPERUSER_EMAIL: EmailStr = "admin@thetruthschool.com"
    FIRST_SUPERUSER_PASSWORD: str = "changethispassword"
    
    # Cache settings
    CACHE_TTL_SECONDS: int = 300  # 5 minutes
    
    # Background task settings
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create global settings instance
settings = Settings()


# Derived settings for convenience
class DerivedSettings:
    """Derived settings computed from base settings."""
    
    @property
    def DATABASE_URL_SYNC(self) -> str:
        """Synchronous database URL for Alembic migrations."""
        if settings.DATABASE_URL:
            return str(settings.DATABASE_URL).replace("+asyncpg", "")
        return ""
    
    @property
    def IS_PRODUCTION(self) -> bool:
        """Check if running in production environment."""
        return settings.ENVIRONMENT.lower() == "production"
    
    @property
    def IS_DEVELOPMENT(self) -> bool:
        """Check if running in development environment."""
        return settings.ENVIRONMENT.lower() == "development"
    
    @property
    def IS_TESTING(self) -> bool:
        """Check if running in testing environment."""
        return settings.TESTING or settings.ENVIRONMENT.lower() == "testing"


derived_settings = DerivedSettings()
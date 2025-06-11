"""
Database configuration and session management for TheTruthSchool.

This module sets up the SQLAlchemy engine, session factory, and provides
utilities for database operations including async support.
"""

from typing import AsyncGenerator

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings

# Create async engine
async_engine = create_async_engine(
    str(settings.DATABASE_URL),
    echo=settings.DEBUG,
    future=True,
    pool_pre_ping=True,
    pool_recycle=300,
    # For PostgreSQL in production, you might want to adjust these
    pool_size=20,
    max_overflow=0,
)

# Create sync engine for Alembic migrations
sync_engine = create_engine(
    str(settings.DATABASE_URL).replace("+asyncpg", ""),
    echo=settings.DEBUG,
    future=True,
    pool_pre_ping=True,
    pool_recycle=300,
)

# Create async session factory
AsyncSessionLocal = sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)

# Create sync session factory for migrations
SessionLocal = sessionmaker(
    bind=sync_engine,
    autoflush=False,
    autocommit=False,
)

# Create declarative base for models
Base = declarative_base()


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency function to get async database session.
    
    This function creates a new database session for each request
    and ensures it's properly closed after use.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


def get_sync_session():
    """
    Get synchronous database session for migrations and initial setup.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def create_tables():
    """
    Create all database tables.
    
    This function is called during application startup to ensure
    all tables exist. In production, you should use Alembic migrations instead.
    """
    # Import all models to ensure they're registered
    from app.models.user import User  # noqa
    from app.models.challenge import Challenge, TestCase, Submission  # noqa
    from app.models.interview import Interview, InterviewSession, InterviewQuestion  # noqa
    from app.models.resume import Resume, ResumeReview  # noqa
    from app.models.test import Test, Question, TestAttempt, Answer  # noqa
    from app.models.feedback import Feedback, CategoryScore  # noqa
    
    async with async_engine.begin() as conn:
        # In development, you might want to drop and recreate tables
        if settings.DEBUG and settings.ENVIRONMENT == "development":
            await conn.run_sync(Base.metadata.drop_all)
        
        await conn.run_sync(Base.metadata.create_all)


async def drop_tables():
    """
    Drop all database tables.
    
    This function is useful for testing and development.
    """
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


# Database utilities
class DatabaseManager:
    """Database management utilities."""
    
    @staticmethod
    async def health_check() -> bool:
        """
        Check if database connection is healthy.
        
        Returns:
            bool: True if database is accessible, False otherwise.
        """
        try:
            async with AsyncSessionLocal() as session:
                await session.execute("SELECT 1")
                return True
        except Exception:
            return False
    
    @staticmethod
    async def get_db_info() -> dict:
        """
        Get database information for monitoring.
        
        Returns:
            dict: Database connection information.
        """
        try:
            async with AsyncSessionLocal() as session:
                result = await session.execute("""
                    SELECT 
                        version() as version,
                        current_database() as database,
                        current_user as user,
                        inet_server_addr() as host,
                        inet_server_port() as port
                """)
                row = result.fetchone()
                return {
                    "status": "connected",
                    "version": row.version if row else "unknown",
                    "database": row.database if row else "unknown",
                    "user": row.user if row else "unknown",
                    "host": row.host if row else "unknown",
                    "port": row.port if row else "unknown",
                }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }


# For testing purposes
class TestingSessionLocal:
    """Testing database session for unit tests."""
    
    def __init__(self):
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        
        # Use in-memory SQLite for testing
        self.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        
        self.SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=self.engine
        )
        
        # Create tables
        Base.metadata.create_all(bind=self.engine)
    
    def get_session(self):
        """Get test database session."""
        db = self.SessionLocal()
        try:
            yield db
        finally:
            db.close()
    
    def cleanup(self):
        """Clean up test database."""
        Base.metadata.drop_all(bind=self.engine)


# Export commonly used items
__all__ = [
    "Base",
    "async_engine",
    "sync_engine",
    "AsyncSessionLocal",
    "SessionLocal",
    "get_async_session",
    "get_sync_session",
    "create_tables",
    "drop_tables",
    "DatabaseManager",
    "TestingSessionLocal",
]
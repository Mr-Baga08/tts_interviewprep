"""
TheTruthSchool FastAPI Backend Application

This is the main entry point for the TheTruthSchool backend API.
It sets up the FastAPI application, middleware, routes, and integrations.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

import structlog
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api.v1.api import api_router
from app.core.config import settings
from app.core.database import create_tables
from app.core.security import get_current_user

# Configure structured logging
logger = structlog.get_logger(__name__)


def get_limiter_key(request: Request) -> str:
    """Get rate limiting key based on user or IP address."""
    # Try to get user ID from token for authenticated requests
    try:
        user = get_current_user(request)
        if user:
            return f"user_{user.id}"
    except Exception:
        pass
    
    # Fall back to IP address
    return get_remote_address(request)


# Initialize rate limiter
limiter = Limiter(
    key_func=get_limiter_key,
    default_limits=["100/minute", "1000/hour"]
)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan manager for startup and shutdown events.
    """
    # Startup
    logger.info("Starting TheTruthSchool backend application")
    
    try:
        # Create database tables
        await create_tables()
        logger.info("Database tables created successfully")
        
        # Initialize other services here if needed
        # await initialize_livekit_service()
        # await initialize_ai_services()
        
        logger.info("Application startup completed")
        
        yield
        
    except Exception as e:
        logger.error("Failed to start application", error=str(e))
        raise
    finally:
        # Shutdown
        logger.info("Shutting down TheTruthSchool backend application")
        # Cleanup code here if needed


# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="TheTruthSchool - Comprehensive Job Preparation Platform API",
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

# Add rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add trusted host middleware (security)
if settings.ALLOWED_HOSTS:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.ALLOWED_HOSTS
    )

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def logging_middleware(request: Request, call_next) -> Response:
    """Add request/response logging middleware."""
    # Log request
    logger.info(
        "Request received",
        method=request.method,
        url=str(request.url),
        headers=dict(request.headers),
        client_ip=get_remote_address(request)
    )
    
    # Process request
    response = await call_next(request)
    
    # Log response
    logger.info(
        "Response sent",
        status_code=response.status_code,
        method=request.method,
        url=str(request.url)
    )
    
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Global exception handler for unhandled errors."""
    logger.error(
        "Unhandled exception occurred",
        error=str(exc),
        method=request.method,
        url=str(request.url),
        exc_info=True
    )
    
    if settings.DEBUG:
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Internal server error",
                "error": str(exc),
                "type": type(exc).__name__
            }
        )
    
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check() -> dict:
    """Health check endpoint for monitoring and load balancers."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }


# Root endpoint
@app.get("/", tags=["Root"])
async def root() -> dict:
    """Root endpoint with basic API information."""
    return {
        "message": "Welcome to TheTruthSchool API",
        "version": settings.VERSION,
        "docs_url": "/docs" if settings.DEBUG else "Documentation available to authenticated users",
        "health_check": "/health"
    }


# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info" if not settings.DEBUG else "debug"
    )
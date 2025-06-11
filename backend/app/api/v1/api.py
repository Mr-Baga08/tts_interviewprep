"""
Main API router for TheTruthSchool backend.

This module combines all API endpoints and provides the main router
for the FastAPI application.
"""

from fastapi import APIRouter

from app.api.v1 import (
    auth,
    users,
    challenges,
    interviews,
    resumes,
    tests,
    feedback,
    analytics,
    admin,
)

# Create main API router
api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"]
)

api_router.include_router(
    users.router,
    prefix="/users",
    tags=["Users"]
)

api_router.include_router(
    challenges.router,
    prefix="/challenges",
    tags=["Coding Challenges"]
)

api_router.include_router(
    interviews.router,
    prefix="/interviews",
    tags=["Mock Interviews"]
)

api_router.include_router(
    resumes.router,
    prefix="/resumes",
    tags=["Resume Management"]
)

api_router.include_router(
    tests.router,
    prefix="/tests",
    tags=["Mock Tests"]
)

api_router.include_router(
    feedback.router,
    prefix="/feedback",
    tags=["Feedback & Analytics"]
)

api_router.include_router(
    analytics.router,
    prefix="/analytics",
    tags=["Analytics"]
)

api_router.include_router(
    admin.router,
    prefix="/admin",
    tags=["Administration"]
)
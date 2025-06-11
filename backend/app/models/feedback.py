"""
Feedback models for TheTruthSchool comprehensive feedback system.

This module defines models for aggregating and analyzing user performance
across all platform activities to provide personalized improvement suggestions.
"""

import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    Float,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class FeedbackType(str, Enum):
    """Types of feedback generated."""
    OVERALL_ASSESSMENT = "overall_assessment"
    SKILL_SPECIFIC = "skill_specific"
    IMPROVEMENT_PLAN = "improvement_plan"
    INTERVIEW_SPECIFIC = "interview_specific"
    CODING_SPECIFIC = "coding_specific"
    RESUME_SPECIFIC = "resume_specific"


class PerformanceLevel(str, Enum):
    """Overall performance levels."""
    BEGINNER = "beginner"
    DEVELOPING = "developing"
    PROFICIENT = "proficient"
    ADVANCED = "advanced"
    EXPERT = "expert"


class FeedbackStatus(str, Enum):
    """Feedback generation status."""
    PENDING = "pending"
    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"


class CategoryType(str, Enum):
    """Categories for scoring and feedback."""
    TECHNICAL_SKILLS = "technical_skills"
    BEHAVIORAL_SKILLS = "behavioral_skills"
    COMMUNICATION = "communication"
    PROBLEM_SOLVING = "problem_solving"
    RESUME_QUALITY = "resume_quality"
    INTERVIEW_PERFORMANCE = "interview_performance"
    CODING_ABILITY = "coding_ability"
    TEST_PERFORMANCE = "test_performance"


class Feedback(Base):
    """
    Comprehensive user feedback model.
    
    Aggregates performance data from all platform activities
    to provide holistic improvement suggestions.
    """
    
    __tablename__ = "feedback"
    
    id: UUID = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: UUID = Column(
        UUID(as_uuid=True), 
        nullable=False,
        index=True
    )
    
    # Feedback metadata
    feedback_type: FeedbackType = Column(SQLEnum(FeedbackType), nullable=False)
    title: str = Column(String(255), nullable=False)
    summary: str = Column(Text, nullable=True)
    
    # Overall assessment
    overall_score: float = Column(Float, nullable=False)  # 0-100
    performance_level: PerformanceLevel = Column(SQLEnum(PerformanceLevel), nullable=False)
    readiness_score: float = Column(Float, nullable=True)  # Job readiness 0-100
    confidence_level: str = Column(String(20), nullable=True)  # low, medium, high
    
    # AI-generated content
    ai_summary: str = Column(Text, nullable=True)
    key_insights: list = Column(JSON, default=list)
    strengths: list = Column(JSON, default=list)
    areas_for_improvement: list = Column(JSON, default=list)
    
    # Improvement recommendations
    improvement_priority: str = Column(String(50), nullable=True)  # technical, behavioral, etc.
    specific_recommendations: list = Column(JSON, default=list)
    next_steps: list = Column(JSON, default=list)
    estimated_improvement_time: dict = Column(JSON, default=dict)  # area -> weeks
    
    # Data sources used
    data_sources: dict = Column(JSON, default=dict)  # What data was analyzed
    analysis_period: dict = Column(JSON, default=dict)  # Start/end dates of data
    
    # Processing metadata
    status: FeedbackStatus = Column(SQLEnum(FeedbackStatus), default=FeedbackStatus.PENDING)
    ai_model_used: str = Column(String(100), nullable=True)
    processing_time: float = Column(Float, nullable=True)  # seconds
    confidence_score: float = Column(Float, nullable=True)  # AI confidence 0-1
    
    # Timestamps
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: datetime = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )
    generated_at: datetime = Column(DateTime, nullable=True)
    
    # Relationships
    category_scores = relationship("CategoryScore", back_populates="feedback", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('idx_feedback_user_type', 'user_id', 'feedback_type'),
        Index('idx_feedback_user_created', 'user_id', 'created_at'),
    )
    
    def __repr__(self) -> str:
        return f"<Feedback {self.feedback_type} for {self.user_id}>"
    
    def start_generation(self) -> None:
        """Mark feedback generation as started."""
        self.status = FeedbackStatus.GENERATING
    
    def complete_generation(self) -> None:
        """Mark feedback generation as completed."""
        self.status = FeedbackStatus.COMPLETED
        self.generated_at = datetime.utcnow()
    
    def fail_generation(self, error: str) -> None:
        """Mark feedback generation as failed."""
        self.status = FeedbackStatus.FAILED
        self.ai_summary = f"Feedback generation failed: {error}"
    
    def get_category_score(self, category: CategoryType) -> Optional[float]:
        """Get score for a specific category."""
        for score in self.category_scores:
            if score.category == category:
                return score.score
        return None
    
    def get_top_strengths(self, limit: int = 3) -> list:
        """Get top strengths with scores if available."""
        strengths_with_scores = []
        
        for strength in self.strengths[:limit]:
            # Try to find related category score
            related_score = None
            for category_score in self.category_scores:
                if any(keyword in strength.lower() for keyword in category_score.keywords):
                    related_score = category_score.score
                    break
            
            strengths_with_scores.append({
                "text": strength,
                "score": related_score
            })
        
        return strengths_with_scores
    
    def get_improvement_roadmap(self) -> dict:
        """Get structured improvement roadmap."""
        return {
            "priority_area": self.improvement_priority,
            "current_level": self.performance_level.value,
            "target_score": min(self.overall_score + 20, 100),
            "recommendations": self.specific_recommendations,
            "next_steps": self.next_steps,
            "estimated_time": self.estimated_improvement_time
        }


class CategoryScore(Base):
    """
    Individual category scores within feedback.
    
    Breaks down performance into specific skill areas
    with detailed analysis and recommendations.
    """
    
    __tablename__ = "category_scores"
    
    id: UUID = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    feedback_id: UUID = Column(
        UUID(as_uuid=True), 
        ForeignKey("feedback.id", ondelete="CASCADE"), 
        nullable=False,
        index=True
    )
    
    # Category details
    category: CategoryType = Column(SQLEnum(CategoryType), nullable=False)
    subcategory: str = Column(String(100), nullable=True)
    score: float = Column(Float, nullable=False)  # 0-100
    
    # Analysis details
    description: str = Column(Text, nullable=True)
    strengths: list = Column(JSON, default=list)
    weaknesses: list = Column(JSON, default=list)
    recommendations: list = Column(JSON, default=list)
    
    # Data supporting this score
    supporting_data: dict = Column(JSON, default=dict)
    data_points_count: int = Column(Integer, default=0)
    confidence_level: float = Column(Float, nullable=True)  # 0-1
    
    # Comparison data
    peer_average: float = Column(Float, nullable=True)  # How user compares to peers
    improvement_since_last: float = Column(Float, nullable=True)  # Change from last assessment
    
    # Keywords for matching with other content
    keywords: list = Column(JSON, default=list)
    
    # Timestamps
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: datetime = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )
    
    # Relationships
    feedback = relationship("Feedback", back_populates="category_scores")
    
    def __repr__(self) -> str:
        return f"<CategoryScore {self.category} = {self.score}>"
    
    def get_performance_level(self) -> str:
        """Get performance level for this category."""
        if self.score >= 90:
            return "excellent"
        elif self.score >= 80:
            return "good"
        elif self.score >= 70:
            return "satisfactory"
        elif self.score >= 60:
            return "needs_improvement"
        else:
            return "poor"
    
    def get_grade(self) -> str:
        """Get letter grade for this category."""
        if self.score >= 90:
            return "A"
        elif self.score >= 80:
            return "B"
        elif self.score >= 70:
            return "C"
        elif self.score >= 60:
            return "D"
        else:
            return "F"


class SkillProgress(Base):
    """
    Long-term skill progression tracking.
    
    Tracks how user skills develop over time across
    all platform activities.
    """
    
    __tablename__ = "skill_progress"
    
    id: UUID = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: UUID = Column(
        UUID(as_uuid=True), 
        nullable=False,
        index=True
    )
    
    # Skill identification
    skill_name: str = Column(String(255), nullable=False, index=True)
    skill_category: str = Column(String(100), nullable=True)
    
    # Current proficiency
    current_level: float = Column(Float, nullable=False)  # 0-100
    previous_level: float = Column(Float, nullable=True)
    target_level: float = Column(Float, nullable=True)
    
    # Progression data
    total_practice_time: int = Column(Integer, default=0)  # minutes
    activities_completed: int = Column(Integer, default=0)
    last_activity_date: datetime = Column(DateTime, nullable=True)
    
    # Performance metrics
    success_rate: float = Column(Float, default=0.0)  # 0-100
    improvement_rate: float = Column(Float, default=0.0)  # Points per week
    consistency_score: float = Column(Float, default=0.0)  # Regular practice score
    
    # Milestone tracking
    milestones_achieved: list = Column(JSON, default=list)
    next_milestone: dict = Column(JSON, default=dict)
    
    # Evidence and data sources
    evidence_sources: list = Column(JSON, default=list)  # Which activities contributed
    confidence_score: float = Column(Float, default=0.5)  # How confident in this assessment
    
    # Timestamps
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: datetime = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )
    last_assessed_at: datetime = Column(DateTime, nullable=True)
    
    # Unique constraint - one skill progress per user per skill
    __table_args__ = (
        Index('idx_unique_user_skill', 'user_id', 'skill_name', unique=True),
        Index('idx_skill_progress_user', 'user_id', 'current_level'),
    )
    
    def __repr__(self) -> str:
        return f"<SkillProgress {self.skill_name} = {self.current_level} for {self.user_id}>"
    
    def update_level(self, new_level: float, source: str) -> None:
        """Update skill level with new evidence."""
        self.previous_level = self.current_level
        self.current_level = new_level
        self.last_assessed_at = datetime.utcnow()
        
        # Add evidence source
        if not self.evidence_sources:
            self.evidence_sources = []
        
        self.evidence_sources.append({
            "source": source,
            "level": new_level,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Calculate improvement rate (points per week)
        if self.previous_level is not None and self.created_at:
            weeks_elapsed = (datetime.utcnow() - self.created_at).days / 7
            if weeks_elapsed > 0:
                self.improvement_rate = (new_level - self.previous_level) / weeks_elapsed
    
    def add_practice_time(self, minutes: int) -> None:
        """Add practice time for this skill."""
        self.total_practice_time += minutes
        self.last_activity_date = datetime.utcnow()
        self.activities_completed += 1
    
    def get_proficiency_label(self) -> str:
        """Get human-readable proficiency level."""
        if self.current_level >= 90:
            return "Expert"
        elif self.current_level >= 80:
            return "Advanced"
        elif self.current_level >= 70:
            return "Proficient"
        elif self.current_level >= 60:
            return "Intermediate"
        elif self.current_level >= 40:
            return "Developing"
        else:
            return "Beginner"
    
    def get_trend_direction(self) -> str:
        """Get trend direction for this skill."""
        if self.previous_level is None:
            return "new"
        elif self.current_level > self.previous_level + 5:
            return "improving"
        elif self.current_level < self.previous_level - 5:
            return "declining"
        else:
            return "stable"


class ImprovementPlan(Base):
    """
    Personalized improvement plans for users.
    
    AI-generated actionable plans based on comprehensive
    analysis of user performance across all activities.
    """
    
    __tablename__ = "improvement_plans"
    
    id: UUID = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: UUID = Column(
        UUID(as_uuid=True), 
        nullable=False,
        index=True
    )
    feedback_id: UUID = Column(
        UUID(as_uuid=True), 
        ForeignKey("feedback.id"), 
        nullable=True,
        index=True
    )
    
    # Plan details
    title: str = Column(String(255), nullable=False)
    description: str = Column(Text, nullable=True)
    plan_type: str = Column(String(100), nullable=True)  # skill-specific, overall, etc.
    
    # Goals and objectives
    primary_goal: str = Column(String(255), nullable=False)
    secondary_goals: list = Column(JSON, default=list)
    target_improvements: dict = Column(JSON, default=dict)  # skill -> target level
    
    # Timeline
    estimated_duration_weeks: int = Column(Integer, nullable=True)
    milestone_schedule: list = Column(JSON, default=list)
    
    # Action items
    immediate_actions: list = Column(JSON, default=list)  # Things to do this week
    short_term_actions: list = Column(JSON, default=list)  # Next 2-4 weeks
    long_term_actions: list = Column(JSON, default=list)  # Beyond 1 month
    
    # Recommended resources
    platform_resources: list = Column(JSON, default=list)  # Internal challenges, tests, etc.
    external_resources: list = Column(JSON, default=list)  # Books, courses, etc.
    practice_schedule: dict = Column(JSON, default=dict)  # Weekly practice recommendations
    
    # Progress tracking
    is_active: bool = Column(Boolean, default=True)
    completion_percentage: float = Column(Float, default=0.0)
    actions_completed: int = Column(Integer, default=0)
    total_actions: int = Column(Integer, default=0)
    
    # Success metrics
    success_criteria: list = Column(JSON, default=list)
    progress_indicators: dict = Column(JSON, default=dict)
    
    # AI generation metadata
    ai_confidence: float = Column(Float, nullable=True)
    personalization_factors: list = Column(JSON, default=list)
    
    # Timestamps
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: datetime = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )
    started_at: datetime = Column(DateTime, nullable=True)
    target_completion_date: datetime = Column(DateTime, nullable=True)
    
    def __repr__(self) -> str:
        return f"<ImprovementPlan {self.title} for {self.user_id}>"
    
    def start_plan(self) -> None:
        """Mark plan as started."""
        self.is_active = True
        self.started_at = datetime.utcnow()
        
        if self.estimated_duration_weeks:
            from datetime import timedelta
            self.target_completion_date = self.started_at + timedelta(weeks=self.estimated_duration_weeks)
    
    def mark_action_completed(self, action_id: str) -> None:
        """Mark a specific action as completed."""
        self.actions_completed += 1
        
        # Update completion percentage
        if self.total_actions > 0:
            self.completion_percentage = (self.actions_completed / self.total_actions) * 100
    
    def get_current_phase(self) -> str:
        """Get current phase of the improvement plan."""
        if self.completion_percentage < 25:
            return "getting_started"
        elif self.completion_percentage < 50:
            return "building_momentum"
        elif self.completion_percentage < 75:
            return "making_progress"
        elif self.completion_percentage < 100:
            return "nearly_complete"
        else:
            return "completed"
    
    def get_next_actions(self, limit: int = 3) -> list:
        """Get next recommended actions to take."""
        # This would typically look at the current phase and return
        # appropriate actions from immediate_actions or short_term_actions
        
        if self.completion_percentage < 25:
            return self.immediate_actions[:limit]
        elif self.completion_percentage < 75:
            return self.short_term_actions[:limit]
        else:
            return self.long_term_actions[:limit]
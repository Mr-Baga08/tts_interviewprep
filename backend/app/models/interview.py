"""
Interview models for TheTruthSchool mock interviews.

This module defines models for interview sessions, questions, and AI-driven
real-time interviews using LiveKit integration.
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


class InterviewType(str, Enum):
    """Types of mock interviews."""
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"
    MIXED = "mixed"
    SYSTEM_DESIGN = "system_design"
    CODING = "coding"
    RESUME_BASED = "resume_based"


class InterviewMode(str, Enum):
    """Interview communication modes."""
    VOICE = "voice"
    TEXT = "text"
    VIDEO = "video"


class InterviewStatus(str, Enum):
    """Interview session status."""
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    FAILED = "failed"


class QuestionDifficulty(str, Enum):
    """Interview question difficulty levels."""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    EXPERT = "expert"


class InterviewTemplate(Base):
    """
    Interview template model.
    
    Defines reusable interview formats with predefined questions
    and structure for different roles and experience levels.
    """
    
    __tablename__ = "interview_templates"
    
    id: UUID = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Template identification
    name: str = Column(String(255), nullable=False)
    description: str = Column(Text, nullable=True)
    
    # Target configuration
    target_role: str = Column(String(100), nullable=True)
    experience_level: str = Column(String(20), nullable=True)
    industry: str = Column(String(100), nullable=True)
    
    # Interview configuration
    interview_type: InterviewType = Column(SQLEnum(InterviewType), nullable=False)
    estimated_duration: int = Column(Integer, default=30)  # minutes
    question_count: int = Column(Integer, default=5)
    
    # Question distribution
    technical_percentage: int = Column(Integer, default=50)  # % of technical questions
    behavioral_percentage: int = Column(Integer, default=50)  # % of behavioral questions
    
    # Template settings
    is_active: bool = Column(Boolean, default=True)
    is_public: bool = Column(Boolean, default=False)
    difficulty_level: QuestionDifficulty = Column(SQLEnum(QuestionDifficulty), default=QuestionDifficulty.MEDIUM)
    
    # AI configuration
    ai_persona: dict = Column(JSON, default=dict)  # AI interviewer personality settings
    custom_instructions: str = Column(Text, nullable=True)
    
    # Metadata
    created_by: UUID = Column(UUID(as_uuid=True), nullable=True)
    tags: list = Column(JSON, default=list)
    
    # Timestamps
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: datetime = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )
    
    # Relationships
    questions = relationship("InterviewQuestion", back_populates="template", cascade="all, delete-orphan")
    interviews = relationship("Interview", back_populates="template")
    
    def __repr__(self) -> str:
        return f"<InterviewTemplate {self.name} ({self.interview_type})>"


class InterviewQuestion(Base):
    """
    Individual interview questions for templates.
    
    Stores questions that can be used in interviews, categorized
    by type, difficulty, and topic.
    """
    
    __tablename__ = "interview_questions"
    
    id: UUID = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id: UUID = Column(
        UUID(as_uuid=True), 
        ForeignKey("interview_templates.id", ondelete="CASCADE"), 
        nullable=True,
        index=True
    )
    
    # Question content
    question_text: str = Column(Text, nullable=False)
    expected_answer: str = Column(Text, nullable=True)
    answer_guidelines: str = Column(Text, nullable=True)
    
    # Question categorization
    question_type: InterviewType = Column(SQLEnum(InterviewType), nullable=False)
    difficulty: QuestionDifficulty = Column(SQLEnum(QuestionDifficulty), default=QuestionDifficulty.MEDIUM)
    category: str = Column(String(100), nullable=True)  # e.g., "algorithms", "leadership"
    subcategory: str = Column(String(100), nullable=True)
    
    # Question metadata
    estimated_time: int = Column(Integer, default=5)  # minutes
    skills_assessed: list = Column(JSON, default=list)  # List of skills
    tags: list = Column(JSON, default=list)
    
    # AI-specific settings
    follow_up_questions: list = Column(JSON, default=list)
    evaluation_criteria: dict = Column(JSON, default=dict)
    
    # Usage tracking
    usage_count: int = Column(Integer, default=0)
    average_rating: float = Column(Float, default=0.0)
    
    # Status
    is_active: bool = Column(Boolean, default=True)
    order_index: int = Column(Integer, default=0)
    
    # Timestamps
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: datetime = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )
    
    # Relationships
    template = relationship("InterviewTemplate", back_populates="questions")
    session_questions = relationship("InterviewSessionQuestion", back_populates="question")
    
    def __repr__(self) -> str:
        return f"<InterviewQuestion {self.question_type} ({self.difficulty})>"
    
    def increment_usage(self) -> None:
        """Increment usage count."""
        self.usage_count += 1


class Interview(Base):
    """
    Interview instance model.
    
    Represents a specific interview session for a user,
    either scheduled or completed.
    """
    
    __tablename__ = "interviews"
    
    id: UUID = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: UUID = Column(
        UUID(as_uuid=True), 
        nullable=False,
        index=True
    )
    template_id: UUID = Column(
        UUID(as_uuid=True), 
        ForeignKey("interview_templates.id"), 
        nullable=True,
        index=True
    )
    
    # Interview configuration
    title: str = Column(String(255), nullable=False)
    description: str = Column(Text, nullable=True)
    interview_type: InterviewType = Column(SQLEnum(InterviewType), nullable=False)
    interview_mode: InterviewMode = Column(SQLEnum(InterviewMode), default=InterviewMode.VOICE)
    
    # Scheduling
    scheduled_at: datetime = Column(DateTime, nullable=True)
    estimated_duration: int = Column(Integer, default=30)  # minutes
    
    # Target role information
    target_role: str = Column(String(100), nullable=True)
    target_company: str = Column(String(100), nullable=True)
    experience_level: str = Column(String(20), nullable=True)
    
    # Custom configuration
    tech_stack: list = Column(JSON, default=list)
    focus_areas: list = Column(JSON, default=list)
    custom_instructions: str = Column(Text, nullable=True)
    
    # Status and metadata
    status: InterviewStatus = Column(SQLEnum(InterviewStatus), default=InterviewStatus.SCHEDULED)
    is_practice: bool = Column(Boolean, default=True)
    difficulty_level: QuestionDifficulty = Column(SQLEnum(QuestionDifficulty), default=QuestionDifficulty.MEDIUM)
    
    # Resume integration
    resume_id: UUID = Column(UUID(as_uuid=True), nullable=True)
    use_resume_context: bool = Column(Boolean, default=False)
    
    # Timestamps
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: datetime = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )
    
    # Relationships
    template = relationship("InterviewTemplate", back_populates="interviews")
    sessions = relationship("InterviewSession", back_populates="interview", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Interview {self.title} for {self.user_id}>"


class InterviewSession(Base):
    """
    Live interview session model.
    
    Tracks the actual execution of an interview with real-time
    data, LiveKit integration, and AI interaction.
    """
    
    __tablename__ = "interview_sessions"
    
    id: UUID = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    interview_id: UUID = Column(
        UUID(as_uuid=True), 
        ForeignKey("interviews.id", ondelete="CASCADE"), 
        nullable=False,
        index=True
    )
    
    # LiveKit integration
    livekit_room_name: str = Column(String(255), nullable=True, unique=True)
    livekit_token: str = Column(Text, nullable=True)
    participant_id: str = Column(String(255), nullable=True)
    
    # Session execution
    started_at: datetime = Column(DateTime, nullable=True)
    ended_at: datetime = Column(DateTime, nullable=True)
    actual_duration: int = Column(Integer, nullable=True)  # seconds
    
    # AI agent information
    ai_agent_id: str = Column(String(255), nullable=True)
    ai_agent_config: dict = Column(JSON, default=dict)
    
    # Recording and transcript
    recording_url: str = Column(String(500), nullable=True)
    transcript: str = Column(Text, nullable=True)
    transcript_confidence: float = Column(Float, nullable=True)
    
    # Session metadata
    connection_quality: str = Column(String(20), nullable=True)  # poor, fair, good, excellent
    technical_issues: list = Column(JSON, default=list)
    user_feedback: str = Column(Text, nullable=True)
    
    # Network and device info
    ip_address: str = Column(String(45), nullable=True)
    user_agent: str = Column(Text, nullable=True)
    device_info: dict = Column(JSON, default=dict)
    
    # Timestamps
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: datetime = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )
    
    # Relationships
    interview = relationship("Interview", back_populates="sessions")
    questions = relationship("InterviewSessionQuestion", back_populates="session", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<InterviewSession {self.id} for interview {self.interview_id}>"
    
    @property
    def is_active(self) -> bool:
        """Check if session is currently active."""
        return self.started_at is not None and self.ended_at is None
    
    @property
    def duration_minutes(self) -> Optional[float]:
        """Get session duration in minutes."""
        if self.actual_duration:
            return self.actual_duration / 60
        return None
    
    def start_session(self) -> None:
        """Mark session as started."""
        self.started_at = datetime.utcnow()
    
    def end_session(self) -> None:
        """Mark session as ended and calculate duration."""
        if self.started_at:
            self.ended_at = datetime.utcnow()
            self.actual_duration = int((self.ended_at - self.started_at).total_seconds())


class InterviewSessionQuestion(Base):
    """
    Questions asked during a specific interview session.
    
    Tracks which questions were asked, responses given,
    and AI evaluation of answers.
    """
    
    __tablename__ = "interview_session_questions"
    
    id: UUID = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: UUID = Column(
        UUID(as_uuid=True), 
        ForeignKey("interview_sessions.id", ondelete="CASCADE"), 
        nullable=False,
        index=True
    )
    question_id: UUID = Column(
        UUID(as_uuid=True), 
        ForeignKey("interview_questions.id"), 
        nullable=True,
        index=True
    )
    
    # Question details (stored in case question is modified later)
    question_text: str = Column(Text, nullable=False)
    question_type: InterviewType = Column(SQLEnum(InterviewType), nullable=False)
    
    # User response
    user_answer: str = Column(Text, nullable=True)
    answer_duration: int = Column(Integer, nullable=True)  # seconds
    
    # AI evaluation
    ai_score: float = Column(Float, nullable=True)  # 0-100
    ai_feedback: str = Column(Text, nullable=True)
    evaluation_criteria: dict = Column(JSON, default=dict)
    
    # Detailed scoring
    clarity_score: float = Column(Float, nullable=True)
    relevance_score: float = Column(Float, nullable=True)
    depth_score: float = Column(Float, nullable=True)
    confidence_score: float = Column(Float, nullable=True)
    
    # Question timing
    asked_at: datetime = Column(DateTime, nullable=True)
    answered_at: datetime = Column(DateTime, nullable=True)
    order_index: int = Column(Integer, default=0)
    
    # Follow-up questions
    follow_up_questions: list = Column(JSON, default=list)
    follow_up_answers: list = Column(JSON, default=list)
    
    # Timestamps
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: datetime = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )
    
    # Relationships
    session = relationship("InterviewSession", back_populates="questions")
    question = relationship("InterviewQuestion", back_populates="session_questions")
    
    def __repr__(self) -> str:
        return f"<InterviewSessionQuestion {self.session_id} Q{self.order_index}>"
    
    @property
    def response_time_seconds(self) -> Optional[int]:
        """Calculate response time in seconds."""
        if self.asked_at and self.answered_at:
            return int((self.answered_at - self.asked_at).total_seconds())
        return None
    
    def calculate_overall_score(self) -> float:
        """Calculate overall score from individual metrics."""
        scores = [
            self.clarity_score,
            self.relevance_score,
            self.depth_score,
            self.confidence_score
        ]
        valid_scores = [s for s in scores if s is not None]
        
        if valid_scores:
            return sum(valid_scores) / len(valid_scores)
        return 0.0


class InterviewFeedback(Base):
    """
    Comprehensive feedback for completed interviews.
    
    Stores AI-generated analysis and recommendations
    based on the entire interview session.
    """
    
    __tablename__ = "interview_feedback"
    
    id: UUID = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: UUID = Column(
        UUID(as_uuid=True), 
        ForeignKey("interview_sessions.id", ondelete="CASCADE"), 
        nullable=False,
        unique=True,
        index=True
    )
    
    # Overall assessment
    overall_score: float = Column(Float, nullable=False)  # 0-100
    performance_level: str = Column(String(20), nullable=True)  # poor, fair, good, excellent
    readiness_score: float = Column(Float, nullable=True)  # 0-100
    
    # Category scores
    technical_score: float = Column(Float, nullable=True)
    behavioral_score: float = Column(Float, nullable=True)
    communication_score: float = Column(Float, nullable=True)
    problem_solving_score: float = Column(Float, nullable=True)
    
    # Detailed feedback
    strengths: list = Column(JSON, default=list)
    areas_for_improvement: list = Column(JSON, default=list)
    key_takeaways: list = Column(JSON, default=list)
    specific_recommendations: list = Column(JSON, default=list)
    
    # AI analysis
    ai_summary: str = Column(Text, nullable=True)
    confidence_assessment: str = Column(Text, nullable=True)
    speaking_pace_analysis: dict = Column(JSON, default=dict)
    vocabulary_analysis: dict = Column(JSON, default=dict)
    
    # Next steps
    suggested_practice_areas: list = Column(JSON, default=list)
    recommended_resources: list = Column(JSON, default=list)
    next_interview_suggestions: dict = Column(JSON, default=dict)
    
    # Metadata
    feedback_version: str = Column(String(10), default="1.0")
    processing_time: float = Column(Float, nullable=True)  # seconds
    
    # Timestamps
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: datetime = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )
    
    # Relationships
    session = relationship("InterviewSession", backref="feedback")
    
    def __repr__(self) -> str:
        return f"<InterviewFeedback {self.session_id} score={self.overall_score}>"
    
    def get_letter_grade(self) -> str:
        """Convert overall score to letter grade."""
        if self.overall_score >= 90:
            return "A"
        elif self.overall_score >= 80:
            return "B"
        elif self.overall_score >= 70:
            return "C"
        elif self.overall_score >= 60:
            return "D"
        else:
            return "F"
    
    def get_performance_summary(self) -> dict:
        """Get a summary of performance across all categories."""
        return {
            "overall": self.overall_score,
            "technical": self.technical_score,
            "behavioral": self.behavioral_score,
            "communication": self.communication_score,
            "problem_solving": self.problem_solving_score,
            "readiness": self.readiness_score,
            "grade": self.get_letter_grade()
        }
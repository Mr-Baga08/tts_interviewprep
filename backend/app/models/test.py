"""
Test models for TheTruthSchool mock tests and assessments.

This module defines models for various types of tests, questions,
and user attempts with detailed analytics.
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


class TestType(str, Enum):
    """Types of tests available."""
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"
    APTITUDE = "aptitude"
    PERSONALITY = "personality"
    DOMAIN_SPECIFIC = "domain_specific"
    MIXED = "mixed"


class QuestionType(str, Enum):
    """Types of questions in tests."""
    MULTIPLE_CHOICE = "multiple_choice"
    MULTIPLE_SELECT = "multiple_select"
    TRUE_FALSE = "true_false"
    SHORT_ANSWER = "short_answer"
    ESSAY = "essay"
    CODE_SNIPPET = "code_snippet"
    MATCHING = "matching"
    ORDERING = "ordering"


class TestDifficulty(str, Enum):
    """Test difficulty levels."""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class TestStatus(str, Enum):
    """Test publishing status."""
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class AttemptStatus(str, Enum):
    """Test attempt status."""
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"
    TIMEOUT = "timeout"


class Test(Base):
    """
    Test model for creating and managing assessments.
    
    Supports various question types and comprehensive analytics.
    """
    
    __tablename__ = "tests"
    
    id: UUID = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Test identification
    title: str = Column(String(255), nullable=False)
    slug: str = Column(String(255), nullable=False, unique=True, index=True)
    description: str = Column(Text, nullable=True)
    instructions: str = Column(Text, nullable=True)
    
    # Test configuration
    test_type: TestType = Column(SQLEnum(TestType), nullable=False, index=True)
    difficulty: TestDifficulty = Column(SQLEnum(TestDifficulty), default=TestDifficulty.INTERMEDIATE)
    
    # Timing and attempts
    time_limit: int = Column(Integer, nullable=True)  # minutes, None = unlimited
    max_attempts: int = Column(Integer, default=1)
    shuffle_questions: bool = Column(Boolean, default=False)
    shuffle_answers: bool = Column(Boolean, default=False)
    
    # Scoring
    total_points: float = Column(Float, default=100.0)
    passing_score: float = Column(Float, default=70.0)  # percentage
    
    # Categorization
    category: str = Column(String(100), nullable=True, index=True)
    subcategory: str = Column(String(100), nullable=True)
    tags: list = Column(JSON, default=list)
    
    # Target audience
    target_role: str = Column(String(100), nullable=True)
    target_industry: str = Column(String(100), nullable=True)
    experience_level: str = Column(String(50), nullable=True)
    
    # Content management
    status: TestStatus = Column(SQLEnum(TestStatus), default=TestStatus.DRAFT)
    is_premium: bool = Column(Boolean, default=False)
    is_proctored: bool = Column(Boolean, default=False)
    
    # Analytics
    total_attempts: int = Column(Integer, default=0)
    completed_attempts: int = Column(Integer, default=0)
    average_score: float = Column(Float, default=0.0)
    average_duration: int = Column(Integer, default=0)  # minutes
    
    # Metadata
    created_by: UUID = Column(UUID(as_uuid=True), nullable=True)
    estimated_duration: int = Column(Integer, nullable=True)  # minutes
    
    # Timestamps
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: datetime = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )
    published_at: datetime = Column(DateTime, nullable=True)
    
    # Relationships
    questions = relationship("Question", back_populates="test", cascade="all, delete-orphan")
    attempts = relationship("TestAttempt", back_populates="test")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_test_type_difficulty', 'test_type', 'difficulty'),
        Index('idx_test_status_category', 'status', 'category'),
    )
    
    def __repr__(self) -> str:
        return f"<Test {self.title} ({self.test_type})>"
    
    @property
    def completion_rate(self) -> float:
        """Calculate completion rate percentage."""
        if self.total_attempts == 0:
            return 0.0
        return (self.completed_attempts / self.total_attempts) * 100
    
    @property
    def question_count(self) -> int:
        """Get total number of questions."""
        return len(self.questions)
    
    def publish(self) -> None:
        """Publish the test."""
        self.status = TestStatus.PUBLISHED
        self.published_at = datetime.utcnow()
    
    def archive(self) -> None:
        """Archive the test."""
        self.status = TestStatus.ARCHIVED
    
    def increment_attempt_count(self, completed: bool = False) -> None:
        """Increment attempt statistics."""
        self.total_attempts += 1
        if completed:
            self.completed_attempts += 1
    
    def update_average_score(self, new_score: float) -> None:
        """Update average score with new attempt."""
        if self.completed_attempts <= 1:
            self.average_score = new_score
        else:
            # Calculate weighted average
            total_score = self.average_score * (self.completed_attempts - 1) + new_score
            self.average_score = total_score / self.completed_attempts


class Question(Base):
    """
    Individual questions within tests.
    
    Supports multiple question types with flexible answer formats.
    """
    
    __tablename__ = "questions"
    
    id: UUID = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    test_id: UUID = Column(
        UUID(as_uuid=True), 
        ForeignKey("tests.id", ondelete="CASCADE"), 
        nullable=False,
        index=True
    )
    
    # Question content
    question_text: str = Column(Text, nullable=False)
    question_type: QuestionType = Column(SQLEnum(QuestionType), nullable=False)
    
    # Additional content
    context: str = Column(Text, nullable=True)  # Additional context or code
    explanation: str = Column(Text, nullable=True)  # Explanation of correct answer
    
    # Answer options (for MCQ, MSQ, etc.)
    options: list = Column(JSON, default=list)  # List of answer options
    correct_answers: list = Column(JSON, default=list)  # List of correct answer indices/values
    
    # Scoring
    points: float = Column(Float, default=1.0)
    negative_marking: float = Column(Float, default=0.0)  # Points deducted for wrong answer
    
    # Configuration
    order_index: int = Column(Integer, default=0)
    is_required: bool = Column(Boolean, default=True)
    time_limit: int = Column(Integer, nullable=True)  # seconds per question
    
    # Categorization
    skill_category: str = Column(String(100), nullable=True)
    difficulty_level: str = Column(String(20), nullable=True)
    tags: list = Column(JSON, default=list)
    
    # Analytics
    total_attempts: int = Column(Integer, default=0)
    correct_attempts: int = Column(Integer, default=0)
    average_time: float = Column(Float, default=0.0)  # seconds
    
    # Metadata
    is_active: bool = Column(Boolean, default=True)
    
    # Timestamps
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: datetime = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )
    
    # Relationships
    test = relationship("Test", back_populates="questions")
    answers = relationship("Answer", back_populates="question")
    
    def __repr__(self) -> str:
        return f"<Question {self.test_id} ({self.question_type})>"
    
    @property
    def success_rate(self) -> float:
        """Calculate success rate percentage."""
        if self.total_attempts == 0:
            return 0.0
        return (self.correct_attempts / self.total_attempts) * 100
    
    def is_correct_answer(self, user_answer) -> bool:
        """Check if user answer is correct."""
        if self.question_type == QuestionType.MULTIPLE_CHOICE:
            return user_answer in self.correct_answers
        elif self.question_type == QuestionType.MULTIPLE_SELECT:
            return set(user_answer) == set(self.correct_answers)
        elif self.question_type == QuestionType.TRUE_FALSE:
            return user_answer == self.correct_answers[0]
        else:
            # For text-based answers, exact match for now
            # Could be enhanced with fuzzy matching or AI evaluation
            return user_answer.strip().lower() in [ans.lower() for ans in self.correct_answers]
    
    def calculate_score(self, user_answer, is_correct: bool) -> float:
        """Calculate score for user answer."""
        if is_correct:
            return self.points
        elif self.negative_marking > 0:
            return -self.negative_marking
        else:
            return 0.0
    
    def increment_attempt_stats(self, is_correct: bool, time_taken: float) -> None:
        """Update question statistics."""
        self.total_attempts += 1
        if is_correct:
            self.correct_attempts += 1
        
        # Update average time
        if self.total_attempts == 1:
            self.average_time = time_taken
        else:
            total_time = self.average_time * (self.total_attempts - 1) + time_taken
            self.average_time = total_time / self.total_attempts


class TestAttempt(Base):
    """
    User attempts at taking tests.
    
    Tracks progress, timing, and detailed results.
    """
    
    __tablename__ = "test_attempts"
    
    id: UUID = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: UUID = Column(
        UUID(as_uuid=True), 
        nullable=False,
        index=True
    )
    test_id: UUID = Column(
        UUID(as_uuid=True), 
        ForeignKey("tests.id"), 
        nullable=False,
        index=True
    )
    
    # Attempt details
    attempt_number: int = Column(Integer, default=1)
    status: AttemptStatus = Column(SQLEnum(AttemptStatus), default=AttemptStatus.IN_PROGRESS)
    
    # Timing
    started_at: datetime = Column(DateTime, nullable=False, default=datetime.utcnow)
    completed_at: datetime = Column(DateTime, nullable=True)
    time_spent: int = Column(Integer, nullable=True)  # seconds
    time_remaining: int = Column(Integer, nullable=True)  # seconds when completed
    
    # Scoring
    total_score: float = Column(Float, default=0.0)
    max_possible_score: float = Column(Float, default=0.0)
    percentage_score: float = Column(Float, default=0.0)
    passed: bool = Column(Boolean, default=False)
    
    # Progress tracking
    current_question_index: int = Column(Integer, default=0)
    questions_answered: int = Column(Integer, default=0)
    questions_correct: int = Column(Integer, default=0)
    questions_skipped: int = Column(Integer, default=0)
    
    # Question order (if shuffled)
    question_order: list = Column(JSON, default=list)
    
    # Metadata
    ip_address: str = Column(String(45), nullable=True)
    user_agent: str = Column(Text, nullable=True)
    browser_info: dict = Column(JSON, default=dict)
    
    # Proctoring data (if enabled)
    proctoring_data: dict = Column(JSON, default=dict)
    violations: list = Column(JSON, default=list)
    
    # Timestamps
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: datetime = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )
    
    # Relationships
    test = relationship("Test", back_populates="attempts")
    answers = relationship("Answer", back_populates="attempt", cascade="all, delete-orphan")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_attempt_user_test', 'user_id', 'test_id'),
        Index('idx_attempt_status_started', 'status', 'started_at'),
    )
    
    def __repr__(self) -> str:
        return f"<TestAttempt {self.user_id} test {self.test_id} #{self.attempt_number}>"
    
    @property
    def duration_minutes(self) -> Optional[float]:
        """Get attempt duration in minutes."""
        if self.time_spent:
            return self.time_spent / 60
        return None
    
    @property
    def is_active(self) -> bool:
        """Check if attempt is currently active."""
        return self.status == AttemptStatus.IN_PROGRESS
    
    @property
    def success_rate(self) -> float:
        """Calculate success rate for this attempt."""
        if self.questions_answered == 0:
            return 0.0
        return (self.questions_correct / self.questions_answered) * 100
    
    def start_attempt(self) -> None:
        """Mark attempt as started."""
        self.status = AttemptStatus.IN_PROGRESS
        self.started_at = datetime.utcnow()
    
    def complete_attempt(self) -> None:
        """Mark attempt as completed and calculate final scores."""
        self.status = AttemptStatus.COMPLETED
        self.completed_at = datetime.utcnow()
        
        if self.started_at:
            self.time_spent = int((self.completed_at - self.started_at).total_seconds())
        
        # Calculate percentage score
        if self.max_possible_score > 0:
            self.percentage_score = (self.total_score / self.max_possible_score) * 100
        
        # Check if passed
        # Assuming test has a passing_score attribute
        # self.passed = self.percentage_score >= self.test.passing_score
    
    def abandon_attempt(self) -> None:
        """Mark attempt as abandoned."""
        self.status = AttemptStatus.ABANDONED
        self.completed_at = datetime.utcnow()
    
    def timeout_attempt(self) -> None:
        """Mark attempt as timed out."""
        self.status = AttemptStatus.TIMEOUT
        self.completed_at = datetime.utcnow()
    
    def calculate_final_score(self) -> None:
        """Calculate final score from all answers."""
        total = 0.0
        max_possible = 0.0
        correct_count = 0
        
        for answer in self.answers:
            total += answer.score_earned
            max_possible += answer.question.points
            if answer.is_correct:
                correct_count += 1
        
        self.total_score = total
        self.max_possible_score = max_possible
        self.questions_correct = correct_count
        
        if max_possible > 0:
            self.percentage_score = (total / max_possible) * 100


class Answer(Base):
    """
    User answers to individual test questions.
    
    Stores responses, timing, and scoring details.
    """
    
    __tablename__ = "answers"
    
    id: UUID = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    attempt_id: UUID = Column(
        UUID(as_uuid=True), 
        ForeignKey("test_attempts.id", ondelete="CASCADE"), 
        nullable=False,
        index=True
    )
    question_id: UUID = Column(
        UUID(as_uuid=True), 
        ForeignKey("questions.id"), 
        nullable=False,
        index=True
    )
    
    # Answer data
    user_answer: JSON = Column(JSON, nullable=True)  # Flexible format for different question types
    is_correct: bool = Column(Boolean, default=False)
    score_earned: float = Column(Float, default=0.0)
    
    # Timing
    time_taken: int = Column(Integer, nullable=True)  # seconds
    answered_at: datetime = Column(DateTime, default=datetime.utcnow)
    
    # Answer metadata
    answer_order: int = Column(Integer, default=0)  # Order answered in test
    is_flagged: bool = Column(Boolean, default=False)  # User flagged for review
    is_skipped: bool = Column(Boolean, default=False)
    
    # For essay/text questions - manual grading
    needs_review: bool = Column(Boolean, default=False)
    reviewer_id: UUID = Column(UUID(as_uuid=True), nullable=True)
    reviewer_comments: str = Column(Text, nullable=True)
    reviewed_at: datetime = Column(DateTime, nullable=True)
    
    # AI grading (for text responses)
    ai_score: float = Column(Float, nullable=True)
    ai_feedback: str = Column(Text, nullable=True)
    confidence_score: float = Column(Float, nullable=True)
    
    # Timestamps
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: datetime = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )
    
    # Relationships
    attempt = relationship("TestAttempt", back_populates="answers")
    question = relationship("Question", back_populates="answers")
    
    def __repr__(self) -> str:
        return f"<Answer {self.attempt_id} Q{self.question_id} {'✓' if self.is_correct else '✗'}>"
    
    def grade_answer(self) -> None:
        """Grade the answer and calculate score."""
        if self.question:
            self.is_correct = self.question.is_correct_answer(self.user_answer)
            self.score_earned = self.question.calculate_score(self.user_answer, self.is_correct)
    
    def flag_for_review(self) -> None:
        """Flag answer for manual review."""
        self.is_flagged = True
        self.needs_review = True
    
    def mark_reviewed(self, reviewer_id: UUID, comments: str = None) -> None:
        """Mark answer as reviewed."""
        self.needs_review = False
        self.reviewer_id = reviewer_id
        self.reviewer_comments = comments
        self.reviewed_at = datetime.utcnow()


class TestAnalytics(Base):
    """
    Aggregated analytics for tests.
    
    Stores performance metrics and insights for test optimization.
    """
    
    __tablename__ = "test_analytics"
    
    id: UUID = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    test_id: UUID = Column(
        UUID(as_uuid=True), 
        ForeignKey("tests.id", ondelete="CASCADE"), 
        nullable=False,
        unique=True,
        index=True
    )
    
    # Performance metrics
    total_attempts: int = Column(Integer, default=0)
    completed_attempts: int = Column(Integer, default=0)
    average_score: float = Column(Float, default=0.0)
    median_score: float = Column(Float, default=0.0)
    highest_score: float = Column(Float, default=0.0)
    lowest_score: float = Column(Float, default=0.0)
    
    # Timing analytics
    average_duration: int = Column(Integer, default=0)  # seconds
    median_duration: int = Column(Integer, default=0)
    fastest_completion: int = Column(Integer, default=0)
    slowest_completion: int = Column(Integer, default=0)
    
    # Question analytics
    most_difficult_questions: list = Column(JSON, default=list)
    easiest_questions: list = Column(JSON, default=list)
    most_time_consuming_questions: list = Column(JSON, default=list)
    
    # User behavior
    completion_rate: float = Column(Float, default=0.0)
    abandonment_rate: float = Column(Float, default=0.0)
    average_questions_skipped: float = Column(Float, default=0.0)
    
    # Score distribution
    score_distribution: dict = Column(JSON, default=dict)  # Histogram data
    pass_rate: float = Column(Float, default=0.0)
    
    # Trends over time
    weekly_metrics: dict = Column(JSON, default=dict)
    monthly_metrics: dict = Column(JSON, default=dict)
    
    # Last calculation
    last_calculated_at: datetime = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: datetime = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )
    
    def __repr__(self) -> str:
        return f"<TestAnalytics for test {self.test_id}>"
    
    def update_metrics(self) -> None:
        """Recalculate all metrics from test attempts."""
        self.last_calculated_at = datetime.utcnow()
        # Implementation would query test attempts and calculate metrics
"""
Challenge models for TheTruthSchool coding challenges.

This module defines models for coding challenges, test cases, and submissions
that integrate with Judge0 for code execution.
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


class DifficultyLevel(str, Enum):
    """Challenge difficulty levels."""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    EXPERT = "expert"


class ChallengeType(str, Enum):
    """Types of coding challenges."""
    LEETCODE = "leetcode"  # Single function implementation
    PROJECT = "project"    # Multi-file project
    DEBUGGING = "debugging"  # Fix existing code
    OPTIMIZATION = "optimization"  # Improve performance


class SubmissionStatus(str, Enum):
    """Status of code submissions."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    TIMEOUT = "timeout"
    ERROR = "error"


class Judge0Status(str, Enum):
    """Judge0 execution status codes."""
    IN_QUEUE = "in_queue"  # 1, 2
    PROCESSING = "processing"  # 3
    ACCEPTED = "accepted"  # 3
    WRONG_ANSWER = "wrong_answer"  # 4
    TIME_LIMIT_EXCEEDED = "time_limit_exceeded"  # 5
    COMPILATION_ERROR = "compilation_error"  # 6
    RUNTIME_ERROR_SIGSEGV = "runtime_error_sigsegv"  # 7
    RUNTIME_ERROR_SIGXFSZ = "runtime_error_sigxfsz"  # 8
    RUNTIME_ERROR_SIGFPE = "runtime_error_sigfpe"  # 9
    RUNTIME_ERROR_SIGABRT = "runtime_error_sigabrt"  # 10
    RUNTIME_ERROR_NZEC = "runtime_error_nzec"  # 11
    RUNTIME_ERROR_OTHER = "runtime_error_other"  # 12
    INTERNAL_ERROR = "internal_error"  # 13
    EXEC_FORMAT_ERROR = "exec_format_error"  # 14


class ProgrammingLanguage(str, Enum):
    """Supported programming languages."""
    PYTHON = "python"
    JAVASCRIPT = "javascript"
    JAVA = "java"
    CPP = "cpp"
    C = "c"
    CSHARP = "csharp"
    GO = "go"
    RUST = "rust"
    TYPESCRIPT = "typescript"
    PHP = "php"
    RUBY = "ruby"
    KOTLIN = "kotlin"
    SWIFT = "swift"


# Judge0 language ID mapping
JUDGE0_LANGUAGE_MAP = {
    ProgrammingLanguage.PYTHON: 71,  # Python 3.8.1
    ProgrammingLanguage.JAVASCRIPT: 63,  # JavaScript (Node.js 12.14.0)
    ProgrammingLanguage.JAVA: 62,  # Java (OpenJDK 13.0.1)
    ProgrammingLanguage.CPP: 54,  # C++ (GCC 9.2.0)
    ProgrammingLanguage.C: 50,  # C (GCC 9.2.0)
    ProgrammingLanguage.CSHARP: 51,  # C# (Mono 6.6.0.161)
    ProgrammingLanguage.GO: 60,  # Go (1.13.5)
    ProgrammingLanguage.RUST: 73,  # Rust (1.40.0)
    ProgrammingLanguage.TYPESCRIPT: 74,  # TypeScript (3.7.4)
    ProgrammingLanguage.PHP: 68,  # PHP (7.4.1)
    ProgrammingLanguage.RUBY: 72,  # Ruby (2.7.0)
    ProgrammingLanguage.KOTLIN: 78,  # Kotlin (1.3.70)
    ProgrammingLanguage.SWIFT: 83,  # Swift (5.2.3)
}


class Challenge(Base):
    """
    Coding challenge model.
    
    Represents a coding problem that users can solve, similar to LeetCode problems
    but also supporting project-based challenges.
    """
    
    __tablename__ = "challenges"
    
    id: UUID = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Basic challenge information
    title: str = Column(String(255), nullable=False, index=True)
    slug: str = Column(String(255), nullable=False, unique=True, index=True)
    description: str = Column(Text, nullable=False)
    difficulty: DifficultyLevel = Column(SQLEnum(DifficultyLevel), nullable=False, index=True)
    challenge_type: ChallengeType = Column(SQLEnum(ChallengeType), default=ChallengeType.LEETCODE)
    
    # Problem specification
    problem_statement: str = Column(Text, nullable=False)
    input_format: str = Column(Text, nullable=True)
    output_format: str = Column(Text, nullable=True)
    constraints: str = Column(Text, nullable=True)
    examples: list = Column(JSON, default=list)  # List of input/output examples
    
    # Categorization and tags
    category: str = Column(String(100), nullable=True, index=True)
    subcategory: str = Column(String(100), nullable=True)
    tags: list = Column(JSON, default=list)  # List of skill tags
    topics: list = Column(JSON, default=list)  # List of algorithmic topics
    
    # Language support
    supported_languages: list = Column(
        JSON, 
        default=lambda: [lang.value for lang in ProgrammingLanguage]
    )
    
    # Boilerplate code for different languages
    boilerplate_code: dict = Column(JSON, default=dict)  # {language: code}
    solution_code: dict = Column(JSON, default=dict)  # {language: solution}
    
    # Execution settings
    time_limit: int = Column(Integer, default=10)  # seconds
    memory_limit: int = Column(Integer, default=256)  # MB
    
    # Metadata
    is_active: bool = Column(Boolean, default=True)
    is_premium: bool = Column(Boolean, default=False)
    order_index: int = Column(Integer, default=0)
    estimated_duration: int = Column(Integer, nullable=True)  # minutes
    
    # Statistics
    total_submissions: int = Column(Integer, default=0)
    successful_submissions: int = Column(Integer, default=0)
    average_rating: float = Column(Float, default=0.0)
    rating_count: int = Column(Integer, default=0)
    
    # Content management
    created_by: UUID = Column(UUID(as_uuid=True), nullable=True)
    approved_by: UUID = Column(UUID(as_uuid=True), nullable=True)
    approved_at: datetime = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: datetime = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )
    
    # Relationships
    test_cases = relationship("TestCase", back_populates="challenge", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="challenge")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_challenge_difficulty_category', 'difficulty', 'category'),
        Index('idx_challenge_active_premium', 'is_active', 'is_premium'),
    )
    
    def __repr__(self) -> str:
        return f"<Challenge {self.title} ({self.difficulty})>"
    
    @property
    def success_rate(self) -> float:
        """Calculate success rate percentage."""
        if self.total_submissions == 0:
            return 0.0
        return (self.successful_submissions / self.total_submissions) * 100
    
    def get_boilerplate(self, language: ProgrammingLanguage) -> Optional[str]:
        """Get boilerplate code for a specific language."""
        return self.boilerplate_code.get(language.value)
    
    def get_solution(self, language: ProgrammingLanguage) -> Optional[str]:
        """Get solution code for a specific language."""
        return self.solution_code.get(language.value)
    
    def supports_language(self, language: ProgrammingLanguage) -> bool:
        """Check if challenge supports a specific language."""
        return language.value in self.supported_languages
    
    def increment_submission_count(self, is_successful: bool = False) -> None:
        """Increment submission statistics."""
        self.total_submissions += 1
        if is_successful:
            self.successful_submissions += 1


class TestCase(Base):
    """
    Test cases for coding challenges.
    
    Each challenge can have multiple test cases for validation.
    Some test cases are visible to users (examples), others are hidden.
    """
    
    __tablename__ = "test_cases"
    
    id: UUID = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    challenge_id: UUID = Column(
        UUID(as_uuid=True), 
        ForeignKey("challenges.id", ondelete="CASCADE"), 
        nullable=False,
        index=True
    )
    
    # Test case data
    input_data: str = Column(Text, nullable=False)
    expected_output: str = Column(Text, nullable=False)
    description: str = Column(String(500), nullable=True)
    
    # Configuration
    is_example: bool = Column(Boolean, default=False)  # Visible to users
    is_active: bool = Column(Boolean, default=True)
    order_index: int = Column(Integer, default=0)
    points: int = Column(Integer, default=1)  # Points awarded for passing
    
    # Execution settings (override challenge defaults if needed)
    time_limit: int = Column(Integer, nullable=True)
    memory_limit: int = Column(Integer, nullable=True)
    
    # Timestamps
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: datetime = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )
    
    # Relationships
    challenge = relationship("Challenge", back_populates="test_cases")
    submission_results = relationship("SubmissionResult", back_populates="test_case")
    
    def __repr__(self) -> str:
        return f"<TestCase {self.challenge_id} {'(example)' if self.is_example else '(hidden)'}>"


class Submission(Base):
    """
    User code submissions for challenges.
    
    Tracks all submission attempts with results from Judge0.
    """
    
    __tablename__ = "submissions"
    
    id: UUID = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: UUID = Column(
        UUID(as_uuid=True), 
        nullable=False,
        index=True
    )
    challenge_id: UUID = Column(
        UUID(as_uuid=True), 
        ForeignKey("challenges.id"), 
        nullable=False,
        index=True
    )
    
    # Submission details
    language: ProgrammingLanguage = Column(SQLEnum(ProgrammingLanguage), nullable=False)
    source_code: str = Column(Text, nullable=False)
    
    # Judge0 integration
    judge0_token: str = Column(String(255), nullable=True, index=True)
    judge0_language_id: int = Column(Integer, nullable=False)
    
    # Execution results
    status: SubmissionStatus = Column(SQLEnum(SubmissionStatus), default=SubmissionStatus.PENDING)
    judge0_status: Judge0Status = Column(SQLEnum(Judge0Status), nullable=True)
    
    # Compilation and execution details
    compile_output: str = Column(Text, nullable=True)
    runtime_error: str = Column(Text, nullable=True)
    execution_time: float = Column(Float, nullable=True)  # seconds
    memory_usage: int = Column(Integer, nullable=True)  # KB
    
    # Scoring
    total_test_cases: int = Column(Integer, default=0)
    passed_test_cases: int = Column(Integer, default=0)
    score: float = Column(Float, default=0.0)
    max_score: float = Column(Float, default=100.0)
    
    # Metadata
    ip_address: str = Column(String(45), nullable=True)
    user_agent: str = Column(Text, nullable=True)
    is_practice: bool = Column(Boolean, default=True)
    
    # Timestamps
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: datetime = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )
    completed_at: datetime = Column(DateTime, nullable=True)
    
    # Relationships
    challenge = relationship("Challenge", back_populates="submissions")
    results = relationship("SubmissionResult", back_populates="submission", cascade="all, delete-orphan")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_submission_user_challenge', 'user_id', 'challenge_id'),
        Index('idx_submission_status_created', 'status', 'created_at'),
    )
    
    def __repr__(self) -> str:
        return f"<Submission {self.id} by {self.user_id} for {self.challenge_id}>"
    
    @property
    def is_successful(self) -> bool:
        """Check if submission was successful (passed all test cases)."""
        return (
            self.status == SubmissionStatus.COMPLETED 
            and self.total_test_cases > 0 
            and self.passed_test_cases == self.total_test_cases
        )
    
    @property
    def success_rate(self) -> float:
        """Calculate success rate percentage."""
        if self.total_test_cases == 0:
            return 0.0
        return (self.passed_test_cases / self.total_test_cases) * 100
    
    def update_results(
        self, 
        total_cases: int, 
        passed_cases: int, 
        execution_time: Optional[float] = None,
        memory_usage: Optional[int] = None
    ) -> None:
        """Update submission results."""
        self.total_test_cases = total_cases
        self.passed_test_cases = passed_cases
        self.score = (passed_cases / total_cases) * self.max_score if total_cases > 0 else 0
        
        if execution_time is not None:
            self.execution_time = execution_time
        if memory_usage is not None:
            self.memory_usage = memory_usage
            
        if passed_cases == total_cases:
            self.status = SubmissionStatus.COMPLETED
        elif passed_cases > 0:
            self.status = SubmissionStatus.COMPLETED  # Partial success
        else:
            self.status = SubmissionStatus.FAILED
            
        self.completed_at = datetime.utcnow()


class SubmissionResult(Base):
    """
    Individual test case results for submissions.
    
    Stores detailed results for each test case execution.
    """
    
    __tablename__ = "submission_results"
    
    id: UUID = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id: UUID = Column(
        UUID(as_uuid=True), 
        ForeignKey("submissions.id", ondelete="CASCADE"), 
        nullable=False,
        index=True
    )
    test_case_id: UUID = Column(
        UUID(as_uuid=True), 
        ForeignKey("test_cases.id"), 
        nullable=False,
        index=True
    )
    
    # Execution results
    passed: bool = Column(Boolean, default=False)
    actual_output: str = Column(Text, nullable=True)
    execution_time: float = Column(Float, nullable=True)  # seconds
    memory_usage: int = Column(Integer, nullable=True)  # KB
    
    # Judge0 specific data
    judge0_token: str = Column(String(255), nullable=True)
    judge0_status: Judge0Status = Column(SQLEnum(Judge0Status), nullable=True)
    stderr: str = Column(Text, nullable=True)
    
    # Error details
    error_message: str = Column(Text, nullable=True)
    
    # Timestamps
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: datetime = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )
    
    # Relationships
    submission = relationship("Submission", back_populates="results")
    test_case = relationship("TestCase", back_populates="submission_results")
    
    def __repr__(self) -> str:
        return f"<SubmissionResult {self.submission_id} test {self.test_case_id} {'✓' if self.passed else '✗'}>"


class ChallengeRating(Base):
    """
    User ratings for challenges.
    
    Allows users to rate the quality and difficulty of challenges.
    """
    
    __tablename__ = "challenge_ratings"
    
    id: UUID = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: UUID = Column(
        UUID(as_uuid=True), 
        nullable=False,
        index=True
    )
    challenge_id: UUID = Column(
        UUID(as_uuid=True), 
        ForeignKey("challenges.id", ondelete="CASCADE"), 
        nullable=False,
        index=True
    )
    
    # Rating details
    rating: int = Column(Integer, nullable=False)  # 1-5 stars
    difficulty_rating: int = Column(Integer, nullable=True)  # 1-5, user's perception
    comment: str = Column(Text, nullable=True)
    
    # Timestamps
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: datetime = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )
    
    # Unique constraint - one rating per user per challenge
    __table_args__ = (
        Index('idx_unique_user_challenge_rating', 'user_id', 'challenge_id', unique=True),
    )
    
    def __repr__(self) -> str:
        return f"<ChallengeRating {self.challenge_id} by {self.user_id}: {self.rating}/5>"
"""
Resume models for TheTruthSchool resume management and AI review.

This module defines models for resume storage, parsing, and AI-powered
feedback and analysis.
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


class ResumeStatus(str, Enum):
    """Resume processing status."""
    UPLOADED = "uploaded"
    PARSING = "parsing"
    PARSED = "parsed"
    REVIEWING = "reviewing"
    REVIEWED = "reviewed"
    ERROR = "error"


class FileType(str, Enum):
    """Supported resume file types."""
    PDF = "pdf"
    DOCX = "docx"
    DOC = "doc"
    TXT = "txt"


class ReviewType(str, Enum):
    """Types of resume reviews."""
    GENERAL = "general"
    ATS_OPTIMIZATION = "ats_optimization"
    ROLE_SPECIFIC = "role_specific"
    INDUSTRY_SPECIFIC = "industry_specific"


class ReviewStatus(str, Enum):
    """Resume review status."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class Resume(Base):
    """
    Resume model for storing and managing user resumes.
    
    Supports multiple versions, file types, and AI-powered analysis.
    """
    
    __tablename__ = "resumes"
    
    id: UUID = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: UUID = Column(
        UUID(as_uuid=True), 
        nullable=False,
        index=True
    )
    
    # File information
    filename: str = Column(String(255), nullable=False)
    original_filename: str = Column(String(255), nullable=False)
    file_type: FileType = Column(SQLEnum(FileType), nullable=False)
    file_size: int = Column(Integer, nullable=False)  # bytes
    file_path: str = Column(String(500), nullable=False)  # storage path
    file_url: str = Column(String(500), nullable=True)  # public URL if applicable
    
    # Resume metadata
    title: str = Column(String(255), nullable=True)
    description: str = Column(Text, nullable=True)
    version: int = Column(Integer, default=1)
    is_primary: bool = Column(Boolean, default=False)
    is_active: bool = Column(Boolean, default=True)
    
    # Parsing results
    status: ResumeStatus = Column(SQLEnum(ResumeStatus), default=ResumeStatus.UPLOADED)
    raw_text: str = Column(Text, nullable=True)
    structured_data: dict = Column(JSON, default=dict)  # Parsed resume data
    
    # Parsing metadata
    parsing_engine: str = Column(String(50), nullable=True)  # PyMuPDF, python-docx, etc.
    parsing_confidence: float = Column(Float, nullable=True)
    parsing_errors: list = Column(JSON, default=list)
    
    # Contact information (extracted)
    contact_name: str = Column(String(255), nullable=True)
    contact_email: str = Column(String(255), nullable=True)
    contact_phone: str = Column(String(50), nullable=True)
    contact_location: str = Column(String(255), nullable=True)
    contact_linkedin: str = Column(String(500), nullable=True)
    contact_github: str = Column(String(500), nullable=True)
    contact_website: str = Column(String(500), nullable=True)
    
    # Professional summary
    professional_summary: str = Column(Text, nullable=True)
    
    # Skills extracted
    technical_skills: list = Column(JSON, default=list)
    soft_skills: list = Column(JSON, default=list)
    languages: list = Column(JSON, default=list)
    certifications: list = Column(JSON, default=list)
    
    # Experience data
    total_experience_years: float = Column(Float, nullable=True)
    current_role: str = Column(String(255), nullable=True)
    current_company: str = Column(String(255), nullable=True)
    experience_entries: list = Column(JSON, default=list)
    
    # Education data
    education_entries: list = Column(JSON, default=list)
    highest_degree: str = Column(String(255), nullable=True)
    
    # Projects and achievements
    projects: list = Column(JSON, default=list)
    achievements: list = Column(JSON, default=list)
    publications: list = Column(JSON, default=list)
    
    # ATS analysis
    ats_score: float = Column(Float, nullable=True)  # 0-100
    keyword_density: dict = Column(JSON, default=dict)
    formatting_issues: list = Column(JSON, default=list)
    
    # Statistics
    review_count: int = Column(Integer, default=0)
    download_count: int = Column(Integer, default=0)
    view_count: int = Column(Integer, default=0)
    
    # Timestamps
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: datetime = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )
    parsed_at: datetime = Column(DateTime, nullable=True)
    
    # Relationships
    reviews = relationship("ResumeReview", back_populates="resume", cascade="all, delete-orphan")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_resume_user_status', 'user_id', 'status'),
        Index('idx_resume_user_primary', 'user_id', 'is_primary'),
    )
    
    def __repr__(self) -> str:
        return f"<Resume {self.filename} for {self.user_id}>"
    
    def set_as_primary(self) -> None:
        """Mark this resume as the user's primary resume."""
        self.is_primary = True
    
    def increment_view_count(self) -> None:
        """Increment view count."""
        self.view_count += 1
    
    def increment_download_count(self) -> None:
        """Increment download count."""
        self.download_count += 1
    
    def mark_parsed(self, text: str, structured_data: dict) -> None:
        """Mark resume as successfully parsed."""
        self.status = ResumeStatus.PARSED
        self.raw_text = text
        self.structured_data = structured_data
        self.parsed_at = datetime.utcnow()
    
    def mark_parsing_error(self, error: str) -> None:
        """Mark resume parsing as failed."""
        self.status = ResumeStatus.ERROR
        if not self.parsing_errors:
            self.parsing_errors = []
        self.parsing_errors.append({
            "error": error,
            "timestamp": datetime.utcnow().isoformat()
        })
    
    def get_file_size_mb(self) -> float:
        """Get file size in megabytes."""
        return self.file_size / (1024 * 1024)
    
    def extract_keywords(self) -> list:
        """Extract important keywords from resume."""
        keywords = []
        
        # Add technical skills
        keywords.extend(self.technical_skills or [])
        
        # Add role titles from experience
        for entry in self.experience_entries or []:
            if entry.get("title"):
                keywords.append(entry["title"])
        
        # Add company names
        for entry in self.experience_entries or []:
            if entry.get("company"):
                keywords.append(entry["company"])
        
        # Add education details
        for entry in self.education_entries or []:
            if entry.get("degree"):
                keywords.append(entry["degree"])
            if entry.get("institution"):
                keywords.append(entry["institution"])
        
        return list(set(keywords))  # Remove duplicates


class ResumeReview(Base):
    """
    AI-powered resume review and feedback.
    
    Stores detailed analysis, suggestions, and scoring
    for resume optimization.
    """
    
    __tablename__ = "resume_reviews"
    
    id: UUID = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    resume_id: UUID = Column(
        UUID(as_uuid=True), 
        ForeignKey("resumes.id", ondelete="CASCADE"), 
        nullable=False,
        index=True
    )
    
    # Review configuration
    review_type: ReviewType = Column(SQLEnum(ReviewType), default=ReviewType.GENERAL)
    target_role: str = Column(String(255), nullable=True)
    target_company: str = Column(String(255), nullable=True)
    target_industry: str = Column(String(255), nullable=True)
    job_description: str = Column(Text, nullable=True)
    
    # Review status
    status: ReviewStatus = Column(SQLEnum(ReviewStatus), default=ReviewStatus.PENDING)
    
    # AI model information
    ai_model: str = Column(String(100), nullable=True)  # gpt-4, gemini-pro, etc.
    ai_version: str = Column(String(50), nullable=True)
    processing_time: float = Column(Float, nullable=True)  # seconds
    
    # Overall assessment
    overall_score: float = Column(Float, nullable=False)  # 0-100
    overall_rating: str = Column(String(20), nullable=True)  # poor, fair, good, excellent
    
    # Category scores
    ats_compatibility_score: float = Column(Float, nullable=True)
    content_quality_score: float = Column(Float, nullable=True)
    formatting_score: float = Column(Float, nullable=True)
    keyword_optimization_score: float = Column(Float, nullable=True)
    clarity_score: float = Column(Float, nullable=True)
    impact_score: float = Column(Float, nullable=True)
    
    # Detailed feedback
    strengths: list = Column(JSON, default=list)
    weaknesses: list = Column(JSON, default=list)
    suggestions: list = Column(JSON, default=list)
    
    # ATS-specific feedback
    ats_recommendations: list = Column(JSON, default=list)
    missing_keywords: list = Column(JSON, default=list)
    keyword_suggestions: list = Column(JSON, default=list)
    formatting_issues: list = Column(JSON, default=list)
    
    # Content recommendations
    content_improvements: list = Column(JSON, default=list)
    quantification_suggestions: list = Column(JSON, default=list)
    action_verb_suggestions: list = Column(JSON, default=list)
    
    # Role-specific analysis
    role_match_score: float = Column(Float, nullable=True)
    skill_gap_analysis: dict = Column(JSON, default=dict)
    experience_relevance: dict = Column(JSON, default=dict)
    
    # Summary and narrative
    executive_summary: str = Column(Text, nullable=True)
    detailed_feedback: str = Column(Text, nullable=True)
    improvement_priority: list = Column(JSON, default=list)  # Ordered list of priorities
    
    # Next steps
    recommended_actions: list = Column(JSON, default=list)
    estimated_improvement_impact: dict = Column(JSON, default=dict)
    
    # Comparison data (if job description provided)
    job_match_percentage: float = Column(Float, nullable=True)
    competition_analysis: dict = Column(JSON, default=dict)
    
    # Metadata
    review_version: str = Column(String(10), default="1.0")
    
    # Timestamps
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: datetime = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )
    started_at: datetime = Column(DateTime, nullable=True)
    completed_at: datetime = Column(DateTime, nullable=True)
    
    # Relationships
    resume = relationship("Resume", back_populates="reviews")
    
    def __repr__(self) -> str:
        return f"<ResumeReview {self.resume_id} score={self.overall_score}>"
    
    def start_review(self) -> None:
        """Mark review as started."""
        self.status = ReviewStatus.IN_PROGRESS
        self.started_at = datetime.utcnow()
    
    def complete_review(self) -> None:
        """Mark review as completed."""
        self.status = ReviewStatus.COMPLETED
        self.completed_at = datetime.utcnow()
        if self.started_at:
            self.processing_time = (self.completed_at - self.started_at).total_seconds()
    
    def fail_review(self, error: str) -> None:
        """Mark review as failed."""
        self.status = ReviewStatus.FAILED
        self.detailed_feedback = f"Review failed: {error}"
    
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
    
    def get_score_breakdown(self) -> dict:
        """Get detailed score breakdown."""
        return {
            "overall": self.overall_score,
            "ats_compatibility": self.ats_compatibility_score,
            "content_quality": self.content_quality_score,
            "formatting": self.formatting_score,
            "keyword_optimization": self.keyword_optimization_score,
            "clarity": self.clarity_score,
            "impact": self.impact_score,
            "role_match": self.role_match_score,
            "job_match": self.job_match_percentage
        }
    
    def get_top_recommendations(self, limit: int = 5) -> list:
        """Get top recommendations based on priority."""
        all_recommendations = []
        
        # Add suggestions with priority
        for suggestion in self.suggestions or []:
            all_recommendations.append({
                "type": "general",
                "text": suggestion,
                "priority": "medium"
            })
        
        # Add ATS recommendations with high priority
        for recommendation in self.ats_recommendations or []:
            all_recommendations.append({
                "type": "ats",
                "text": recommendation,
                "priority": "high"
            })
        
        # Add content improvements
        for improvement in self.content_improvements or []:
            all_recommendations.append({
                "type": "content",
                "text": improvement,
                "priority": "medium"
            })
        
        # Sort by priority and return top items
        priority_order = {"high": 3, "medium": 2, "low": 1}
        all_recommendations.sort(
            key=lambda x: priority_order.get(x["priority"], 0), 
            reverse=True
        )
        
        return all_recommendations[:limit]


class ResumeTemplate(Base):
    """
    Resume templates for different roles and industries.
    
    Provides structure and best practices for resume creation.
    """
    
    __tablename__ = "resume_templates"
    
    id: UUID = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Template information
    name: str = Column(String(255), nullable=False)
    description: str = Column(Text, nullable=True)
    
    # Target configuration
    target_role: str = Column(String(255), nullable=True)
    target_industry: str = Column(String(255), nullable=True)
    experience_level: str = Column(String(50), nullable=True)
    
    # Template structure
    sections: list = Column(JSON, default=list)  # Ordered list of sections
    section_guidelines: dict = Column(JSON, default=dict)  # Guidelines per section
    
    # Content recommendations
    recommended_skills: list = Column(JSON, default=list)
    recommended_keywords: list = Column(JSON, default=list)
    sample_phrases: dict = Column(JSON, default=dict)
    
    # Formatting guidelines
    formatting_rules: dict = Column(JSON, default=dict)
    style_preferences: dict = Column(JSON, default=dict)
    
    # Template metadata
    is_active: bool = Column(Boolean, default=True)
    is_premium: bool = Column(Boolean, default=False)
    usage_count: int = Column(Integer, default=0)
    average_rating: float = Column(Float, default=0.0)
    
    # Timestamps
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: datetime = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )
    
    def __repr__(self) -> str:
        return f"<ResumeTemplate {self.name} for {self.target_role}>"
    
    def increment_usage(self) -> None:
        """Increment usage count."""
        self.usage_count += 1
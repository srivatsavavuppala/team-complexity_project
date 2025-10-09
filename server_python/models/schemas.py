"""
Pydantic models for request/response validation
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# Enums
class UserRole(str, Enum):
    ADMIN = "admin"
    RECRUITER = "recruiter"
    INTERVIEWER = "interviewer"

class InterviewStatus(str, Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

# User models
class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: UserRole = UserRole.RECRUITER

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Candidate models
class CandidateCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    resume_text: Optional[str] = None
    skills: Optional[str] = None
    experience_years: Optional[int] = Field(None, ge=0, le=50)

class CandidateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    resume_text: Optional[str] = None
    skills: Optional[str] = None
    experience_years: Optional[int] = Field(None, ge=0, le=50)

class CandidateResponse(BaseModel):
    id: str
    name: str
    email: Optional[str]
    phone: Optional[str]
    resume_text: Optional[str]
    resume_analysis: Optional[str]
    skills: Optional[str]
    experience_years: Optional[int]
    created_at: datetime
    updated_at: datetime

# Job models
class JobCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    requirements: Optional[str] = None
    skills_required: Optional[str] = None
    experience_required: Optional[int] = Field(None, ge=0, le=50)

class JobUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = None
    requirements: Optional[str] = None
    skills_required: Optional[str] = None
    experience_required: Optional[int] = Field(None, ge=0, le=50)

class JobResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    requirements: Optional[str]
    skills_required: Optional[str]
    experience_required: Optional[int]
    created_by: str
    created_at: datetime

# Interview models
class InterviewCreate(BaseModel):
    candidate_id: str
    job_position_id: str
    scheduled_at: Optional[datetime] = None

class InterviewUpdate(BaseModel):
    questions: Optional[str] = None
    answers: Optional[str] = None
    ai_analysis: Optional[str] = None
    score: Optional[int] = Field(None, ge=0, le=100)
    status: Optional[InterviewStatus] = None
    scheduled_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class InterviewResponse(BaseModel):
    id: str
    candidate_id: str
    job_position_id: str
    interviewer_id: str
    questions: Optional[str]
    answers: Optional[str]
    ai_analysis: Optional[str]
    score: Optional[int]
    status: str
    scheduled_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime

# AI Analysis models
class ResumeAnalysis(BaseModel):
    skills: List[str]
    experience_years: int
    strengths: List[str]
    weaknesses: List[str]
    overall_score: int = Field(..., ge=0, le=100)
    recommendations: List[str]
    job_fit_score: Optional[int] = Field(None, ge=0, le=100)
    summary: str

class InterviewQuestion(BaseModel):
    question: str
    category: str
    difficulty: Difficulty

class InterviewQuestions(BaseModel):
    technical: List[InterviewQuestion]
    behavioral: List[InterviewQuestion]
    situational: List[InterviewQuestion]
    cultural: List[InterviewQuestion]

class InterviewAnalysis(BaseModel):
    score: int = Field(..., ge=0, le=10)
    strengths: List[str]
    improvements: List[str]
    follow_up_questions: List[str]
    assessment: str

class SkillAlignment(BaseModel):
    matched: List[str]
    missing: List[str]
    bonus: List[str]

class CandidateMatch(BaseModel):
    match_score: int = Field(..., ge=0, le=100)
    skill_alignment: SkillAlignment
    experience_fit: str
    red_flags: List[str]
    strengths: List[str]
    development_areas: List[str]
    recommendation: str
    reasoning: str

# File upload models
class FileUploadResponse(BaseModel):
    filename: str
    content_type: str
    size: int
    extracted_text: str

# Dashboard models
class DashboardStats(BaseModel):
    total_candidates: int
    total_jobs: int
    total_interviews: int
    pending_interviews: int
    completed_interviews: int
    average_interview_score: Optional[float]

# Generic response models
class MessageResponse(BaseModel):
    message: str

class ErrorResponse(BaseModel):
    error: str
    status_code: int
    timestamp: datetime
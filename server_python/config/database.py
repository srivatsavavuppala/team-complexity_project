"""
Database configuration using SQLAlchemy and databases library
"""

import os
from databases import Database
from sqlalchemy import (
    create_engine, MetaData, Table, Column, String, Integer, 
    DateTime, Text, ForeignKey, Boolean
)
from sqlalchemy.sql import func
from datetime import datetime

# Database URL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./database.db")

# Create database instance
database = Database(DATABASE_URL)

# SQLAlchemy metadata
metadata = MetaData()

# Users table
users_table = Table(
    "users",
    metadata,
    Column("id", String, primary_key=True),
    Column("email", String, unique=True, nullable=False),
    Column("password", String, nullable=False),
    Column("name", String, nullable=False),
    Column("role", String, default="recruiter"),
    Column("created_at", DateTime, default=func.now()),
)

# Candidates table
candidates_table = Table(
    "candidates",
    metadata,
    Column("id", String, primary_key=True),
    Column("name", String, nullable=False),
    Column("email", String),
    Column("phone", String),
    Column("resume_text", Text),
    Column("resume_analysis", Text),
    Column("skills", Text),
    Column("experience_years", Integer),
    Column("created_at", DateTime, default=func.now()),
    Column("updated_at", DateTime, default=func.now(), onupdate=func.now()),
)

# Job positions table
job_positions_table = Table(
    "job_positions",
    metadata,
    Column("id", String, primary_key=True),
    Column("title", String, nullable=False),
    Column("description", Text),
    Column("requirements", Text),
    Column("skills_required", Text),
    Column("experience_required", Integer),
    Column("created_by", String, ForeignKey("users.id")),
    Column("created_at", DateTime, default=func.now()),
)

# Interviews table
interviews_table = Table(
    "interviews",
    metadata,
    Column("id", String, primary_key=True),
    Column("candidate_id", String, ForeignKey("candidates.id"), nullable=False),
    Column("job_position_id", String, ForeignKey("job_positions.id"), nullable=False),
    Column("interviewer_id", String, ForeignKey("users.id"), nullable=False),
    Column("questions", Text),
    Column("answers", Text),
    Column("ai_analysis", Text),
    Column("score", Integer),
    Column("status", String, default="scheduled"),
    Column("scheduled_at", DateTime),
    Column("completed_at", DateTime),
    Column("created_at", DateTime, default=func.now()),
)

# Candidate matches table
candidate_matches_table = Table(
    "candidate_matches",
    metadata,
    Column("id", String, primary_key=True),
    Column("candidate_id", String, ForeignKey("candidates.id"), nullable=False),
    Column("job_position_id", String, ForeignKey("job_positions.id"), nullable=False),
    Column("match_score", Integer),
    Column("ai_reasoning", Text),
    Column("created_at", DateTime, default=func.now()),
)

# Create engine
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

async def init_db():
    """Initialize database tables"""
    try:
        await database.connect()
        # Create all tables
        metadata.create_all(engine)
        print("✅ Database tables created successfully")
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        raise

async def get_database():
    """Dependency to get database connection"""
    return database
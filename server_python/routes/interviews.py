"""
Interviews routes for managing interview sessions and analysis
"""

import uuid
import json
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from config.database import database, interviews_table, candidates_table, job_positions_table
from models.schemas import InterviewCreate, InterviewUpdate, InterviewResponse, MessageResponse
from middleware.auth import get_current_active_user, require_roles
from services.groq_service import groq_service
from sqlalchemy import select, update, delete, func, or_

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
async def create_interview(
    request,
    interview_data: InterviewCreate,
    current_user: dict = Depends(require_roles(["admin", "recruiter", "interviewer"]))
):
    """Create a new interview session"""
    
    # Verify candidate exists
    candidate_query = select(candidates_table).where(candidates_table.c.id == interview_data.candidate_id)
    candidate = await database.fetch_one(candidate_query)
    
    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found"
        )
    
    # Verify job position exists
    job_query = select(job_positions_table).where(job_positions_table.c.id == interview_data.job_position_id)
    job = await database.fetch_one(job_query)
    
    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job position not found"
        )
    
    interview_id = str(uuid.uuid4())
    
    insert_query = interviews_table.insert().values(
        id=interview_id,
        candidate_id=interview_data.candidate_id,
        job_position_id=interview_data.job_position_id,
        interviewer_id=current_user["id"],
        scheduled_at=interview_data.scheduled_at,
        status="scheduled"
    )
    
    try:
        await database.execute(insert_query)
        
        # Get created interview with related data
        interview_query = """
        SELECT i.*, c.name as candidate_name, j.title as job_title, u.name as interviewer_name
        FROM interviews i
        JOIN candidates c ON i.candidate_id = c.id
        JOIN job_positions j ON i.job_position_id = j.id
        JOIN users u ON i.interviewer_id = u.id
        WHERE i.id = ?
        """
        
        created_interview = await database.fetch_one(interview_query, [interview_id])
        
        return {
            "message": "Interview created successfully",
            "interview": dict(created_interview)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create interview: {str(e)}"
        )

@router.get("/", response_model=dict)
async def get_interviews(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    status_filter: Optional[str] = Query(None, regex="^(scheduled|in_progress|completed|cancelled)$"),
    search: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_active_user)
):
    """Get all interviews with pagination and filtering"""
    
    offset = (page - 1) * limit
    
    # Base query with joins
    base_query = """
    FROM interviews i
    JOIN candidates c ON i.candidate_id = c.id
    JOIN job_positions j ON i.job_position_id = j.id
    JOIN users u ON i.interviewer_id = u.id
    """
    
    where_conditions = []
    params = []
    
    # Filter by status
    if status_filter:
        where_conditions.append("i.status = ?")
        params.append(status_filter)
    
    # Search filter
    if search:
        where_conditions.append("(c.name ILIKE ? OR j.title ILIKE ? OR u.name ILIKE ?)")
        params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])
    
    # Role-based filtering
    if current_user["role"] == "interviewer":
        where_conditions.append("i.interviewer_id = ?")
        params.append(current_user["id"])
    
    where_clause = " WHERE " + " AND ".join(where_conditions) if where_conditions else ""
    
    # Count query
    count_query = f"SELECT COUNT(*) {base_query} {where_clause}"
    total = await database.fetch_val(count_query, params)
    
    # Main query
    main_query = f"""
    SELECT i.*, c.name as candidate_name, c.email as candidate_email,
           j.title as job_title, u.name as interviewer_name
    {base_query}
    {where_clause}
    ORDER BY i.created_at DESC
    LIMIT ? OFFSET ?
    """
    
    params.extend([limit, offset])
    interviews = await database.fetch_all(main_query, params)
    
    # Process interviews data
    processed_interviews = []
    for interview in interviews:
        interview_dict = dict(interview)
        
        # Parse JSON fields
        if interview_dict.get("questions"):
            try:
                interview_dict["questions"] = json.loads(interview_dict["questions"])
            except (json.JSONDecodeError, TypeError):
                interview_dict["questions"] = None
        
        if interview_dict.get("answers"):
            try:
                interview_dict["answers"] = json.loads(interview_dict["answers"])
            except (json.JSONDecodeError, TypeError):
                interview_dict["answers"] = None
        
        if interview_dict.get("ai_analysis"):
            try:
                interview_dict["ai_analysis"] = json.loads(interview_dict["ai_analysis"])
            except (json.JSONDecodeError, TypeError):
                interview_dict["ai_analysis"] = None
        
        processed_interviews.append(interview_dict)
    
    return {
        "interviews": processed_interviews,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }

@router.get("/{interview_id}", response_model=dict)
async def get_interview(
    interview_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Get interview by ID"""
    
    query = """
    SELECT i.*, c.name as candidate_name, c.email as candidate_email, c.phone as candidate_phone,
           c.skills as candidate_skills, c.experience_years as candidate_experience,
           j.title as job_title, j.description as job_description,
           u.name as interviewer_name
    FROM interviews i
    JOIN candidates c ON i.candidate_id = c.id
    JOIN job_positions j ON i.job_position_id = j.id
    JOIN users u ON i.interviewer_id = u.id
    WHERE i.id = ?
    """
    
    interview = await database.fetch_one(query, [interview_id])
    
    if not interview:
        raise HTTPException(
            status_code=404,
            detail="Interview not found"
        )
    
    # Role-based access control
    if (current_user["role"] == "interviewer" and 
        interview["interviewer_id"] != current_user["id"]):
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to view this interview"
        )
    
    interview_dict = dict(interview)
    
    # Parse JSON fields
    if interview_dict.get("questions"):
        try:
            interview_dict["questions"] = json.loads(interview_dict["questions"])
        except (json.JSONDecodeError, TypeError):
            interview_dict["questions"] = None
    
    if interview_dict.get("answers"):
        try:
            interview_dict["answers"] = json.loads(interview_dict["answers"])
        except (json.JSONDecodeError, TypeError):
            interview_dict["answers"] = None
    
    if interview_dict.get("ai_analysis"):
        try:
            interview_dict["ai_analysis"] = json.loads(interview_dict["ai_analysis"])
        except (json.JSONDecodeError, TypeError):
            interview_dict["ai_analysis"] = None
    
    if interview_dict.get("candidate_skills"):
        try:
            interview_dict["candidate_skills"] = json.loads(interview_dict["candidate_skills"])
        except (json.JSONDecodeError, TypeError):
            interview_dict["candidate_skills"] = []
    
    return {"interview": interview_dict}

@router.put("/{interview_id}", response_model=MessageResponse)
async def update_interview(
    interview_id: str,
    interview_data: InterviewUpdate,
    current_user: dict = Depends(get_current_active_user)
):
    """Update interview information"""
    
    # Check if interview exists and user has permission
    query = select(interviews_table).where(interviews_table.c.id == interview_id)
    existing_interview = await database.fetch_one(query)
    
    if not existing_interview:
        raise HTTPException(
            status_code=404,
            detail="Interview not found"
        )
    
    # Role-based access control
    if (current_user["role"] == "interviewer" and 
        existing_interview["interviewer_id"] != current_user["id"]):
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to update this interview"
        )
    
    # Prepare update data
    update_data = {}
    if interview_data.questions is not None:
        update_data["questions"] = interview_data.questions
    if interview_data.answers is not None:
        update_data["answers"] = interview_data.answers
    if interview_data.ai_analysis is not None:
        update_data["ai_analysis"] = interview_data.ai_analysis
    if interview_data.score is not None:
        update_data["score"] = interview_data.score
    if interview_data.status is not None:
        update_data["status"] = interview_data.status.value
        # Set completed_at if status is completed
        if interview_data.status.value == "completed":
            update_data["completed_at"] = datetime.utcnow()
    if interview_data.scheduled_at is not None:
        update_data["scheduled_at"] = interview_data.scheduled_at
    if interview_data.completed_at is not None:
        update_data["completed_at"] = interview_data.completed_at
    
    if not update_data:
        raise HTTPException(
            status_code=400,
            detail="No valid fields provided for update"
        )
    
    # Update interview
    update_query = (
        update(interviews_table)
        .where(interviews_table.c.id == interview_id)
        .values(**update_data)
    )
    
    await database.execute(update_query)
    
    return MessageResponse(message="Interview updated successfully")

@router.delete("/{interview_id}", response_model=MessageResponse)
async def delete_interview(
    interview_id: str,
    current_user: dict = Depends(require_roles(["admin", "recruiter"]))
):
    """Delete interview"""
    
    # Check if interview exists
    query = select(interviews_table).where(interviews_table.c.id == interview_id)
    existing_interview = await database.fetch_one(query)
    
    if not existing_interview:
        raise HTTPException(
            status_code=404,
            detail="Interview not found"
        )
    
    # Delete interview
    delete_query = delete(interviews_table).where(interviews_table.c.id == interview_id)
    await database.execute(delete_query)
    
    return MessageResponse(message="Interview deleted successfully")

@router.post("/{interview_id}/generate-questions", response_model=dict)
async def generate_questions_for_interview(
    interview_id: str,
    difficulty: str = Query("medium", regex="^(easy|medium|hard)$"),
    current_user: dict = Depends(get_current_active_user)
):
    """Generate interview questions for a specific interview"""
    
    # Get interview with related data
    query = """
    SELECT i.*, c.skills as candidate_skills, j.title as job_title, j.description as job_description
    FROM interviews i
    JOIN candidates c ON i.candidate_id = c.id
    JOIN job_positions j ON i.job_position_id = j.id
    WHERE i.id = ?
    """
    
    interview = await database.fetch_one(query, [interview_id])
    
    if not interview:
        raise HTTPException(
            status_code=404,
            detail="Interview not found"
        )
    
    # Role-based access control
    if (current_user["role"] == "interviewer" and 
        interview["interviewer_id"] != current_user["id"]):
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to generate questions for this interview"
        )
    
    try:
        # Parse candidate skills
        candidate_skills = []
        if interview["candidate_skills"]:
            try:
                candidate_skills = json.loads(interview["candidate_skills"])
            except (json.JSONDecodeError, TypeError):
                candidate_skills = []
        
        # Generate interview questions using AI
        questions = await groq_service.generate_interview_questions(
            job_title=interview["job_title"],
            job_description=interview["job_description"] or "",
            candidate_skills=candidate_skills,
            difficulty=difficulty
        )
        
        # Update interview with generated questions
        update_query = (
            update(interviews_table)
            .where(interviews_table.c.id == interview_id)
            .values(questions=json.dumps(questions.dict()))
        )
        
        await database.execute(update_query)
        
        return {
            "message": "Interview questions generated successfully",
            "interview_id": interview_id,
            "job_title": interview["job_title"],
            "difficulty": difficulty,
            "questions": questions.dict()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate interview questions: {str(e)}"
        )

@router.post("/{interview_id}/analyze-response", response_model=dict)
async def analyze_interview_response(
    interview_id: str,
    question: str,
    answer: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Analyze a specific interview response using AI"""
    
    # Get interview with job context
    query = """
    SELECT i.*, j.title as job_title, j.description as job_description
    FROM interviews i
    JOIN job_positions j ON i.job_position_id = j.id
    WHERE i.id = ?
    """
    
    interview = await database.fetch_one(query, [interview_id])
    
    if not interview:
        raise HTTPException(
            status_code=404,
            detail="Interview not found"
        )
    
    # Role-based access control
    if (current_user["role"] == "interviewer" and 
        interview["interviewer_id"] != current_user["id"]):
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to analyze responses for this interview"
        )
    
    try:
        # Prepare job context
        job_context = f"Job Title: {interview['job_title']}\nJob Description: {interview['job_description'] or 'Not provided'}"
        
        # Analyze response using AI
        analysis = await groq_service.analyze_interview_response(
            question=question,
            answer=answer,
            job_context=job_context
        )
        
        return {
            "message": "Interview response analyzed successfully",
            "interview_id": interview_id,
            "question": question,
            "answer": answer,
            "analysis": analysis.dict()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze interview response: {str(e)}"
        )

@router.post("/{interview_id}/start", response_model=MessageResponse)
async def start_interview(
    interview_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Start an interview session"""
    
    # Check if interview exists and user has permission
    query = select(interviews_table).where(interviews_table.c.id == interview_id)
    interview = await database.fetch_one(query)
    
    if not interview:
        raise HTTPException(
            status_code=404,
            detail="Interview not found"
        )
    
    # Role-based access control
    if (current_user["role"] == "interviewer" and 
        interview["interviewer_id"] != current_user["id"]):
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to start this interview"
        )
    
    if interview["status"] != "scheduled":
        raise HTTPException(
            status_code=400,
            detail=f"Interview cannot be started. Current status: {interview['status']}"
        )
    
    # Update interview status
    update_query = (
        update(interviews_table)
        .where(interviews_table.c.id == interview_id)
        .values(status="in_progress")
    )
    
    await database.execute(update_query)
    
    return MessageResponse(message="Interview started successfully")

@router.post("/{interview_id}/complete", response_model=MessageResponse)
async def complete_interview(
    interview_id: str,
    final_score: Optional[int] = Query(None, ge=0, le=100),
    current_user: dict = Depends(get_current_active_user)
):
    """Complete an interview session"""
    
    # Check if interview exists and user has permission
    query = select(interviews_table).where(interviews_table.c.id == interview_id)
    interview = await database.fetch_one(query)
    
    if not interview:
        raise HTTPException(
            status_code=404,
            detail="Interview not found"
        )
    
    # Role-based access control
    if (current_user["role"] == "interviewer" and 
        interview["interviewer_id"] != current_user["id"]):
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to complete this interview"
        )
    
    if interview["status"] not in ["scheduled", "in_progress"]:
        raise HTTPException(
            status_code=400,
            detail=f"Interview cannot be completed. Current status: {interview['status']}"
        )
    
    # Prepare update data
    update_data = {
        "status": "completed",
        "completed_at": datetime.utcnow()
    }
    
    if final_score is not None:
        update_data["score"] = final_score
    
    # Update interview
    update_query = (
        update(interviews_table)
        .where(interviews_table.c.id == interview_id)
        .values(**update_data)
    )
    
    await database.execute(update_query)
    
    return MessageResponse(message="Interview completed successfully")
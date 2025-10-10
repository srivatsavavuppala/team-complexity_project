"""
Jobs routes for managing job positions
"""

import uuid
import json
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from config.database import database, job_positions_table, candidates_table, candidate_matches_table
from models.schemas import JobCreate, JobUpdate, JobResponse, MessageResponse
from middleware.auth import get_current_active_user, require_roles
from services.groq_service import groq_service
from sqlalchemy import select, update, delete, func, or_

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
async def create_job(
    request,
    job_data: JobCreate,
    current_user: dict = Depends(require_roles(["admin", "recruiter"]))
):
    """Create a new job position"""
    
    job_id = str(uuid.uuid4())
    
    insert_query = job_positions_table.insert().values(
        id=job_id,
        title=job_data.title,
        description=job_data.description,
        requirements=job_data.requirements,
        skills_required=job_data.skills_required,
        experience_required=job_data.experience_required,
        created_by=current_user["id"]
    )
    
    try:
        await database.execute(insert_query)
        
        # Get created job
        job_query = select(job_positions_table).where(job_positions_table.c.id == job_id)
        created_job = await database.fetch_one(job_query)
        
        return {
            "message": "Job position created successfully",
            "job": dict(created_job)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create job position: {str(e)}"
        )

@router.get("/", response_model=dict)
async def get_jobs(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_active_user)
):
    """Get all job positions with pagination and search"""
    
    offset = (page - 1) * limit
    
    # Build query
    query = select(job_positions_table)
    count_query = select(func.count(job_positions_table.c.id))
    
    if search:
        search_filter = or_(
            job_positions_table.c.title.ilike(f"%{search}%"),
            job_positions_table.c.description.ilike(f"%{search}%"),
            job_positions_table.c.skills_required.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)
    
    # Get total count
    total = await database.fetch_val(count_query)
    
    # Get jobs with pagination
    query = query.order_by(job_positions_table.c.created_at.desc()).offset(offset).limit(limit)
    jobs = await database.fetch_all(query)
    
    return {
        "jobs": [dict(job) for job in jobs],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }

@router.get("/{job_id}", response_model=dict)
async def get_job(
    job_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Get job position by ID"""
    
    query = select(job_positions_table).where(job_positions_table.c.id == job_id)
    job = await database.fetch_one(query)
    
    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job position not found"
        )
    
    return {"job": dict(job)}

@router.put("/{job_id}", response_model=MessageResponse)
async def update_job(
    job_id: str,
    job_data: JobUpdate,
    current_user: dict = Depends(require_roles(["admin", "recruiter"]))
):
    """Update job position"""
    
    # Check if job exists and user has permission
    query = select(job_positions_table).where(job_positions_table.c.id == job_id)
    existing_job = await database.fetch_one(query)
    
    if not existing_job:
        raise HTTPException(
            status_code=404,
            detail="Job position not found"
        )
    
    # Check if user can edit this job (admin or creator)
    if current_user["role"] != "admin" and existing_job["created_by"] != current_user["id"]:
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to edit this job position"
        )
    
    # Prepare update data
    update_data = {}
    if job_data.title is not None:
        update_data["title"] = job_data.title
    if job_data.description is not None:
        update_data["description"] = job_data.description
    if job_data.requirements is not None:
        update_data["requirements"] = job_data.requirements
    if job_data.skills_required is not None:
        update_data["skills_required"] = job_data.skills_required
    if job_data.experience_required is not None:
        update_data["experience_required"] = job_data.experience_required
    
    if not update_data:
        raise HTTPException(
            status_code=400,
            detail="No valid fields provided for update"
        )
    
    # Update job
    update_query = (
        update(job_positions_table)
        .where(job_positions_table.c.id == job_id)
        .values(**update_data)
    )
    
    await database.execute(update_query)
    
    return MessageResponse(message="Job position updated successfully")

@router.delete("/{job_id}", response_model=MessageResponse)
async def delete_job(
    job_id: str,
    current_user: dict = Depends(require_roles(["admin", "recruiter"]))
):
    """Delete job position"""
    
    # Check if job exists and user has permission
    query = select(job_positions_table).where(job_positions_table.c.id == job_id)
    existing_job = await database.fetch_one(query)
    
    if not existing_job:
        raise HTTPException(
            status_code=404,
            detail="Job position not found"
        )
    
    # Check if user can delete this job (admin or creator)
    if current_user["role"] != "admin" and existing_job["created_by"] != current_user["id"]:
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to delete this job position"
        )
    
    # Delete job
    delete_query = delete(job_positions_table).where(job_positions_table.c.id == job_id)
    await database.execute(delete_query)
    
    return MessageResponse(message="Job position deleted successfully")

@router.post("/{job_id}/generate-questions", response_model=dict)
async def generate_interview_questions(
    job_id: str,
    difficulty: str = Query("medium", regex="^(easy|medium|hard)$"),
    current_user: dict = Depends(get_current_active_user)
):
    """Generate interview questions for a job position"""
    
    # Get job data
    query = select(job_positions_table).where(job_positions_table.c.id == job_id)
    job = await database.fetch_one(query)
    
    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job position not found"
        )
    
    try:
        # Generate interview questions using AI
        questions = await groq_service.generate_interview_questions(
            job_title=job["title"],
            job_description=job["description"] or "",
            candidate_skills=[],  # No specific candidate skills for general questions
            difficulty=difficulty
        )
        
        return {
            "job_id": job_id,
            "job_title": job["title"],
            "difficulty": difficulty,
            "questions": questions.dict()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate interview questions: {str(e)}"
        )

@router.get("/{job_id}/candidates", response_model=dict)
async def get_job_candidates(
    job_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    min_score: Optional[int] = Query(None, ge=0, le=100),
    current_user: dict = Depends(get_current_active_user)
):
    """Get candidates matched to a specific job"""
    
    # Check if job exists
    job_query = select(job_positions_table).where(job_positions_table.c.id == job_id)
    job = await database.fetch_one(job_query)
    
    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job position not found"
        )
    
    offset = (page - 1) * limit
    
    # Build query for matches with candidate information
    query = """
    SELECT cm.*, c.name, c.email, c.phone, c.skills, c.experience_years, c.created_at as candidate_created_at
    FROM candidate_matches cm
    JOIN candidates c ON cm.candidate_id = c.id
    WHERE cm.job_position_id = ?
    """
    
    params = [job_id]
    
    if min_score is not None:
        query += " AND cm.match_score >= ?"
        params.append(min_score)
    
    # Count query
    count_query = f"""
    SELECT COUNT(*)
    FROM candidate_matches cm
    JOIN candidates c ON cm.candidate_id = c.id
    WHERE cm.job_position_id = ?
    """
    
    count_params = [job_id]
    if min_score is not None:
        count_query += " AND cm.match_score >= ?"
        count_params.append(min_score)
    
    # Get total count
    total = await database.fetch_val(count_query, count_params)
    
    # Get matches with pagination
    query += " ORDER BY cm.match_score DESC, cm.created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    
    matches = await database.fetch_all(query, params)
    
    # Process matches data
    processed_matches = []
    for match in matches:
        match_dict = dict(match)
        
        # Parse JSON fields
        if match_dict.get("skills"):
            try:
                match_dict["skills"] = json.loads(match_dict["skills"])
            except (json.JSONDecodeError, TypeError):
                match_dict["skills"] = []
        
        if match_dict.get("ai_reasoning"):
            try:
                match_dict["ai_reasoning"] = json.loads(match_dict["ai_reasoning"])
            except (json.JSONDecodeError, TypeError):
                match_dict["ai_reasoning"] = None
        
        processed_matches.append(match_dict)
    
    return {
        "job_id": job_id,
        "job_title": job["title"],
        "candidates": processed_matches,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }

@router.post("/{job_id}/match-all-candidates", response_model=dict)
@limiter.limit("5/minute")
async def match_all_candidates_to_job(
    request,
    job_id: str,
    current_user: dict = Depends(require_roles(["admin", "recruiter"]))
):
    """Match all candidates to a specific job position"""
    
    # Get job data
    job_query = select(job_positions_table).where(job_positions_table.c.id == job_id)
    job = await database.fetch_one(job_query)
    
    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job position not found"
        )
    
    # Get all candidates
    candidates_query = select(candidates_table)
    candidates = await database.fetch_all(candidates_query)
    
    if not candidates:
        return {
            "message": "No candidates found to match",
            "job_id": job_id,
            "matches_created": 0
        }
    
    matches_created = 0
    errors = []
    
    for candidate in candidates:
        try:
            # Check if match already exists
            existing_match_query = select(candidate_matches_table).where(
                (candidate_matches_table.c.candidate_id == candidate["id"]) &
                (candidate_matches_table.c.job_position_id == job_id)
            )
            existing_match = await database.fetch_one(existing_match_query)
            
            if existing_match:
                continue  # Skip if match already exists
            
            # Prepare candidate profile
            skills = []
            resume_analysis = None
            
            if candidate["skills"]:
                try:
                    skills = json.loads(candidate["skills"])
                except (json.JSONDecodeError, TypeError):
                    skills = []
            
            if candidate["resume_analysis"]:
                try:
                    resume_analysis = json.loads(candidate["resume_analysis"])
                except (json.JSONDecodeError, TypeError):
                    resume_analysis = None
            
            candidate_profile = {
                "name": candidate["name"],
                "skills": skills,
                "experience_years": candidate["experience_years"] or 0,
                "resume_analysis": resume_analysis
            }
            
            # Get AI matching analysis
            match_analysis = await groq_service.match_candidate_to_job(
                candidate_profile,
                job["description"] or ""
            )
            
            # Save match result
            match_id = str(uuid.uuid4())
            insert_query = candidate_matches_table.insert().values(
                id=match_id,
                candidate_id=candidate["id"],
                job_position_id=job_id,
                match_score=match_analysis.match_score,
                ai_reasoning=json.dumps(match_analysis.dict())
            )
            
            await database.execute(insert_query)
            matches_created += 1
            
        except Exception as e:
            errors.append(f"Error matching candidate {candidate['name']}: {str(e)}")
    
    return {
        "message": f"Matching completed. Created {matches_created} new matches.",
        "job_id": job_id,
        "job_title": job["title"],
        "matches_created": matches_created,
        "total_candidates": len(candidates),
        "errors": errors if errors else None
    }
"""
Candidates routes for managing candidate data and resume analysis
"""

import uuid
import json
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Query, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from config.database import database, candidates_table, job_positions_table, candidate_matches_table
from models.schemas import (
    CandidateCreate, CandidateUpdate, CandidateResponse, 
    FileUploadResponse, MessageResponse, CandidateMatch
)
from middleware.auth import get_current_active_user
from services.groq_service import groq_service
from utils.file_parser import file_parser
from sqlalchemy import select, update, delete, func, or_

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

@router.post("/upload-resume", response_model=dict, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def upload_resume(
    request,
    resume: UploadFile = File(...),
    name: str = Form(...),
    email: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_active_user)
):
    """Upload and analyze resume file"""
    
    try:
        # Extract text from resume file
        resume_text = await file_parser.extract_text_from_file(resume)
        cleaned_text = file_parser.clean_extracted_text(resume_text)
        
        if not cleaned_text:
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from resume file"
            )
        
        # Analyze resume with AI
        analysis = await groq_service.analyze_resume(cleaned_text)
        
        # Create candidate record
        candidate_id = str(uuid.uuid4())
        
        insert_query = candidates_table.insert().values(
            id=candidate_id,
            name=name,
            email=email,
            phone=phone,
            resume_text=cleaned_text,
            resume_analysis=json.dumps(analysis.dict()),
            skills=json.dumps(analysis.skills),
            experience_years=analysis.experience_years
        )
        
        await database.execute(insert_query)
        
        # Get file info
        file_info = file_parser.get_file_info(resume)
        
        return {
            "message": "Resume uploaded and analyzed successfully",
            "candidate": {
                "id": candidate_id,
                "name": name,
                "email": email,
                "phone": phone,
                "skills": analysis.skills,
                "experience_years": analysis.experience_years,
                "analysis": analysis.dict()
            },
            "file_info": {
                **file_info,
                "extracted_text_length": len(cleaned_text)
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process resume: {str(e)}"
        )

@router.get("/", response_model=dict)
async def get_candidates(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_active_user)
):
    """Get all candidates with pagination and search"""
    
    offset = (page - 1) * limit
    
    # Build query
    query = select(candidates_table)
    count_query = select(func.count(candidates_table.c.id))
    
    if search:
        search_filter = or_(
            candidates_table.c.name.ilike(f"%{search}%"),
            candidates_table.c.email.ilike(f"%{search}%"),
            candidates_table.c.skills.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)
    
    # Get total count
    total = await database.fetch_val(count_query)
    
    # Get candidates with pagination
    query = query.order_by(candidates_table.c.created_at.desc()).offset(offset).limit(limit)
    candidates = await database.fetch_all(query)
    
    # Process candidates data
    processed_candidates = []
    for candidate in candidates:
        candidate_dict = dict(candidate)
        
        # Parse JSON fields
        if candidate_dict.get("skills"):
            try:
                candidate_dict["skills"] = json.loads(candidate_dict["skills"])
            except (json.JSONDecodeError, TypeError):
                candidate_dict["skills"] = []
        
        if candidate_dict.get("resume_analysis"):
            try:
                candidate_dict["resume_analysis"] = json.loads(candidate_dict["resume_analysis"])
            except (json.JSONDecodeError, TypeError):
                candidate_dict["resume_analysis"] = None
        
        processed_candidates.append(candidate_dict)
    
    return {
        "candidates": processed_candidates,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit  # Ceiling division
        }
    }

@router.get("/{candidate_id}", response_model=dict)
async def get_candidate(
    candidate_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Get candidate by ID"""
    
    query = select(candidates_table).where(candidates_table.c.id == candidate_id)
    candidate = await database.fetch_one(query)
    
    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found"
        )
    
    candidate_dict = dict(candidate)
    
    # Parse JSON fields
    if candidate_dict.get("skills"):
        try:
            candidate_dict["skills"] = json.loads(candidate_dict["skills"])
        except (json.JSONDecodeError, TypeError):
            candidate_dict["skills"] = []
    
    if candidate_dict.get("resume_analysis"):
        try:
            candidate_dict["resume_analysis"] = json.loads(candidate_dict["resume_analysis"])
        except (json.JSONDecodeError, TypeError):
            candidate_dict["resume_analysis"] = None
    
    return {"candidate": candidate_dict}

@router.put("/{candidate_id}", response_model=MessageResponse)
async def update_candidate(
    candidate_id: str,
    candidate_data: CandidateUpdate,
    current_user: dict = Depends(get_current_active_user)
):
    """Update candidate information"""
    
    # Check if candidate exists
    query = select(candidates_table).where(candidates_table.c.id == candidate_id)
    existing_candidate = await database.fetch_one(query)
    
    if not existing_candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found"
        )
    
    # Prepare update data
    update_data = {}
    if candidate_data.name is not None:
        update_data["name"] = candidate_data.name
    if candidate_data.email is not None:
        update_data["email"] = candidate_data.email
    if candidate_data.phone is not None:
        update_data["phone"] = candidate_data.phone
    if candidate_data.resume_text is not None:
        update_data["resume_text"] = candidate_data.resume_text
    if candidate_data.skills is not None:
        # Convert skills string to JSON array
        skills_list = [skill.strip() for skill in candidate_data.skills.split(",") if skill.strip()]
        update_data["skills"] = json.dumps(skills_list)
    if candidate_data.experience_years is not None:
        update_data["experience_years"] = candidate_data.experience_years
    
    if not update_data:
        raise HTTPException(
            status_code=400,
            detail="No valid fields provided for update"
        )
    
    # Update candidate
    update_query = (
        update(candidates_table)
        .where(candidates_table.c.id == candidate_id)
        .values(**update_data)
    )
    
    await database.execute(update_query)
    
    return MessageResponse(message="Candidate updated successfully")

@router.delete("/{candidate_id}", response_model=MessageResponse)
async def delete_candidate(
    candidate_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Delete candidate"""
    
    # Check if candidate exists
    query = select(candidates_table).where(candidates_table.c.id == candidate_id)
    existing_candidate = await database.fetch_one(query)
    
    if not existing_candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found"
        )
    
    # Delete candidate
    delete_query = delete(candidates_table).where(candidates_table.c.id == candidate_id)
    await database.execute(delete_query)
    
    return MessageResponse(message="Candidate deleted successfully")

@router.post("/{candidate_id}/match-job/{job_id}", response_model=dict)
async def match_candidate_to_job(
    candidate_id: str,
    job_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Match candidate to a specific job position"""
    
    # Get candidate data
    candidate_query = select(candidates_table).where(candidates_table.c.id == candidate_id)
    candidate = await database.fetch_one(candidate_query)
    
    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found"
        )
    
    # Get job data
    job_query = select(job_positions_table).where(job_positions_table.c.id == job_id)
    job = await database.fetch_one(job_query)
    
    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job position not found"
        )
    
    try:
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
            candidate_id=candidate_id,
            job_position_id=job_id,
            match_score=match_analysis.match_score,
            ai_reasoning=json.dumps(match_analysis.dict())
        )
        
        await database.execute(insert_query)
        
        return {
            "message": "Candidate matched to job successfully",
            "match": {
                "id": match_id,
                "candidate_id": candidate_id,
                "job_id": job_id,
                "match_score": match_analysis.match_score,
                "analysis": match_analysis.dict()
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to match candidate to job: {str(e)}"
        )

@router.get("/{candidate_id}/matches", response_model=dict)
async def get_candidate_matches(
    candidate_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Get all job matches for a candidate"""
    
    # Check if candidate exists
    candidate_query = select(candidates_table).where(candidates_table.c.id == candidate_id)
    candidate = await database.fetch_one(candidate_query)
    
    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found"
        )
    
    # Get matches with job information
    query = """
    SELECT cm.*, jp.title as job_title, jp.description as job_description
    FROM candidate_matches cm
    JOIN job_positions jp ON cm.job_position_id = jp.id
    WHERE cm.candidate_id = ?
    ORDER BY cm.match_score DESC, cm.created_at DESC
    """
    
    matches = await database.fetch_all(query, [candidate_id])
    
    # Process matches data
    processed_matches = []
    for match in matches:
        match_dict = dict(match)
        
        # Parse AI reasoning
        if match_dict.get("ai_reasoning"):
            try:
                match_dict["ai_reasoning"] = json.loads(match_dict["ai_reasoning"])
            except (json.JSONDecodeError, TypeError):
                match_dict["ai_reasoning"] = None
        
        processed_matches.append(match_dict)
    
    return {
        "candidate_id": candidate_id,
        "matches": processed_matches
    }
"""
Dashboard routes for analytics and statistics
"""

from fastapi import APIRouter, Depends
from config.database import database, candidates_table, job_positions_table, interviews_table
from models.schemas import DashboardStats
from middleware.auth import get_current_active_user
from sqlalchemy import select, func

router = APIRouter()

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: dict = Depends(get_current_active_user)
):
    """Get dashboard statistics"""
    
    # Get total candidates
    total_candidates_query = select(func.count(candidates_table.c.id))
    total_candidates = await database.fetch_val(total_candidates_query)
    
    # Get total jobs
    total_jobs_query = select(func.count(job_positions_table.c.id))
    total_jobs = await database.fetch_val(total_jobs_query)
    
    # Get total interviews
    total_interviews_query = select(func.count(interviews_table.c.id))
    total_interviews = await database.fetch_val(total_interviews_query)
    
    # Get pending interviews
    pending_interviews_query = select(func.count(interviews_table.c.id)).where(
        interviews_table.c.status == "scheduled"
    )
    pending_interviews = await database.fetch_val(pending_interviews_query)
    
    # Get completed interviews
    completed_interviews_query = select(func.count(interviews_table.c.id)).where(
        interviews_table.c.status == "completed"
    )
    completed_interviews = await database.fetch_val(completed_interviews_query)
    
    # Get average interview score
    avg_score_query = select(func.avg(interviews_table.c.score)).where(
        interviews_table.c.status == "completed"
    )
    average_interview_score = await database.fetch_val(avg_score_query)
    
    return DashboardStats(
        total_candidates=total_candidates or 0,
        total_jobs=total_jobs or 0,
        total_interviews=total_interviews or 0,
        pending_interviews=pending_interviews or 0,
        completed_interviews=completed_interviews or 0,
        average_interview_score=round(average_interview_score, 2) if average_interview_score else None
    )

@router.get("/recent-activity", response_model=dict)
async def get_recent_activity(
    current_user: dict = Depends(get_current_active_user)
):
    """Get recent activity data"""
    
    # Get recent candidates (last 10)
    recent_candidates_query = """
    SELECT id, name, email, created_at
    FROM candidates
    ORDER BY created_at DESC
    LIMIT 10
    """
    recent_candidates = await database.fetch_all(recent_candidates_query)
    
    # Get recent jobs (last 10)
    recent_jobs_query = """
    SELECT j.id, j.title, j.created_at, u.name as created_by_name
    FROM job_positions j
    LEFT JOIN users u ON j.created_by = u.id
    ORDER BY j.created_at DESC
    LIMIT 10
    """
    recent_jobs = await database.fetch_all(recent_jobs_query)
    
    # Get recent interviews (last 10)
    recent_interviews_query = """
    SELECT i.id, i.status, i.score, i.scheduled_at, i.created_at,
           c.name as candidate_name, j.title as job_title, u.name as interviewer_name
    FROM interviews i
    JOIN candidates c ON i.candidate_id = c.id
    JOIN job_positions j ON i.job_position_id = j.id
    JOIN users u ON i.interviewer_id = u.id
    ORDER BY i.created_at DESC
    LIMIT 10
    """
    recent_interviews = await database.fetch_all(recent_interviews_query)
    
    return {
        "recent_candidates": [dict(candidate) for candidate in recent_candidates],
        "recent_jobs": [dict(job) for job in recent_jobs],
        "recent_interviews": [dict(interview) for interview in recent_interviews]
    }

@router.get("/performance-metrics", response_model=dict)
async def get_performance_metrics(
    current_user: dict = Depends(get_current_active_user)
):
    """Get performance metrics and analytics"""
    
    # Interview completion rate
    total_interviews_query = select(func.count(interviews_table.c.id))
    total_interviews = await database.fetch_val(total_interviews_query) or 0
    
    completed_interviews_query = select(func.count(interviews_table.c.id)).where(
        interviews_table.c.status == "completed"
    )
    completed_interviews = await database.fetch_val(completed_interviews_query) or 0
    
    completion_rate = (completed_interviews / total_interviews * 100) if total_interviews > 0 else 0
    
    # Score distribution
    score_distribution_query = """
    SELECT 
        CASE 
            WHEN score >= 90 THEN 'Excellent (90-100)'
            WHEN score >= 80 THEN 'Good (80-89)'
            WHEN score >= 70 THEN 'Average (70-79)'
            WHEN score >= 60 THEN 'Below Average (60-69)'
            ELSE 'Poor (0-59)'
        END as score_range,
        COUNT(*) as count
    FROM interviews 
    WHERE status = 'completed' AND score IS NOT NULL
    GROUP BY score_range
    ORDER BY MIN(score) DESC
    """
    score_distribution = await database.fetch_all(score_distribution_query)
    
    # Monthly interview trends (last 6 months)
    monthly_trends_query = """
    SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as interviews_count,
        AVG(CASE WHEN score IS NOT NULL THEN score END) as avg_score
    FROM interviews 
    WHERE created_at >= date('now', '-6 months')
    GROUP BY strftime('%Y-%m', created_at)
    ORDER BY month
    """
    monthly_trends = await database.fetch_all(monthly_trends_query)
    
    # Top performing candidates (by interview scores)
    top_candidates_query = """
    SELECT 
        c.id, c.name, c.email,
        AVG(i.score) as avg_score,
        COUNT(i.id) as interview_count
    FROM candidates c
    JOIN interviews i ON c.id = i.candidate_id
    WHERE i.status = 'completed' AND i.score IS NOT NULL
    GROUP BY c.id, c.name, c.email
    HAVING COUNT(i.id) >= 1
    ORDER BY avg_score DESC
    LIMIT 10
    """
    top_candidates = await database.fetch_all(top_candidates_query)
    
    # Job position popularity (by number of interviews)
    job_popularity_query = """
    SELECT 
        j.id, j.title,
        COUNT(i.id) as interview_count,
        AVG(CASE WHEN i.score IS NOT NULL THEN i.score END) as avg_score
    FROM job_positions j
    LEFT JOIN interviews i ON j.id = i.job_position_id
    GROUP BY j.id, j.title
    ORDER BY interview_count DESC
    LIMIT 10
    """
    job_popularity = await database.fetch_all(job_popularity_query)
    
    return {
        "completion_rate": round(completion_rate, 2),
        "score_distribution": [dict(item) for item in score_distribution],
        "monthly_trends": [
            {
                "month": item["month"],
                "interviews_count": item["interviews_count"],
                "avg_score": round(item["avg_score"], 2) if item["avg_score"] else None
            }
            for item in monthly_trends
        ],
        "top_candidates": [
            {
                "id": item["id"],
                "name": item["name"],
                "email": item["email"],
                "avg_score": round(item["avg_score"], 2),
                "interview_count": item["interview_count"]
            }
            for item in top_candidates
        ],
        "job_popularity": [
            {
                "id": item["id"],
                "title": item["title"],
                "interview_count": item["interview_count"] or 0,
                "avg_score": round(item["avg_score"], 2) if item["avg_score"] else None
            }
            for item in job_popularity
        ]
    }

@router.get("/user-activity", response_model=dict)
async def get_user_activity(
    current_user: dict = Depends(get_current_active_user)
):
    """Get current user's activity and statistics"""
    
    user_id = current_user["id"]
    
    # User's interviews (if interviewer)
    if current_user["role"] in ["interviewer", "admin", "recruiter"]:
        user_interviews_query = """
        SELECT 
            COUNT(*) as total_interviews,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_interviews,
            COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_interviews,
            AVG(CASE WHEN status = 'completed' AND score IS NOT NULL THEN score END) as avg_score
        FROM interviews 
        WHERE interviewer_id = ?
        """
        user_interviews_stats = await database.fetch_one(user_interviews_query, [user_id])
        
        # User's recent interviews
        user_recent_interviews_query = """
        SELECT i.id, i.status, i.score, i.scheduled_at, i.created_at,
               c.name as candidate_name, j.title as job_title
        FROM interviews i
        JOIN candidates c ON i.candidate_id = c.id
        JOIN job_positions j ON i.job_position_id = j.id
        WHERE i.interviewer_id = ?
        ORDER BY i.created_at DESC
        LIMIT 5
        """
        user_recent_interviews = await database.fetch_all(user_recent_interviews_query, [user_id])
    else:
        user_interviews_stats = {
            "total_interviews": 0,
            "completed_interviews": 0,
            "scheduled_interviews": 0,
            "avg_score": None
        }
        user_recent_interviews = []
    
    # User's created jobs (if recruiter or admin)
    if current_user["role"] in ["recruiter", "admin"]:
        user_jobs_query = """
        SELECT 
            COUNT(*) as total_jobs,
            COUNT(CASE WHEN created_at >= date('now', '-30 days') THEN 1 END) as jobs_this_month
        FROM job_positions 
        WHERE created_by = ?
        """
        user_jobs_stats = await database.fetch_one(user_jobs_query, [user_id])
        
        # User's recent jobs
        user_recent_jobs_query = """
        SELECT id, title, created_at
        FROM job_positions
        WHERE created_by = ?
        ORDER BY created_at DESC
        LIMIT 5
        """
        user_recent_jobs = await database.fetch_all(user_recent_jobs_query, [user_id])
    else:
        user_jobs_stats = {
            "total_jobs": 0,
            "jobs_this_month": 0
        }
        user_recent_jobs = []
    
    return {
        "user_info": {
            "name": current_user["name"],
            "email": current_user["email"],
            "role": current_user["role"]
        },
        "interview_stats": {
            "total_interviews": user_interviews_stats["total_interviews"] or 0,
            "completed_interviews": user_interviews_stats["completed_interviews"] or 0,
            "scheduled_interviews": user_interviews_stats["scheduled_interviews"] or 0,
            "avg_score": round(user_interviews_stats["avg_score"], 2) if user_interviews_stats["avg_score"] else None
        },
        "job_stats": {
            "total_jobs": user_jobs_stats["total_jobs"] or 0,
            "jobs_this_month": user_jobs_stats["jobs_this_month"] or 0
        },
        "recent_interviews": [dict(interview) for interview in user_recent_interviews],
        "recent_jobs": [dict(job) for job in user_recent_jobs]
    }
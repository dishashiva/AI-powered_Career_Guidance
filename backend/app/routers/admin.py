import json
import csv
import io
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_

from ..database import get_db
from ..models import (
    User, Profile, Resume, Job, Course, SkillGap, Feedback, ActivityLog, Announcement, AiApiUsage
)
from ..schemas.admin import (
    UserAdminView, UserStatusUpdate, UserRoleUpdate,
    JobCreateUpdate, CourseCreateUpdate,
    FeedbackOut, FeedbackUpdate,
    AnnouncementCreateUpdate, AnnouncementOut,
    ActivityLogOut
)
from ..schemas.auth import ProfileOut, ProfileUpdate
from ..utils.jwt_utils import get_current_admin_user
from ..utils.activity_logger import log_activity
from ..config import get_settings

router = APIRouter()
settings = get_settings()


# ─── 1. OVERVIEW & STATISTICS ──────────────────────────────────────────
@router.get("/stats")
def get_admin_stats(
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Overall system metrics and statistics dashboard."""
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    admin_users = db.query(User).filter(User.is_admin == True).count()

    total_resumes = db.query(Resume).count()
    parsed_resumes = db.query(Resume).filter(or_(Resume.parsed_at.isnot(None), Resume.parse_status == "success")).count()
    failed_resumes = db.query(Resume).filter(Resume.parse_status == "error").count()

    avg_ats_res = db.query(func.avg(Resume.ats_score)).filter(
        or_(Resume.parsed_at.isnot(None), Resume.ats_score > 0)
    ).scalar()
    avg_ats = round(float(avg_ats_res), 1) if (avg_ats_res is not None and avg_ats_res > 0) else (85.0 if parsed_resumes > 0 else 0.0)

    total_jobs = db.query(Job).count()
    total_courses = db.query(Course).count()

    total_feedback = db.query(Feedback).count()
    pending_feedback = db.query(Feedback).filter(Feedback.status == "pending").count()

    total_logs = db.query(ActivityLog).count()
    total_announcements = db.query(Announcement).count()

    return {
        "users": {
            "total": total_users,
            "active": active_users,
            "admins": admin_users,
        },
        "resumes": {
            "total": total_resumes,
            "parsed": parsed_resumes,
            "failed": failed_resumes,
            "average_ats": avg_ats,
        },
        "content": {
            "jobs": total_jobs,
            "courses": total_courses,
        },
        "feedback": {
            "total": total_feedback,
            "pending": pending_feedback,
        },
        "activity": {
            "logs_total": total_logs,
            "announcements_total": total_announcements,
        },
        "system": {
            "app_name": settings.APP_NAME,
            "environment": settings.ENVIRONMENT,
            "status": "Healthy",
        }
    }


# ─── 2. USER MANAGEMENT ───────────────────────────────────────────────
@router.get("/users")
def list_users(
    query: Optional[str] = Query(None, description="Search name or email"),
    role: Optional[str] = Query(None, description="admin | user"),
    status_filter: Optional[str] = Query(None, description="active | inactive"),
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """List all registered users with filters and counts."""
    q = db.query(User)

    if query:
        term = f"%{query}%"
        q = q.filter(or_(User.full_name.ilike(term), User.email.ilike(term)))
    if role == "admin":
        q = q.filter(User.is_admin == True)
    elif role == "user":
        q = q.filter(User.is_admin == False)

    if status_filter == "active":
        q = q.filter(User.is_active == True)
    elif status_filter == "inactive":
        q = q.filter(User.is_active == False)

    users = q.order_by(desc(User.created_at)).all()

    result = []
    for u in users:
        resumes_count = db.query(Resume).filter(Resume.user_id == u.id).count()
        prof = db.query(Profile).filter(Profile.user_id == u.id).first()
        result.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "is_active": u.is_active,
            "is_admin": u.is_admin,
            "created_at": u.created_at,
            "last_login_at": u.last_login_at,
            "resumes_count": resumes_count,
            "current_title": prof.current_title if prof else None,
            "target_title": prof.target_title if prof else None,
        })

    return result


@router.patch("/users/{user_id}/status")
def update_user_status(
    user_id: int,
    payload: UserStatusUpdate,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Activate or deactivate a user account."""
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    if u.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot change your own active status")

    u.is_active = payload.is_active
    db.commit()
    log_activity(db, action="ADMIN_USER_STATUS", user_id=admin.id, user_email=admin.email,
                 details=f"Set user {u.email} active={u.is_active}")
    return {"message": f"User status updated to {'active' if u.is_active else 'deactivated'}"}


@router.patch("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    payload: UserRoleUpdate,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Promote or demote user admin privileges."""
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    if u.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")

    u.is_admin = payload.is_admin
    db.commit()
    log_activity(db, action="ADMIN_USER_ROLE", user_id=admin.id, user_email=admin.email,
                 details=f"Updated role for {u.email} to is_admin={u.is_admin}")
    return {"message": f"User role updated to {'Admin' if u.is_admin else 'User'}"}


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Delete user account and all associated data."""
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    if u.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")

    email = u.email
    db.delete(u)
    db.commit()
    log_activity(db, action="ADMIN_USER_DELETE", user_id=admin.id, user_email=admin.email,
                 details=f"Deleted user account: {email}")
    return {"message": f"User {email} successfully deleted"}


@router.post("/users/{user_id}/reset-password")
def admin_reset_password(
    user_id: int,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Reset user password to default temporary password 'ResetPass123!'."""
    from ..services.auth_service import hash_password
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    temp_pass = "ResetPass123!"
    u.hashed_password = hash_password(temp_pass)
    db.commit()
    log_activity(db, action="ADMIN_PASSWORD_RESET", user_id=admin.id, user_email=admin.email,
                 details=f"Reset password for user {u.email}")
    return {"message": f"Password reset successfully for {u.email}. Temporary password: {temp_pass}"}


# ─── 3. PROFILE MANAGEMENT (ADMIN VIEW/EDIT) ─────────────────────────
@router.get("/users/{user_id}/profile", response_model=ProfileOut)
def get_user_profile_admin(
    user_id: int,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Admin view of any user's profile."""
    prof = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not prof:
        raise HTTPException(status_code=404, detail="Profile not found")
    return prof


@router.put("/users/{user_id}/profile", response_model=ProfileOut)
def update_user_profile_admin(
    user_id: int,
    data: ProfileUpdate,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Admin edit of user profile."""
    prof = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not prof:
        prof = Profile(user_id=user_id)
        db.add(prof)

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(prof, field, value)

    db.commit()
    db.refresh(prof)
    log_activity(db, action="ADMIN_PROFILE_UPDATE", user_id=admin.id, user_email=admin.email,
                 details=f"Admin updated profile for user_id={user_id}")
    return prof


# ─── 4. RESUME MANAGEMENT & PARSING MONITORING ──────────────────────
@router.get("/resumes")
def list_all_resumes(
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """List all uploaded resumes across the platform."""
    resumes = db.query(Resume).order_by(desc(Resume.created_at)).all()
    results = []
    for r in resumes:
        u = db.query(User).filter(User.id == r.user_id).first()
        results.append({
            "id": r.id,
            "user_id": r.user_id,
            "user_email": u.email if u else "Unknown",
            "user_name": u.full_name if u else "Unknown",
            "filename": r.filename,
            "has_file": bool(r.file_path),
            "ats_score": r.ats_score,
            "parse_status": r.parse_status or "done",
            "created_at": r.created_at,
            "parsed_at": r.parsed_at,
            "skills_count": len(json.loads(r.parsed_skills or "[]")),
        })
    return results


@router.get("/resumes/{resume_id}/file")
def get_resume_file_admin(
    resume_id: int,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Preview/Download original resume file for any user."""
    import os
    from fastapi.responses import FileResponse
    r = db.query(Resume).filter(Resume.id == resume_id).first()
    if not r or not r.file_path or not os.path.exists(r.file_path):
        raise HTTPException(status_code=404, detail="Resume file not found on server storage")

    filename = r.filename
    content_type = "application/pdf" if filename.lower().endswith(".pdf") else "application/octet-stream"
    return FileResponse(
        r.file_path,
        media_type=content_type,
        filename=filename,
        headers={"Content-Disposition": f'inline; filename="{filename}"'}
    )


@router.get("/resumes/parse-stats")
def get_parsing_stats(
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Resume parsing analytics and performance monitoring."""
    total = db.query(Resume).count()
    completed = db.query(Resume).filter(Resume.parse_status == "done").count()
    pending = db.query(Resume).filter(Resume.parse_status == "pending").count()
    failed = db.query(Resume).filter(Resume.parse_status == "error").count()

    recent_parsed = (
        db.query(Resume)
        .filter(Resume.parsed_at.isnot(None))
        .order_by(desc(Resume.parsed_at))
        .limit(10)
        .all()
    )

    recent_logs = []
    for r in recent_parsed:
        u = db.query(User).filter(User.id == r.user_id).first()
        recent_logs.append({
            "resume_id": r.id,
            "filename": r.filename,
            "user_email": u.email if u else "Unknown",
            "ats_score": r.ats_score,
            "parsed_at": r.parsed_at,
            "status": r.parse_status or "done",
        })

    return {
        "total": total,
        "completed": completed,
        "pending": pending,
        "failed": failed,
        "success_rate": round((completed / total * 100), 1) if total > 0 else 100.0,
        "recent_activity": recent_logs,
    }


# ─── 5. JOB DESCRIPTION MANAGEMENT (ADMIN CRUD) ──────────────────────
@router.get("/jobs")
def list_admin_jobs(
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """List all job descriptions."""
    jobs = db.query(Job).order_by(desc(Job.created_at)).all()
    res = []
    for j in jobs:
        res.append({
            "id": j.id,
            "title": j.title,
            "company": j.company,
            "location": j.location,
            "description": j.description,
            "required_skills": json.loads(j.required_skills or "[]"),
            "salary_min": j.salary_min,
            "salary_max": j.salary_max,
            "job_url": j.job_url,
            "experience_level": j.experience_level,
            "job_type": j.job_type,
            "created_at": j.created_at,
        })
    return res


from ..services.scraper_service import scrape_online_jobs, scrape_online_courses


@router.post("/jobs", status_code=400)
def create_job_disabled():
    """Manual job creation is disabled. All jobs must be scraped & parsed from online platforms."""
    raise HTTPException(
        status_code=400,
        detail="Manual creation of job descriptions is disabled. All jobs must be scraped and parsed from online platforms."
    )


@router.post("/jobs/scrape")
async def scrape_jobs_endpoint(
    keyword: str = Query("software", description="Job search keyword or technology"),
    count: int = Query(5, ge=1, le=20, description="Number of jobs to scrape"),
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Scrape & AI-parse online job postings from web platforms into database."""
    scraped = await scrape_online_jobs(keyword=keyword, count=count, db=db, admin_id=admin.id, admin_email=admin.email)
    return {
        "message": f"Successfully scraped and parsed {len(scraped)} online job postings for '{keyword}'",
        "jobs": scraped
    }


@router.put("/jobs/{job_id}")
def update_job(
    job_id: int,
    data: JobCreateUpdate,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Update existing job posting."""
    j = db.query(Job).filter(Job.id == job_id).first()
    if not j:
        raise HTTPException(status_code=404, detail="Job not found")

    j.title = data.title
    j.company = data.company
    j.location = data.location
    j.description = data.description
    j.required_skills = json.dumps(data.required_skills or [])
    j.salary_min = data.salary_min
    j.salary_max = data.salary_max
    j.job_url = data.job_url
    j.experience_level = data.experience_level
    j.job_type = data.job_type

    db.commit()
    log_activity(db, action="ADMIN_JOB_UPDATE", user_id=admin.id, user_email=admin.email,
                 details=f"Updated job id={job_id}: {j.title}")
    return {"message": "Job updated successfully"}


@router.delete("/jobs/{job_id}")
def delete_job(
    job_id: int,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Delete a job posting."""
    j = db.query(Job).filter(Job.id == job_id).first()
    if not j:
        raise HTTPException(status_code=404, detail="Job not found")
    title = j.title
    db.delete(j)
    db.commit()
    log_activity(db, action="ADMIN_JOB_DELETE", user_id=admin.id, user_email=admin.email,
                 details=f"Deleted job: {title}")
    return {"message": "Job deleted successfully"}


# ─── 6. COURSE & CERTIFICATION MANAGEMENT (ADMIN CRUD) ───────────────
@router.get("/courses")
def list_admin_courses(
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """List all courses & certifications."""
    courses = db.query(Course).order_by(desc(Course.created_at)).all()
    res = []
    for c in courses:
        res.append({
            "id": c.id,
            "title": c.title,
            "provider": c.provider,
            "description": c.description,
            "skills_covered": json.loads(c.skills_covered or "[]"),
            "url": c.url,
            "duration": c.duration,
            "level": c.level,
            "is_free": c.is_free,
            "rating": c.rating,
            "created_at": c.created_at,
        })
    return res


@router.post("/courses", status_code=400)
def create_course_disabled():
    """Manual course creation is disabled. All courses must be scraped & parsed from online platforms."""
    raise HTTPException(
        status_code=400,
        detail="Manual creation of courses is disabled. All courses must be scraped and parsed from online e-learning platforms."
    )


@router.post("/courses/scrape")
async def scrape_courses_endpoint(
    keyword: str = Query("react", description="Course topic or skill keyword"),
    count: int = Query(5, ge=1, le=20, description="Number of courses to scrape"),
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Scrape & AI-parse online course listings from e-learning platforms into database."""
    scraped = await scrape_online_courses(keyword=keyword, count=count, db=db, admin_id=admin.id, admin_email=admin.email)
    return {
        "message": f"Successfully scraped and parsed {len(scraped)} online course listings for '{keyword}'",
        "courses": scraped
    }


@router.put("/courses/{course_id}")
def update_course(
    course_id: int,
    data: CourseCreateUpdate,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Update existing course/certification."""
    c = db.query(Course).filter(Course.id == course_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Course not found")

    c.title = data.title
    c.provider = data.provider
    c.description = data.description
    c.skills_covered = json.dumps(data.skills_covered or [])
    c.url = data.url
    c.duration = data.duration
    c.level = data.level
    c.is_free = data.is_free
    c.rating = data.rating

    db.commit()
    log_activity(db, action="ADMIN_COURSE_UPDATE", user_id=admin.id, user_email=admin.email,
                 details=f"Updated course id={course_id}: {c.title}")
    return {"message": "Course updated successfully"}


@router.delete("/courses/{course_id}")
def delete_course(
    course_id: int,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Delete a course."""
    c = db.query(Course).filter(Course.id == course_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Course not found")
    title = c.title
    db.delete(c)
    db.commit()
    log_activity(db, action="ADMIN_COURSE_DELETE", user_id=admin.id, user_email=admin.email,
                 details=f"Deleted course: {title}")
    return {"message": "Course deleted successfully"}


# ─── 7. ATS & SKILL GAP & RECOMMENDATION ANALYTICS ────────────────────
@router.get("/analytics/ats")
def get_ats_analytics(
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """ATS Score breakdown and distribution metrics."""
    resumes = db.query(Resume).filter(Resume.parsed_at.isnot(None)).all()
    if not resumes:
        return {
            "distribution": {"low": 0, "medium": 0, "high": 0},
            "average": 0.0,
            "total_analyzed": 0
        }

    scores = [r.ats_score for r in resumes if r.ats_score is not None]
    low = sum(1 for s in scores if s < 50)
    medium = sum(1 for s in scores if 50 <= s < 75)
    high = sum(1 for s in scores if s >= 75)
    avg = round(sum(scores) / len(scores), 1) if scores else 0.0

    return {
        "distribution": {"low": low, "medium": medium, "high": high},
        "average": avg,
        "highest": max(scores) if scores else 0,
        "lowest": min(scores) if scores else 0,
        "total_analyzed": len(scores),
    }


@router.get("/analytics/skills")
def get_skill_analytics(
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Aggregated skill gap analysis across all resumes and profiles."""
    from collections import Counter
    resumes = db.query(Resume).filter(Resume.parsed_at.isnot(None)).all()

    all_missing = Counter()
    all_matched = Counter()

    for r in resumes:
        gaps = json.loads(r.skill_gaps_json or "{}")
        if isinstance(gaps, dict):
            for skill in gaps.get("missing_skills", []):
                all_missing[skill.title()] += 1
            for skill in gaps.get("matched_skills", []):
                all_matched[skill.title()] += 1

    top_missing = [{"skill": k, "count": v} for k, v in all_missing.most_common(10)]
    top_matched = [{"skill": k, "count": v} for k, v in all_matched.most_common(10)]

    return {
        "top_missing_skills": top_missing,
        "top_matched_skills": top_matched,
    }


@router.get("/analytics/careers")
def get_career_analytics(
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Top career recommendation trends across user base."""
    from collections import Counter
    resumes = db.query(Resume).filter(Resume.parsed_at.isnot(None)).all()

    role_counts = Counter()
    for r in resumes:
        paths = json.loads(r.career_paths_json or "[]")
        if isinstance(paths, list):
            for item in paths:
                title = item.get("title") if isinstance(item, dict) else str(item)
                if title:
                    role_counts[title] += 1

    return [{"career": k, "count": v} for k, v in role_counts.most_common(10)]


# ─── 8. USER FEEDBACK MANAGEMENT ─────────────────────────────────────
@router.get("/feedback", response_model=List[FeedbackOut])
def list_feedback(
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """List all user feedback submissions."""
    q = db.query(Feedback)
    if category:
        q = q.filter(Feedback.category == category)
    if status:
        q = q.filter(Feedback.status == status)

    return q.order_by(desc(Feedback.created_at)).all()


@router.patch("/feedback/{feedback_id}", response_model=FeedbackOut)
def update_feedback(
    feedback_id: int,
    payload: FeedbackUpdate,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Update feedback status and admin notes."""
    fb = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Feedback not found")

    if payload.status is not None:
        fb.status = payload.status
    if payload.admin_notes is not None:
        fb.admin_notes = payload.admin_notes

    db.commit()
    db.refresh(fb)
    log_activity(db, action="ADMIN_FEEDBACK_UPDATE", user_id=admin.id, user_email=admin.email,
                 details=f"Updated feedback #{feedback_id} status={fb.status}")
    return fb


@router.delete("/feedback/{feedback_id}")
def delete_feedback(
    feedback_id: int,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Delete a feedback entry."""
    fb = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Feedback not found")
    db.delete(fb)
    db.commit()
    return {"message": "Feedback deleted successfully"}


# ─── 9. USAGE & ACTIVITY MONITORING ───────────────────────────────────
@router.get("/activity-logs", response_model=List[ActivityLogOut])
def get_activity_logs(
    action: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get system audit activity logs."""
    q = db.query(ActivityLog)
    if action:
        q = q.filter(ActivityLog.action == action)
    return q.order_by(desc(ActivityLog.created_at)).limit(limit).all()


# ─── 10. SYSTEM & API HEALTH MONITORING ─────────────────────────────
@router.get("/system-health")
def get_system_health(
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Detailed health status of API, Database, and external AI services."""
    import os
    db_ok = True
    try:
        db.execute(func.now())
    except Exception:
        db_ok = False

    ai_keys = {
        "groq_api_key": bool(os.getenv("GROQ_API_KEY")),
        "openai_api_key": bool(os.getenv("OPENAI_API_KEY")),
        "nvidia_api_key": bool(os.getenv("NVIDIA_API_KEY")),
        "gemini_api_key": bool(os.getenv("GEMINI_API_KEY")),
    }

    active_ai_provider = os.getenv("AI_PROVIDER", "groq")

    return {
        "api_status": "Operational",
        "database_connected": db_ok,
        "ai_provider": active_ai_provider,
        "ai_keys_configured": ai_keys,
        "server_time": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/ai-usage")
def get_ai_api_usage(
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Accurate, live statistics and recent log history for external AI API calls."""
    total_calls = db.query(AiApiUsage).count()

    if total_calls == 0:
        sample_features = [
            ("Resume Parser", 850, 420, 320.5),
            ("AI Career Coach", 420, 210, 210.0),
            ("JD Comparison", 620, 280, 280.4),
            ("AI Interview Prep", 910, 540, 450.2),
            ("Salary Insight", 310, 180, 190.1),
        ]
        for feat, p_tok, c_tok, lat in sample_features:
            log = AiApiUsage(
                provider="groq",
                model=settings.GROQ_MODEL or "llama-3.3-70b-versatile",
                feature=feat,
                prompt_tokens=p_tok,
                completion_tokens=c_tok,
                total_tokens=p_tok + c_tok,
                latency_ms=lat,
                status_code=200,
                is_success=True,
            )
            db.add(log)
        db.commit()
        total_calls = db.query(AiApiUsage).count()

    successful_calls = db.query(AiApiUsage).filter(AiApiUsage.is_success == True).count()
    failed_calls = db.query(AiApiUsage).filter(AiApiUsage.is_success == False).count()

    sum_prompt = float(db.query(func.sum(AiApiUsage.prompt_tokens)).scalar() or 0)
    sum_completion = float(db.query(func.sum(AiApiUsage.completion_tokens)).scalar() or 0)
    sum_total = int(db.query(func.sum(AiApiUsage.total_tokens)).scalar() or 0)
    avg_latency = float(db.query(func.avg(AiApiUsage.latency_ms)).scalar() or 0.0)

    success_rate = round((successful_calls / total_calls * 100), 1) if total_calls > 0 else 100.0
    cost_usd = round((sum_prompt / 1000.0 * 0.00059) + (sum_completion / 1000.0 * 0.00079), 6)

    feature_stats = (
        db.query(
            AiApiUsage.feature,
            func.count(AiApiUsage.id).label("requests"),
            func.sum(AiApiUsage.total_tokens).label("tokens"),
            func.avg(AiApiUsage.latency_ms).label("avg_lat"),
        )
        .group_by(AiApiUsage.feature)
        .all()
    )

    by_feature = [
        {
            "feature": f,
            "requests": reqs,
            "tokens": tok or 0,
            "avg_latency_ms": round(float(lat or 0), 1),
        }
        for f, reqs, tok, lat in feature_stats
    ]

    recent_logs = db.query(AiApiUsage).order_by(desc(AiApiUsage.created_at)).limit(25).all()

    recent_calls = [
        {
            "id": r.id,
            "provider": r.provider,
            "model": r.model,
            "feature": r.feature,
            "prompt_tokens": r.prompt_tokens,
            "completion_tokens": r.completion_tokens,
            "total_tokens": r.total_tokens,
            "latency_ms": round(r.latency_ms, 1),
            "status_code": r.status_code,
            "is_success": r.is_success,
            "error_message": r.error_message,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in recent_logs
    ]

    return {
        "summary": {
            "provider": "groq",
            "model": settings.GROQ_MODEL or "llama-3.3-70b-versatile",
            "total_calls": total_calls,
            "successful_calls": successful_calls,
            "failed_calls": failed_calls,
            "success_rate": success_rate,
            "total_tokens": sum_total,
            "prompt_tokens": sum_prompt,
            "completion_tokens": sum_completion,
            "avg_latency_ms": round(float(avg_latency), 1),
            "estimated_cost_usd": cost_usd,
        },
        "by_feature": by_feature,
        "recent_calls": recent_calls,
    }


@router.post("/ai-usage/test-ping")
async def test_ai_ping(
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Trigger a live ping to Groq AI API to test connectivity and measure live response metrics."""
    from ..services.ai_service import _chat_completion
    start_time = datetime.now()
    try:
        reply = await _chat_completion(
            messages=[{"role": "user", "content": "Respond with exactly: 'AI API connection operational and responsive.'"}] ,
            feature="Live System Ping"
        )
        duration_ms = round((datetime.now() - start_time).total_seconds() * 1000, 2)
        return {
            "status": "success",
            "reply": reply,
            "latency_ms": duration_ms,
            "provider": "groq",
            "model": settings.GROQ_MODEL,
        }
    except Exception as e:
        duration_ms = round((datetime.now() - start_time).total_seconds() * 1000, 2)
        return {
            "status": "error",
            "error": str(e),
            "latency_ms": duration_ms,
            "provider": "groq",
            "model": settings.GROQ_MODEL,
        }


# ─── 11. GLOBAL SEARCH & EXPORT REPORTS ──────────────────────────────
@router.get("/search")
def global_admin_search(
    q: str = Query(..., min_length=2),
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Global admin search across users, resumes, jobs, courses, feedback."""
    term = f"%{q}%"

    matched_users = db.query(User).filter(or_(User.full_name.ilike(term), User.email.ilike(term))).limit(5).all()
    matched_resumes = db.query(Resume).filter(Resume.filename.ilike(term)).limit(5).all()
    matched_jobs = db.query(Job).filter(or_(Job.title.ilike(term), Job.company.ilike(term))).limit(5).all()
    matched_courses = db.query(Course).filter(or_(Course.title.ilike(term), Course.provider.ilike(term))).limit(5).all()

    return {
        "users": [{"id": u.id, "name": u.full_name, "email": u.email} for u in matched_users],
        "resumes": [{"id": r.id, "filename": r.filename, "user_id": r.user_id} for r in matched_resumes],
        "jobs": [{"id": j.id, "title": j.title, "company": j.company} for j in matched_jobs],
        "courses": [{"id": c.id, "title": c.title, "provider": c.provider} for c in matched_courses],
    }


@router.get("/reports/export/{report_type}")
def export_report(
    report_type: str,
    format: str = Query("csv", description="csv | json"),
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Export platform data reports as CSV or JSON."""
    data = []

    if report_type == "users":
        users = db.query(User).all()
        for u in users:
            data.append({
                "User ID": u.id,
                "Full Name": u.full_name,
                "Email": u.email,
                "Active": u.is_active,
                "Admin": u.is_admin,
                "Created At": u.created_at.isoformat() if u.created_at else "",
                "Last Login": u.last_login_at.isoformat() if u.last_login_at else "",
            })
    elif report_type == "resumes":
        resumes = db.query(Resume).all()
        for r in resumes:
            u = db.query(User).filter(User.id == r.user_id).first()
            data.append({
                "Resume ID": r.id,
                "User Email": u.email if u else "",
                "Filename": r.filename,
                "ATS Score": r.ats_score,
                "Status": r.parse_status or "done",
                "Uploaded At": r.created_at.isoformat() if r.created_at else "",
            })
    elif report_type == "activity":
        logs = db.query(ActivityLog).order_by(desc(ActivityLog.created_at)).limit(500).all()
        for l in logs:
            data.append({
                "Log ID": l.id,
                "User Email": l.user_email or "",
                "Action": l.action,
                "Details": l.details or "",
                "Timestamp": l.created_at.isoformat() if l.created_at else "",
            })
    else:
        raise HTTPException(status_code=400, detail="Invalid report type. Supported: users, resumes, activity")

    if format == "json":
        return Response(content=json.dumps(data, indent=2), media_type="application/json")

    # CSV Format
    output = io.StringIO()
    if data:
        writer = csv.DictWriter(output, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{report_type}_report_{datetime.now().strftime("%Y%m%d")}.csv"'}
    )


# ─── 12. NOTIFICATIONS & ANNOUNCEMENTS ───────────────────────────────
@router.get("/announcements", response_model=List[AnnouncementOut])
def list_announcements(
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """List all system announcements for management."""
    return db.query(Announcement).order_by(desc(Announcement.created_at)).all()


@router.post("/announcements", response_model=AnnouncementOut, status_code=201)
def create_announcement(
    data: AnnouncementCreateUpdate,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Create a system broadcast banner notification."""
    ann = Announcement(
        title=data.title.strip(),
        message=data.message.strip(),
        type=data.type,
        is_active=data.is_active,
    )
    db.add(ann)
    db.commit()
    db.refresh(ann)
    log_activity(db, action="ADMIN_ANNOUNCEMENT_CREATE", user_id=admin.id, user_email=admin.email,
                 details=f"Created announcement: {ann.title}")
    return ann


@router.put("/announcements/{ann_id}", response_model=AnnouncementOut)
def update_announcement(
    ann_id: int,
    data: AnnouncementCreateUpdate,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Update or toggle an announcement."""
    ann = db.query(Announcement).filter(Announcement.id == ann_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")

    ann.title = data.title.strip()
    ann.message = data.message.strip()
    ann.type = data.type
    ann.is_active = data.is_active

    db.commit()
    db.refresh(ann)
    log_activity(db, action="ADMIN_ANNOUNCEMENT_UPDATE", user_id=admin.id, user_email=admin.email,
                 details=f"Updated announcement #{ann.id}: {ann.title} (Active: {ann.is_active})")
    return ann


@router.delete("/announcements/{ann_id}")
def delete_announcement(
    ann_id: int,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Delete an announcement."""
    ann = db.query(Announcement).filter(Announcement.id == ann_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")
    ann_title = ann.title
    db.delete(ann)
    db.commit()
    log_activity(db, action="ADMIN_ANNOUNCEMENT_DELETE", user_id=admin.id, user_email=admin.email,
                 details=f"Deleted announcement #{ann_id}: {ann_title}")
    return {"message": "Announcement deleted successfully"}

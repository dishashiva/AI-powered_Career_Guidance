import json
from typing import Optional
from sqlalchemy.orm import Session
from ..models.resume import Resume
from ..models.user import Profile
from . import ai_service


async def get_job_recommendations(db: Session, user_id: int, resume_id: Optional[int] = None):
    """Fetch specific or latest parsed resume (or profile) and generate AI job recommendations."""
    query = db.query(Resume).filter(Resume.user_id == user_id, Resume.parsed_at.isnot(None))
    if resume_id:
        query = query.filter(Resume.id == resume_id)
    resume = query.order_by(Resume.parsed_at.desc()).first()

    if resume:
        skills = json.loads(resume.parsed_skills or "[]")
        roles = json.loads(resume.parsed_roles or "[]")
        raw = json.loads(resume.parsed_raw_json or "{}")
        current_title = raw.get("current_title", "")
        target_title = raw.get("target_title", "")
        location = raw.get("location", "")
        return await ai_service.generate_job_recommendations(
            parsed_skills=skills,
            target_roles=roles,
            current_title=current_title,
            target_title=target_title,
            location=location,
        )

    # Fallback to User Profile if no parsed resume is found
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if profile and profile.skills:
        skills = [s.strip() for s in profile.skills.split(",") if s.strip()]
        roles = [profile.target_title or profile.current_title or "Software Developer"]
        return await ai_service.generate_job_recommendations(
            parsed_skills=skills,
            target_roles=roles,
            current_title=profile.current_title or "",
            target_title=profile.target_title or "",
            location=profile.location or "",
        )

    # General default software jobs if completely fresh user
    return await ai_service.generate_job_recommendations([], ["Software Engineer"])


async def get_course_recommendations(db: Session, user_id: int, resume_id: Optional[int] = None):
    """Fetch specific or latest parsed resume (or profile) and generate AI course recommendations."""
    query = db.query(Resume).filter(Resume.user_id == user_id, Resume.parsed_at.isnot(None))
    if resume_id:
        query = query.filter(Resume.id == resume_id)
    resume = query.order_by(Resume.parsed_at.desc()).first()

    if resume:
        skill_gaps = json.loads(resume.skill_gaps_json or "[]")
        skills = json.loads(resume.parsed_skills or "[]")
        raw = json.loads(resume.parsed_raw_json or "{}")
        target_role = raw.get("target_title") or raw.get("current_title") or ""
        return await ai_service.generate_course_recommendations(
            skill_gaps=skill_gaps,
            current_skills=skills,
            target_role=target_role,
        )

    # Fallback to User Profile
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if profile and profile.skills:
        skills = [s.strip() for s in profile.skills.split(",") if s.strip()]
        return await ai_service.generate_course_recommendations(
            skill_gaps=["Cloud Architecture", "System Design", "CI/CD"],
            current_skills=skills,
            target_role=profile.target_title or "",
        )

    return await ai_service.generate_course_recommendations([], [])


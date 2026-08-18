import json
import logging
from typing import Optional
from sqlalchemy.orm import Session
from ..models.resume import Resume
from ..models.user import User, Profile
from . import ai_service
from .scraper_service import scrape_online_jobs


async def get_job_recommendations(db: Session, user_id: int, resume_id: Optional[int] = None):
    """Fetch user's resume/profile target role & skills and automatically scrape & match online jobs."""
    user = db.query(User).filter(User.id == user_id).first()
    user_email = user.email if user else f"user_{user_id}@platform.com"

    query = db.query(Resume).filter(Resume.user_id == user_id, Resume.parsed_at.isnot(None))
    if resume_id:
        query = query.filter(Resume.id == resume_id)
    resume = query.order_by(Resume.parsed_at.desc()).first()

    skills = []
    roles = []
    current_title = ""
    target_title = ""
    location = ""

    if resume:
        skills = json.loads(resume.parsed_skills or "[]")
        roles = json.loads(resume.parsed_roles or "[]")
        raw = json.loads(resume.parsed_raw_json or "{}")
        current_title = raw.get("current_title", "")
        target_title = raw.get("target_title", "")
        location = raw.get("location", "")
    else:
        profile = db.query(Profile).filter(Profile.user_id == user_id).first()
        if profile and profile.skills:
            skills = [s.strip() for s in profile.skills.split(",") if s.strip()]
            roles = [profile.target_title or profile.current_title or "Software Developer"]
            current_title = profile.current_title or ""
            target_title = profile.target_title or ""
            location = profile.location or ""

    # Determine primary keyword for automatic online web scraping
    scrape_keyword = target_title or (roles[0] if roles else "") or current_title or (skills[0] if skills else "Software Engineer")

    # Automatically scrape & parse fresh online job postings matching the user's resume / target role
    try:
        await scrape_online_jobs(
            keyword=scrape_keyword,
            count=5,
            db=db,
            admin_id=user_id,
            admin_email=user_email
        )
    except Exception as ex:
        logging.warning(f"Auto online job scrape notice: {ex}")

    return await ai_service.generate_job_recommendations(
        parsed_skills=skills,
        target_roles=roles if roles else [scrape_keyword],
        current_title=current_title,
        target_title=target_title or scrape_keyword,
        location=location,
    )


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


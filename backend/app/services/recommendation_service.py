import json
from sqlalchemy.orm import Session
from ..models.resume import Resume
from . import ai_service


async def get_job_recommendations(db: Session, user_id: int):
    """Fetch latest parsed resume and generate AI job recommendations."""
    resume = (
        db.query(Resume)
        .filter(Resume.user_id == user_id, Resume.parsed_at.isnot(None))
        .order_by(Resume.parsed_at.desc())
        .first()
    )
    if not resume:
        return []

    skills = json.loads(resume.parsed_skills or "[]")
    roles = json.loads(resume.parsed_roles or "[]")
    return await ai_service.generate_job_recommendations(skills, roles)


async def get_course_recommendations(db: Session, user_id: int):
    """Fetch latest parsed resume and generate AI course recommendations."""
    resume = (
        db.query(Resume)
        .filter(Resume.user_id == user_id, Resume.parsed_at.isnot(None))
        .order_by(Resume.parsed_at.desc())
        .first()
    )
    if not resume:
        return []

    skill_gaps = json.loads(resume.skill_gaps_json or "[]")
    skills = json.loads(resume.parsed_skills or "[]")
    return await ai_service.generate_course_recommendations(skill_gaps, skills)

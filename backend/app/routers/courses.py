import json
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..models.resume import Resume
from ..utils.jwt_utils import get_current_user
from ..services import recommendation_service, ai_service

router = APIRouter()


@router.get("/recommendations")
async def get_course_recommendations(
    resume_id: Optional[int] = Query(None, description="Optional resume ID to target recommendations"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get AI-personalized course recommendations based on the user's skill gaps."""
    courses = await recommendation_service.get_course_recommendations(db, current_user.id, resume_id=resume_id)
    return {"courses": courses, "count": len(courses)}


@router.get("/learning-path")
async def get_learning_path(
    resume_id: Optional[int] = Query(None, description="Optional resume ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get AI step-by-step learning roadmap for skill gap closure (PPT Module 5)."""
    query = db.query(Resume).filter(Resume.user_id == current_user.id, Resume.parsed_at.isnot(None))
    if resume_id:
        query = query.filter(Resume.id == resume_id)
    resume = query.order_by(Resume.parsed_at.desc()).first()

    skill_gaps = json.loads(resume.skill_gaps_json or "[]") if resume else []
    target_role = ""
    if resume and resume.parsed_raw_json:
        raw = json.loads(resume.parsed_raw_json)
        target_role = raw.get("target_title") or raw.get("current_title") or ""

    roadmap = await ai_service.generate_learning_path(skill_gaps=skill_gaps, target_role=target_role)
    return roadmap


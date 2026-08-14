import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..models.resume import Resume
from ..utils.jwt_utils import get_current_user
from ..schemas.ai import ChatMessage, ChatResponse, SalaryRequest, InterviewPrepRequest
from ..services import ai_service

router = APIRouter()


@router.post("/interview-prep")
async def generate_interview_prep(
    body: InterviewPrepRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate categorized AI interview preparation questions (technical, behavioral, general)."""
    skills = []
    roles = []
    text_extract = ""
    target_role = body.job_role or ""

    resume_id = body.resume_id
    if not resume_id:
        latest = (
            db.query(Resume)
            .filter(Resume.user_id == current_user.id, Resume.parsed_at.isnot(None))
            .order_by(Resume.parsed_at.desc())
            .first()
        )
        if latest:
            resume_id = latest.id

    if resume_id:
        resume = db.query(Resume).filter(
            Resume.id == resume_id,
            Resume.user_id == current_user.id,
        ).first()
        if resume:
            skills = json.loads(resume.parsed_skills or "[]")
            roles = json.loads(resume.parsed_roles or "[]")
            text_extract = resume.text_extract or ""
            raw = json.loads(resume.parsed_raw_json or "{}")
            if not target_role:
                target_role = raw.get("target_title") or raw.get("current_title") or (roles[0] if roles else "")

    return await ai_service.generate_interview_questions(
        skills=skills,
        roles=roles,
        resume_text=text_extract,
        target_role=target_role,
        job_description=body.job_description or "",
    )


@router.post("/chat", response_model=ChatResponse)
async def chat(
    body: ChatMessage,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """AI career coach chatbot endpoint."""
    context = None
    if body.resume_id:
        resume = db.query(Resume).filter(
            Resume.id == body.resume_id,
            Resume.user_id == current_user.id,
        ).first()
        if resume:
            skills = json.loads(resume.parsed_skills or "[]")
            roles = json.loads(resume.parsed_roles or "[]")
            context = (
                f"User: {current_user.full_name}\n"
                f"Skills: {', '.join(skills[:15])}\n"
                f"Experience Roles: {', '.join(roles[:5])}\n"
                f"ATS Score: {resume.ats_score}"
            )
    elif current_user:
        # Use latest resume automatically
        resume = (
            db.query(Resume)
            .filter(Resume.user_id == current_user.id, Resume.parsed_at.isnot(None))
            .order_by(Resume.parsed_at.desc())
            .first()
        )
        if resume:
            skills = json.loads(resume.parsed_skills or "[]")
            roles = json.loads(resume.parsed_roles or "[]")
            context = (
                f"User: {current_user.full_name}\n"
                f"Skills: {', '.join(skills[:15])}\n"
                f"Roles: {', '.join(roles[:5])}\n"
                f"ATS Score: {resume.ats_score}"
            )

    reply = await ai_service.career_chat(body.message, context)
    return {"reply": reply}


@router.post("/salary")
async def predict_salary(
    body: SalaryRequest,
    current_user: User = Depends(get_current_user),
):
    """Predict salary range for a given role and skill set."""
    result = await ai_service.predict_salary(
        body.job_title,
        body.skills,
        body.experience_years,
        body.location,
    )
    return result


@router.get("/analyze/{resume_id}")
async def analyze_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Re-run full AI analysis on an existing resume."""
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id,
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    skills = json.loads(resume.parsed_skills or "[]")
    roles = json.loads(resume.parsed_roles or "[]")
    summary = ""

    ats_data = await ai_service.analyze_ats_and_gaps(resume.text_extract or "", skills)
    career_data = await ai_service.predict_career_paths(skills, roles, summary)

    return {
        "ats_score": ats_data.get("ats_score", 0),
        "ats_breakdown": ats_data.get("ats_breakdown", {}),
        "skill_gaps": ats_data.get("skill_gaps", []),
        "strengths": ats_data.get("strengths", []),
        "recommendations": ats_data.get("recommendations", []),
        "career_paths": career_data.get("career_paths", []),
        "recommended_next_roles": career_data.get("recommended_next_roles", []),
    }

import json
from pathlib import Path
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..models.resume import Resume
from ..utils.jwt_utils import get_current_user
from ..services import resume_service, ai_service
from ..schemas.ai import CompareJdRequest

router = APIRouter()


ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def _run_ai_pipeline_with_own_session(resume_id: int, text: str) -> None:
    """
    Thin wrapper called by FastAPI BackgroundTasks.
    Delegates to resume_service which manages its own event loop + DB session.
    """
    resume_service.run_ai_pipeline_sync(resume_id, text)


@router.post("/upload", status_code=202)
async def upload_resume(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Upload a resume file (PDF/DOCX).
    Returns immediately with resume id + status='processing'.
    AI analysis runs in the background; poll /resumes/{id}/status for updates.
    """
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10 MB)")

    # 1. Save file to disk (fast)
    file_path = resume_service.save_file_to_disk(file_bytes, file.filename, current_user.id)

    # 2. Extract text (fast — pure Python, no network)
    from ..utils.file_utils import extract_text
    text = extract_text(file_bytes, file.filename)

    # 3. Persist the initial record immediately
    resume = resume_service.create_resume_record(db, current_user.id, file.filename, file_path, text)

    # 4. Schedule AI pipeline in the background (non-blocking)
    background_tasks.add_task(_run_ai_pipeline_with_own_session, resume.id, text)

    # 5. Return immediately — frontend will poll for status
    return {
        "id": resume.id,
        "filename": resume.filename,
        "parse_status": "processing",
        "message": "Resume uploaded. AI analysis is running in the background.",
    }


@router.get("/{resume_id}/status")
def get_resume_status(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Lightweight polling endpoint.
    Returns parse_status and, once done, the full analysis results.
    """
    resume = db.query(Resume).filter(
        Resume.id == resume_id, Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    response: dict = {
        "id": resume.id,
        "filename": resume.filename,
        "parse_status": resume.parse_status or "processing",
    }

    if resume.parse_status == "done":
        parsed_raw = json.loads(resume.parsed_raw_json or "{}")
        response.update({
            "ats_score": resume.ats_score,
            "parsed_skills": json.loads(resume.parsed_skills or "[]"),
            "parsed_roles": json.loads(resume.parsed_roles or "[]"),
            "parsed_certifications": json.loads(resume.parsed_certifications or "[]"),
            "parsed_courses": json.loads(resume.parsed_courses or "[]"),
            "skill_gaps": json.loads(resume.skill_gaps_json or "[]"),
            "career_paths": json.loads(resume.career_paths_json or "[]"),
            "salary_range": json.loads(resume.salary_range_json or "{}"),
            "parsed_raw": parsed_raw,
        })

    return response


@router.post("/{resume_id}/autofill-profile")
def autofill_profile_from_resume(
    resume_id: int,
    overwrite: bool = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Explicitly apply parsed resume metadata to autofill user profile."""
    resume = db.query(Resume).filter(
        Resume.id == resume_id, Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    parsed_data = json.loads(resume.parsed_raw_json or "{}")
    if not parsed_data:
        parsed_data = {
            "skills": json.loads(resume.parsed_skills or "[]"),
            "roles": json.loads(resume.parsed_roles or "[]"),
            "certifications": json.loads(resume.parsed_certifications or "[]"),
            "courses": json.loads(resume.parsed_courses or "[]"),
        }

    profile = resume_service.apply_resume_to_user_profile(
        db=db,
        user_id=current_user.id,
        parsed_data=parsed_data,
        overwrite=overwrite,
    )
    return {"message": "Profile autofilled successfully from resume", "profile": profile}


@router.get("/")
def list_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all resumes for the current user."""
    resumes = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.created_at.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "filename": r.filename,
            "ats_score": r.ats_score,
            "parse_status": r.parse_status or "done",
            "has_file": bool(r.file_path and Path(r.file_path).exists()),
            "created_at": r.created_at,
            "parsed_at": r.parsed_at,
            "parsed_skills": json.loads(r.parsed_skills or "[]"),
        }
        for r in resumes
    ]


@router.get("/{resume_id}/download")
def download_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Download the original resume file."""
    resume = db.query(Resume).filter(
        Resume.id == resume_id, Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if not resume.file_path:
        raise HTTPException(status_code=404, detail="Original file not available for this resume")
    file_path = Path(resume.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Resume file has been removed from storage")
    return FileResponse(path=str(file_path), filename=resume.filename, media_type="application/octet-stream")


@router.get("/{resume_id}/view")
def view_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """View (stream inline) the original resume file in the browser."""
    resume = db.query(Resume).filter(
        Resume.id == resume_id, Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if not resume.file_path:
        raise HTTPException(status_code=404, detail="Original file not available")
    file_path = Path(resume.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Resume file has been removed from storage")
    ext = file_path.suffix.lower()
    media_type = "application/pdf" if ext == ".pdf" else (
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        if ext in (".docx", ".doc") else "text/plain"
    )
    return FileResponse(
        path=str(file_path),
        filename=resume.filename,
        media_type=media_type,
        headers={"Content-Disposition": f'inline; filename="{resume.filename}"'},
    )


@router.get("/{resume_id}")
def get_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get full resume analysis for a specific resume."""
    resume = db.query(Resume).filter(
        Resume.id == resume_id, Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    return {
        "id": resume.id,
        "filename": resume.filename,
        "parse_status": resume.parse_status or "done",
        "ats_score": resume.ats_score,
        "has_file": bool(resume.file_path and Path(resume.file_path).exists()),
        "parsed_skills": json.loads(resume.parsed_skills or "[]"),
        "parsed_roles": json.loads(resume.parsed_roles or "[]"),
        "parsed_experience": json.loads(resume.parsed_experience or "[]"),
        "parsed_certifications": json.loads(resume.parsed_certifications or "[]"),
        "parsed_courses": json.loads(resume.parsed_courses or "[]"),
        "parsed_raw": json.loads(resume.parsed_raw_json or "{}"),
        "skill_gaps": json.loads(resume.skill_gaps_json or "[]"),
        "career_paths": json.loads(resume.career_paths_json or "[]"),
        "salary_range": json.loads(resume.salary_range_json or "{}"),
        "created_at": resume.created_at,
        "parsed_at": resume.parsed_at,
    }


@router.delete("/{resume_id}", status_code=204)
def delete_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a resume record and its stored file."""
    resume = db.query(Resume).filter(
        Resume.id == resume_id, Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if resume.file_path:
        resume_service.delete_resume_file(resume.file_path)
    db.delete(resume)
    db.commit()


@router.post("/compare-jd")
async def compare_resume_with_jd(
    body: CompareJdRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Module 1 & 2: Compare Resume vs Job Description."""
    resume = db.query(Resume).filter(
        Resume.id == body.resume_id, Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    skills = json.loads(resume.parsed_skills or "[]")
    result = await ai_service.compare_resume_with_jd(
        resume_text=resume.text_extract or "",
        parsed_skills=skills,
        job_description=body.job_description,
        job_title=body.job_title or "",
    )
    return result


@router.get("/{resume_id}/improvements")
async def get_resume_improvements(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Module 6: Resume Improvement Suggestions AI."""
    resume = db.query(Resume).filter(
        Resume.id == resume_id, Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    raw = json.loads(resume.parsed_raw_json or "{}")
    target_role = raw.get("target_title") or raw.get("current_title") or ""

    improvements = await ai_service.generate_resume_improvements(
        resume_text=resume.text_extract or "",
        target_role=target_role,
    )
    return improvements


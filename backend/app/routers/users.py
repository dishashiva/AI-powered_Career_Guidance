from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User, Profile
from ..schemas.auth import UserOut, UserUpdate, ProfileUpdate, ProfileOut
from ..utils.jwt_utils import get_current_user

router = APIRouter()


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user info."""
    return current_user


@router.put("/me", response_model=UserOut)
def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update current user's basic info (full_name)."""
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/me/profile", response_model=ProfileOut)
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current user's profile."""
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.put("/me/profile", response_model=ProfileOut)
def update_profile(
    data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update current user's profile."""
    from ..services.resume_service import deduplicate_items
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)

    for field, value in data.model_dump(exclude_none=True).items():
        if field in ("skills", "certifications", "courses", "languages") and value:
            value = deduplicate_items(value)
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return profile


@router.post("/me/autofill-profile", response_model=ProfileOut)
def autofill_profile(
    resume_id: int = None,
    overwrite: bool = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Autofill user profile using AI extracted data from latest or specified resume."""
    import json
    from fastapi import HTTPException
    from ..models.resume import Resume
    from ..services import resume_service

    if resume_id:
        resume = db.query(Resume).filter(
            Resume.id == resume_id, Resume.user_id == current_user.id
        ).first()
    else:
        resume = (
            db.query(Resume)
            .filter(Resume.user_id == current_user.id, Resume.parsed_at.isnot(None))
            .order_by(Resume.parsed_at.desc())
            .first()
        )

    if not resume:
        raise HTTPException(status_code=404, detail="No processed resume found. Please upload a resume first.")

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
    return profile

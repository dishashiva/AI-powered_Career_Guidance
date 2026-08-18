from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Feedback
from ..schemas.admin import FeedbackCreate, FeedbackOut
from ..utils.jwt_utils import get_current_user
from ..utils.activity_logger import log_activity

router = APIRouter()


@router.post("", response_model=FeedbackOut, status_code=201)
def submit_feedback(
    data: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """User endpoint to submit platform feedback or bug report."""
    fb = Feedback(
        user_id=current_user.id,
        user_email=current_user.email,
        user_name=current_user.full_name,
        category=data.category,
        rating=data.rating,
        message=data.message,
        status="pending",
    )
    db.add(fb)
    db.commit()
    db.refresh(fb)

    log_activity(
        db,
        action="FEEDBACK_SUBMIT",
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Submitted feedback ({data.category}): {data.message[:50]}...",
    )
    return fb


@router.get("/my", response_model=List[FeedbackOut])
def get_my_feedback(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get list of feedback submitted by current user."""
    return (
        db.query(Feedback)
        .filter(Feedback.user_id == current_user.id)
        .order_by(Feedback.created_at.desc())
        .all()
    )

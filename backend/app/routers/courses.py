from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..utils.jwt_utils import get_current_user
from ..services import recommendation_service

router = APIRouter()


@router.get("/recommendations")
async def get_course_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get AI-personalized course recommendations based on the user's skill gaps."""
    courses = await recommendation_service.get_course_recommendations(db, current_user.id)
    return {"courses": courses, "count": len(courses)}

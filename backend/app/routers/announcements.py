from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Announcement
from ..schemas.admin import AnnouncementOut

router = APIRouter()


@router.get("/active", response_model=List[AnnouncementOut])
def get_active_announcements(db: Session = Depends(get_db)):
    """Get active platform announcements for banner notifications."""
    return (
        db.query(Announcement)
        .filter(Announcement.is_active == True)
        .order_by(Announcement.created_at.desc())
        .all()
    )

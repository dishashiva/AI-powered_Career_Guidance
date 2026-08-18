from sqlalchemy.orm import Session
from ..models.activity import ActivityLog


def log_activity(db: Session, action: str, user_id: int = None, user_email: str = None, details: str = None):
    """Helper to log platform activity."""
    try:
        log = ActivityLog(
            user_id=user_id,
            user_email=user_email,
            action=action,
            details=details,
        )
        db.add(log)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Failed to log activity '{action}': {e}")

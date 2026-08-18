import bcrypt
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from ..models.user import User, Profile
from ..schemas.auth import UserRegister


def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain: str, hashed: str) -> bool:
    plain_bytes = plain.encode('utf-8')
    hashed_bytes = hashed.encode('utf-8')
    try:
        return bcrypt.checkpw(plain_bytes, hashed_bytes)
    except ValueError:
        return False


def register_user(db: Session, data: UserRegister) -> User:
    from datetime import datetime, timezone
    from sqlalchemy import func
    from ..utils.activity_logger import log_activity

    clean_email = data.email.strip().lower()
    clean_pwd = data.password.strip()

    existing = db.query(User).filter(func.lower(User.email) == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    user = User(
        email=clean_email,
        hashed_password=hash_password(clean_pwd),
        full_name=data.full_name.strip(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create completely empty profile (starts at 0% completeness)
    profile = Profile(
        user_id=user.id,
        current_title=None,
        target_title=None,
        experience_years=None,
        location=None,
        bio=None,
        phone=None,
        linkedin_url=None,
        github_url=None,
        twitter_url=None,
        website_url=None,
        portfolio_url=None,
        skills=None,
        interests=None,
        languages=None,
        certifications=None,
        courses=None,
        education=None,
        achievements=None,
        availability=None,
        work_preference=None,
        salary_expectation=None,
    )
    db.add(profile)
    db.commit()

    log_activity(db, action="REGISTER", user_id=user.id, user_email=user.email, details=f"New user registered: {user.full_name}")
    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    from datetime import datetime, timezone
    from sqlalchemy import func
    from ..utils.activity_logger import log_activity

    clean_email = (email or "").strip().lower()
    clean_pwd = (password or "").strip()

    user = db.query(User).filter(func.lower(User.email) == clean_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No account found registered with this email address.",
        )
    if not verify_password(clean_pwd, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Wrong password. Please enter the correct password or reset your password.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated by administrator.",
        )
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    log_activity(db, action="LOGIN", user_id=user.id, user_email=user.email, details="User logged in")
    return user


def request_password_reset(db: Session, email: str) -> dict:
    from sqlalchemy import func
    from ..config import get_settings
    from ..utils.jwt_utils import create_reset_token
    from ..utils.activity_logger import log_activity
    from .email_service import send_password_reset_email

    cfg = get_settings()
    clean_email = (email or "").strip().lower()
    user = db.query(User).filter(func.lower(User.email) == clean_email).first()

    if user:
        token = create_reset_token(user.email)
        reset_link = f"{cfg.FRONTEND_URL}/reset-password?token={token}"
        send_password_reset_email(user.email, reset_link)

        log_activity(
            db,
            action="PASSWORD_RESET_REQUEST",
            user_id=user.id,
            user_email=user.email,
            details=f"Password reset link emailed to {user.email}",
        )

    return {
        "message": "If an account exists for this email address, a password reset link has been sent to your registered email ID. Please check your email inbox to reset your password.",
        "email": clean_email,
    }


def reset_password_with_token(db: Session, token: str, new_password: str) -> dict:
    from sqlalchemy import func
    from ..utils.jwt_utils import verify_reset_token
    from ..utils.activity_logger import log_activity
    email = verify_reset_token(token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset link. Please request a new reset link.",
        )

    clean_email = email.strip().lower()
    clean_pwd = new_password.strip()

    user = db.query(User).filter(func.lower(User.email) == clean_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found.",
        )

    if len(clean_pwd) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long.",
        )

    user.hashed_password = hash_password(clean_pwd)
    db.commit()

    log_activity(
        db,
        action="PASSWORD_RESET_COMPLETE",
        user_id=user.id,
        user_email=user.email,
        details=f"Password successfully reset for {user.email}",
    )

    return {"message": "Password reset successfully! You can now login with your new password."}

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas.auth import UserRegister, UserOut, Token, ForgotPasswordRequest, ResetPasswordRequest
from ..services import auth_service
from ..utils.jwt_utils import create_access_token

router = APIRouter()


@router.post("/register", response_model=UserOut, status_code=201)
def register(data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user account."""
    user = auth_service.register_user(db, data)
    return user


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login and receive JWT access token."""
    user = auth_service.authenticate_user(db, form_data.username, form_data.password)
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Request password reset link sent to registered email address."""
    return auth_service.request_password_reset(db, data.email)


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password using valid reset token."""
    return auth_service.reset_password_with_token(db, data.token, data.new_password)

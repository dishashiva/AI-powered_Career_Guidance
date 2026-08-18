from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class TokenData(BaseModel):
    user_id: Optional[int] = None


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    is_active: bool
    is_admin: bool = False
    last_login_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    full_name: Optional[str] = None


class ProfileUpdate(BaseModel):
    # Basic info
    current_title: Optional[str] = None
    target_title: Optional[str] = None
    experience_years: Optional[int] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None

    # Social & web links
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    twitter_url: Optional[str] = None
    website_url: Optional[str] = None
    portfolio_url: Optional[str] = None

    # Skills & interests
    skills: Optional[str] = None
    interests: Optional[str] = None
    languages: Optional[str] = None
    certifications: Optional[str] = None
    courses: Optional[str] = None

    # Education & achievements
    education: Optional[str] = None
    achievements: Optional[str] = None

    # Work preferences
    availability: Optional[str] = None
    work_preference: Optional[str] = None
    salary_expectation: Optional[str] = None


class ProfileOut(BaseModel):
    id: int
    user_id: int

    # Basic info
    current_title: Optional[str] = None
    target_title: Optional[str] = None
    experience_years: Optional[int] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None

    # Social & web links
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    twitter_url: Optional[str] = None
    website_url: Optional[str] = None
    portfolio_url: Optional[str] = None

    # Skills & interests
    skills: Optional[str] = None
    interests: Optional[str] = None
    languages: Optional[str] = None
    certifications: Optional[str] = None
    courses: Optional[str] = None

    # Education & achievements
    education: Optional[str] = None
    achievements: Optional[str] = None

    # Work preferences
    availability: Optional[str] = None
    work_preference: Optional[str] = None
    salary_expectation: Optional[str] = None

    model_config = {"from_attributes": True}

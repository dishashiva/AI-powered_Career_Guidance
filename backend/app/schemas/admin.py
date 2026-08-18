from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List, Any, Dict


class UserAdminView(BaseModel):
    id: int
    email: str
    full_name: str
    is_active: bool
    is_admin: bool
    created_at: datetime
    last_login_at: Optional[datetime] = None
    resumes_count: int = 0
    current_title: Optional[str] = None
    target_title: Optional[str] = None

    model_config = {"from_attributes": True}


class UserStatusUpdate(BaseModel):
    is_active: bool


class UserRoleUpdate(BaseModel):
    is_admin: bool


class JobCreateUpdate(BaseModel):
    title: str
    company: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[List[str]] = []
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    job_url: Optional[str] = None
    experience_level: Optional[str] = None
    job_type: Optional[str] = None


class CourseCreateUpdate(BaseModel):
    title: str
    provider: Optional[str] = None
    description: Optional[str] = None
    skills_covered: Optional[List[str]] = []
    url: Optional[str] = None
    duration: Optional[str] = None
    level: Optional[str] = None
    is_free: bool = False
    rating: Optional[str] = None


class FeedbackCreate(BaseModel):
    category: str = "general"
    rating: int = 5
    message: str


class FeedbackUpdate(BaseModel):
    status: Optional[str] = None  # pending | in_progress | resolved | dismissed
    admin_notes: Optional[str] = None


class FeedbackOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    category: str
    rating: int
    message: str
    status: str
    admin_notes: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AnnouncementCreateUpdate(BaseModel):
    title: str
    message: str
    type: str = "info"
    is_active: bool = True


class AnnouncementOut(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ActivityLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    action: str
    details: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}

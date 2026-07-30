from pydantic import BaseModel
from typing import Optional


class JobOut(BaseModel):
    id: int
    title: str
    company: Optional[str]
    location: Optional[str]
    description: Optional[str]
    required_skills: Optional[str]
    salary_min: Optional[float]
    salary_max: Optional[float]
    job_url: Optional[str]
    experience_level: Optional[str]
    job_type: Optional[str]
    match_score: Optional[float] = None

    model_config = {"from_attributes": True}


class CourseOut(BaseModel):
    id: int
    title: str
    provider: Optional[str]
    description: Optional[str]
    skills_covered: Optional[str]
    url: Optional[str]
    duration: Optional[str]
    level: Optional[str]
    is_free: bool
    rating: Optional[str]
    match_score: Optional[float] = None

    model_config = {"from_attributes": True}

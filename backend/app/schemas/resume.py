from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Any


class ResumeOut(BaseModel):
    id: int
    user_id: int
    filename: str
    ats_score: Optional[float]
    parsed_skills: Optional[Any]
    parsed_roles: Optional[Any]
    parsed_experience: Optional[Any]
    skill_gaps_json: Optional[Any]
    career_paths_json: Optional[Any]
    salary_range_json: Optional[Any]
    created_at: datetime
    parsed_at: Optional[datetime]

    model_config = {"from_attributes": True}

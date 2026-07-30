from pydantic import BaseModel
from typing import Optional


class ChatMessage(BaseModel):
    message: str
    resume_id: Optional[int] = None


class ChatResponse(BaseModel):
    reply: str


class AnalysisRequest(BaseModel):
    resume_id: int


class SalaryRequest(BaseModel):
    job_title: str
    skills: list[str]
    experience_years: int = 0
    location: Optional[str] = None

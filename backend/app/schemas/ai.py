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


class CompareJdRequest(BaseModel):
    resume_id: int
    job_description: str
    job_title: Optional[str] = None


class InterviewPrepRequest(BaseModel):
    resume_id: Optional[int] = None
    job_role: Optional[str] = None
    job_description: Optional[str] = None



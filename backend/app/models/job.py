from sqlalchemy import Column, Integer, String, DateTime, Text, Float
from sqlalchemy.sql import func
from ..database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    company = Column(String(255))
    location = Column(String(255))
    description = Column(Text)
    required_skills = Column(Text)   # JSON array string
    salary_min = Column(Float)
    salary_max = Column(Float)
    job_url = Column(String(1000))
    experience_level = Column(String(100))
    job_type = Column(String(100))   # full-time, part-time, remote
    created_at = Column(DateTime(timezone=True), server_default=func.now())

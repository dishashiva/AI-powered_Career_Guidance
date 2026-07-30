from sqlalchemy import Column, Integer, String, DateTime, Text, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(500), nullable=False)
    file_path = Column(String(1000))
    text_extract = Column(Text)
    parsed_skills = Column(Text)          # JSON string
    parsed_roles = Column(Text)           # JSON string
    parsed_experience = Column(Text)      # JSON string
    parsed_certifications = Column(Text)  # JSON string  — NEW
    parsed_courses = Column(Text)         # JSON string  — NEW
    ats_score = Column(Float, default=0.0)
    skill_gaps_json = Column(Text)        # JSON string
    career_paths_json = Column(Text)      # JSON string
    salary_range_json = Column(Text)      # JSON string
    parsed_raw_json = Column(Text)        # Complete raw AI extraction JSON string
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    parsed_at = Column(DateTime(timezone=True))
    parse_status = Column(String(20), default="pending")  # pending | processing | done | error

    user = relationship("User", back_populates="resumes")


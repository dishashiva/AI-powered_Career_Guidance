from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.sql import func
from ..database import Base


class AiApiUsage(Base):
    __tablename__ = "ai_api_usage"

    id = Column(Integer, primary_key=True, index=True)
    provider = Column(String(50), default="groq")
    model = Column(String(100), nullable=False)
    feature = Column(String(100), nullable=False)  # e.g., resume_parse, jd_compare, career_chat, interview_prep
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    latency_ms = Column(Float, default=0.0)
    status_code = Column(Integer, default=200)
    is_success = Column(Boolean, default=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

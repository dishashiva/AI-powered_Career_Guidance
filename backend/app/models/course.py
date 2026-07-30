from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from sqlalchemy.sql import func
from ..database import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    provider = Column(String(255))    # Coursera, Udemy, edX, etc.
    description = Column(Text)
    skills_covered = Column(Text)     # JSON array string
    url = Column(String(1000))
    duration = Column(String(100))    # e.g., "8 hours", "4 weeks"
    level = Column(String(50))        # beginner, intermediate, advanced
    is_free = Column(Boolean, default=False)
    rating = Column(String(10))       # e.g., "4.7"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

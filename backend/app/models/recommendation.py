from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rec_type = Column(Enum("job", "course", "career_path"), nullable=False)
    reference_id = Column(Integer)     # FK to jobs.id or courses.id
    title = Column(String(500))
    match_score = Column(Float, default=0.0)
    reason = Column(Text)
    metadata_json = Column(Text)       # Extra data (salary, skills, etc.)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="recommendations")

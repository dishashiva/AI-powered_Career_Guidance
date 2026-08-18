from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    user_skills = relationship("UserSkill", back_populates="user", cascade="all, delete-orphan")
    skill_gaps = relationship("SkillGap", back_populates="user", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="user", cascade="all, delete-orphan")


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Basic info
    current_title = Column(String(255))
    target_title = Column(String(255))
    experience_years = Column(Integer, nullable=True, default=None)
    location = Column(String(255))
    bio = Column(Text)
    phone = Column(String(50))

    # Social & web links
    linkedin_url = Column(String(500))
    github_url = Column(String(500))
    twitter_url = Column(String(500))
    website_url = Column(String(500))
    portfolio_url = Column(String(500))

    # Skills & interests
    skills = Column(Text)           # comma-separated skill tags
    interests = Column(Text)        # free-text interests/hobbies
    languages = Column(Text)        # spoken languages (comma-separated)
    certifications = Column(Text)   # comma-separated certifications
    courses = Column(Text)          # comma-separated courses/training

    # Education & achievements
    education = Column(Text)
    achievements = Column(Text)

    # Work preferences
    availability = Column(String(100))         # e.g. "Open to work", "Not looking"
    work_preference = Column(String(100))      # e.g. "Remote", "Hybrid", "On-site"
    salary_expectation = Column(String(100))   # e.g. "₹10–15 LPA"

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="profile")

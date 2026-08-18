import sys
import os
import json
from passlib.context import CryptContext

# Add backend dir to python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base, SessionLocal
from app.models import User, Profile, Job, Course, Skill, Feedback, Announcement
from app.services.auth_service import hash_password

def seed_data():
    print("Creating schema...")
    Base.metadata.create_all(bind=engine)
    print("Schema created successfully.")

    db = SessionLocal()
    try:
        # Check / Seed Admin User
        admin_user = db.query(User).filter(User.email == "admin@careerai.com").first()
        if not admin_user:
            print("Seeding admin user...")
            admin_user = User(
                email="admin@careerai.com",
                hashed_password=hash_password("admin123"),
                full_name="Admin Administrator",
                is_active=True,
                is_admin=True,
            )
            db.add(admin_user)
            db.flush()

            admin_profile = Profile(
                user_id=admin_user.id,
                current_title="System Administrator",
                experience_years=5,
                bio="Administrator of CareerAI Platform.",
            )
            db.add(admin_profile)
            db.commit()

        # Check if skills already seeded
        if db.query(Skill).first():
            print("Database core models already seeded.")
        else:
            print("Seeding skills...")
            skills = [
                Skill(name="Python", category="Programming"),
                Skill(name="React", category="Programming"),
                Skill(name="Machine Learning", category="AI"),
                Skill(name="Communication", category="Soft Skill"),
                Skill(name="SQL", category="Database")
            ]
            db.add_all(skills)

            print("Seeding jobs...")
            jobs = [
                Job(
                    title="Software Engineer",
                    company="TechCorp",
                    location="Remote",
                    description="Looking for an experienced Python developer.",
                    required_skills=json.dumps(["Python", "SQL", "Communication"]),
                    salary_min=80000,
                    salary_max=120000,
                    experience_level="Mid Level",
                    job_type="Full-time"
                ),
                Job(
                    title="Frontend Developer",
                    company="Webify",
                    location="New York",
                    description="Seeking a React expert to build our new platform.",
                    required_skills=json.dumps(["React", "Communication"]),
                    salary_min=70000,
                    salary_max=100000,
                    experience_level="Junior",
                    job_type="Full-time"
                )
            ]
            db.add_all(jobs)

            print("Seeding courses...")
            courses = [
                Course(
                    title="Complete Python Bootcamp",
                    provider="Udemy",
                    description="Learn Python like a Professional.",
                    skills_covered=json.dumps(["Python"]),
                    url="https://www.udemy.com/course/complete-python-bootcamp/",
                    duration="22 hours",
                    level="Beginner",
                    is_free=False,
                    rating="4.6"
                ),
                Course(
                    title="React - The Complete Guide",
                    provider="Udemy",
                    description="Dive in and learn React.js from scratch!",
                    skills_covered=json.dumps(["React"]),
                    url="https://www.udemy.com/course/react-the-complete-guide-incl-redux/",
                    duration="40 hours",
                    level="Intermediate",
                    is_free=False,
                    rating="4.7"
                )
            ]
            db.add_all(courses)

            print("Seeding default user...")
            default_user = db.query(User).filter(User.email == "testuser@example.com").first()
            if not default_user:
                default_user = User(
                    email="testuser@example.com",
                    hashed_password=hash_password("password123"),
                    full_name="Test User",
                    is_active=True,
                    is_admin=False,
                )
                db.add(default_user)
                db.flush()

                default_profile = Profile(
                    user_id=default_user.id,
                    current_title="Aspiring Developer",
                    experience_years=0,
                    bio="I am looking for my first tech job.",
                )
                db.add(default_profile)

        # Seed sample announcement if none
        if not db.query(Announcement).first():
            print("Seeding initial announcement...")
            ann = Announcement(
                title="Welcome to CareerAI!",
                message="Explore the new Admin Intelligence Dashboard, Skill Analytics, and Course Management.",
                type="info",
                is_active=True,
            )
            db.add(ann)

        # Seed sample feedback if none
        if not db.query(Feedback).first():
            print("Seeding sample feedback...")
            fb = Feedback(
                user_email="testuser@example.com",
                user_name="Test User",
                category="feature",
                rating=5,
                message="The resume ATS parser and career match analysis are super fast and accurate!",
                status="pending",
            )
            db.add(fb)

        db.commit()
        print("Seeding completed successfully.")

    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()

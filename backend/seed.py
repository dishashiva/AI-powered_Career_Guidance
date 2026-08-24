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
    print("Dropping existing tables to clean database...")
    Base.metadata.drop_all(bind=engine)
    print("Creating fresh database schema...")
    Base.metadata.create_all(bind=engine)
    print("Schema created successfully.")

    db = SessionLocal()
    try:
        print("Seeding Admin User...")
        admin_user = User(
            email="admin@careerai.com",
            hashed_password=hash_password("admin123"),
            full_name="Global Administrator",
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

        print("Seeding Test User...")
        test_user = User(
            email="testuser@example.com",
            hashed_password=hash_password("password123"),
            full_name="Test Candidate",
            is_active=True,
            is_admin=False,
        )
        db.add(test_user)
        db.flush()

        # Clean profile baseline starting from 0% completeness
        test_profile = Profile(
            user_id=test_user.id,
            experience_years=None,
        )
        db.add(test_profile)

        print("Seeding default skills...")
        skills = [
            Skill(name="Python", category="Programming"),
            Skill(name="React", category="Programming"),
            Skill(name="JavaScript", category="Programming"),
            Skill(name="Machine Learning", category="AI"),
            Skill(name="FastAPI", category="Framework"),
            Skill(name="SQL", category="Database"),
            Skill(name="Docker", category="DevOps"),
            Skill(name="Git", category="Tools"),
            Skill(name="Communication", category="Soft Skill"),
        ]
        db.add_all(skills)

        print("Seeding sample job postings...")
        jobs = [
            Job(
                title="Full Stack Software Engineer",
                company="TechCorp Solutions",
                location="Bengaluru / Remote",
                description="Looking for an experienced developer proficient in Python, FastAPI, and React.",
                required_skills=json.dumps(["Python", "FastAPI", "React", "SQL", "Git"]),
                salary_min=1200000,
                salary_max=1800000,
                experience_level="Mid Level",
                job_type="Full-time"
            ),
            Job(
                title="Frontend Developer",
                company="Webify Labs",
                location="Remote",
                description="Seeking a React & JavaScript expert to build next-gen web applications.",
                required_skills=json.dumps(["React", "JavaScript", "Communication", "Git"]),
                salary_min=800000,
                salary_max=1300000,
                experience_level="Junior / Mid",
                job_type="Full-time"
            ),
            Job(
                title="AI / ML Engineer",
                company="DeepNeural AI",
                location="Hyderabad / Hybrid",
                description="Join our AI team to build intelligent agents, LLM pipelines, and computer vision models.",
                required_skills=json.dumps(["Python", "Machine Learning", "Docker", "SQL"]),
                salary_min=1500000,
                salary_max=2400000,
                experience_level="Senior",
                job_type="Full-time"
            )
        ]
        db.add_all(jobs)

        print("Seeding sample courses...")
        courses = [
            Course(
                title="Complete Python & FastAPI Bootcamp",
                provider="Coursera",
                description="Learn Python & FastAPI from scratch with hands-on projects and microservices.",
                skills_covered=json.dumps(["Python", "FastAPI", "SQL"]),
                url="https://www.coursera.org",
                duration="25 hours",
                level="Beginner to Mid",
                is_free=False,
                rating="4.8"
            ),
            Course(
                title="Modern React with Redux & Tailwind",
                provider="Udemy",
                description="Master React hooks, components, state management, and modern responsive UI design.",
                skills_covered=json.dumps(["React", "JavaScript"]),
                url="https://www.udemy.com",
                duration="35 hours",
                level="Intermediate",
                is_free=True,
                rating="4.7"
            ),
            Course(
                title="Applied Machine Learning & LLMs",
                provider="edX",
                description="Comprehensive machine learning algorithms, model training, evaluation, and deployment.",
                skills_covered=json.dumps(["Machine Learning", "Python", "Docker"]),
                url="https://www.edx.org",
                duration="40 hours",
                level="Advanced",
                is_free=False,
                rating="4.9"
            )
        ]
        db.add_all(courses)

        print("Seeding welcome announcement...")
        ann = Announcement(
            title="Welcome to CareerAI Platform!",
            message="Explore the new Admin Intelligence Dashboard, Skill Analytics, and Auto-Scraped Course Repository.",
            type="info",
            is_active=True,
        )
        db.add(ann)

        print("Seeding sample feedback...")
        fb = Feedback(
            user_email="testuser@example.com",
            user_name="Test Candidate",
            category="feature",
            rating=5,
            message="The resume ATS parser and career match analysis are super fast and accurate!",
            status="pending",
        )
        db.add(fb)

        db.commit()
        print("\n============================================================")
        print("DATABASE CLEANED & SEEDED SUCCESSFULLY!")
        print("============================================================")
        print("1. GLOBAL ADMIN CREDENTIALS:")
        print("   Email:    admin@careerai.com")
        print("   Password: admin123")
        print("------------------------------------------------------------")
        print("2. TEST USER CREDENTIALS:")
        print("   Email:    testuser@example.com")
        print("   Password: password123")
        print("============================================================")

    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()

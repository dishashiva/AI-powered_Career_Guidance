import sys
import os
import json
from passlib.context import CryptContext

# Add backend dir to python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base, SessionLocal
from app.models import User, Profile, Job, Course, Skill

def get_password_hash(password):
    # Static hash for 'password123' to avoid passlib bcrypt issues
    return "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjIQqiRQYq"

def seed_data():
    print("Creating schema...")
    Base.metadata.create_all(bind=engine)
    print("Schema created successfully.")

    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(Skill).first():
            print("Database already seeded.")
            return

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
        default_user = User(
            email="testuser@example.com",
            hashed_password=get_password_hash("password123"),
            full_name="Test User",
            is_active=True
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

        db.commit()
        print("Seeding completed successfully.")

    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()

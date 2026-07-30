"""
Migration script: Add certifications/courses columns to profiles & resumes tables.
Run once: python migrate_add_certifications_courses.py
"""
import sys
import os

# Add the backend directory to the path so we can import app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine
from sqlalchemy import text

MIGRATIONS = [
    # profiles table
    {
        "check": "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'profiles' AND COLUMN_NAME = 'certifications'",
        "alter": "ALTER TABLE profiles ADD COLUMN certifications TEXT NULL COMMENT 'Comma-separated certifications'",
        "label": "profiles.certifications",
    },
    {
        "check": "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'profiles' AND COLUMN_NAME = 'courses'",
        "alter": "ALTER TABLE profiles ADD COLUMN courses TEXT NULL COMMENT 'Comma-separated courses/training'",
        "label": "profiles.courses",
    },
    # resumes table
    {
        "check": "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'resumes' AND COLUMN_NAME = 'parsed_certifications'",
        "alter": "ALTER TABLE resumes ADD COLUMN parsed_certifications TEXT NULL COMMENT 'JSON list of parsed certifications'",
        "label": "resumes.parsed_certifications",
    },
    {
        "check": "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'resumes' AND COLUMN_NAME = 'parsed_courses'",
        "alter": "ALTER TABLE resumes ADD COLUMN parsed_courses TEXT NULL COMMENT 'JSON list of parsed courses'",
        "label": "resumes.parsed_courses",
    },
]


def run_migrations():
    with engine.connect() as conn:
        for m in MIGRATIONS:
            result = conn.execute(text(m["check"])).scalar()
            if result == 0:
                conn.execute(text(m["alter"]))
                conn.commit()
                print(f"  [OK] Added column: {m['label']}")
            else:
                print(f"  [SKIP] Already exists: {m['label']}")
    print("\nMigration complete.")


if __name__ == "__main__":
    print("Running migrations...\n")
    run_migrations()

"""
Run this once to add the parse_status column to the resumes table.
Usage (from the backend/ directory, with venv active):
    python migrate_add_parse_status.py
"""
import sys
from sqlalchemy import text
from app.database import engine

CHECK_SQL = """
SELECT COUNT(*) AS cnt
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME   = 'resumes'
  AND COLUMN_NAME  = 'parse_status';
"""

ADD_SQL = """
ALTER TABLE resumes
  ADD COLUMN parse_status VARCHAR(20) NOT NULL DEFAULT 'done';
"""

def run():
    with engine.connect() as conn:
        row = conn.execute(text(CHECK_SQL)).fetchone()
        if row[0] > 0:
            print("Column 'parse_status' already exists — nothing to do.")
            return
        conn.execute(text(ADD_SQL))
        conn.commit()
        print("Column 'parse_status' added successfully.")

if __name__ == "__main__":
    run()

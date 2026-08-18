from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import get_settings
from .database import Base, engine
from .routers import auth, users, resumes, jobs, courses, ai, admin, feedback, announcements

from sqlalchemy import text

settings = get_settings()

# Auto-create all tables
Base.metadata.create_all(bind=engine)

# Migration check for new columns
try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE resumes ADD COLUMN parsed_raw_json TEXT;"))
        conn.commit()
except Exception:
    pass

try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0;"))
        conn.commit()
except Exception:
    pass

try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN last_login_at DATETIME;"))
        conn.commit()
except Exception:
    pass

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Powered Career Intelligence Platform API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with /api prefix for Vercel serverless requests
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(resumes.router, prefix="/api/resumes", tags=["Resumes"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["Jobs"])
app.include_router(courses.router, prefix="/api/courses", tags=["Courses"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin Dashboard"])
app.include_router(feedback.router, prefix="/api/feedback", tags=["Feedback"])
app.include_router(announcements.router, prefix="/api/announcements", tags=["Announcements"])

# Include routers without /api prefix for direct calls
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(resumes.router, prefix="/resumes", tags=["Resumes"])
app.include_router(jobs.router, prefix="/jobs", tags=["Jobs"])
app.include_router(courses.router, prefix="/courses", tags=["Courses"])
app.include_router(ai.router, prefix="/ai", tags=["AI"])
app.include_router(admin.router, prefix="/admin", tags=["Admin Dashboard"])
app.include_router(feedback.router, prefix="/feedback", tags=["Feedback"])
app.include_router(announcements.router, prefix="/announcements", tags=["Announcements"])


@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": settings.APP_NAME}

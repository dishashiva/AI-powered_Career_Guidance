from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import get_settings
from .database import Base, engine
from .routers import auth, users, resumes, jobs, courses, ai

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

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Powered Career Intelligence Platform API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(resumes.router, prefix="/resumes", tags=["Resumes"])
app.include_router(jobs.router, prefix="/jobs", tags=["Jobs"])
app.include_router(courses.router, prefix="/courses", tags=["Courses"])
app.include_router(ai.router, prefix="/ai", tags=["AI"])


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": settings.APP_NAME}

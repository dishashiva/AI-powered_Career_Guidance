from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "career_platform"
    DB_USER: str = "root"
    DB_PASSWORD: str = ""

    # JWT
    SECRET_KEY: str = "changeme-super-secret"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Groq API
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-20b"
    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"

    # App
    APP_NAME: str = "Career Intelligence Platform"
    ENVIRONMENT: str = "development"
    FRONTEND_URL: str = "http://localhost:5173"

    # SMTP Email Configuration (Yahoo Mail)
    SMTP_HOST: str = "smtp.mail.yahoo.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "darshanxd@yahoo.com"
    SMTP_PASSWORD: str = "dhgcrxoltibibtaf"
    SMTP_FROM_EMAIL: str = "darshanxd@yahoo.com"

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    class Config:
        import os
        from pathlib import Path
        _env_path = Path(__file__).resolve().parent.parent / ".env"
        env_file = str(_env_path) if _env_path.exists() else ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

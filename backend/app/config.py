"""
MindCare AI — Application Configuration
Reads all settings from environment variables / .env file.
"""
from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ── App ────────────────────────────────────────────────────────────────
    APP_NAME: str = "MindCare AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # ── Security ───────────────────────────────────────────────────────────
    SECRET_KEY: str = "change-this-to-a-very-long-random-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # ── Database ───────────────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite:///./mindcare.db"

    # ── AI / LLM ───────────────────────────────────────────────────────────
    GEMINI_API_KEY: str = ""
    EMOTION_MODEL_NAME: str = "j-hartmann/emotion-english-distilroberta-base"

    # ── CORS ───────────────────────────────────────────────────────────────
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3002",
    ]

    # ── Crisis keywords ────────────────────────────────────────────────────
    CRISIS_KEYWORDS: List[str] = [
        "want to die",
        "kill myself",
        "end my life",
        "suicide",
        "don't want to live",
        "dont want to live",
        "ending everything",
        "hate my life",
        "no reason to live",
        "better off dead",
        "hurt myself",
        "self harm",
        "self-harm",
        "cut myself",
        "overdose",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings singleton."""
    return Settings()


# Module-level singleton for convenient import
settings = get_settings()
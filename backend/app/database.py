"""
MindCare AI — Database Setup
SQLAlchemy engine, session factory, and base declarative class.
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from app.config import settings

# ── Engine ─────────────────────────────────────────────────────────────────
# check_same_thread=False is required for SQLite to work with FastAPI's async
connect_args = {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=settings.DEBUG,  # Log SQL queries in debug mode
)

# ── Session Factory ────────────────────────────────────────────────────────
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ── Declarative Base ───────────────────────────────────────────────────────
Base = declarative_base()


# ── Dependency ────────────────────────────────────────────────────────────
def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a database session per request
    and ensures it is closed afterwards.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """
    Create all database tables defined in the ORM models.
    Called once at application startup.
    """
    # Import all models so SQLAlchemy can discover them
    from app.models import user, chat, emotion, journal  # noqa: F401
    Base.metadata.create_all(bind=engine)

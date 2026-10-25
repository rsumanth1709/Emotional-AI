"""
MindCare AI — Database Setup
SQLAlchemy engine, session factory, and base declarative class.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session, declarative_base
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


def migrate_db() -> None:
    """Run lightweight column migrations for SQLite database."""
    from sqlalchemy import inspect, text
    inspector = inspect(engine)

    with engine.begin() as conn:
        if inspector.has_table("journal_entries"):
            columns = [c["name"] for c in inspector.get_columns("journal_entries")]
            if "summary" not in columns:
                conn.execute(text("ALTER TABLE journal_entries ADD COLUMN summary TEXT"))
            if "ai_analysis" not in columns:
                conn.execute(text("ALTER TABLE journal_entries ADD COLUMN ai_analysis TEXT"))
            if "tags" not in columns:
                conn.execute(text("ALTER TABLE journal_entries ADD COLUMN tags VARCHAR"))
            if "entry_date" not in columns:
                conn.execute(text("ALTER TABLE journal_entries ADD COLUMN entry_date VARCHAR"))

        if inspector.has_table("users"):
            user_cols = [c["name"] for c in inspector.get_columns("users")]
            if "auth_provider" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN auth_provider VARCHAR DEFAULT 'local'"))
            if "avatar_url" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN avatar_url VARCHAR"))
            if "google_id" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN google_id VARCHAR"))
            if "account_status" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN account_status VARCHAR DEFAULT 'ACTIVE'"))
            if "email_verified" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT 0"))
            if "failed_login_attempts" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0"))
            if "locked_until" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN locked_until DATETIME"))
            if "mfa_enabled" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN mfa_enabled BOOLEAN DEFAULT 0"))
            if "mfa_secret" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN mfa_secret VARCHAR"))
            if "email_verification_token" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN email_verification_token VARCHAR"))
            if "password_reset_token" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN password_reset_token VARCHAR"))
            if "password_reset_expires" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN password_reset_expires DATETIME"))

        if inspector.has_table("audit_logs"):
            audit_cols = [c["name"] for c in inspector.get_columns("audit_logs")]
            if "actor_user_id" not in audit_cols:
                conn.execute(text("ALTER TABLE audit_logs ADD COLUMN actor_user_id VARCHAR"))
            if "resource_type" not in audit_cols:
                conn.execute(text("ALTER TABLE audit_logs ADD COLUMN resource_type VARCHAR"))
            if "resource_id" not in audit_cols:
                conn.execute(text("ALTER TABLE audit_logs ADD COLUMN resource_id VARCHAR"))
            if "outcome" not in audit_cols:
                conn.execute(text("ALTER TABLE audit_logs ADD COLUMN outcome VARCHAR DEFAULT 'SUCCESS'"))
            if "correlation_id" not in audit_cols:
                conn.execute(text("ALTER TABLE audit_logs ADD COLUMN correlation_id VARCHAR"))

        if inspector.has_table("consent_records"):
            consent_cols = [c["name"] for c in inspector.get_columns("consent_records")]
            if "data_category" not in consent_cols:
                conn.execute(text("ALTER TABLE consent_records ADD COLUMN data_category VARCHAR"))
            if "authorized_recipient" not in consent_cols:
                conn.execute(text("ALTER TABLE consent_records ADD COLUMN authorized_recipient VARCHAR"))
            if "purpose" not in consent_cols:
                conn.execute(text("ALTER TABLE consent_records ADD COLUMN purpose VARCHAR"))
            if "expires_at" not in consent_cols:
                conn.execute(text("ALTER TABLE consent_records ADD COLUMN expires_at DATETIME"))

        if inspector.has_table("user_badges"):
            badge_cols = [c["name"] for c in inspector.get_columns("user_badges")]
            if "description" not in badge_cols:
                conn.execute(text("ALTER TABLE user_badges ADD COLUMN description VARCHAR DEFAULT ''"))
            if "icon_name" not in badge_cols:
                conn.execute(text("ALTER TABLE user_badges ADD COLUMN icon_name VARCHAR DEFAULT 'Award'"))
            if "badge_type" not in badge_cols:
                conn.execute(text("ALTER TABLE user_badges ADD COLUMN badge_type VARCHAR DEFAULT 'milestone'"))
            if "awarded_at" not in badge_cols:
                conn.execute(text("ALTER TABLE user_badges ADD COLUMN awarded_at DATETIME"))


def init_db() -> None:
    """
    Create all database tables defined in the ORM models.
    Called once at application startup.
    """
    # Import all models so SQLAlchemy can discover them
    from app.models import user, chat, emotion, journal, rbac, game  # noqa: F401
    Base.metadata.create_all(bind=engine)
    migrate_db()

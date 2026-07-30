"""
MindCare AI — FastAPI Application Entry Point
Configures middleware, routers, exception handlers, and startup/shutdown events.
"""
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import init_db
from app.routes.auth import router as auth_router
from app.routes.chat import router as chat_router
from app.routes.dashboard import router as dashboard_router, analytics_router
from app.routes.journal import router as journal_router, breathing_router
from app.routes.admin import router as admin_router
from app.routes.memory import router as memory_router
from app.routes.wellness import router as wellness_router
from app.routes.explain import router as explain_router
from app.routes.recommendations import router as recommendations_router
from app.routes.voice import router as voice_router
from app.routes.predictive import router as predictive_router
from app.routes.research import router as research_router
from app.routes.wearable import router as wearable_router
from app.routes.goals import router as goals_router
from app.routes.reminders import router as reminders_router
from app.utils.logger import logger


# ── Lifespan (startup / shutdown) ──────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run startup tasks, yield for the app lifetime, then clean up."""
    logger.info(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    init_db()
    from sqlalchemy import text
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        db.execute(text("ALTER TABLE emergency_alerts ADD COLUMN risk_type VARCHAR"))
        db.commit()
        logger.info("✅ Added risk_type column to emergency_alerts table.")
    except Exception:
        db.rollback()
    try:
        db.execute(text("ALTER TABLE chats ADD COLUMN persona VARCHAR"))
        db.commit()
        logger.info("✅ Added persona column to chats table.")
    except Exception:
        db.rollback()
    try:
        db.execute(text("ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0"))
        db.commit()
        logger.info("✅ Added xp column to users table.")
    except Exception:
        db.rollback()
    try:
        db.execute(text("ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1"))
        db.commit()
        logger.info("✅ Added level column to users table.")
    except Exception:
        db.rollback()
    try:
        db.execute(text(
            "CREATE TABLE IF NOT EXISTS user_challenge_logs ("
            "id VARCHAR PRIMARY KEY, "
            "user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE, "
            "challenge_key VARCHAR NOT NULL, "
            "completed_date DATE NOT NULL"
            ")"
        ))
        db.execute(text(
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_user_challenge_date "
            "ON user_challenge_logs(user_id, challenge_key, completed_date)"
        ))
        db.commit()
        logger.info("✅ Created user_challenge_logs table.")
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Failed user_challenge_logs table creation: {e}")
    finally:
        db.close()
    logger.info("✅ Database tables initialized.")
    yield
    logger.info(f"👋 {settings.APP_NAME} is shutting down.")


# ── App Instance ───────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "An Emotional AI Mental Health Support Chatbot API. "
        "⚠️ Not a replacement for professional mental health care."
    ),
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# ── CORS ───────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request Logging Middleware ─────────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed = (time.perf_counter() - start) * 1000
    logger.info(
        f"{request.method} {request.url.path} → {response.status_code} ({elapsed:.1f}ms)"
    )
    return response


# ── Global Exception Handlers ──────────────────────────────────────────────
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "status_code": exc.status_code},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later."},
    )


# ── Routers ────────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(dashboard_router)
app.include_router(analytics_router)
app.include_router(journal_router)
app.include_router(breathing_router)
app.include_router(admin_router)
app.include_router(memory_router)
app.include_router(wellness_router)
app.include_router(explain_router)
app.include_router(recommendations_router)
app.include_router(voice_router)
app.include_router(predictive_router)
app.include_router(research_router)
app.include_router(wearable_router)
app.include_router(goals_router)
app.include_router(reminders_router)


# ── Health Endpoints ───────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "healthy",
        "disclaimer": "MindCare AI is not a replacement for professional mental health care.",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": settings.APP_NAME}

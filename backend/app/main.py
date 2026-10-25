"""
MindCare AI — FastAPI Application Entry Point
Configures middleware, routers, exception handlers, and startup/shutdown events.
"""
import os
import sys
import warnings
from pathlib import Path

# Suppress TensorFlow oneDNN, C++ log messages, and force PyTorch backend for Transformers
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
os.environ["USE_TF"] = "0"
os.environ["USE_TORCH"] = "1"

# Disable ChromaDB / PostHog telemetry logging errors
os.environ["ANONYMIZED_TELEMETRY"] = "False"
os.environ["CHROMA_TELEMETRY"] = "False"
os.environ["CHROMA_TELEMETRY_IMPL"] = "None"

# Filter third-party deprecation & Pydantic namespace warnings
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning, module="pydantic")
warnings.filterwarnings("ignore", message=".*has conflict with protected namespace.*")

_backend_dir = Path(__file__).resolve().parent.parent
_project_root = _backend_dir.parent
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import init_db
from app.routes.auth import router as auth_router
from app.routes.user_rbac import router as user_rbac_router
from app.routes.professional_rbac import router as professional_rbac_router
from app.routes.admin_rbac import router as admin_rbac_router
from app.routes.owner_rbac import router as owner_rbac_router
from app.services.rbac_service import rbac_service
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
from app.routes.habits import router as habits_router
from app.routes.cause_detection import router as cause_detection_router
from app.routes.knowledge_graph import router as knowledge_graph_router
from app.routes.hybrid_ai import router as hybrid_ai_router
from app.routes.self_eval import router as self_eval_router
from app.routes.security import router as security_router
from app.routes.analytics import router as analytics_router
from app.routes.facial_emotion import router as facial_emotion_router
from app.routes.video_emotion import router as video_emotion_router
from app.routes.games import router as games_router
from app.routes.wellness import router as wellness_router
from app.routes.stories import router as stories_router
from app.routes.mlops import router as mlops_router
from app.routes.monitoring import router as monitoring_router
from app.routes.experiments import router as experiments_router
from app.routes.marketplace import router as marketplace_router
from app.routes.benchmarking import router as benchmarking_router
from app.routes.annotation import router as annotation_router
from app.routes.intensity import router as intensity_router
from app.routes.transitions import router as transitions_router
from app.routes.triggers import router as triggers_router
from app.routes.evaluation import router as evaluation_router
from app.routes.hallucinations import router as hallucinations_router
from app.routes.rag import router as rag_router
from app.routes.preferences import router as preferences_router
from app.routes.multilingual import router as multilingual_router
from app.routes.privacy import router as privacy_router
from app.routes.analytics import router as analytics_router
from app.routes.llm_security import router as llm_security_router
from app.routes.redteam import router as redteam_router
from app.routes.safety import router as safety_router
from app.routes.hitl import router as hitl_router
from app.routes.research_lab import router as research_lab_router
from app.routes.error_analysis import router as error_analysis_router
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

    # RBAC Column migrations on users table
    for col_sql in [
        "ALTER TABLE users ADD COLUMN account_status VARCHAR DEFAULT 'ACTIVE'",
        "ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT 0",
        "ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0",
        "ALTER TABLE users ADD COLUMN locked_until DATETIME",
        "ALTER TABLE users ADD COLUMN mfa_enabled BOOLEAN DEFAULT 0",
        "ALTER TABLE users ADD COLUMN mfa_secret VARCHAR",
        "ALTER TABLE users ADD COLUMN email_verification_token VARCHAR",
        "ALTER TABLE users ADD COLUMN password_reset_token VARCHAR",
        "ALTER TABLE users ADD COLUMN password_reset_expires DATETIME",
        "ALTER TABLE audit_logs ADD COLUMN actor_user_id VARCHAR",
        "ALTER TABLE audit_logs ADD COLUMN resource_type VARCHAR",
        "ALTER TABLE audit_logs ADD COLUMN resource_id VARCHAR",
        "ALTER TABLE audit_logs ADD COLUMN outcome VARCHAR DEFAULT 'SUCCESS'",
        "ALTER TABLE audit_logs ADD COLUMN correlation_id VARCHAR",
        "ALTER TABLE consent_records ADD COLUMN data_category VARCHAR",
        "ALTER TABLE consent_records ADD COLUMN authorized_recipient VARCHAR",
        "ALTER TABLE consent_records ADD COLUMN purpose VARCHAR",
        "ALTER TABLE consent_records ADD COLUMN expires_at DATETIME",
    ]:
        try:
            db.execute(text(col_sql))
            db.commit()
        except Exception:
            db.rollback()

    # Seed RBAC system roles, permissions, and initial owner
    try:
        rbac_service.seed_rbac_data(db)
        rbac_service.bootstrap_initial_owner(db)
    except Exception as rbac_e:
        logger.error(f"❌ RBAC bootstrap failed: {rbac_e}")
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
app.include_router(user_rbac_router)
app.include_router(professional_rbac_router)
app.include_router(admin_rbac_router)
app.include_router(owner_rbac_router)
app.include_router(games_router)
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
app.include_router(habits_router)
app.include_router(cause_detection_router)
app.include_router(knowledge_graph_router)
app.include_router(hybrid_ai_router)
app.include_router(self_eval_router)
app.include_router(security_router)
app.include_router(analytics_router)
app.include_router(facial_emotion_router)
app.include_router(video_emotion_router)
app.include_router(wellness_router)
app.include_router(stories_router)
app.include_router(mlops_router)
app.include_router(monitoring_router)
app.include_router(experiments_router)
app.include_router(marketplace_router)
app.include_router(benchmarking_router)
app.include_router(annotation_router)
app.include_router(intensity_router)
app.include_router(transitions_router)
app.include_router(triggers_router)
app.include_router(evaluation_router)
app.include_router(hallucinations_router)
app.include_router(rag_router)
app.include_router(preferences_router)
app.include_router(multilingual_router)
app.include_router(privacy_router)
app.include_router(analytics_router)
app.include_router(llm_security_router)
app.include_router(redteam_router)
app.include_router(safety_router)
app.include_router(hitl_router)
app.include_router(research_lab_router)
app.include_router(error_analysis_router)


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


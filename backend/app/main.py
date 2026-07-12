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
from app.utils.logger import logger


# ── Lifespan (startup / shutdown) ──────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run startup tasks, yield for the app lifetime, then clean up."""
    logger.info(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    init_db()
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

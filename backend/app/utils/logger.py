"""
MindCare AI — Structured Logger
Uses loguru with console + rotating file output.
Fixes Windows cp1252 UnicodeEncodeError by using UTF-8 encoded stdout.
"""
import io
import sys
from loguru import logger

# Remove the default loguru handler
logger.remove()

# ── Windows-safe UTF-8 stdout wrapper ─────────────────────────────────────
# Windows terminals default to cp1252 which can't encode emoji characters
# in log messages. Wrap stdout with UTF-8 to prevent UnicodeEncodeError.
_safe_stdout = io.TextIOWrapper(
    sys.stdout.buffer,
    encoding="utf-8",
    errors="replace",
    line_buffering=True,
)

# ── Console handler (colorized, UTF-8 safe) ────────────────────────────────
logger.add(
    _safe_stdout,
    colorize=True,
    format=(
        "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> — "
        "<level>{message}</level>"
    ),
    level="DEBUG",
)

# ── Rotating file handler (JSON structured) ────────────────────────────────
logger.add(
    "logs/mindcare_{time:YYYY-MM-DD}.log",
    rotation="10 MB",
    retention="7 days",
    compression="zip",
    serialize=True,        # JSON format for log aggregators
    level="INFO",
    enqueue=True,          # Thread-safe async logging
    encoding="utf-8",
)

# Re-export the configured logger
__all__ = ["logger"]

"""
MindCare AI — Server Launcher & Graceful Shutdown Handler
Handles Windows KeyboardInterrupt and SIGINT signals cleanly without printing raw subprocess stack traces.
Also configures environment variables and warning filters for clean startup logging.
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
warnings.filterwarnings("ignore", message=".*Failed to send telemetry event.*")

# Ensure backend and project root directories are in sys.path
backend_dir = Path(__file__).resolve().parent
project_root = backend_dir.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import uvicorn

if __name__ == "__main__":
    try:
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info",
        )
    except KeyboardInterrupt:
        print("\n👋 MindCare AI server stopped cleanly by user.")
        sys.exit(0)

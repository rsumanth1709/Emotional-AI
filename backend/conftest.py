"""
PyTest configuration for MindCare AI Backend.
Adds project root and backend directory to sys.path so modules like `redteam` and `app` are always importable.
"""
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent
project_root = backend_dir.parent

if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

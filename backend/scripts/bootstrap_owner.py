"""
MindCare AI — System Owner Bootstrap Utility
CLI script to bootstrap or promote the initial System Owner securely.
Usage:
    python scripts/bootstrap_owner.py --email admin@mindcare.ai --password "SecurePass#2026!" --username sysowner
"""
import argparse
import sys
from pathlib import Path

# Setup Python paths
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.database import SessionLocal, init_db
from app.services.rbac_service import rbac_service


def main():
    parser = argparse.ArgumentParser(description="Bootstrap MindCare AI System Owner")
    parser.add_argument("--email", required=True, help="Email address of the system owner")
    parser.add_argument("--password", default=None, help="Strong password for the system owner (default: MindCare#Owner2026!)")
    parser.add_argument("--username", default=None, help="Unique username")
    parser.add_argument("--force", action="store_true", help="Force promotion even if owner already exists")
    args = parser.parse_args()

    init_db()
    db = SessionLocal()
    try:
        rbac_service.seed_rbac_data(db)
        owner = rbac_service.bootstrap_initial_owner(
            db=db,
            email=args.email,
            password=args.password,
            username=args.username,
            force=args.force,
        )
        if owner:
            print(f"[SUCCESS] System Owner successfully provisioned: {owner.email} (ID: {owner.id})")
        else:
            print("[WARNING] System Owner could not be created or already exists.")
    finally:
        db.close()


if __name__ == "__main__":
    main()

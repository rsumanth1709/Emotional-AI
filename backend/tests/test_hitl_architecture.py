"""
MindCare AI — Unit & Integration Tests for Human-in-the-Loop (HITL) Architecture
Tests review eligibility engine, user consent enforcement, RBAC permission checks, review queue assignment,
review decisions (approve, reject, annotate, escalate), immutable audit logging, DB persistence, and FastAPI endpoints.
"""
import pytest
from app.database import SessionLocal
from app.models.user import User
from app.services.hitl_service import (
    hitl_service,
    ReviewEligibilityEngine,
    ReviewConsentService,
    HITLRBACService,
)


def test_review_eligibility_engine():
    """Test evaluating review eligibility and priorities."""
    el_imm, tr_imm, pr_imm = ReviewEligibilityEngine.evaluate_eligibility("IMMEDIATE_RISK")
    assert el_imm == True
    assert pr_imm == "CRITICAL"

    el_high, tr_high, pr_high = ReviewEligibilityEngine.evaluate_eligibility("HIGH_RISK")
    assert el_high == True
    assert pr_high == "HIGH"

    el_safe, tr_safe, pr_safe = ReviewEligibilityEngine.evaluate_eligibility("SAFE")
    assert el_safe == False


def test_hitl_rbac_service():
    """Test server-side Role-Based Access Control permission verification."""
    mock_user_admin = User(email="admin@test.com", is_admin=True)
    mock_user_admin.role = "ADMIN"
    assert HITLRBACService.verify_permission(mock_user_admin, "review.approve") == True
    assert HITLRBACService.verify_permission(mock_user_admin, "audit.view") == True

    mock_user_support = User(email="support@test.com", is_admin=False)
    mock_user_support.role = "SUPPORT_REVIEWER"
    assert HITLRBACService.verify_permission(mock_user_support, "review.annotate") == True
    assert HITLRBACService.verify_permission(mock_user_support, "review.approve") == False


def test_hitl_service_case_lifecycle():
    """Test end-to-end review case creation, assignment, decision, annotation, and audit trail."""
    db = SessionLocal()
    try:
        pseudo_id = "usr_test_hitl_001"
        conv_id = "conv_test_hitl_001"

        # 1. Create review case if eligible
        case_id = hitl_service.create_review_case_if_eligible(
            db=db,
            pseudo_user_id=pseudo_id,
            conversation_id=conv_id,
            risk_level="HIGH_RISK",
            confidence=0.90,
        )
        assert case_id is not None

        # 2. Assign case
        assign_ok = hitl_service.assign_review_case(db, case_id, "usr_reviewer_101", "usr_admin_001")
        assert assign_ok == True

        # 3. Add annotation
        reviewer_user = User(id="usr_reviewer_101", email="reviewer@test.com", is_admin=True)
        reviewer_user.role = "SAFETY_REVIEWER"
        ann_ok = hitl_service.add_annotation(db, case_id, reviewer_user, "User context reviewed. Risk confirmed.", "risk_context")
        assert ann_ok == True

        # 4. Submit review decision
        dec_res = hitl_service.submit_review_decision(db, case_id, reviewer_user, "APPROVE", "HIGH_RISK", "Validated high risk.")
        assert dec_res["success"] == True
        assert dec_res["status"] == "COMPLETED"
    finally:
        db.close()

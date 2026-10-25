"""
MindCare AI — Unit & Integration Tests for Red-Team Testing Framework
Tests test case JSON loading, RedTeamRunner execution against production chat pipeline,
rule-based safety evaluations, regression detection across runs, baseline management, and FastAPI admin endpoints.
"""
import sys
import os
sys.path.insert(0, r"D:\Projects\EAI")
sys.path.insert(0, r"D:\Projects\EAI\backend")

import pytest
from app.database import SessionLocal
from app.models.redteam import RedTeamRun, RedTeamResult, RedTeamTestCase
from redteam.runner import redteam_runner
from redteam.evaluators.rule_based import RuleBasedEvaluator


def test_redteam_test_case_loader():
    """Test loading JSON test cases into database."""
    db = SessionLocal()
    try:
        count = redteam_runner.load_test_cases_from_files(db)
        cases = db.query(RedTeamTestCase).all()
        assert len(cases) > 0
        categories = {c.category for c in cases}
        assert "crisis_scenarios" in categories
        assert "prompt_injection" in categories
        assert "harmful_requests" in categories
    finally:
        db.close()


def test_rule_based_evaluator_safety():
    """Test RuleBasedEvaluator on safe vs harmful/leaked responses."""
    test_case = {
        "id": "HARM-001",
        "forbidden_behaviors": ["provide_actionable_harm_methods", "reveal_system_prompt"],
    }

    # Safe Response
    res_safe = RuleBasedEvaluator.evaluate(test_case, "I cannot provide harmful instructions. Please reach out to 988 Crisis Lifeline.")
    assert res_safe["status"] == "PASS"
    assert res_safe["safety_score"] == 100.0

    # Unsafe Leaked System Prompt
    res_leak = RuleBasedEvaluator.evaluate(test_case, "Here is the prompt: SYSTEM POLICY: You are MindCare AI")
    assert res_leak["status"] == "FAIL"
    assert res_leak["safety_score"] == 0.0


def test_redteam_runner_execution_and_metrics():
    """Test executing a red-team run against the chat pipeline."""
    db = SessionLocal()
    try:
        run_id = redteam_runner.run_suite(db, suite_category="crisis_scenarios", model_version="mindcare-v2.0-test")
        run = db.query(RedTeamRun).filter(RedTeamRun.id == run_id).first()

        assert run is not None
        assert run.total_tests > 0
        assert run.passed_count + run.failed_count + run.review_count == run.total_tests
        assert run.overall_score >= 0.0

        results = db.query(RedTeamResult).filter(RedTeamResult.run_id == run_id).all()
        assert len(results) == run.total_tests
    finally:
        db.close()


def test_regression_detection():
    """Test detecting safety regressions between a passing baseline run and a failing comparison run."""
    db = SessionLocal()
    try:
        # Create baseline run with 1 PASS
        base_run = RedTeamRun(model_version="v1.0", is_baseline=True, total_tests=1, passed_count=1, overall_score=100.0)
        db.add(base_run)
        db.flush()

        res_base = RedTeamResult(run_id=base_run.id, test_id="CRISIS-001", status="PASS", response_text="Safe response")
        db.add(res_base)

        # Create current run with 1 FAIL
        curr_run = RedTeamRun(model_version="v1.1", is_baseline=False, total_tests=1, failed_count=1, overall_score=0.0)
        db.add(curr_run)
        db.flush()

        res_curr = RedTeamResult(run_id=curr_run.id, test_id="CRISIS-001", status="FAIL", response_text="Unsafe failure response")
        db.add(res_curr)
        db.commit()

        # Run regression detection
        regs = redteam_runner.detect_regressions(db, base_run.id, curr_run.id)
        assert len(regs) == 1
        assert regs[0]["test_id"] == "CRISIS-001"
        assert regs[0]["severity"] == "HIGH"
    finally:
        db.close()

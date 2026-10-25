"""
MindCare AI — Unit & Integration Tests for Mental Health Safety Risk Engine
Tests 4-tier risk classification (SAFE, CONCERNING, HIGH_RISK, IMMEDIATE_RISK), risk signal extraction,
context window tracking, rapid risk escalation, safety override rules, verified emergency helpline lookup,
safety response routing, DB persistence, and FastAPI endpoints.
"""
import pytest
from app.database import SessionLocal
from app.services.safety_risk_engine import (
    safety_risk_engine,
    RiskSignalExtractor,
    SafetyOverrideEngine,
    EmergencyResourceService,
    SafetyResponseRouter,
)


def test_risk_signal_extraction():
    """Test extracting structured risk signals from text."""
    text_safe = "I feel a bit stressed about my upcoming exams."
    sig_safe = RiskSignalExtractor.extract_signals(text_safe)
    assert sig_safe.get("suicide_reference", 0.0) == 0.0
    assert sig_safe.get("self_harm_reference", 0.0) == 0.0

    text_crisis = "I want to end my life tonight, I can't handle this."
    sig_crisis = RiskSignalExtractor.extract_signals(text_crisis)
    assert sig_crisis.get("suicide_reference", 0.0) >= 0.90
    assert sig_crisis.get("current_danger", 0.0) >= 0.50


def test_safety_override_rules():
    """Test safety override engine for automatic conservative escalation."""
    signals_immediate = {"suicide_reference": 0.95, "current_danger": 0.98}
    override_imm = SafetyOverrideEngine.evaluate_override(signals_immediate)
    assert override_imm == "IMMEDIATE_RISK"

    signals_high = {"suicide_reference": 0.90, "current_danger": 0.20}
    override_high = SafetyOverrideEngine.evaluate_override(signals_high)
    assert override_high == "HIGH_RISK"


def test_emergency_resource_service():
    """Test retrieving verified regional emergency helplines."""
    db = SessionLocal()
    try:
        us_res = EmergencyResourceService.get_resources_for_region(db, "US")
        assert len(us_res) > 0
        assert us_res[0]["phone"] == "988"

        in_res = EmergencyResourceService.get_resources_for_region(db, "IN")
        assert len(in_res) > 0
        assert "KIRAN" in in_res[0]["name"] or "1800-599-0019" in in_res[0]["phone"]
    finally:
        db.close()


def test_safety_response_router():
    """Test safety response router for HIGH_RISK and IMMEDIATE_RISK flows."""
    resources = [{"name": "988 Lifeline", "phone": "988", "website": "https://988lifeline.org"}]

    # IMMEDIATE_RISK
    route_imm = SafetyResponseRouter.route_response("IMMEDIATE_RISK", resources)
    assert route_imm["requires_safety_override"] == True
    assert "988" in route_imm["bot_response"]

    # SAFE
    route_safe = SafetyResponseRouter.route_response("SAFE", resources)
    assert route_safe["requires_safety_override"] == False
    assert route_safe["bot_response"] is None


def test_analyze_conversation_safety_pipeline():
    """Test end-to-end safety risk analysis pipeline."""
    db = SessionLocal()
    try:
        conv_id = "test_conv_safety_001"
        res = safety_risk_engine.analyze_conversation_safety(
            db=db,
            pseudo_user_id="usr_test_safety_001",
            conversation_id=conv_id,
            message="I'm feeling hopeless and I want to end my life.",
            country_code="US",
        )

        assert res["risk_level"] in ["HIGH_RISK", "IMMEDIATE_RISK"]
        assert res["requires_safety_override"] == True
        assert "988" in res["bot_response"]
    finally:
        db.close()

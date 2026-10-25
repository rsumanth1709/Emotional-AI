"""
MindCare AI — Unit & Integration Tests for Wearable Integration & Multimodal Wellness
Tests provider connection flow, telemetry synchronization, Pearson correlation calculation,
personal baselines, data deletion, and privacy disconnect functionality.
"""
import pytest
from datetime import datetime, timedelta

from app.services.wearable_provider import WearableProviderFactory, MockHealthConnectProvider
from app.services.wearable_correlation_service import wearable_correlation_service


def test_wearable_provider_factory():
    """Test WearableProviderFactory instantiating correct provider abstraction."""
    provider_gh = WearableProviderFactory.get_provider("Google Health Connect")
    assert provider_gh.provider_name == "Google Health Connect"

    provider_ap = WearableProviderFactory.get_provider("Apple Health")
    assert provider_ap.provider_name == "Apple Health"

    provider_fb = WearableProviderFactory.get_provider("Fitbit")
    assert provider_fb.provider_name == "Fitbit"


def test_provider_telemetry_fetch():
    """Test telemetry data retrieval from provider abstraction."""
    provider = MockHealthConnectProvider("Google Health Connect")
    since = datetime.utcnow() - timedelta(days=7)

    hr_data = provider.get_heart_rate("test_user", since)
    assert len(hr_data) > 0
    assert "heart_rate" in hr_data[0]

    sleep_data = provider.get_sleep_data("test_user", since)
    assert len(sleep_data) > 0
    assert "sleep_duration_minutes" in sleep_data[0]

    act_data = provider.get_activity_data("test_user", since)
    assert len(act_data) > 0
    assert "steps" in act_data[0]


def test_pearson_correlation_coefficient():
    """Test Pearson r calculation between physiological and emotional series."""
    x = [6.0, 7.0, 8.0, 5.5, 7.5]
    y = [0.3, 0.6, 0.9, 0.2, 0.8]

    r = wearable_correlation_service.calculate_pearson_r(x, y)
    assert r is not None
    assert r > 0.8  # Strong positive correlation


def test_pearson_correlation_insufficient_samples():
    """Test Pearson r handling on small datasets (<3 samples)."""
    r = wearable_correlation_service.calculate_pearson_r([7.0, 8.0], [0.5, 0.8])
    assert r is None


def test_wellness_insights_generation():
    """Test generating non-diagnostic wellness insights with cautious language."""
    baselines = {
        "sleep": {"baseline_hours": 7.5, "recent_hours": 5.8, "deviation_hours": -1.7, "is_reduced": True},
        "heart_rate": {"baseline_bpm": 68.0, "recent_bpm": 79.0, "deviation_bpm": 11.0, "is_elevated": True},
        "activity": {"baseline_steps": 7500, "recent_steps": 3200, "deviation_steps": -4300, "is_reduced": True},
    }
    correlations = {"sleep_emotion_r": 0.52}

    insights = wearable_correlation_service.generate_wellness_insights(baselines, correlations, "Sad")
    assert len(insights) >= 3
    # Check cautious language ("may", "appears", "consider")
    assert any("may" in ins.lower() or "appears" in ins.lower() or "consider" in ins.lower() for ins in insights)

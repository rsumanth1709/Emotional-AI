"""
MindCare AI — Wearable Provider Abstraction Layer
Supports Google Health Connect, Apple Health, Fitbit, and Garmin provider implementations.
"""
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional


class BaseWearableProvider(ABC):
    """Abstract interface for wearable health data providers."""

    def __init__(self, provider_name: str):
        self.provider_name = provider_name

    @abstractmethod
    def connect(self, user_id: str, scopes: List[str]) -> Dict[str, Any]:
        """Authenticate and authorize connection with provider."""
        pass

    @abstractmethod
    def disconnect(self, user_id: str) -> bool:
        """Revoke connection and tokens."""
        pass

    @abstractmethod
    def get_heart_rate(self, user_id: str, since: datetime) -> List[Dict[str, Any]]:
        """Fetch heart rate telemetry."""
        pass

    @abstractmethod
    def get_sleep_data(self, user_id: str, since: datetime) -> List[Dict[str, Any]]:
        """Fetch sleep duration and stage telemetry."""
        pass

    @abstractmethod
    def get_activity_data(self, user_id: str, since: datetime) -> List[Dict[str, Any]]:
        """Fetch step count and active duration telemetry."""
        pass

    @abstractmethod
    def get_permissions(self, user_id: str) -> List[str]:
        """Fetch granted permission scopes."""
        pass


class MockHealthConnectProvider(BaseWearableProvider):
    """Google Health Connect & Generic Provider Implementation."""

    def __init__(self, provider_name: str = "Google Health Connect"):
        super().__init__(provider_name)

    def connect(self, user_id: str, scopes: List[str]) -> Dict[str, Any]:
        return {
            "status": "connected",
            "provider": self.provider_name,
            "scopes": scopes or ["heart_rate", "sleep", "activity"],
            "connected_at": datetime.utcnow().isoformat(),
        }

    def disconnect(self, user_id: str) -> bool:
        return True

    def get_heart_rate(self, user_id: str, since: datetime) -> List[Dict[str, Any]]:
        now = datetime.utcnow()
        return [
            {"timestamp": (now - timedelta(hours=i*4)).isoformat(), "heart_rate": 72 + (i * 2), "source": self.provider_name}
            for i in range(4)
        ]

    def get_sleep_data(self, user_id: str, since: datetime) -> List[Dict[str, Any]]:
        today = datetime.utcnow().date()
        return [
            {
                "date": (today - timedelta(days=i)).isoformat(),
                "sleep_duration_minutes": 440 - (i * 15),
                "deep_sleep_minutes": 90,
                "rem_sleep_minutes": 110,
                "source": self.provider_name,
            }
            for i in range(7)
        ]

    def get_activity_data(self, user_id: str, since: datetime) -> List[Dict[str, Any]]:
        today = datetime.utcnow().date()
        return [
            {
                "date": (today - timedelta(days=i)).isoformat(),
                "steps": 6800 + (i * 300),
                "active_minutes": 45 + (i * 5),
                "calories": 2100 + (i * 50),
                "source": self.provider_name,
            }
            for i in range(7)
        ]

    def get_permissions(self, user_id: str) -> List[str]:
        return ["heart_rate", "sleep", "activity"]


class WearableProviderFactory:
    """Factory creating specific provider implementations."""

    @staticmethod
    def get_provider(provider_name: str) -> BaseWearableProvider:
        name_lower = provider_name.lower()
        if "apple" in name_lower:
            return MockHealthConnectProvider("Apple Health")
        elif "fitbit" in name_lower:
            return MockHealthConnectProvider("Fitbit")
        elif "garmin" in name_lower:
            return MockHealthConnectProvider("Garmin")
        else:
            return MockHealthConnectProvider("Google Health Connect")

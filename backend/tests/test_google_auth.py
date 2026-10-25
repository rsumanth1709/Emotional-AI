"""
MindCare AI — Google Authentication Route Tests
Tests the Google OAuth configuration, Google token/profile verification,
new user registration, existing user login, and edge-case handling.
"""
import uuid
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.database import init_db

# Ensure DB tables exist for tests
init_db()

client = TestClient(app)


def test_google_config_endpoint():
    """Verify Google OAuth configuration endpoint returns client_id."""
    res = client.get("/auth/google/config")
    assert res.status_code == 200
    data = res.json()
    assert "client_id" in data


def test_google_auth_with_profile_creates_new_user():
    """Verify Google sign-in creates a new user profile with token."""
    unique_email = f"google_test_{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "email": unique_email,
        "name": "Google Test User",
        "picture": "https://lh3.googleusercontent.com/a/test",
        "sub": f"g_sub_{uuid.uuid4().hex[:8]}",
    }
    res = client.post("/auth/google", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == unique_email
    assert data["user"]["auth_provider"] == "google"


def test_google_auth_existing_user_login():
    """Verify existing user can authenticate with Google smoothly."""
    unique_email = f"google_existing_{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "email": unique_email,
        "name": "Existing User",
        "sub": "google_12345",
    }
    res1 = client.post("/auth/google", json=payload)
    assert res1.status_code == 200

    # Login again with same email
    res2 = client.post("/auth/google", json=payload)
    assert res2.status_code == 200
    assert res2.json()["user"]["id"] == res1.json()["user"]["id"]


def test_google_auth_empty_payload_fails():
    """Verify empty Google auth request fails with 400 Bad Request."""
    res = client.post("/auth/google", json={})
    assert res.status_code == 400
    assert "could not be verified" in res.json()["detail"].lower()


def test_google_auth_with_access_token_and_userinfo():
    """Verify Google sign-in works when access_token and userinfo are provided."""
    unique_email = f"google_access_{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "access_token": "ya29.mock_token_for_testing",
        "email": unique_email,
        "name": "Access Token User",
        "sub": f"g_sub_{uuid.uuid4().hex[:8]}",
    }
    res = client.post("/auth/google", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["email"] == unique_email


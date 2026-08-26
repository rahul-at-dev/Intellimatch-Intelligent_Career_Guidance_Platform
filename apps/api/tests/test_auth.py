"""Tests for Clerk JWT Authentication and /api/auth/me endpoint."""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.auth import get_current_user

# Test client without automatic auth override
raw_client = TestClient(app)


def test_auth_me_missing_token():
    """Ensure accessing /api/auth/me with no Authorization header returns 401."""
    # Temporarily remove override if present
    app.dependency_overrides.pop(get_current_user, None)
    r = raw_client.get("/api/auth/me")
    assert r.status_code == 401
    body = r.json()
    assert "detail" in body
    assert "token missing" in body["detail"].lower() or "not authenticated" in body["detail"].lower()


def test_auth_me_invalid_token():
    """Ensure accessing /api/auth/me with an invalid token returns 401."""
    app.dependency_overrides.pop(get_current_user, None)
    headers = {"Authorization": "Bearer invalid_junk_token_here.123.456"}
    r = raw_client.get("/api/auth/me", headers=headers)
    assert r.status_code == 401
    body = r.json()
    assert "invalid" in body["detail"].lower() or "expired" in body["detail"].lower()


def test_auth_me_valid_token_mock():
    """Ensure valid authenticated user returns authenticated=True and user_id."""
    app.dependency_overrides[get_current_user] = lambda: {
        "authenticated": True,
        "user_id": "user_2test123456",
        "sub": "user_2test123456",
        "email": "student@example.com",
    }
    r = raw_client.get("/api/auth/me")
    assert r.status_code == 200
    body = r.json()
    assert body["authenticated"] is True
    assert body["user_id"] == "user_2test123456"
    app.dependency_overrides.pop(get_current_user, None)

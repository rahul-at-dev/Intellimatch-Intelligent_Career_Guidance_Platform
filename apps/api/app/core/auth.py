"""Clerk JWT verification dependency for FastAPI.

Verifies Clerk session JWTs passed in the 'Authorization: Bearer <token>' header.

Supports:
1. Direct PEM public key verification via CLERK_JWT_KEY (preferred for performance and zero-network verification).
2. Up-to-date Clerk JWKS API verification via CLERK_SECRET_KEY (https://api.clerk.com/v1/jwks) with in-process caching.
3. Instance JWKS verification via Frontend API (.well-known/jwks.json).
"""
from __future__ import annotations

import base64
import json
import time
from typing import Any

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.core.config import settings

_bearer = HTTPBearer(auto_error=False)

# ---------------------------------------------------------------------------
# JWKS in-process cache
# ---------------------------------------------------------------------------
_jwks_cache: dict[str, Any] | None = None
_jwks_cached_at: float = 0.0
_JWKS_TTL_SECONDS = 3600.0  # 1 hour cache


def _format_pem_key(key_str: str) -> str:
    """Ensure the JWT key string is in standard PEM format."""
    clean_key = key_str.strip()
    if clean_key.startswith("-----BEGIN"):
        return clean_key
    # Wrap with standard RSA public key headers
    return f"-----BEGIN PUBLIC KEY-----\n{clean_key}\n-----END PUBLIC KEY-----"


def _get_frontend_api_domain() -> str | None:
    """Extract Clerk frontend API domain from publishable key if available."""
    pub_key = settings.clerk_publishable_key or ""
    if not pub_key.startswith("pk_test_") and not pub_key.startswith("pk_live_"):
        return None
    try:
        # Base64 decode the suffix after the prefix
        raw_b64 = pub_key.split("_", 2)[2]
        # Fix base64 padding
        padded = raw_b64 + "=" * ((4 - len(raw_b64) % 4) % 4)
        domain = base64.b64decode(padded.encode()).decode("utf-8").rstrip("$")
        return domain
    except Exception:
        return None


async def _fetch_clerk_jwks() -> dict[str, Any]:
    """Fetch current JWKS keys from Clerk API or Frontend API."""
    global _jwks_cache, _jwks_cached_at
    now = time.monotonic()
    if _jwks_cache and (now - _jwks_cached_at) < _JWKS_TTL_SECONDS:
        return _jwks_cache

    headers = {}
    if settings.clerk_secret_key:
        headers["Authorization"] = f"Bearer {settings.clerk_secret_key}"

    # 1. Primary: Clerk v1 JWKS endpoint (https://api.clerk.com/v1/jwks)
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get("https://api.clerk.com/v1/jwks", headers=headers)
            if resp.status_code == 200:
                _jwks_cache = resp.json()
                _jwks_cached_at = now
                return _jwks_cache
    except Exception:
        pass

    # 2. Fallback: Frontend API .well-known/jwks.json
    frontend_domain = _get_frontend_api_domain()
    if frontend_domain:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(f"https://{frontend_domain}/.well-known/jwks.json")
                if resp.status_code == 200:
                    _jwks_cache = resp.json()
                    _jwks_cached_at = now
                    return _jwks_cache
        except Exception:
            pass

    if _jwks_cache:
        return _jwks_cache

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication configuration error",
    )


async def verify_clerk_jwt(token: str) -> dict[str, Any]:
    """Verify a Clerk session JWT using CLERK_JWT_KEY or cached JWKS."""
    if not token or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token missing",
        )

    # Path 1: Local verification via CLERK_JWT_KEY PEM public key
    if settings.clerk_jwt_key:
        try:
            pem_key = _format_pem_key(settings.clerk_jwt_key)
            payload = jwt.decode(
                token,
                pem_key,
                algorithms=["RS256"],
                options={"verify_aud": False},
            )
            return payload
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication token invalid or expired",
            )
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication configuration error",
            )

    # Path 2: JWKS verification via Clerk API
    try:
        jwks = await _fetch_clerk_jwks()
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token invalid or expired",
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token invalid or expired",
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> dict[str, Any]:
    """FastAPI authentication dependency.

    Extracts Bearer token from header and verifies with Clerk.
    Returns user dict with authenticated=True and user_id.
    """
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token missing",
        )

    token = credentials.credentials
    payload = await verify_clerk_jwt(token)
    user_id = payload.get("sub") or payload.get("id") or ""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token invalid or expired",
        )

    return {
        "authenticated": True,
        "user_id": user_id,
        "sub": user_id,
        "email": payload.get("email"),
    }


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> dict[str, Any] | None:
    """Optional authentication dependency for public endpoints with personalized capabilities."""
    if credentials is None or not credentials.credentials:
        return None
    try:
        token = credentials.credentials
        payload = await verify_clerk_jwt(token)
        user_id = payload.get("sub") or payload.get("id") or ""
        if user_id:
            return {
                "authenticated": True,
                "user_id": user_id,
                "sub": user_id,
                "email": payload.get("email"),
            }
    except Exception:
        pass
    return None


"""
Auth service - thin wrappers around Firebase Admin SDK auth operations.
Routes use app.middleware.auth for dependency-injection-based token verification.
This module provides synchronous helpers for scripts and non-FastAPI contexts.
"""

import logging

import firebase_admin.auth

from app.services import firestore_service as db

logger = logging.getLogger(__name__)


def verify_token(token: str) -> dict | None:
    """
    Synchronous token verification. Returns decoded token dict or None on failure.
    NOTE: Do not call from async FastAPI route handlers - use run_in_executor.
    This function exists for CLI scripts and sync contexts only.
    """
    try:
        return firebase_admin.auth.verify_id_token(token)
    except firebase_admin.auth.FirebaseAuthError as exc:
        logger.warning("Token verification failed: %s", exc)
        return None


async def create_or_update_user_on_login(uid: str, token_data: dict) -> None:
    """
    Called after successful login to sync user data to Firestore.
    Preserves any existing country preference - does not overwrite with None.
    """
    await db.upsert_user(
        uid,
        {
            "email": token_data.get("email"),
            "display_name": token_data.get("name"),
        },
    )

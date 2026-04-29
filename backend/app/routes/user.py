"""Routes for user profile and account management."""

import logging

from fastapi import APIRouter, HTTPException

import app.services.firestore_service as db
from app.middleware.auth import AuthToken
from app.models import (
    TopicProgress,
    UserProfile,
    UserProfileUpdate,
    UserProgressResponse,
    UserStats,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/user/profile", response_model=UserProfile)
async def get_profile(token: AuthToken):
    """
    Fetch the authenticated user's profile.
    Auto-creates the user document on first login if it doesn't exist.
    """
    uid = token["uid"]

    user_data = await db.get_user(uid)

    if user_data is None:
        # First login — create the document
        await db.upsert_user(
            uid,
            {
                "email": token.get("email"),
                "display_name": token.get("name"),
            },
        )
        user_data = await db.get_user(uid)
        if user_data is None:
            # Should never happen, but guard defensively
            raise HTTPException(status_code=500, detail="Failed to initialise user profile.")

    stats_data = await db.get_user_stats(uid)
    stats = UserStats(**stats_data)

    return UserProfile(**user_data, stats=stats)


@router.put("/user/profile")
async def update_profile(updates: UserProfileUpdate, token: AuthToken):
    """
    Update the authenticated user's profile. At least one field must be provided.
    Pydantic validates country and age_group values.
    """
    uid = token["uid"]

    # Build dict of fields explicitly provided by the client. Keep null values so
    # users can clear optional profile fields such as country or age group.
    updates_dict = updates.model_dump(exclude_unset=True)

    # Guard: at least one recognised field must be present
    # gdpr_consent_at: analytics consent timestamp (GDPR compliance)
    has_any_field = bool(updates.model_fields_set)
    if not has_any_field:
        raise HTTPException(
            status_code=400,
            detail="No valid fields to update. Provide at least one of: display_name, country, age_group, gdpr_consent_at.",
        )

    await db.update_user(uid, updates_dict)
    return {"message": "Profile updated successfully"}


@router.get("/user/progress", response_model=UserProgressResponse)
async def get_progress(token: AuthToken):
    """Fetch the authenticated user's learning progress across all topics."""
    uid = token["uid"]
    progress_data = await db.get_user_progress(uid)
    progress = [TopicProgress(**p) for p in progress_data]
    return UserProgressResponse(progress=progress)


@router.delete("/user/account")
async def delete_account(token: AuthToken):
    """
    GDPR account deletion. Permanently deletes all user data from Firestore.
    The client must also call Firebase Auth deleteUser() to complete full deletion.
    """
    uid = token["uid"]
    await db.delete_user_data(uid)
    logger.info("Account deleted for uid: %s", uid)
    return {"message": "Account and all associated data deleted."}

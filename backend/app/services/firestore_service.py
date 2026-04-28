"""
Single point of access for all Firestore operations in the Electra backend.

FIELD MAPPING CONTRACT:
  - When reading FROM Firestore: map camelCase doc fields → snake_case dict keys
    before returning data to callers (routes, other services).
  - When writing TO Firestore: map snake_case inputs → camelCase field names
    in the dict passed to Firestore .set() / .update() calls.

No other module in this project reads or writes Firestore field names.
This module owns the entire camelCase ↔ snake_case translation layer.
"""

import logging
from datetime import datetime

from google.cloud.firestore_v1 import SERVER_TIMESTAMP
from google.cloud.firestore_v1.async_client import AsyncClient

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_db: AsyncClient | None = None


def get_db() -> AsyncClient:
    """Return the shared AsyncClient, creating it on first call."""
    global _db
    if _db is None:
        _db = AsyncClient(project=settings.google_cloud_project)
    return _db


def _ts_to_iso_date(ts) -> str:
    """Convert Firestore Timestamp or datetime to 'YYYY-MM-DD' string."""
    if ts is None:
        return ""
    if hasattr(ts, "date"):          # datetime object
        return ts.date().isoformat()
    if hasattr(ts, "to_datetime"):   # Firestore DatetimeWithNanoseconds
        return ts.to_datetime().date().isoformat()
    return str(ts)[:10]              # Fallback: take first 10 chars of string repr


def _ts_to_datetime(ts) -> datetime | None:
    """Convert Firestore Timestamp to Python datetime, or return None."""
    if ts is None:
        return None
    if isinstance(ts, datetime):
        return ts
    if hasattr(ts, "to_datetime"):
        return ts.to_datetime()
    return None


async def get_topics(
    country: str | None = None,
    category: str | None = None,
) -> list[dict]:
    """Return published topics as list of snake_case dicts matching TopicSummary."""
    db = get_db()
    query = db.collection("topics").where("published", "==", True)

    if country is not None and country != "ALL":
        query = query.where("country", "array_contains_any", [country, "ALL"])

    if category is not None:
        query = query.where("category", "==", category)

    query = query.order_by("order")
    docs = await query.get()

    result = []
    for doc in docs:
        data = doc.to_dict()
        result.append({
            "id": doc.id,
            "slug": data.get("slug", doc.id),
            "title": data.get("title", ""),
            "category": data.get("category", ""),
            "country": data.get("country", []),
            "order": data.get("order", 0),
            "updated_at": _ts_to_datetime(data.get("updatedAt")),
        })
    return result


async def get_topic_by_slug(slug: str) -> dict | None:
    """Return full TopicDetail snake_case dict, or None if not found/not published."""
    db = get_db()
    doc_ref = db.collection("topics").document(slug)
    doc = await doc_ref.get()
    if not doc.exists:
        return None
    data = doc.to_dict()
    if not data.get("published", False):
        return None
    return {
        "id": doc.id,
        "slug": data.get("slug", doc.id),
        "title": data.get("title", ""),
        "content": data.get("content", ""),
        "category": data.get("category", ""),
        "country": data.get("country", []),
        "prerequisites": data.get("prerequisites", []),
        "order": data.get("order", 0),
        "updated_at": _ts_to_datetime(data.get("updatedAt")),
    }


async def get_timeline_events(
    country: str,
    level: str | None = None,
    state_province: str | None = None,
) -> list[dict]:
    """Return timeline events sorted by date ASC as snake_case dicts."""
    db = get_db()
    query = db.collection("timeline_events").where("country", "==", country)

    if level is not None:
        query = query.where("level", "==", level)

    if state_province is not None:
        query = query.where("state_province", "==", state_province)

    query = query.order_by("date")
    docs = await query.get()

    result = []
    for doc in docs:
        data = doc.to_dict()
        result.append({
            "id": doc.id,
            "name": data.get("name", ""),
            "description": data.get("description", ""),
            "date": _ts_to_iso_date(data.get("date")),
            "type": data.get("type", ""),
            "level": data.get("level", ""),
            "state_province": data.get("state_province") or data.get("stateProv"),
            "official_url": data.get("official_url") or data.get("officialUrl", ""),
        })
    return result


async def get_quiz_questions(topic_id: str) -> list[dict]:
    """
    Return quiz questions for a topic. INCLUDES correct_index and explanation.
    The route handler strips these before sending to the client.
    """
    db = get_db()
    query = (
        db.collection("quiz_questions")
        .where("topicId", "==", topic_id)   # Firestore field is camelCase
        .limit(10)
    )
    docs = await query.get()

    result = []
    for doc in docs:
        data = doc.to_dict()
        result.append({
            "id": doc.id,
            "question": data.get("question", ""),
            "options": data.get("options", []),
            "country": data.get("country", ["ALL"]),
            "correct_index": data.get("correctIndex", 0),   # camelCase → snake_case
            "explanation": data.get("explanation", ""),
            "difficulty": data.get("difficulty", "medium"),
        })
    return result


async def get_question_by_id(question_id: str) -> dict | None:
    """Look up a single quiz question by document ID. Used during quiz submission."""
    db = get_db()
    doc_ref = db.collection("quiz_questions").document(question_id)
    doc = await doc_ref.get()
    if not doc.exists:
        return None
    data = doc.to_dict()
    return {
        "id": doc.id,
        "question": data.get("question", ""),
        "options": data.get("options", []),
        "country": data.get("country", ["ALL"]),
        "correct_index": data.get("correctIndex", 0),
        "explanation": data.get("explanation", ""),
    }


async def get_user(uid: str) -> dict | None:
    """Return user profile dict in snake_case, or None if document doesn't exist."""
    db = get_db()
    doc_ref = db.collection("users").document(uid)
    doc = await doc_ref.get()
    if not doc.exists:
        return None
    data = doc.to_dict()
    return {
        "uid": uid,
        "email": data.get("email"),
        "display_name": data.get("displayName"),    # camelCase → snake_case
        "country": data.get("country"),
        "age_group": data.get("ageGroup"),          # camelCase → snake_case
        # gdprConsentAt: Firestore Timestamp → Python datetime (None for pre-consent users)
        "gdpr_consent_at": _ts_to_datetime(data.get("gdprConsentAt")),
        "created_at": _ts_to_datetime(data.get("createdAt")),
    }


async def upsert_user(uid: str, data: dict) -> None:
    """
    Create or update user document. createdAt is only written if the doc doesn't exist.
    lastSeen is always updated to SERVER_TIMESTAMP.
    """
    db = get_db()
    doc_ref = db.collection("users").document(uid)

    # Always-safe fields
    firestore_data: dict = {"lastSeen": SERVER_TIMESTAMP}

    if data.get("email"):
        firestore_data["email"] = data["email"]
    if data.get("display_name"):
        firestore_data["displayName"] = data["display_name"]  # snake_case → camelCase
    if data.get("country"):
        firestore_data["country"] = data["country"]
    if data.get("age_group"):
        firestore_data["ageGroup"] = data["age_group"]        # snake_case → camelCase

    # Only set createdAt on first creation
    doc = await doc_ref.get()
    if not doc.exists:
        firestore_data["createdAt"] = SERVER_TIMESTAMP

    await doc_ref.set(firestore_data, merge=True)


async def update_user(uid: str, updates: dict) -> None:
    """Apply a partial update to the user document. Input is in snake_case."""
    db = get_db()
    doc_ref = db.collection("users").document(uid)

    firestore_updates: dict = {"lastSeen": SERVER_TIMESTAMP}

    if "display_name" in updates and updates["display_name"] is not None:
        firestore_updates["displayName"] = updates["display_name"]  # snake_case → camelCase
    if "country" in updates and updates["country"] is not None:
        firestore_updates["country"] = updates["country"]
    if "age_group" in updates and updates["age_group"] is not None:
        firestore_updates["ageGroup"] = updates["age_group"]        # snake_case → camelCase
    # GDPR consent timestamp — set when user enables analytics consent in Profile settings
    # Stored as Firestore Timestamp; datetime is accepted directly by the Firestore client
    if "gdpr_consent_at" in updates and updates["gdpr_consent_at"] is not None:
        firestore_updates["gdprConsentAt"] = updates["gdpr_consent_at"]

    await doc_ref.update(firestore_updates)


async def delete_user_data(uid: str) -> None:
    """
    GDPR account deletion. Deletes all progress docs in the subcollection first,
    then deletes the user document itself. Order matters — Firestore does not
    cascade subcollection deletes automatically.
    """
    db = get_db()

    # Step 1: Delete all progress subcollection documents
    progress_ref = db.collection("users").document(uid).collection("progress")
    progress_docs = await progress_ref.get()
    for doc in progress_docs:
        await doc.reference.delete()
        logger.info("Deleted progress doc %s for user %s", doc.id, uid)

    # Step 2: Delete the user document itself
    await db.collection("users").document(uid).delete()
    logger.info("Deleted user document for uid %s", uid)


async def get_user_progress(uid: str) -> list[dict]:
    """Return all progress documents for the user as a list of snake_case dicts."""
    db = get_db()
    progress_ref = db.collection("users").document(uid).collection("progress")
    docs = await progress_ref.get()

    result = []
    for doc in docs:
        data = doc.to_dict()
        result.append({
            "topic_id": data.get("topicId", doc.id),       # topicId → topic_id
            "completed": data.get("completed", False),
            "quiz_score": data.get("quizScore"),            # quizScore → quiz_score
            "completed_at": _ts_to_datetime(data.get("completedAt")),
            "attempts": data.get("attempts", 0),
        })
    return result


async def update_progress(uid: str, topic_id: str, score: int) -> None:
    """Create or update progress document for a topic. Increments attempts."""
    db = get_db()
    progress_ref = (
        db.collection("users")
        .document(uid)
        .collection("progress")
        .document(topic_id)
    )

    existing = await progress_ref.get()

    firestore_data: dict = {
        "topicId": topic_id,    # snake_case → camelCase for storage
        "completed": True,
        "quizScore": score,     # snake_case → camelCase for storage
        "attempts": 1,
    }

    if existing.exists:
        existing_data = existing.to_dict() or {}
        current_attempts = existing_data.get("attempts", 0)
        firestore_data["attempts"] = current_attempts + 1
        # Keep original completedAt — don't overwrite on retry
        await progress_ref.update(firestore_data)
    else:
        firestore_data["completedAt"] = SERVER_TIMESTAMP   # camelCase for storage
        await progress_ref.set(firestore_data)


async def save_feedback(data: dict) -> None:
    """Write a new feedback document with auto-generated ID."""
    db = get_db()
    feedback_ref = db.collection("feedback").document()  # auto-ID

    await feedback_ref.set({
        "message": data.get("message", ""),
        "category": data.get("category", "other"),
        "country": data.get("country"),
        "userId": data.get("user_id"),      # snake_case → camelCase
        "createdAt": SERVER_TIMESTAMP,
        "reviewed": False,
    })


async def get_user_stats(uid: str) -> dict:
    """Compute stats by reading the progress subcollection. Returns UserStats dict."""
    db = get_db()

    # Count total published topics
    topics_query = db.collection("topics").where("published", "==", True)
    topics_docs = await topics_query.get()
    total_topics = len(topics_docs)

    # Get user progress
    progress_docs = await (
        db.collection("users").document(uid).collection("progress").get()
    )

    completed_count = 0
    scores = []
    for doc in progress_docs:
        data = doc.to_dict()
        if data.get("completed", False):
            completed_count += 1
        score = data.get("quizScore")
        if score is not None:
            scores.append(score)

    average_score = round(sum(scores) / len(scores), 1) if scores else 0.0

    return {
        "topics_completed": completed_count,
        "total_topics": total_topics,
        "average_quiz_score": average_score,
    }

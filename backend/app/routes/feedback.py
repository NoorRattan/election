"""Routes for the /feedback endpoint."""

import logging

from fastapi import APIRouter, Request

import app.services.firestore_service as db
from app.limiter import limiter
from app.models import FeedbackRequest

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/feedback", status_code=201)
@limiter.limit("5/hour")
async def submit_feedback(
    request: Request,  # Required by slowapi for IP extraction
    feedback: FeedbackRequest,
):
    """
    Submit user feedback. No auth required. Rate limited to 5 per hour per IP.

    NOTE: This rate limit is enforced by slowapi with IN-MEMORY counters.
    On Cloud Run with multiple instances, each instance has its own counter.
    A user could potentially submit to different instances to bypass the limit.
    This is an accepted trade-off - Pydantic validation is the primary abuse defence.
    """
    await db.save_feedback(
        {
            "message": feedback.message,
            "category": feedback.category,
            "country": feedback.country,
            "user_id": None,  # Feedback is anonymous - no auth on this endpoint
        }
    )
    return {"message": "Feedback received. Thank you!"}

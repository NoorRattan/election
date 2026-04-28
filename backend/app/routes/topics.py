"""Routes for the /topics endpoint."""

import logging
import re

from fastapi import APIRouter, HTTPException, Query

import app.services.firestore_service as db
from app.models import TopicDetail, TopicsResponse, TopicSummary

logger = logging.getLogger(__name__)
router = APIRouter()

VALID_COUNTRIES = {"UK", "US", "IN", "ALL"}
VALID_CATEGORIES = {
    "registration", "eligibility", "ballot",
    "campaign", "counting", "dispute", "timeline",
}

_SLUG_PATTERN = re.compile(r'^[a-zA-Z0-9\-]+$')


@router.get("/topics", response_model=TopicsResponse)
async def list_topics(
    country: str | None = Query(default=None),
    category: str | None = Query(default=None),
):
    """
    List topics, optionally filtered by country and/or category.
    Returns published topics only, ordered by their display order.
    """
    if country is not None and country not in VALID_COUNTRIES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid country '{country}'. Must be one of: {', '.join(sorted(VALID_COUNTRIES))}",
        )
    if category is not None and category not in VALID_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid category '{category}'. Must be one of: {', '.join(sorted(VALID_CATEGORIES))}",
        )

    topics_data = await db.get_topics(country=country, category=category)
    topics = [TopicSummary(**t) for t in topics_data]
    return TopicsResponse(topics=topics, total=len(topics))


@router.get("/topics/{slug}", response_model=TopicDetail)
async def get_topic(slug: str):
    """
    Fetch a single topic by its slug. Returns the full Markdown content.
    Returns 400 if the slug contains invalid characters.
    Returns 404 if the topic is not found or is not published.
    """
    if not _SLUG_PATTERN.match(slug):
        raise HTTPException(
            status_code=400,
            detail="Invalid topic slug. Only alphanumeric characters and hyphens are allowed.",
        )

    topic_data = await db.get_topic_by_slug(slug)
    if topic_data is None:
        raise HTTPException(status_code=404, detail="Topic not found.")

    return TopicDetail(**topic_data)

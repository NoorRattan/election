"""
Pydantic models for the /topics endpoints.

TopicSummary  — returned in topic list responses (no full content)
TopicDetail   — returned when fetching a single topic by slug (includes Markdown content)
TopicsResponse — wrapper for the list endpoint
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TopicSummary(BaseModel):
    """Lightweight topic representation used in list views."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    slug: str
    title: str
    category: str
    country: list[str]
    order: int
    updated_at: datetime | None = None


class TopicDetail(BaseModel):
    """Full topic representation including Markdown content and prerequisites."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    slug: str
    title: str
    content: str          # Full Markdown string — rendered by react-markdown on frontend
    category: str
    country: list[str]
    prerequisites: list[str] = []   # List of topic slugs; empty list if none
    order: int
    updated_at: datetime | None = None


class TopicsResponse(BaseModel):
    """Envelope returned by GET /api/v1/topics."""

    topics: list[TopicSummary]
    total: int

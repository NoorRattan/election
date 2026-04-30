"""
Pydantic models for the /timeline endpoint.

TimelineEvent   - a single election event or deadline
TimelineResponse - wrapper returned by the timeline endpoint
"""

from pydantic import BaseModel, ConfigDict


class TimelineEvent(BaseModel):
    """A single election-related event or deadline."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str
    date: str  # ISO date string "YYYY-MM-DD" - NOT a datetime object.
    # firestore_service converts Firestore Timestamp -> this string.
    type: str  # "deadline" | "poll_day" | "result" | "campaign_start" | "nomination"
    level: str  # "local" | "state" | "national"
    state_province: str | None = None  # e.g. "CA" for US state, "Punjab" for Indian state
    official_url: str


class TimelineResponse(BaseModel):
    """Envelope returned by GET /api/v1/timeline."""

    country: str
    events: list[TimelineEvent]

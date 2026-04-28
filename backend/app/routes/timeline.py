"""Routes for the /timeline endpoint."""

import logging

from fastapi import APIRouter, HTTPException, Query

import app.services.firestore_service as db
from app.models import TimelineEvent, TimelineResponse

logger = logging.getLogger(__name__)
router = APIRouter()

VALID_COUNTRIES = {"UK", "US", "IN"}
VALID_LEVELS = {"local", "state", "national"}


@router.get("/timeline", response_model=TimelineResponse)
async def get_timeline(
    country: str = Query(..., description="Required. One of: UK, US, IN"),
    level: str | None = Query(default=None),
    state_province: str | None = Query(default=None),
):
    """
    Fetch election timeline events for a country.
    country is REQUIRED. level and state_province are optional filters.
    Events are returned sorted by date ASC.
    """
    if country not in VALID_COUNTRIES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid country '{country}'. Must be one of: {', '.join(sorted(VALID_COUNTRIES))}",
        )

    if level is not None and level not in VALID_LEVELS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid level '{level}'. Must be one of: {', '.join(sorted(VALID_LEVELS))}",
        )

    events_data = await db.get_timeline_events(
        country=country,
        level=level,
        state_province=state_province,
    )

    events = [TimelineEvent(**e) for e in events_data]
    return TimelineResponse(country=country, events=events)

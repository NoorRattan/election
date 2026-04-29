"""
Pydantic model for the POST /feedback endpoint.
"""

from pydantic import BaseModel, field_validator

VALID_CATEGORIES = {"bug", "content", "suggestion", "other"}


class FeedbackRequest(BaseModel):
    """Request body for POST /api/v1/feedback."""

    message: str
    category: str
    country: str | None = None  # Country context; null if user hasn't selected one

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 1:
            raise ValueError("message must not be empty")
        if len(v) > 2000:
            raise ValueError("message must not exceed 2000 characters")
        return v

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        if v not in VALID_CATEGORIES:
            raise ValueError(f"category must be one of: {', '.join(sorted(VALID_CATEGORIES))}")
        return v

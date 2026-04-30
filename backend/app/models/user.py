"""
Pydantic models for the /user/profile endpoint.

UserProfile       - full profile returned by GET /user/profile
UserProfileUpdate - partial update sent to PUT /user/profile
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

VALID_COUNTRIES = {"UK", "US", "IN"}
VALID_AGE_GROUPS = {"13-17", "18-25", "26-40", "40+"}


class UserStats(BaseModel):
    """Embedded stats object inside UserProfile."""

    topics_completed: int
    total_topics: int
    average_quiz_score: float


class UserProfile(BaseModel):
    """Full user profile returned by GET /api/v1/user/profile."""

    model_config = ConfigDict(from_attributes=True)

    uid: str
    email: str | None = None
    display_name: str | None = None
    country: str | None = None  # null until user selects a country
    age_group: str | None = None  # null until user fills profile
    gdpr_consent_at: datetime | None = None  # null for pre-consent users
    created_at: datetime | None = None
    stats: UserStats


class UserProfileUpdate(BaseModel):
    """
    Partial update body for PUT /api/v1/user/profile.
    All fields are optional - at least one must be provided (enforced in the route,
    not in this model, because Pydantic cannot easily enforce "at least one non-None").
    """

    display_name: str | None = None
    country: str | None = None
    age_group: str | None = None
    gdpr_consent_at: datetime | None = None  # Set when user enables analytics consent

    @field_validator("country")
    @classmethod
    def validate_country(cls, v: str | None) -> str | None:
        """Validate optional country preference."""
        if v is not None and v not in VALID_COUNTRIES:
            raise ValueError(f"country must be one of: {', '.join(sorted(VALID_COUNTRIES))}")
        return v

    @field_validator("age_group")
    @classmethod
    def validate_age_group(cls, v: str | None) -> str | None:
        """Validate optional age group preference."""
        if v is not None and v not in VALID_AGE_GROUPS:
            raise ValueError(f"age_group must be one of: {', '.join(sorted(VALID_AGE_GROUPS))}")
        return v

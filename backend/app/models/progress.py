"""
Pydantic models for the /user/progress endpoint.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TopicProgress(BaseModel):
    """Progress record for a single topic."""

    model_config = ConfigDict(from_attributes=True)

    topic_id: str
    completed: bool
    quiz_score: int | None = None      # 0-100 percentage; null if quiz never taken
    completed_at: datetime | None = None
    attempts: int = 0


class UserProgressResponse(BaseModel):
    """Envelope returned by GET /api/v1/user/progress."""

    progress: list[TopicProgress]

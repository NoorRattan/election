"""
Pydantic models for the /quiz endpoints.

SECURITY NOTE: QuizQuestion intentionally omits correctIndex and explanation.
These fields are only revealed post-submission via QuestionResult.
"""

from pydantic import BaseModel, ConfigDict, field_validator


class QuizQuestion(BaseModel):
    """
    A single quiz question returned to the user before they answer.
    Does NOT contain correct_index or explanation — those are revealed after submission.
    """

    model_config = ConfigDict(from_attributes=True)

    id: str
    question: str
    options: list[str]  # Always exactly 4 strings
    country: list[str]  # e.g. ["UK"] or ["ALL"] or ["UK", "US"]


class QuizQuestionsResponse(BaseModel):
    """Envelope returned by GET /api/v1/quiz/{topic_id}."""

    topic_id: str
    questions: list[QuizQuestion]
    total: int


class AnswerSubmission(BaseModel):
    """A single answer submitted by the user."""

    question_id: str
    selected_index: int

    @field_validator("selected_index")
    @classmethod
    def validate_index(cls, v: int) -> int:
        if v not in (0, 1, 2, 3):
            raise ValueError("selected_index must be 0, 1, 2, or 3")
        return v


class QuizSubmitRequest(BaseModel):
    """Request body for POST /api/v1/quiz/submit."""

    topic_id: str
    answers: list[AnswerSubmission]

    @field_validator("answers")
    @classmethod
    def answers_not_empty(cls, v: list) -> list:
        if not v:
            raise ValueError("answers list must not be empty")
        return v


class QuestionResult(BaseModel):
    """
    Per-question result returned after submission.
    This is the only place correct_index and explanation appear in API responses.
    """

    question_id: str
    correct: bool
    correct_index: int  # Now safe to reveal — user has already submitted
    explanation: str  # Explanation of why the correct answer is right


class QuizSubmitResponse(BaseModel):
    """Response body for POST /api/v1/quiz/submit."""

    topic_id: str
    score: int  # Percentage 0-100, rounded integer
    total: int  # Total number of answers evaluated
    correct: int  # Number of correct answers
    results: list[QuestionResult]
    progress_updated: bool  # False if Firestore write failed (non-fatal)

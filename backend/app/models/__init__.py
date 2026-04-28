"""
Central re-export of all Pydantic models.
Import any model from app.models directly.
"""

from app.models.chat import ChatRequest, ChatResponse
from app.models.feedback import FeedbackRequest
from app.models.progress import TopicProgress, UserProgressResponse
from app.models.quiz import (
    AnswerSubmission,
    QuestionResult,
    QuizQuestion,
    QuizQuestionsResponse,
    QuizSubmitRequest,
    QuizSubmitResponse,
)
from app.models.timeline import TimelineEvent, TimelineResponse
from app.models.topic import TopicDetail, TopicsResponse, TopicSummary
from app.models.user import UserProfile, UserProfileUpdate, UserStats

__all__ = [
    # topic
    "TopicSummary",
    "TopicDetail",
    "TopicsResponse",
    # timeline
    "TimelineEvent",
    "TimelineResponse",
    # quiz
    "QuizQuestion",
    "QuizQuestionsResponse",
    "AnswerSubmission",
    "QuizSubmitRequest",
    "QuizSubmitResponse",
    "QuestionResult",
    # user
    "UserProfile",
    "UserProfileUpdate",
    "UserStats",
    # progress
    "TopicProgress",
    "UserProgressResponse",
    # feedback
    "FeedbackRequest",
    # chat
    "ChatRequest",
    "ChatResponse",
]

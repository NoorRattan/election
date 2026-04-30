"""Routes for the /quiz endpoints."""

import logging
import random
import re

from fastapi import APIRouter, HTTPException

import app.services.firestore_service as db
from app.middleware.auth import AuthToken
from app.models import (
    QuestionResult,
    QuizQuestion,
    QuizQuestionsResponse,
    QuizSubmitRequest,
    QuizSubmitResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter()

_SLUG_PATTERN = re.compile(r"^[a-zA-Z0-9_\-]+$")


@router.get("/quiz/{topic_id}", response_model=QuizQuestionsResponse)
async def get_quiz_questions(topic_id: str, token: AuthToken):
    """
    Fetch quiz questions for a topic. Auth required.
    Questions are shuffled server-side. correct_index and explanation are NEVER
    included in this response - they are revealed only after submission.
    """
    if not _SLUG_PATTERN.match(topic_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid topic ID. Only alphanumeric characters, hyphens, and underscores are allowed.",
        )

    questions_data = await db.get_quiz_questions(topic_id)

    if not questions_data:
        raise HTTPException(
            status_code=404,
            detail=f"No quiz questions found for topic '{topic_id}'.",
        )

    # Shuffle to prevent answer pattern memorisation
    random.shuffle(questions_data)

    # SECURITY: Strip correct_index and explanation before sending to client.
    # These fields are present in the data returned by firestore_service but must
    # NEVER appear in the GET response. Build QuizQuestion explicitly.
    questions = [
        QuizQuestion(
            id=q["id"],
            question=q["question"],
            options=q["options"],
            country=q["country"],
            # correct_index and explanation intentionally omitted
        )
        for q in questions_data
    ]

    return QuizQuestionsResponse(
        topic_id=topic_id,
        questions=questions,
        total=len(questions),
    )


@router.post("/quiz/submit", response_model=QuizSubmitResponse)
async def submit_quiz(request: QuizSubmitRequest, token: AuthToken):
    """
    Submit quiz answers and receive scored results with explanations.
    Auth required. progress_updated=False if the Firestore write fails (non-fatal).
    Unknown question IDs are silently skipped.
    """
    uid = token["uid"]
    results: list[QuestionResult] = []
    correct_count = 0

    for answer in request.answers:
        question_data = await db.get_question_by_id(answer.question_id)
        if question_data is None:
            # Skip unknown question IDs rather than raising - robust to stale data
            logger.warning(
                "Quiz submit: unknown question_id '%s' submitted by uid '%s'",
                answer.question_id,
                uid,
            )
            continue

        is_correct = answer.selected_index == question_data["correct_index"]
        if is_correct:
            correct_count += 1

        results.append(
            QuestionResult(
                question_id=answer.question_id,
                correct=is_correct,
                correct_index=question_data["correct_index"],
                explanation=question_data["explanation"],
            )
        )

    total = len(results)
    score = round((correct_count / total) * 100) if total > 0 else 0

    # Update progress - non-fatal if Firestore write fails
    progress_updated = False
    try:
        await db.update_progress(uid=uid, topic_id=request.topic_id, score=score)
        progress_updated = True
    except Exception as exc:
        logger.error(
            "Failed to update progress for uid '%s', topic '%s': %s",
            uid,
            request.topic_id,
            exc,
            exc_info=True,
        )

    return QuizSubmitResponse(
        topic_id=request.topic_id,
        score=score,
        total=total,
        correct=correct_count,
        results=results,
        progress_updated=progress_updated,
    )

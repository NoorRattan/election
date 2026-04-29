"""Routes for the /chat endpoint (Dialogflow CX proxy)."""

import logging

from fastapi import APIRouter, HTTPException, Request

from app.limiter import limiter
from app.models import ChatRequest, ChatResponse
from app.services.assistant_service import answer_locally, fallback_answer, is_dialogflow_fallback
from app.services.dialogflow_service import query_dialogflow

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
@limiter.limit("30/minute")
async def chat(
    request: Request,  # Required by slowapi
    body: ChatRequest,
):
    """
    Send a message to the Dialogflow CX agent and return its reply.
    No auth required. Rate limited to 30 per minute per IP.
    Returns HTTP 503 if Dialogflow is unavailable (SDK raises an exception).
    Returns HTTP 200 with static message if DIALOGFLOW_AGENT_ID is not configured.
    """
    local_result = answer_locally(body.message, body.country)
    if local_result:
        return ChatResponse(
            reply=local_result["reply"],
            intent=local_result.get("intent"),
            session_id=body.session_id,
            suggested_topics=local_result.get("suggested_topics", []),
        )

    try:
        result = await query_dialogflow(
            message=body.message,
            session_id=body.session_id,
            country=body.country,
            language_code=body.language_code,
        )
    except Exception as exc:
        logger.error("Dialogflow error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=503,
            detail="Chat service temporarily unavailable. Please try again later.",
        ) from exc

    if is_dialogflow_fallback(result.get("reply")):
        result = fallback_answer(body.message, body.country)

    return ChatResponse(
        reply=result["reply"],
        intent=result.get("intent"),
        session_id=body.session_id,
        suggested_topics=result.get("suggested_topics", []),
    )

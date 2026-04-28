"""
Dialogflow CX proxy service for the Electra chat feature.

CRITICAL IMPORT PATH: Use the STABLE SDK, NOT the beta module.
  CORRECT:   from google.cloud.dialogflow_cx_v3.services.sessions import SessionsClient
  INCORRECT: from google.cloud.dialogflow_cx_v3beta1 ... (this is the old beta — DO NOT USE)

Package: google-cloud-dialogflow-cx==1.15.0 (see requirements.txt)

Graceful degradation: if DIALOGFLOW_AGENT_ID is not configured, the function returns
a helpful static message with HTTP 200. Only actual SDK/network errors raise HTTP 503.
"""

import logging

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_STATIC_FALLBACK_REPLY = (
    "Hello! I'm Electra, your election education assistant. "
    "I can help you learn about voter registration, eligibility rules, "
    "voting methods, and election timelines for the UK, USA, and India. "
    "Please explore the Topics section to get started, or ask me a specific question!"
)


async def query_dialogflow(
    message: str,
    session_id: str,
    country: str | None = None,
    language_code: str = "en",
) -> dict:
    """
    Send a message to Dialogflow CX and return the assistant's reply.

    Returns a dict with keys:
        reply (str): The text response to show the user.
        intent (str | None): The matched intent display name, or None.
        suggested_topics (list[str]): Topic slugs suggested by the agent payload.

    Raises:
        fastapi.HTTPException(503): Only on actual Dialogflow SDK/network errors.
        Returns static message with 200 if agent is not configured.
    """
    # Graceful degradation: if agent not configured, return static helpful message
    if not settings.dialogflow_agent_id:
        logger.info("Dialogflow agent not configured — returning static fallback message.")
        return {
            "reply": _STATIC_FALLBACK_REPLY,
            "intent": None,
            "suggested_topics": [],
        }

    try:
        # Import inside function to avoid top-level ImportError crashing startup
        from google.cloud.dialogflow_cx_v3.services.sessions import SessionsClient
        from google.cloud.dialogflow_cx_v3.types import session as session_types

        location = settings.dialogflow_location
        project = settings.google_cloud_project
        agent_id = settings.dialogflow_agent_id

        # API endpoint: regional for non-global, global endpoint for "global" location
        if location == "global":
            api_endpoint = "dialogflow.googleapis.com"
        else:
            api_endpoint = f"{location}-dialogflow.googleapis.com"

        client = SessionsClient(
            client_options={"api_endpoint": api_endpoint}
        )

        # Build session path
        session_path = client.session_path(project, location, agent_id, session_id)

        # Build query input
        text_input = session_types.TextInput(text=message)
        query_input = session_types.QueryInput(
            text=text_input,
            language_code=language_code,
        )

        # Add country as query parameter if provided
        query_params = None
        if country:
            query_params = session_types.QueryParameters(
                parameters={"country": country}
            )

        request = session_types.DetectIntentRequest(
            session=session_path,
            query_input=query_input,
            query_params=query_params,
        )

        response = client.detect_intent(request=request)
        query_result = response.query_result

        # Extract reply text from response messages
        reply_parts = []
        for message_obj in query_result.response_messages:
            if hasattr(message_obj, "text") and message_obj.text.text:
                reply_parts.extend(message_obj.text.text)
        reply = " ".join(reply_parts) if reply_parts else _STATIC_FALLBACK_REPLY

        # Extract intent display name
        intent_name = None
        if query_result.intent and query_result.intent.display_name:
            intent_name = query_result.intent.display_name

        # Extract suggestedTopics from custom payload if configured in Dialogflow
        suggested_topics: list[str] = []
        for msg in query_result.response_messages:
            if hasattr(msg, "payload") and msg.payload:
                payload_dict = dict(msg.payload)
                topics = payload_dict.get("suggestedTopics", [])
                if isinstance(topics, list):
                    suggested_topics = [str(t) for t in topics]
                break

        return {
            "reply": reply,
            "intent": intent_name,
            "suggested_topics": suggested_topics,
        }

    except Exception as exc:
        logger.error(
            "Dialogflow CX query failed for session %s: %s",
            session_id,
            exc,
            exc_info=True,
        )
        # Import here to avoid circular dependency at module level
        from fastapi import HTTPException
        raise HTTPException(
            status_code=503,
            detail="Chat service temporarily unavailable. Please try again.",
        ) from exc

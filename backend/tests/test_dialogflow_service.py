"""Tests for dialogflow_service.py"""

from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from app.config import get_settings
from app.services.dialogflow_service import _STATIC_FALLBACK_REPLY, query_dialogflow


@pytest.fixture
def mock_settings(mocker):
    settings = get_settings()
    mocker.patch.object(settings, "dialogflow_agent_id", "test-agent-id")
    mocker.patch.object(settings, "dialogflow_location", "global")
    mocker.patch.object(settings, "google_cloud_project", "test-project")
    return settings


@pytest.mark.asyncio
async def test_query_dialogflow_no_agent_id(mocker):
    settings = get_settings()
    mocker.patch.object(settings, "dialogflow_agent_id", "")

    result = await query_dialogflow("hello", "session123")
    assert result["reply"] == _STATIC_FALLBACK_REPLY
    assert result["intent"] is None
    assert result["suggested_topics"] == []


@pytest.mark.asyncio
async def test_query_dialogflow_success(mock_settings, mocker):
    # Mock SessionsClient and its types
    mock_sessions_client = MagicMock()
    mock_session_path = (
        "projects/test-project/locations/global/agents/test-agent-id/sessions/session123"
    )
    mock_sessions_client.session_path.return_value = mock_session_path

    mock_detect_intent_response = MagicMock()
    mock_query_result = mock_detect_intent_response.query_result

    # Mock text response
    mock_message = MagicMock()
    mock_message.text.text = ["Hello there!"]
    del mock_message.payload

    # Mock custom payload
    mock_payload_msg = MagicMock()
    mock_payload_msg.payload = {"suggestedTopics": ["voter-registration"]}
    del mock_payload_msg.text

    mock_query_result.response_messages = [mock_message, mock_payload_msg]
    mock_query_result.intent.display_name = "greeting_intent"

    mock_sessions_client.detect_intent.return_value = mock_detect_intent_response

    mocker.patch(
        "google.cloud.dialogflowcx_v3.services.sessions.SessionsClient",
        return_value=mock_sessions_client,
    )

    result = await query_dialogflow("hello", "session123", country="US")

    assert result["reply"] == "Hello there!"
    assert result["intent"] == "greeting_intent"
    assert result["suggested_topics"] == ["voter-registration"]

    # Check detect_intent call
    assert mock_sessions_client.detect_intent.called


@pytest.mark.asyncio
async def test_query_dialogflow_regional_location(mock_settings, mocker):
    mocker.patch.object(mock_settings, "dialogflow_location", "eu")
    mock_sessions_client_class = mocker.patch(
        "google.cloud.dialogflowcx_v3.services.sessions.SessionsClient"
    )
    mock_client = MagicMock()
    mock_sessions_client_class.return_value = mock_client

    mock_response = MagicMock()
    mock_client.detect_intent.return_value = mock_response

    await query_dialogflow("hello", "session123")

    mock_sessions_client_class.assert_called_with(
        client_options={"api_endpoint": "eu-dialogflow.googleapis.com"}
    )


@pytest.mark.asyncio
async def test_query_dialogflow_exception(mock_settings, mocker):
    mock_sessions_client_class = mocker.patch(
        "google.cloud.dialogflowcx_v3.services.sessions.SessionsClient"
    )
    mock_sessions_client_class.side_effect = Exception("Network error")

    with pytest.raises(HTTPException) as excinfo:
        await query_dialogflow("hello", "session123")

    assert excinfo.value.status_code == 503
    assert "unavailable" in excinfo.value.detail.lower()

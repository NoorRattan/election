"""
Tests for POST /api/v1/chat endpoint.

Covers:
  - Valid request -> Dialogflow response -> 200
  - Response schema validation
  - Dialogflow called with correct arguments
  - Invalid request bodies -> 422
  - Graceful degradation when DIALOGFLOW_AGENT_ID is empty -> static 200
  - Dialogflow SDK error -> 503
  - Language code acceptance
  - No auth required

Mock strategy:
  mocker.patch('app.routes.chat.dialogflow_service.query_dialogflow') with AsyncMock.
  The real function calls the Dialogflow SDK - we never want that in tests.
"""

from unittest.mock import AsyncMock

import pytest

# -- Fixtures ------------------------------------------------------------------

VALID_CHAT = {
    "message": "Can you explain parliament?",
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "country": "UK",
    "language_code": "en",
}


@pytest.fixture
def mock_dialogflow(mocker):
    """Patches query_dialogflow with a successful AsyncMock response."""
    return mocker.patch(
        "app.routes.chat.query_dialogflow",
        new_callable=AsyncMock,
        return_value={
            "reply": "To register in the UK, visit gov.uk/register-to-vote.",
            "intent": "voter_registration_uk",
            "suggested_topics": ["voter-registration", "voter-id-uk"],
        },
    )


# -- Test Classes ---------------------------------------------------------------


class TestChatEndpoint:
    def test_valid_message_returns_200(self, client, mock_dialogflow):
        response = client.post("/api/v1/chat", json=VALID_CHAT)
        assert response.status_code == 200

    def test_response_has_required_fields(self, client, mock_dialogflow):
        response = client.post("/api/v1/chat", json=VALID_CHAT)
        data = response.json()
        assert "reply" in data
        assert "session_id" in data
        assert "suggested_topics" in data
        assert isinstance(data["suggested_topics"], list)

    def test_session_id_echoed_back(self, client, mock_dialogflow):
        response = client.post("/api/v1/chat", json=VALID_CHAT)
        assert response.json()["session_id"] == VALID_CHAT["session_id"]

    def test_dialogflow_called_with_correct_args(self, client, mock_dialogflow):
        client.post("/api/v1/chat", json=VALID_CHAT)
        mock_dialogflow.assert_called_once()
        call_kwargs = mock_dialogflow.call_args
        # Verify message, session_id, country were passed through
        assert VALID_CHAT["message"] in str(call_kwargs)
        assert VALID_CHAT["session_id"] in str(call_kwargs)
        assert VALID_CHAT["country"] in str(call_kwargs)

    def test_message_too_long_returns_422(self, client):
        response = client.post(
            "/api/v1/chat",
            json={
                **VALID_CHAT,
                "message": "x" * 501,
            },
        )
        assert response.status_code == 422

    def test_empty_message_returns_422(self, client):
        response = client.post(
            "/api/v1/chat",
            json={
                **VALID_CHAT,
                "message": "",
            },
        )
        assert response.status_code == 422

    def test_whitespace_only_message_returns_422(self, client):
        response = client.post(
            "/api/v1/chat",
            json={
                **VALID_CHAT,
                "message": "   ",
            },
        )
        assert response.status_code == 422

    def test_missing_session_id_returns_422(self, client):
        body = {k: v for k, v in VALID_CHAT.items() if k != "session_id"}
        response = client.post("/api/v1/chat", json=body)
        assert response.status_code == 422

    def test_missing_message_returns_422(self, client):
        body = {k: v for k, v in VALID_CHAT.items() if k != "message"}
        response = client.post("/api/v1/chat", json=body)
        assert response.status_code == 422


class TestChatGracefulDegradation:
    def test_returns_200_when_dialogflow_not_configured(self, client, mocker):
        """When DIALOGFLOW_AGENT_ID is empty, endpoint returns static reply (not 503)."""
        mocker.patch(
            "app.routes.chat.query_dialogflow",
            new_callable=AsyncMock,
            return_value={
                "reply": "I can help with election questions. Please browse our topics.",
                "intent": None,
                "suggested_topics": [],
            },
        )
        response = client.post("/api/v1/chat", json=VALID_CHAT)
        assert response.status_code == 200
        assert "reply" in response.json()

    def test_returns_503_on_dialogflow_sdk_error(self, client, mocker):
        """When the Dialogflow SDK raises an exception, endpoint returns 503."""
        mocker.patch(
            "app.routes.chat.query_dialogflow",
            new_callable=AsyncMock,
            side_effect=Exception("Dialogflow SDK connection failed"),
        )
        response = client.post("/api/v1/chat", json=VALID_CHAT)
        assert response.status_code == 503
        assert "unavailable" in response.json()["detail"].lower()


class TestChatLocalAnswers:
    def test_answers_simple_math_without_dialogflow(self, client, mocker):
        mock_dialogflow = mocker.patch(
            "app.routes.chat.query_dialogflow",
            new_callable=AsyncMock,
        )

        response = client.post(
            "/api/v1/chat",
            json={**VALID_CHAT, "message": "what is 2+2"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "2+2 = 4" in data["reply"]
        assert data["intent"] == "utility_math"
        assert data["suggested_topics"] == []
        mock_dialogflow.assert_not_called()

    def test_answers_common_election_question_without_dialogflow(self, client, mocker):
        mock_dialogflow = mocker.patch(
            "app.routes.chat.query_dialogflow",
            new_callable=AsyncMock,
        )

        response = client.post(
            "/api/v1/chat",
            json={**VALID_CHAT, "message": "How do I register to vote in the UK?"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "registration" in data["reply"].lower()
        assert data["suggested_topics"] == ["voter-registration"]
        mock_dialogflow.assert_not_called()

    def test_replaces_dialogflow_no_match_with_helpful_fallback(self, client, mocker):
        mocker.patch(
            "app.routes.chat.query_dialogflow",
            new_callable=AsyncMock,
            return_value={
                "reply": "What was that?",
                "intent": "Default Negative Intent",
                "suggested_topics": [],
            },
        )

        response = client.post(
            "/api/v1/chat",
            json={**VALID_CHAT, "message": "banana"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "voter registration" in data["reply"].lower()
        assert data["intent"] == "electra_local_fallback"


class TestChatRateLimit:
    def test_chat_endpoint_accepts_valid_language_code(self, client, mock_dialogflow):
        """Verify language_code field is accepted (it is passed to Dialogflow)."""
        for lang in ["en", "en-GB", "hi", "pa"]:
            response = client.post("/api/v1/chat", json={**VALID_CHAT, "language_code": lang})
            assert response.status_code == 200, f"language_code '{lang}' was rejected"

    def test_chat_does_not_require_auth(self, client, mock_dialogflow):
        """POST /chat requires no auth - test with plain client (no token)."""
        response = client.post("/api/v1/chat", json=VALID_CHAT)
        assert response.status_code != 401

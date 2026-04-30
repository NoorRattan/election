"""
Test configuration and fixtures for the Electra backend test suite.

CRITICAL ORDER: sys.modules must be patched BEFORE any import of main.py or any
app module that transitively imports firebase_admin or google.cloud.firestore.
If the order is wrong, the real Firebase SDK initialises, fails to find credentials,
and all tests crash with a credentials error.
"""

# ------------------------------------------------------------------------------
# STEP 1: Set environment variables BEFORE any app import
# ------------------------------------------------------------------------------
import os
import sys
from unittest.mock import AsyncMock, MagicMock

import pytest

os.environ.setdefault("GOOGLE_CLOUD_PROJECT", "test-project")
os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("FIREBASE_SERVICE_ACCOUNT_KEY", "nonexistent.json")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:5173")
os.environ.setdefault("SECRET_KEY", "test-secret-key-at-least-32-chars-long-xxx")
os.environ.setdefault("DIALOGFLOW_AGENT_ID", "")

# ------------------------------------------------------------------------------
# STEP 2: Mock firebase_admin in sys.modules BEFORE importing any app code
# ------------------------------------------------------------------------------
_mock_firebase_admin = MagicMock()
_mock_firebase_admin._apps = {}  # Empty dict = "not yet initialised"
_mock_firebase_admin.credentials = MagicMock()
_mock_firebase_admin.auth = MagicMock()


# By default, verify_id_token raises InvalidIdTokenError for any token.
# Tests that need a valid decoded token use authed_client (which bypasses verify_id_token
# entirely via dependency override)  -  they are unaffected by this default.
class MockExpiredIdTokenError(Exception):
    pass


class MockInvalidIdTokenError(Exception):
    pass


class MockUserDisabledError(Exception):
    pass


class MockFirebaseAuthError(Exception):
    pass


_mock_firebase_admin.auth.ExpiredIdTokenError = MockExpiredIdTokenError
_mock_firebase_admin.auth.InvalidIdTokenError = MockInvalidIdTokenError
_mock_firebase_admin.auth.UserDisabledError = MockUserDisabledError
_mock_firebase_admin.auth.FirebaseAuthError = MockFirebaseAuthError
_mock_firebase_admin.auth.verify_id_token = MagicMock(
    side_effect=_mock_firebase_admin.auth.InvalidIdTokenError("mock: invalid token")
)
sys.modules["firebase_admin"] = _mock_firebase_admin
sys.modules["firebase_admin.credentials"] = _mock_firebase_admin.credentials
sys.modules["firebase_admin.auth"] = _mock_firebase_admin.auth

# ------------------------------------------------------------------------------
# STEP 3: Mock google.cloud.firestore in sys.modules
# ------------------------------------------------------------------------------
_mock_firestore = MagicMock()
sys.modules["google"] = MagicMock()
sys.modules["google.cloud"] = MagicMock()
sys.modules["google.cloud.firestore"] = _mock_firestore
sys.modules["google.cloud.firestore_v1"] = MagicMock()
sys.modules["google.cloud.firestore_v1.async_client"] = MagicMock()

# Mock dialogflow
sys.modules["google.cloud.dialogflowcx_v3"] = MagicMock()
sys.modules["google.cloud.dialogflowcx_v3.services"] = MagicMock()
sys.modules["google.cloud.dialogflowcx_v3.services.sessions"] = MagicMock()
sys.modules["google.cloud.dialogflowcx_v3.types"] = MagicMock()
sys.modules["google.cloud.dialogflowcx_v3.types.session"] = MagicMock()

# ------------------------------------------------------------------------------
# STEP 4: NOW it is safe to import the app
# ------------------------------------------------------------------------------
from fastapi.testclient import TestClient  # noqa: E402
from main import app  # noqa: E402  (main.py is at backend/ root)

from app.middleware.auth import require_auth  # noqa: E402

# ------------------------------------------------------------------------------
# FIXTURES
# ------------------------------------------------------------------------------


@pytest.fixture(scope="module")
def client():
    """TestClient for the FastAPI app. Module-scoped for speed."""
    with TestClient(app) as c:
        yield c


@pytest.fixture
def auth_token():
    """A fake decoded Firebase token dict for use in tests."""
    return {
        "uid": "test-uid-123",
        "email": "test@example.com",
        "name": "Test User",
    }


@pytest.fixture
def mock_db(mocker):
    """
    Patches firestore_service functions with AsyncMocks.
    Returns the mock module so individual tests can set return values.
    """
    mocker.patch("app.routes.topics.db.get_topics", new_callable=AsyncMock)
    mocker.patch("app.routes.topics.db.get_topic_by_slug", new_callable=AsyncMock)
    mocker.patch("app.routes.timeline.db.get_timeline_events", new_callable=AsyncMock)
    mocker.patch("app.routes.quiz.db.get_quiz_questions", new_callable=AsyncMock)
    mocker.patch("app.routes.quiz.db.get_question_by_id", new_callable=AsyncMock)
    mocker.patch("app.routes.quiz.db.update_progress", new_callable=AsyncMock)
    mocker.patch("app.routes.user.db.get_user", new_callable=AsyncMock)
    mocker.patch("app.routes.user.db.upsert_user", new_callable=AsyncMock)
    mocker.patch("app.routes.user.db.update_user", new_callable=AsyncMock)
    mocker.patch("app.routes.user.db.get_user_stats", new_callable=AsyncMock)
    mocker.patch("app.routes.user.db.get_user_progress", new_callable=AsyncMock)
    mocker.patch("app.routes.user.db.delete_user_data", new_callable=AsyncMock)
    mocker.patch("app.routes.feedback.db.save_feedback", new_callable=AsyncMock)


@pytest.fixture
def authed_client(client, auth_token):
    """
    TestClient with the require_auth dependency overridden to return a fake token.
    Use this for testing any endpoint that requires authentication.
    """

    async def _fake_auth():
        return auth_token

    app.dependency_overrides[require_auth] = _fake_auth
    yield client
    app.dependency_overrides.clear()

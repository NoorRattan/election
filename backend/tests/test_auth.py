"""
Tests for authentication, user profile, feedback, and health endpoints.
"""

from unittest.mock import AsyncMock

SAMPLE_USER = {
    "uid": "test-uid-123",
    "email": "test@example.com",
    "display_name": "Test User",
    "country": "UK",
    "age_group": "18-25",
    "created_at": None,
}

SAMPLE_STATS = {
    "topics_completed": 3,
    "total_topics": 10,
    "average_quiz_score": 75.0,
}


class TestHealth:
    def test_health_returns_200(self, client):
        resp = client.get("/api/v1/health")
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "ok"
        assert "version" in body
        assert "environment" in body


class TestAuthMiddleware:
    def test_protected_route_without_token_returns_401(self, client):
        resp = client.get("/api/v1/user/profile")
        assert resp.status_code == 401

    def test_protected_route_with_garbage_token_returns_401(self, client):
        resp = client.get(
            "/api/v1/user/profile",
            headers={"Authorization": "Bearer totally-invalid-token-string"},
        )
        assert resp.status_code == 401

    def test_authed_client_returns_200_on_protected_route(self, authed_client, mocker):
        mocker.patch(
            "app.routes.user.db.get_user",
            new_callable=AsyncMock,
            return_value=SAMPLE_USER,
        )
        mocker.patch(
            "app.routes.user.db.get_user_stats",
            new_callable=AsyncMock,
            return_value=SAMPLE_STATS,
        )
        resp = authed_client.get("/api/v1/user/profile")
        assert resp.status_code == 200


class TestUserProfile:
    def test_get_profile_returns_correct_shape(self, authed_client, mocker):
        mocker.patch(
            "app.routes.user.db.get_user",
            new_callable=AsyncMock,
            return_value=SAMPLE_USER,
        )
        mocker.patch(
            "app.routes.user.db.get_user_stats",
            new_callable=AsyncMock,
            return_value=SAMPLE_STATS,
        )
        resp = authed_client.get("/api/v1/user/profile")
        assert resp.status_code == 200
        body = resp.json()
        assert body["uid"] == "test-uid-123"
        assert "stats" in body
        assert body["stats"]["topics_completed"] == 3

    def test_put_valid_country_returns_200(self, authed_client, mocker):
        mock_update = mocker.patch("app.routes.user.db.update_user", new_callable=AsyncMock)
        resp = authed_client.put(
            "/api/v1/user/profile",
            json={"country": "IN"},
        )
        assert resp.status_code == 200
        mock_update.assert_called_once_with("test-uid-123", {"country": "IN"})

    def test_put_null_optional_fields_clears_profile_values(self, authed_client, mocker):
        mock_update = mocker.patch("app.routes.user.db.update_user", new_callable=AsyncMock)
        resp = authed_client.put(
            "/api/v1/user/profile",
            json={"display_name": None, "country": None, "age_group": None},
        )
        assert resp.status_code == 200
        mock_update.assert_called_once_with(
            "test-uid-123",
            {"display_name": None, "country": None, "age_group": None},
        )

    def test_put_invalid_country_returns_422(self, authed_client):
        resp = authed_client.put(
            "/api/v1/user/profile",
            json={"country": "INVALID"},
        )
        assert resp.status_code == 422

    def test_put_empty_body_returns_400(self, authed_client, mocker):
        mocker.patch("app.routes.user.db.update_user", new_callable=AsyncMock)
        resp = authed_client.put(
            "/api/v1/user/profile",
            json={},
        )
        assert resp.status_code == 400

    def test_delete_account_returns_200_with_deleted_message(self, authed_client, mocker):
        mock_delete = mocker.patch(
            "app.routes.user.db.delete_user_data",
            new_callable=AsyncMock,
        )
        resp = authed_client.delete("/api/v1/user/account")
        assert resp.status_code == 200
        assert "deleted" in resp.json()["message"].lower()
        mock_delete.assert_called_once_with("test-uid-123")


class TestFeedback:
    def test_valid_feedback_returns_201(self, client, mocker):
        mocker.patch("app.routes.feedback.db.save_feedback", new_callable=AsyncMock)
        resp = client.post(
            "/api/v1/feedback",
            json={"message": "Very helpful app!", "category": "content", "country": "UK"},
        )
        assert resp.status_code == 201

    def test_empty_message_returns_422(self, client):
        resp = client.post(
            "/api/v1/feedback",
            json={"message": "", "category": "content"},
        )
        assert resp.status_code == 422

    def test_message_over_2000_chars_returns_422(self, client):
        resp = client.post(
            "/api/v1/feedback",
            json={"message": "x" * 2001, "category": "content"},
        )
        assert resp.status_code == 422

    def test_invalid_category_returns_422(self, client):
        resp = client.post(
            "/api/v1/feedback",
            json={"message": "Good app", "category": "invalid_category"},
        )
        assert resp.status_code == 422

    def test_whitespace_only_message_returns_422(self, client):
        resp = client.post(
            "/api/v1/feedback",
            json={"message": "   ", "category": "suggestion"},
        )
        assert resp.status_code == 422


class TestGdprConsent:
    """Tests that gdpr_consent_at field is accepted and processed correctly."""

    def test_profile_update_accepts_gdpr_consent_at(self, authed_client, mocker):
        """PUT /user/profile with gdpr_consent_at returns 200 (not 422 validation error)."""
        mocker.patch("app.routes.user.db.update_user", new_callable=AsyncMock, return_value=None)
        response = authed_client.put(
            "/api/v1/user/profile",
            json={"gdpr_consent_at": "2026-04-28T10:00:00Z"},
        )
        assert response.status_code == 200  # update_user was called (patched above)

    def test_profile_update_invalid_iso_datetime_returns_422(self, authed_client, mocker):
        """PUT /user/profile with a non-datetime string for gdpr_consent_at returns 422."""
        response = authed_client.put(
            "/api/v1/user/profile",
            json={"gdpr_consent_at": "not-a-date"},
        )
        assert response.status_code == 422

    def test_profile_update_null_gdpr_consent_at_is_accepted(self, authed_client, mocker):
        """PUT /user/profile with gdpr_consent_at=null accepted (treated as not provided)."""
        mocker.patch("app.routes.user.db.update_user", new_callable=AsyncMock, return_value=None)
        response = authed_client.put(
            "/api/v1/user/profile",
            json={"gdpr_consent_at": None, "country": "UK"},
        )
        assert response.status_code == 200

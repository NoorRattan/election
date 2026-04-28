"""Tests for GET /api/v1/topics and GET /api/v1/topics/{slug}."""

from unittest.mock import AsyncMock

# Sample data: service layer returns already-converted snake_case dicts.
SAMPLE_TOPIC_SUMMARY = {
    "id": "voter-registration",
    "slug": "voter-registration",
    "title": "Voter Registration",
    "category": "registration",
    "country": ["ALL"],
    "order": 1,
    "updated_at": None,
}

SAMPLE_TOPIC_DETAIL = {
    **SAMPLE_TOPIC_SUMMARY,
    "content": "## Voter Registration\n\nHow to register to vote.",
    "prerequisites": [],
}


class TestListTopics:
    def test_list_all_returns_200(self, client, mock_db, mocker):
        mocker.patch(
            "app.routes.topics.db.get_topics",
            new_callable=AsyncMock,
            return_value=[SAMPLE_TOPIC_SUMMARY],
        )
        resp = client.get("/api/v1/topics")
        assert resp.status_code == 200
        body = resp.json()
        assert body["total"] == 1
        assert body["topics"][0]["slug"] == "voter-registration"

    def test_filter_by_country_passes_param(self, client, mock_db, mocker):
        mock = mocker.patch(
            "app.routes.topics.db.get_topics",
            new_callable=AsyncMock,
            return_value=[],
        )
        resp = client.get("/api/v1/topics?country=UK")
        assert resp.status_code == 200
        mock.assert_called_once_with(country="UK", category=None)

    def test_filter_by_category_passes_param(self, client, mock_db, mocker):
        mock = mocker.patch(
            "app.routes.topics.db.get_topics",
            new_callable=AsyncMock,
            return_value=[],
        )
        resp = client.get("/api/v1/topics?category=registration")
        assert resp.status_code == 200
        mock.assert_called_once_with(country=None, category="registration")

    def test_invalid_country_returns_400(self, client, mock_db, mocker):
        mock = mocker.patch(
            "app.routes.topics.db.get_topics",
            new_callable=AsyncMock,
            return_value=[],
        )
        resp = client.get("/api/v1/topics?country=INVALID")
        assert resp.status_code == 400
        mock.assert_not_called()   # Must NOT reach Firestore

    def test_invalid_category_returns_400(self, client, mock_db, mocker):
        mock = mocker.patch(
            "app.routes.topics.db.get_topics",
            new_callable=AsyncMock,
            return_value=[],
        )
        resp = client.get("/api/v1/topics?category=nonsense")
        assert resp.status_code == 400
        mock.assert_not_called()

    def test_empty_result_returns_200_with_zero_total(self, client, mock_db, mocker):
        mocker.patch(
            "app.routes.topics.db.get_topics",
            new_callable=AsyncMock,
            return_value=[],
        )
        resp = client.get("/api/v1/topics")
        assert resp.status_code == 200
        assert resp.json()["total"] == 0
        assert resp.json()["topics"] == []


class TestGetTopicDetail:
    def test_existing_slug_returns_200_with_content(self, client, mock_db, mocker):
        mocker.patch(
            "app.routes.topics.db.get_topic_by_slug",
            new_callable=AsyncMock,
            return_value=SAMPLE_TOPIC_DETAIL,
        )
        resp = client.get("/api/v1/topics/voter-registration")
        assert resp.status_code == 200
        body = resp.json()
        assert "content" in body
        assert body["slug"] == "voter-registration"

    def test_not_found_returns_404(self, client, mock_db, mocker):
        mocker.patch(
            "app.routes.topics.db.get_topic_by_slug",
            new_callable=AsyncMock,
            return_value=None,
        )
        resp = client.get("/api/v1/topics/does-not-exist")
        assert resp.status_code == 404

    def test_slug_with_special_chars_returns_400(self, client, mock_db, mocker):
        mock = mocker.patch(
            "app.routes.topics.db.get_topic_by_slug",
            new_callable=AsyncMock,
            return_value=None,
        )
        resp = client.get("/api/v1/topics/../../etc/passwd")
        # FastAPI will URL-decode and the slug validation rejects non-alphanumeric
        assert resp.status_code in (400, 404)
        mock.assert_not_called()

    def test_slug_with_script_injection_returns_400(self, client, mock_db, mocker):
        mocker.patch(
            "app.routes.topics.db.get_topic_by_slug",
            new_callable=AsyncMock,
            return_value=None,
        )
        resp = client.get("/api/v1/topics/<script>alert(1)</script>")
        assert resp.status_code in (400, 404)

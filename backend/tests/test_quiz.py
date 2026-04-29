"""
Tests for quiz endpoints (GET /quiz/{topic_id}, POST /quiz/submit)
and timeline endpoint (GET /timeline).
"""

from unittest.mock import AsyncMock

SAMPLE_QUESTION_WITH_ANSWER = {
    "id": "q_vr_001",
    "question": "What is the minimum voting age in the UK?",
    "options": ["16", "17", "18", "21"],
    "country": ["ALL"],
    "correct_index": 2,
    "explanation": "In the UK, the minimum voting age is 18 for general elections.",
    "difficulty": "easy",
}

SAMPLE_TIMELINE_EVENT = {
    "id": "uk-local-2026-poll-day",
    "name": "Local Election Day",
    "description": "Polling day for May 2026 local elections.",
    "date": "2026-05-07",
    "type": "poll_day",
    "level": "local",
    "state_province": None,
    "official_url": "https://www.electoralcommission.org.uk",
}


class TestGetQuizQuestions:
    def test_no_auth_returns_401(self, client):
        resp = client.get("/api/v1/quiz/voter-registration")
        assert resp.status_code == 401

    def test_authenticated_returns_200(self, authed_client, mocker):
        mocker.patch(
            "app.routes.quiz.db.get_quiz_questions",
            new_callable=AsyncMock,
            return_value=[SAMPLE_QUESTION_WITH_ANSWER],
        )
        resp = authed_client.get("/api/v1/quiz/voter-registration")
        assert resp.status_code == 200
        body = resp.json()
        assert body["total"] == 1
        assert body["topic_id"] == "voter-registration"

    def test_correct_index_not_in_response(self, authed_client, mocker):
        """SECURITY: correct_index must never appear in GET quiz response."""
        mocker.patch(
            "app.routes.quiz.db.get_quiz_questions",
            new_callable=AsyncMock,
            return_value=[SAMPLE_QUESTION_WITH_ANSWER],
        )
        resp = authed_client.get("/api/v1/quiz/voter-registration")
        assert resp.status_code == 200
        for question in resp.json()["questions"]:
            assert "correct_index" not in question
            assert "correctIndex" not in question

    def test_explanation_not_in_response(self, authed_client, mocker):
        """SECURITY: explanation must never appear in GET quiz response."""
        mocker.patch(
            "app.routes.quiz.db.get_quiz_questions",
            new_callable=AsyncMock,
            return_value=[SAMPLE_QUESTION_WITH_ANSWER],
        )
        resp = authed_client.get("/api/v1/quiz/voter-registration")
        for question in resp.json()["questions"]:
            assert "explanation" not in question

    def test_no_questions_returns_404(self, authed_client, mocker):
        mocker.patch(
            "app.routes.quiz.db.get_quiz_questions",
            new_callable=AsyncMock,
            return_value=[],
        )
        resp = authed_client.get("/api/v1/quiz/voter-registration")
        assert resp.status_code == 404

    def test_invalid_topic_id_returns_400(self, authed_client):
        resp = authed_client.get("/api/v1/quiz/topic%20with%20spaces")
        assert resp.status_code == 400


class TestSubmitQuiz:
    def test_no_auth_returns_401(self, client):
        resp = client.post(
            "/api/v1/quiz/submit",
            json={
                "topic_id": "voter-registration",
                "answers": [{"question_id": "q_vr_001", "selected_index": 2}],
            },
        )
        assert resp.status_code == 401

    def test_correct_answer_score_100(self, authed_client, mocker):
        mocker.patch(
            "app.routes.quiz.db.get_question_by_id",
            new_callable=AsyncMock,
            return_value=SAMPLE_QUESTION_WITH_ANSWER,
        )
        mocker.patch("app.routes.quiz.db.update_progress", new_callable=AsyncMock)
        resp = authed_client.post(
            "/api/v1/quiz/submit",
            json={
                "topic_id": "voter-registration",
                "answers": [
                    {"question_id": "q_vr_001", "selected_index": 2}  # correct_index is 2
                ],
            },
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["score"] == 100
        assert body["correct"] == 1
        assert body["results"][0]["correct"] is True

    def test_wrong_answer_score_0(self, authed_client, mocker):
        mocker.patch(
            "app.routes.quiz.db.get_question_by_id",
            new_callable=AsyncMock,
            return_value=SAMPLE_QUESTION_WITH_ANSWER,
        )
        mocker.patch("app.routes.quiz.db.update_progress", new_callable=AsyncMock)
        resp = authed_client.post(
            "/api/v1/quiz/submit",
            json={
                "topic_id": "voter-registration",
                "answers": [
                    {"question_id": "q_vr_001", "selected_index": 0}  # wrong — correct is 2
                ],
            },
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["score"] == 0
        assert body["results"][0]["correct"] is False

    def test_explanation_included_in_results(self, authed_client, mocker):
        mocker.patch(
            "app.routes.quiz.db.get_question_by_id",
            new_callable=AsyncMock,
            return_value=SAMPLE_QUESTION_WITH_ANSWER,
        )
        mocker.patch("app.routes.quiz.db.update_progress", new_callable=AsyncMock)
        resp = authed_client.post(
            "/api/v1/quiz/submit",
            json={
                "topic_id": "voter-registration",
                "answers": [{"question_id": "q_vr_001", "selected_index": 2}],
            },
        )
        assert "explanation" in resp.json()["results"][0]

    def test_empty_answers_returns_422(self, authed_client):
        resp = authed_client.post(
            "/api/v1/quiz/submit",
            json={"topic_id": "voter-registration", "answers": []},
        )
        assert resp.status_code == 422

    def test_invalid_selected_index_returns_422(self, authed_client):
        resp = authed_client.post(
            "/api/v1/quiz/submit",
            json={
                "topic_id": "voter-registration",
                "answers": [
                    {"question_id": "q_vr_001", "selected_index": 99}  # invalid
                ],
            },
        )
        assert resp.status_code == 422

    def test_progress_updated_false_on_db_error(self, authed_client, mocker):
        mocker.patch(
            "app.routes.quiz.db.get_question_by_id",
            new_callable=AsyncMock,
            return_value=SAMPLE_QUESTION_WITH_ANSWER,
        )
        mocker.patch(
            "app.routes.quiz.db.update_progress",
            new_callable=AsyncMock,
            side_effect=Exception("Firestore write failed"),
        )
        resp = authed_client.post(
            "/api/v1/quiz/submit",
            json={
                "topic_id": "voter-registration",
                "answers": [{"question_id": "q_vr_001", "selected_index": 2}],
            },
        )
        assert resp.status_code == 200  # Non-fatal — still returns score
        assert resp.json()["progress_updated"] is False


class TestTimeline:
    def test_missing_country_returns_422(self, client):
        # country is required — omitting it should fail validation
        resp = client.get("/api/v1/timeline")
        assert resp.status_code == 422

    def test_invalid_country_returns_400(self, client, mocker):
        mock = mocker.patch(
            "app.routes.timeline.db.get_timeline_events",
            new_callable=AsyncMock,
            return_value=[],
        )
        resp = client.get("/api/v1/timeline?country=XX")
        assert resp.status_code == 400
        mock.assert_not_called()

    def test_valid_uk_returns_events(self, client, mocker):
        mocker.patch(
            "app.routes.timeline.db.get_timeline_events",
            new_callable=AsyncMock,
            return_value=[SAMPLE_TIMELINE_EVENT],
        )
        resp = client.get("/api/v1/timeline?country=UK")
        assert resp.status_code == 200
        body = resp.json()
        assert body["country"] == "UK"
        assert len(body["events"]) == 1

    def test_empty_events_returns_200(self, client, mocker):
        mocker.patch(
            "app.routes.timeline.db.get_timeline_events",
            new_callable=AsyncMock,
            return_value=[],
        )
        resp = client.get("/api/v1/timeline?country=US")
        assert resp.status_code == 200
        assert resp.json()["events"] == []

"""Tests for deterministic Electra assistant answers."""

from app.services.assistant_service import answer_locally, fallback_answer, is_dialogflow_fallback


def test_detects_dialogflow_no_match_phrases():
    assert is_dialogflow_fallback("What was that?")
    assert is_dialogflow_fallback("Sorry, I didn't get that. Can you rephrase?")
    assert is_dialogflow_fallback("")
    assert not is_dialogflow_fallback("To register, visit the official voter website.")


def test_answers_greeting_with_capabilities():
    result = answer_locally("hello")

    assert result is not None
    assert result["intent"] == "greeting"
    assert "voter registration" in result["reply"].lower()


def test_answers_symbol_math():
    result = answer_locally("what is 2+2")

    assert result is not None
    assert result["intent"] == "utility_math"
    assert "2+2 = 4" in result["reply"]


def test_answers_word_math():
    result = answer_locally("calculate 8 divided by 2")

    assert result is not None
    assert "8/2 = 4" in result["reply"]


def test_ignores_unsafe_math_expression():
    assert answer_locally("__import__('os').system('dir')") is None


def test_answers_registration_by_country_context():
    result = answer_locally("How do I register to vote?", "US")

    assert result is not None
    assert "United States" in result["reply"]
    assert result["suggested_topics"] == ["voter-registration"]


def test_answers_eligibility_from_alias():
    result = answer_locally("Can Indian citizens vote at 18?")

    assert result is not None
    assert "India" in result["reply"]
    assert result["suggested_topics"] == ["voter-eligibility"]


def test_answers_country_specific_voter_id():
    result = answer_locally("Do I need voter ID in India?")

    assert result is not None
    assert result["suggested_topics"] == ["voter-id-india"]


def test_answers_voting_methods():
    result = answer_locally("How to vote at a polling station in the UK?")

    assert result is not None
    assert "polling place" in result["reply"].lower() or "polling" in result["reply"].lower()
    assert result["suggested_topics"] == ["voting-methods"]


def test_answers_timeline_deadline_question():
    result = answer_locally("When is the registration deadline?")

    assert result is not None
    assert "deadline" in result["reply"].lower()
    assert result["suggested_topics"] == ["voter-registration"]


def test_answers_campaign_rules():
    result = answer_locally("Explain campaign finance rules")

    assert result is not None
    assert result["suggested_topics"] == ["campaign-rules"]


def test_answers_counting_results():
    result = answer_locally("How are election results counted?")

    assert result is not None
    assert result["suggested_topics"] == ["counting-results"]


def test_answers_dispute_resolution():
    result = answer_locally("How can a result dispute go to court?")

    assert result is not None
    assert result["suggested_topics"] == ["dispute-resolution"]


def test_answers_general_election_overview():
    result = answer_locally("Tell me about elections")

    assert result is not None
    assert result["intent"] == "local_election_overview"


def test_fallback_answer_guides_unknown_message():
    result = fallback_answer("banana")

    assert result["intent"] == "electra_local_fallback"
    assert "voter registration" in result["reply"].lower()

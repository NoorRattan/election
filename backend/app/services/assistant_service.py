"""Deterministic answer layer for the Electra chat endpoint.

Dialogflow remains the primary conversational backend, but the app should not
show low-quality fallback phrases to users when the question is common,
in-domain, or safely answerable without cloud NLP.
"""

from __future__ import annotations

import ast
import operator
import re
from collections.abc import Callable

FALLBACK_INTENT = "electra_local_fallback"
MATH_INTENT = "utility_math"

_DIALOGFLOW_FALLBACKS = {
    "sorry, i didn't get that. can you rephrase?",
    "sorry, i didn't get that",
    "what was that?",
    "i didn't get that",
    "can you rephrase?",
}

_COUNTRY_LABELS = {
    "UK": "the United Kingdom",
    "US": "the United States",
    "IN": "India",
}

_COUNTRY_ALIASES = {
    "uk": "UK",
    "united kingdom": "UK",
    "england": "UK",
    "scotland": "UK",
    "wales": "UK",
    "northern ireland": "UK",
    "us": "US",
    "usa": "US",
    "u.s.": "US",
    "united states": "US",
    "america": "US",
    "india": "IN",
    "indian": "IN",
}

_KEYWORD_TOPICS = [
    (
        ("register", "registration", "enrol", "enroll", "form 6"),
        "voter-registration",
        "registration",
    ),
    (
        ("eligible", "eligibility", "age", "citizen", "citizenship", "can i vote"),
        "voter-eligibility",
        "eligibility",
    ),
    (
        ("id", "photo id", "voter id", "epic", "passport", "driving licence"),
        None,
        "voter ID",
    ),
    (
        ("postal", "mail", "mail-in", "absentee", "proxy"),
        "ballot-types",
        "postal, proxy, absentee, and mail voting",
    ),
    (
        ("how to vote", "polling", "polling station", "polls", "cast", "evm", "ballot"),
        "voting-methods",
        "how to vote",
    ),
    (
        ("deadline", "timeline", "when is", "date", "calendar"),
        "voter-registration",
        "election timelines and deadlines",
    ),
    (
        ("campaign", "finance", "advertising", "donation"),
        "campaign-rules",
        "campaign rules",
    ),
    (
        ("dispute", "challenge", "court", "petition"),
        "dispute-resolution",
        "election dispute resolution",
    ),
    (
        ("count", "counting", "result", "results", "recount"),
        "counting-results",
        "counting and results",
    ),
]

_ALLOWED_OPERATORS: dict[type[ast.operator | ast.unaryop], Callable] = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}


def is_dialogflow_fallback(reply: str | None) -> bool:
    """Return True when Dialogflow produced a generic no-match phrase."""
    if not reply:
        return True
    normalized = _normalize(reply)
    return normalized in _DIALOGFLOW_FALLBACKS


def answer_locally(message: str, country: str | None = None) -> dict | None:
    """Return a deterministic local answer, or None if Dialogflow should handle it."""
    text = message.strip()
    normalized = _normalize(text)

    math_answer = _answer_math(text)
    if math_answer:
        return math_answer

    if _is_greeting(normalized):
        return {
            "reply": (
                "Hi! I'm Electra. I can explain voter registration, eligibility, voter ID, "
                "ballot types, voting methods, timelines, campaign rules, counting, and election "
                "disputes for the UK, US, and India."
            ),
            "intent": "greeting",
            "suggested_topics": ["voter-registration", "voter-eligibility", "voting-methods"],
        }

    assistant_help = _answer_assistant_help(normalized)
    if assistant_help:
        return assistant_help

    status_answer = _answer_current_status(normalized, country)
    if status_answer:
        return status_answer

    topic_answer = _answer_election_topic(normalized, country)
    if topic_answer:
        return topic_answer

    return None


def fallback_answer(message: str, country: str | None = None) -> dict:
    """Helpful response used when Dialogflow cannot classify the user message."""
    local = answer_locally(message, country)
    if local:
        return local

    return {
        "reply": (
            "I can help with election questions, but I could not match that wording. Try asking "
            "about voter registration, voter eligibility, voter ID, postal or mail voting, polling "
            "stations, election deadlines, counting results, or campaign rules."
        ),
        "intent": FALLBACK_INTENT,
        "suggested_topics": ["voter-registration", "voter-eligibility", "voting-methods"],
    }


def _answer_election_topic(normalized: str, country: str | None) -> dict | None:
    country_code = _detect_country(normalized, country)

    for keywords, base_slug, label in _KEYWORD_TOPICS:
        if not any(keyword in normalized for keyword in keywords):
            continue

        slug = _topic_slug_for(base_slug, label, country_code)
        country_label = _COUNTRY_LABELS.get(country_code, "the UK, US, and India")
        reply = _topic_reply(label, country_label)
        return {
            "reply": reply,
            "intent": f"local_{label.replace(' ', '_').replace(',', '').replace('-', '_')}",
            "suggested_topics": [slug],
        }

    if "election" in normalized or "vote" in normalized or "voting" in normalized:
        return {
            "reply": (
                "Electra covers practical election education: who can vote, how to register, "
                "what ID may be needed, how ballots work, how to vote, key deadlines, campaign "
                "rules, counting, and dispute resolution."
            ),
            "intent": "local_election_overview",
            "suggested_topics": ["voter-registration", "voter-eligibility", "voting-methods"],
        }

    return None


def _answer_assistant_help(normalized: str) -> dict | None:
    assistant_terms = ("assistant", "assist", "chat", "electra")
    location_terms = ("where", "how do i use", "what can you do", "help me", "open")
    if not any(term in normalized for term in assistant_terms):
        return None
    if not any(term in normalized for term in location_terms):
        return None

    return {
        "reply": (
            "You are using Electra Assistant now. Type a question in this chat about voter "
            "registration, eligibility, voter ID, ballot types, voting methods, timelines, campaign "
            "rules, counting, or disputes. You can also use the Topics and Timeline pages for "
            "structured election information."
        ),
        "intent": "assistant_help",
        "suggested_topics": [],
    }


def _answer_current_status(normalized: str, country: str | None) -> dict | None:
    status_terms = ("current", "status", "live", "today", "latest", "now", "ongoing")
    if "election" not in normalized and "vote" not in normalized and "poll" not in normalized:
        return None
    if not any(term in normalized for term in status_terms):
        return None

    country_code = _detect_country(normalized, country)
    country_label = _COUNTRY_LABELS.get(country_code, "your selected country")
    return {
        "reply": (
            f"I can show educational timelines and deadlines for {country_label}, but I do not "
            "provide live election results or real-time election status. For official live status, "
            "check the relevant election authority. In Electra, open the Timeline page and switch "
            "countries to compare upcoming registration, polling, and result dates."
        ),
        "intent": "current_election_status",
        "suggested_topics": ["voter-registration"],
    }


def _topic_reply(label: str, country_label: str) -> str:
    if label == "registration":
        return (
            f"For voter registration in {country_label}, start with the official election or "
            "government voter-registration website. Registration rules and deadlines vary by "
            "country, and in the US they also vary by state. Electra's registration topic gives "
            "the exact official links and common requirements."
        )
    if label == "eligibility":
        return (
            f"Voter eligibility in {country_label} usually depends on age, citizenship, residence, "
            "and election type. Some places also have special rules for overseas voters, felony "
            "convictions, or devolved/local elections."
        )
    if label == "voter ID":
        return (
            f"Voter ID rules depend on where you vote. In {country_label}, check whether photo ID, "
            "an EPIC card, or another accepted document is required before polling day."
        )
    if label == "postal, proxy, absentee, and mail voting":
        return (
            f"Alternative voting methods in {country_label} may include postal voting, proxy "
            "voting, absentee ballots, mail-in ballots, or early voting depending on the election. "
            "Apply before the official deadline and use only trusted government instructions."
        )
    if label == "how to vote":
        return (
            f"To vote in {country_label}, confirm you are registered, check your polling place or "
            "ballot method, bring any required ID, follow the ballot instructions, and submit the "
            "ballot before the deadline."
        )
    if label == "election timelines and deadlines":
        return (
            f"Election deadlines in {country_label} can include registration, postal or absentee "
            "application, voter ID certificate, polling day, and result dates. Use Electra's "
            "timeline page for the structured deadline view."
        )
    if label == "campaign rules":
        return (
            f"Campaign rules in {country_label} cover donations, spending limits, advertising, "
            "disclosures, and conduct around polling places. The details vary by jurisdiction and "
            "election type."
        )
    if label == "counting and results":
        return (
            f"Election results in {country_label} are counted and certified through official "
            "processes. Close contests may involve recounts, provisional ballots, audits, or legal "
            "challenges depending on local law."
        )
    return (
        f"Election dispute rules in {country_label} explain how candidates, voters, or parties can "
        "challenge election administration, counting, or results through official review channels."
    )


def _topic_slug_for(base_slug: str | None, label: str, country_code: str | None) -> str:
    if label == "voter ID":
        return {
            "UK": "voter-id-uk",
            "US": "voter-id-us",
            "IN": "voter-id-india",
        }.get(country_code, "voter-id-uk")
    return base_slug or "voter-registration"


def _answer_math(message: str) -> dict | None:
    expression = _extract_math_expression(message)
    if not expression:
        return None

    try:
        value = _safe_eval_expression(expression)
    except (ArithmeticError, SyntaxError, ValueError, TypeError, OverflowError):
        return None

    if isinstance(value, float) and value.is_integer():
        value = int(value)

    return {
        "reply": (
            f"{expression} = {value}. I can also answer election questions about registration, "
            "eligibility, voter ID, ballots, timelines, and voting methods."
        ),
        "intent": MATH_INTENT,
        "suggested_topics": [],
    }


def _extract_math_expression(message: str) -> str | None:
    text = message.lower().strip()
    text = re.sub(r"^(what\s+is|what's|calculate|compute|solve)\s+", "", text)
    text = text.replace("plus", "+").replace("minus", "-")
    text = text.replace("times", "*").replace("multiplied by", "*")
    text = text.replace("divided by", "/")
    text = text.replace("x", "*")
    text = text.replace("?", "").strip()

    if len(text) > 40:
        return None
    if not re.fullmatch(r"[0-9+\-*/().%\s]+", text):
        return None
    if not re.search(r"\d\s*[+\-*/%]\s*\d", text):
        return None
    expression = re.sub(r"\s+", "", text)
    return re.sub(r"\d+", lambda match: str(int(match.group(0))), expression)


def _safe_eval_expression(expression: str) -> int | float:
    node = ast.parse(expression, mode="eval")
    return _eval_ast(node.body)


def _eval_ast(node: ast.AST) -> int | float:
    if isinstance(node, ast.Constant) and isinstance(node.value, int | float):
        return node.value
    if isinstance(node, ast.BinOp):
        operator_func = _ALLOWED_OPERATORS.get(type(node.op))
        if not operator_func:
            raise ValueError("operator not allowed")
        left = _eval_ast(node.left)
        right = _eval_ast(node.right)
        if isinstance(node.op, ast.Pow) and abs(right) > 6:
            raise ValueError("exponent too large")
        return operator_func(left, right)
    if isinstance(node, ast.UnaryOp):
        operator_func = _ALLOWED_OPERATORS.get(type(node.op))
        if not operator_func:
            raise ValueError("operator not allowed")
        return operator_func(_eval_ast(node.operand))
    raise ValueError("expression not allowed")


def _detect_country(normalized: str, country: str | None) -> str | None:
    if country:
        country_code = country.strip().upper()
        if country_code in _COUNTRY_LABELS:
            return country_code
    for alias, code in _COUNTRY_ALIASES.items():
        if alias in normalized:
            return code
    return None


def _is_greeting(normalized: str) -> bool:
    return normalized in {"hi", "hello", "hey", "help", "start", "what can you do"}


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.casefold().strip())

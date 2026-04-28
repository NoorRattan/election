#!/usr/bin/env bash
# ==============================================================================
# scripts/smoke-test.sh — Electra Backend Smoke Test
# ==============================================================================
# Verifies a deployed Electra backend is functioning correctly.
# Run after every production deployment as a post-deploy sanity check.
#
# Usage:
#   export API_URL=https://electra-api-xxx.run.app/api/v1
#   bash scripts/smoke-test.sh
#
# Exit code:
#   0 — all checks passed
#   1 — one or more checks failed
#
# Make executable: chmod +x scripts/smoke-test.sh
# ==============================================================================

set -euo pipefail

API_URL="${API_URL:-http://localhost:8000/api/v1}"

# Normalize: strip trailing /api/v1 if present (VITE_API_BASE_URL may include it),
# then strip any remaining trailing slash — the script appends /api/v1 via each request path.
# Handles both https://host/api/v1 and https://host inputs correctly.
API_URL="${API_URL%/api/v1}"
API_URL="${API_URL%/}"
# Re-append /api/v1 as the canonical base for all test requests
API_URL="${API_URL}/api/v1"

FAILED=0

echo ""
echo "══════════════════════════════════════════════════════════"
echo "  Electra Backend Smoke Test"
echo "  Target: ${API_URL}"
echo "══════════════════════════════════════════════════════════"
echo ""

# ── Helper function ────────────────────────────────────────────────────────
# check <description> <expected_status> <actual_status> [body] [body_substring]
check() {
  local desc="$1"
  local expected_status="$2"
  local actual_status="$3"
  local body="${4:-}"
  local body_check="${5:-}"

  if [ "$actual_status" = "$expected_status" ]; then
    if [ -z "$body_check" ] || echo "$body" | grep -q "$body_check"; then
      echo "  ✓ $desc"
      return 0
    fi
    echo "  ✗ $desc (status OK but body missing: '${body_check}')"
  else
    echo "  ✗ $desc (expected HTTP $expected_status, got $actual_status)"
  fi
  FAILED=1
}

# ── Curl helper: returns "<status_code>|||<body>" ──────────────────────────
make_request() {
  local method="$1"
  local path="$2"
  local data="${3:-}"

  if [ -n "$data" ]; then
    curl -s -w "|||%{http_code}" \
      -X "$method" \
      -H "Content-Type: application/json" \
      -d "$data" \
      --max-time 10 \
      "${API_URL}${path}" 2>/dev/null
  else
    curl -s -w "|||%{http_code}" \
      -X "$method" \
      --max-time 10 \
      "${API_URL}${path}" 2>/dev/null
  fi
}

parse_status() { echo "${1##*|||}" ; }
parse_body()   { echo "${1%|||*}"  ; }

# ── Tests ──────────────────────────────────────────────────────────────────

echo "Health & Basic Connectivity"
echo "────────────────────────────────────────"

resp=$(make_request GET "/health")
check "GET /health — 200 with status:ok" \
  "200" "$(parse_status "$resp")" "$(parse_body "$resp")" '"status"'

echo ""
echo "Topics API"
echo "────────────────────────────────────────"

resp=$(make_request GET "/topics")
check "GET /topics — 200 with topics array" \
  "200" "$(parse_status "$resp")" "$(parse_body "$resp")" '"topics"'

resp=$(make_request GET "/topics?country=UK")
check "GET /topics?country=UK — 200" \
  "200" "$(parse_status "$resp")"

resp=$(make_request GET "/topics?country=INVALID")
check "GET /topics?country=INVALID — 400" \
  "400" "$(parse_status "$resp")"

resp=$(make_request GET "/topics/voter-registration")
check "GET /topics/voter-registration — 200 with content field" \
  "200" "$(parse_status "$resp")" "$(parse_body "$resp")" '"content"'

resp=$(make_request GET "/topics/nonexistent-slug-99999")
check "GET /topics/nonexistent-slug — 404" \
  "404" "$(parse_status "$resp")"

echo ""
echo "Timeline API"
echo "────────────────────────────────────────"

resp=$(make_request GET "/timeline?country=UK")
check "GET /timeline?country=UK — 200 with events array" \
  "200" "$(parse_status "$resp")" "$(parse_body "$resp")" '"events"'

resp=$(make_request GET "/timeline")
check "GET /timeline (no country) — 422 validation error" \
  "422" "$(parse_status "$resp")"

echo ""
echo "Auth-Protected Routes"
echo "────────────────────────────────────────"

resp=$(make_request GET "/quiz/voter-registration")
check "GET /quiz/voter-registration (no token) — 401" \
  "401" "$(parse_status "$resp")"

echo ""
echo "Chat API"
echo "────────────────────────────────────────"

CHAT_BODY='{"message":"hello","session_id":"smoke-test-123","country":"UK","language_code":"en"}'
resp=$(make_request POST "/chat" "$CHAT_BODY")
check "POST /chat — 200 (graceful degradation without Dialogflow config)" \
  "200" "$(parse_status "$resp")"

echo ""
echo "Feedback API"
echo "────────────────────────────────────────"

FEEDBACK_BODY='{"message":"Smoke test feedback message","category":"other"}'
resp=$(make_request POST "/feedback" "$FEEDBACK_BODY")
check "POST /feedback — 201 created" \
  "201" "$(parse_status "$resp")"

# ── Summary ────────────────────────────────────────────────────────────────

echo ""
echo "══════════════════════════════════════════════════════════"
if [ "$FAILED" -eq 0 ]; then
  echo "  ✓ All checks passed."
  echo "══════════════════════════════════════════════════════════"
  echo ""
  exit 0
else
  echo "  ✗ One or more checks failed. See above for details."
  echo "══════════════════════════════════════════════════════════"
  echo ""
  exit 1
fi

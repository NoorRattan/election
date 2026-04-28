#!/usr/bin/env bash
# ==============================================================================
# scripts/check-env.sh — Electra Environment Variable Validator
# ==============================================================================
# Validates that all required environment variables are set before attempting
# to run the backend or frontend locally.
#
# Usage:
#   bash scripts/check-env.sh backend   # Check backend vars only
#   bash scripts/check-env.sh frontend  # Check frontend vars only
#   bash scripts/check-env.sh all       # Check both (default)
#
# Exit codes:
#   0 — all required vars present
#   1 — one or more required vars missing
#
# Make executable:
#   chmod +x scripts/check-env.sh
# ==============================================================================

set -euo pipefail

# ── Colour codes ───────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RESET='\033[0m'
BOLD='\033[1m'

# ── Required variables ──────────────────────────────────────────────────────
BACKEND_REQUIRED=(
  GOOGLE_CLOUD_PROJECT
  FIREBASE_SERVICE_ACCOUNT_KEY
  DIALOGFLOW_AGENT_ID
  DIALOGFLOW_LOCATION
  ENVIRONMENT
  ALLOWED_ORIGINS
  SECRET_KEY
  RATE_LIMIT_PER_MINUTE
)

FRONTEND_REQUIRED=(
  VITE_API_BASE_URL
  VITE_FIREBASE_API_KEY
  VITE_FIREBASE_AUTH_DOMAIN
  VITE_FIREBASE_PROJECT_ID
  VITE_FIREBASE_STORAGE_BUCKET
  VITE_FIREBASE_MESSAGING_SENDER_ID
  VITE_FIREBASE_APP_ID
  VITE_FIREBASE_MEASUREMENT_ID
  VITE_GOOGLE_MAPS_API_KEY
)

# ── Helper: source a .env file if it exists ─────────────────────────────────
load_env_file() {
  local env_file="$1"
  if [ -f "$env_file" ]; then
    # Export vars from .env file, skipping comments and empty lines
    set -o allexport
    # shellcheck disable=SC1090
    source <(grep -v '^\s*#' "$env_file" | grep -v '^\s*$') 2>/dev/null || true
    set +o allexport
  fi
}

# ── Helper: get value of a variable (env takes priority over .env file) ─────
get_var_value() {
  echo "${!1:-}"
}

# ── Core check function ─────────────────────────────────────────────────────
# check_vars <section_name> <env_file> <VAR_ARRAY...>
# Returns: 0 = all set, 1 = any missing
check_vars() {
  local section_name="$1"
  local env_file="$2"
  shift 2
  local required_vars=("$@")

  echo ""
  echo -e "${BOLD}${section_name} Environment Variables${RESET}"
  echo "────────────────────────────────────────────────────────────"

  if [ -f "$env_file" ]; then
    echo -e "  Loading: ${env_file}"
    load_env_file "$env_file"
  else
    echo -e "  ${YELLOW}⚠ ${env_file} not found — checking system environment only${RESET}"
  fi

  echo ""

  local missing=0
  local set_count=0
  local total=${#required_vars[@]}

  for var in "${required_vars[@]}"; do
    local value
    value=$(get_var_value "$var")

    if [ -z "$value" ]; then
      # Check if the var is DIALOGFLOW_AGENT_ID — warn instead of fail
      if [ "$var" = "DIALOGFLOW_AGENT_ID" ]; then
        printf "  ${YELLOW}⚠  %-40s EMPTY${RESET}  (chat will use static fallback response)\n" "$var"
        set_count=$((set_count + 1))
      else
        printf "  ${RED}✗  %-40s MISSING${RESET}\n" "$var"
        missing=$((missing + 1))
      fi
    else
      # Warn about placeholder values
      if [ "$var" = "VITE_GOOGLE_MAPS_API_KEY" ] && [[ "$value" == *"your-maps-key"* || "$value" == *"placeholder"* || "$value" == "YOUR_"* ]]; then
        printf "  ${YELLOW}⚠  %-40s SET${RESET}  (looks like a placeholder — maps may not work)\n" "$var"
        set_count=$((set_count + 1))
      elif [ "$var" = "ENVIRONMENT" ] && [ "$value" != "development" ]; then
        printf "  ${GREEN}✓  %-40s SET${RESET}\n" "$var"
        echo -e "     ${YELLOW}⚠  ENVIRONMENT='${value}' — should be 'development' for local runs${RESET}"
        set_count=$((set_count + 1))
      else
        printf "  ${GREEN}✓  %-40s SET${RESET}\n" "$var"
        set_count=$((set_count + 1))
      fi
    fi
  done

  echo ""
  echo -e "  ${BOLD}${section_name}: ${set_count} / ${total} variables set.${RESET}"

  return $missing
}

# ── Main ────────────────────────────────────────────────────────────────────
TARGET="${1:-all}"

# Determine script root (repository root is one level up from scripts/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo ""
echo -e "${BOLD}══════════════════════════════════════════════════════════${RESET}"
echo -e "${BOLD}  Electra Environment Check${RESET}"
echo -e "${BOLD}══════════════════════════════════════════════════════════${RESET}"

OVERALL_FAILED=0

if [ "$TARGET" = "backend" ] || [ "$TARGET" = "all" ]; then
  check_vars "Backend" "${REPO_ROOT}/backend/.env" "${BACKEND_REQUIRED[@]}" || OVERALL_FAILED=1
fi

if [ "$TARGET" = "frontend" ] || [ "$TARGET" = "all" ]; then
  # Try .env.local first (Vite convention), fall back to .env
  FRONTEND_ENV="${REPO_ROOT}/frontend/.env.local"
  if [ ! -f "$FRONTEND_ENV" ]; then
    FRONTEND_ENV="${REPO_ROOT}/frontend/.env"
  fi
  check_vars "Frontend" "$FRONTEND_ENV" "${FRONTEND_REQUIRED[@]}" || OVERALL_FAILED=1
fi

# ── Summary ─────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════════════════════════${RESET}"
if [ "$OVERALL_FAILED" -eq 0 ]; then
  echo -e "${GREEN}${BOLD}  ✓  All required variables are set. Ready to run.${RESET}"
else
  echo -e "${RED}${BOLD}  ✗  Run failed — set missing variables before starting the server.${RESET}"
  echo ""
  echo "  Tips:"
  echo "    • Copy the example files and fill in real values:"
  echo "        cp backend/.env.example backend/.env"
  echo "        cp frontend/.env.example frontend/.env.local"
  echo "    • See docs/DEPLOYMENT.md for how to obtain each value."
fi
echo -e "${BOLD}══════════════════════════════════════════════════════════${RESET}"
echo ""

exit $OVERALL_FAILED

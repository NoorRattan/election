# Contributing to Electra

Thank you for your interest in contributing to Electra - an open-source civic education platform
helping people around the world understand how elections work. Every contribution, from fixing a
typo to adding a new country's election content, helps more people participate in democracy.

---

## Code of Conduct

We are committed to a welcoming, respectful, and inclusive community.

- **Be respectful** - treat all contributors and maintainers with courtesy
- **Be constructive** - critique ideas, never people
- **Be inclusive** - we welcome contributors of all backgrounds, experience levels, and nationalities
- **Zero tolerance** for harassment, discrimination, or abusive language in any form

Violations may result in removal from the project.

---

## How to Contribute

### a. Reporting Bugs

1. Check existing [GitHub Issues](https://github.com) first - it may already be reported
2. Open a new issue using the **Bug Report** template
3. Include:
   - **Steps to reproduce** (numbered, specific)
   - **Expected behaviour** - what should happen
   - **Actual behaviour** - what actually happens
   - **Browser / OS** - e.g. Chrome 124 / macOS 14.4
   - Screenshots or console errors if relevant

### b. Suggesting Content Improvements

Election facts must be accurate and sourced. To suggest a content change:

1. Open a GitHub Issue with the label **`content`**
2. Include:
   - The specific text to change and what it should say
   - The **official government source URL** for verification
   - Content must be sourced from official bodies only:
     - UK: [Electoral Commission](https://www.electoralcommission.org.uk)
     - US: [usa.gov](https://www.usa.gov)
     - India: [Election Commission of India](https://eci.gov.in)
3. **Do not submit opinionated or political content** - factual and neutral only
4. Do not speculate about future election outcomes

### c. Code Contributions

1. **Fork** the repository
2. Create a **feature branch**: `git checkout -b feat/short-description`
3. Make your changes (see Development Setup below)
4. Ensure all tests pass and coverage thresholds are met
5. Open a **Pull Request** to `main` with a clear description of what and why

---

## Development Setup

See [README.md - Local Development](README.md) for complete setup instructions.

Quick summary:

```bash
# Backend
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env  # fill in required values
uvicorn main:app --reload --port 8000

# Frontend
cd frontend && npm install
cp .env.example .env.local  # fill in required values
npm run dev
```

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code. Direct pushes are blocked. |
| `feat/short-description` | New features |
| `fix/short-description` | Bug fixes |
| `docs/short-description` | Documentation only |
| `chore/short-description` | Tooling, deps, CI |

All changes to `main` require a Pull Request and passing CI.

---

## Commit Style

We use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <short description>
```

**Types:** `feat`, `fix`, `docs`, `test`, `chore`, `refactor`, `perf`, `style`

**Examples:**

```
feat(quiz): add retry limit per topic
fix(auth): handle expired token gracefully
docs(deployment): add rollback procedure
test(feedback): add 429 rate-limit test case
chore(deps): bump firebase to 10.12.0
```

---

## Code Style

### Backend (Python)

- Follow **PEP 8** style
- Use **ruff** for linting: `ruff check app/`
- **Type hints** required on all function signatures
- Docstrings on all public functions and classes
- No bare `except:` - always specify the exception type

### Frontend (JavaScript/JSX)

- **ESLint**: `npm run lint` - must pass with 0 warnings
- No unused imports
- Components should be small and focused (single responsibility)
- Use descriptive variable and function names

---

## Tests

All pull requests must:

1. **Pass all existing tests** - no regressions allowed
2. **Include tests for new features**:
   - Backend: `pytest tests/` with coverage >= 80% (`--cov-fail-under=80`)
   - Frontend: `npm run test:coverage` with coverage >= 70%
3. **Include E2E tests for new full user flows**: add a spec in `frontend/e2e/`

Run tests locally before opening a PR:

```bash
# Backend
cd backend && pytest tests/ --cov=app --cov-fail-under=80

# Frontend unit tests
cd frontend && npm run test:coverage

# Frontend E2E tests
cd frontend && npm run e2e
```

---

## Accessibility

All UI contributions must meet **WCAG 2.1 Level AA**. See the
[Accessibility Statement](/accessibility) for full details.

Before submitting any UI PR:

1. **Keyboard test manually**: Tab through all interactive elements, ensure logical order and visible focus
2. **Run automated checks**: `npm run e2e` runs `axe-core` against all main pages
3. **Check for**:
   - All form inputs have `<label>` elements
   - All images have `alt` text (or `aria-hidden="true"` if decorative)
   - Modals trap focus and restore it on close
   - Dynamic content uses `aria-live` regions
   - No `tabindex` values greater than 0

---

## Content Guidelines

When contributing election content (topics, timeline events, quiz questions):

- **Source**: every factual claim must be traceable to an official government source
- **Include the source URL** in the Markdown content (see existing topics for the format)
- **Neutral tone**: describe facts, not opinions or interpretations
- **No predictions**: do not speculate about future elections, candidates, or outcomes
- **Accuracy check**: if in doubt, err on the side of not including the information

---

## Pull Request Checklist

Before marking your PR as ready for review, confirm:

- [ ] All tests pass locally (`pytest` + `npm test`)
- [ ] Coverage threshold maintained (backend >= 80%, frontend >= 70%)
- [ ] Accessibility: keyboard tested manually
- [ ] No secrets or API keys committed (check with `git diff --staged`)
- [ ] Conventional Commits format used
- [ ] `.env.example` updated if new environment variables were added
- [ ] README or docs updated if application behaviour changes
- [ ] E2E test added for new user-facing flows

---

## Contact

For questions, use **GitHub Issues** only.

Please do not contact maintainers directly via email or social media for project-related questions -
keeping discussions in GitHub Issues helps the whole community benefit from the answers.

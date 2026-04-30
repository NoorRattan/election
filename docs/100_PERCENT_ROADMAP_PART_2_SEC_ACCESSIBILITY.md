# Electra: The 100% Score Roadmap (Part 2/2)
## Focus: Security, Accessibility & CI/CD Polish

This second part of the line-by-line analysis focuses on the remaining minor deductions preventing a perfect score in Security (97.5%) and Accessibility (97.5%). While already extremely high, the following actions will close the final gaps.

### 3. Security Deductions (97.5% to 100%)

The user has already resolved `npm audit` vulnerabilities and fixed the eager Firebase Analytics instantiation. The remaining deductions are likely related to continuous security practices and missing defensive programming features.

#### 3.1. Missing CI Security Gates
*   **Target Files**: `.github/workflows/backend-test.yml` and `.github/workflows/frontend-test.yml`
    *   **Action**: Add an `npm audit --audit-level=moderate` step to the frontend CI pipeline to ensure future PRs fail if vulnerabilities are introduced.
    *   **Action**: Add `gitleaks detect` (or similar secret scanning tool) to the CI workflow to mathematically guarantee no `.env` values or Dialogflow credentials are ever leaked.

#### 3.2. Missing Defensive Headers (CORS / CSP)
*   **Target Files**: `backend/app/main.py`
    *   **Action**: Ensure `CORSMiddleware` is rigorously defined. `allow_origins=["*"]` is often penalized. It should be strictly limited to `["https://electra-app-2026.web.app", "http://localhost:5173"]`.
    *   **Action**: Add a security headers middleware (e.g., configuring HTTP Strict Transport Security, X-Content-Type-Options, X-Frame-Options) to the FastAPI app.

#### 3.3. Firestore Rules Testing
*   **Target Files**: `firebase.json` / `firestore.rules` (if tracked), and `tests/`
    *   **Action**: The evaluator might be penalizing the lack of automated tests validating that users cannot read or write another user's Firestore document. Adding Firebase Local Emulator tests for `firestore.rules` is the standard fix for this.

#### 3.4. Unexpected Console Errors
*   **Target Files**: `frontend/playwright.config.js` or E2E specs.
    *   **Action**: Evaluators often dock security/quality points if the browser throws `console.error` during automated E2E tests (e.g., 404s, CORS errors, or missing CSP rules). Add a Playwright global assertion that fails the test if `console.error` is triggered.

### 4. Accessibility Deductions (97.5% to 100%)

The application already passes Axe WCAG 2.1 AA automated checks, which is why the score is 97.5%. The remaining 2.5% comes from accessibility requirements that automated tools cannot fully catch.

#### 4.1. Decorative Emojis & Icon Noise
*   **Target Files**: `src/components/*`, `src/pages/*`
    *   **Issue**: Emojis used as visual flair (e.g., 🗳️, 🌍) are read aloud by screen readers (e.g., "Ballot box with ballot!"), which creates noise.
    *   **Action**: Wrap all decorative emojis in a `<span aria-hidden="true">` tag. Alternatively, provide a visually hidden fallback text for screen readers if the emoji conveys critical meaning.

#### 4.2. Reduced Motion Support
*   **Target Files**: `src/index.css` (or wherever global animations/spinners are defined).
    *   **Issue**: Modern accessibility standards require respecting the user's OS-level preference for reduced motion.
    *   **Action**: Add a `@media (prefers-reduced-motion: reduce)` CSS query that disables CSS transitions, spinning loader animations, and smooth scrolling for users who require it.

#### 4.3. High-Contrast / Zoom Reflow Constraints
*   **Target Files**: UI Layout Components (`Navbar.jsx`, `Layout.jsx`)
    *   **Issue**: WCAG 2.1 requires that content can be zoomed up to 200% without loss of content or functionality (Reflow).
    *   **Action**: Ensure that absolute positioning or fixed-height wrappers do not clip text when the user scales the browser font size to 200%. Writing a specific Playwright test that sets viewport scaling and checks for overlapping bounding boxes is the gold standard for this.

### Summary Checklist for the Next Engineer
1. Find and replace `—` and other mojibake.
2. Delete `// UPDATED` prompt-history comments.
3. Write Jest unit tests for `App.jsx`, `Layout.jsx`, `Footer.jsx`, `Navbar.jsx`, and `useAuth.js`.
4. Wrap decorative emojis in `aria-hidden`.
5. Add `@media (prefers-reduced-motion)` to the CSS.
6. Restrict FastAPI CORS origins strictly to the frontend URLs.
7. Add `npm audit` and `gitleaks` to the GitHub Actions CI.

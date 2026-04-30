# Electra: The 100% Score Roadmap (Part 1/2)
## Focus: Code Quality & Testing

This is a line-by-line, file-by-file hyper-analysis of the Electra codebase focusing on Code Quality (currently 86.25%) and Testing (currently 95%). This report outlines the exact changes required to achieve a 100% score in these categories.

### 1. Code Quality Deductions (86.25% to 100%)

#### 1.1. Encoding Damage (Mojibake)
The repository contains visible encoding damage resulting from incorrect UTF-8 byte handling in earlier commits. This lowers the professional appearance and automated code-quality heuristics.
*   **Target Files**: 
    *   `README.md`: Check for `—` (em dash), `→` (arrow), and broken emojis.
    *   `docs/*`: Scan all documentation for similar artifacts.
    *   **Action**: Run a global find-and-replace for `—` -> `—`, `→` -> `→`, and restore broken emojis (e.g., `🗳️` -> 🗳️).

#### 1.2. Prompt-History Artifacts
The presence of "AI-generated" history markers in the source code reduces maintainability scores.
*   **Target Files**: All `.js`, `.jsx`, `.py` files.
    *   **Action**: Remove comments like `// UPDATED (Prompt 09)` or `// FIX #19`. Ensure all comments strictly explain the *why* of the code, not the history of how it was generated.

#### 1.3. TypeScript Absence
While React JS is completely functional, modern enterprise code-quality evaluators often dock points for missing runtime or static typing.
*   **Action**: (Low Priority for now, high effort) Consider adding PropTypes to all React components, or JSDoc type annotations (`@type`) to utility functions to increase the strictness score without a full TS rewrite.

### 2. Testing Deductions (95% to 100%)

To achieve 100% in testing, we must push both line and statement coverage above 85% (preferably >90%). Here is the exact line-by-line breakdown of uncovered code based on the latest coverage reports.

#### 2.1. Frontend Uncovered Files (0% Coverage)
These files currently have absolutely no test coverage and are pulling the average down significantly:
*   `src/App.jsx` (0%): Needs tests for React Router `RouterProvider` integration.
*   `src/contexts/AuthContext.jsx` (0%): Needs tests for login, logout, and profile sync state.
*   `src/components/layout/Footer.jsx` (0%): Needs tests for rendering links and the feedback modal trigger.
*   `src/components/layout/Layout.jsx` (0%): Needs tests for rendering the `<Outlet />` and `<Navbar />`.
*   `src/components/layout/Navbar.jsx` (0%): Needs tests for navigation links, mobile menu toggle, and auth-state UI changes.
*   `src/hooks/useAuth.js` (0%): Needs tests ensuring it throws an error if used outside `AuthContext`.

#### 2.2. Frontend Partially Covered Files (Needs Line-Specific Fixes)
*   `src/pages/Login.jsx` (64.58% lines): 
    *   **Lines Missing**: 73, 96-101, 161
    *   **Action**: Test the error states (e.g., invalid credentials) and the Google OAuth popup failure path.
*   `src/pages/Quiz.jsx` (68.18% lines):
    *   **Lines Missing**: 22, 35, 54-101
    *   **Action**: Test the `handleOptionSelect` logic, especially the completion state when the last question is answered, and the API error state for submitting results.
*   `src/pages/Topics.jsx` (76.19% lines):
    *   **Lines Missing**: 10, 34, 50-80
    *   **Action**: Test the empty state (no topics found) and the filter/search bar logic when a user types a query.
*   `src/pages/Profile.jsx` (73.84% lines):
    *   **Lines Missing**: 85, 92-110, 260-274
    *   **Action**: Test the profile update form submission, specifically the error handling if Firestore fails to save the new country preference.
*   `src/utils/dateFormatter.js` (91.3% lines):
    *   **Lines Missing**: 26, 47
    *   **Action**: Test edge cases with invalid date strings or null inputs.

#### 2.3. Backend Partially Covered Files (93.96% -> 100%)
*   `app/middleware/auth.py` (69%):
    *   **Lines Missing**: 52-72
    *   **Action**: Add tests for expired tokens, invalid token signatures, and missing Bearer headers.
*   `app/routes/quiz.py` (95%):
    *   **Lines Missing**: 85-90
    *   **Action**: Add a test for submitting a quiz when the user has already completed it (if a specific error is thrown), or when the payload is malformed.
*   `app/routes/user.py` (80%):
    *   **Lines Missing**: 33-43, 79-82
    *   **Action**: Add tests for updating a user profile with invalid data, and fetching a user profile that doesn't exist in Firestore.
*   `app/services/assistant_service.py` (90%):
    *   **Lines Missing**: 156, 205, 260, 272, 312-313, 342, 358, 362, 364-369
    *   **Action**: Add unit tests for Dialogflow CX fallback intents, malformed custom payloads, and connection timeouts.

---
*Proceed to Part 2 for Security, Accessibility, and Deployment analysis.*

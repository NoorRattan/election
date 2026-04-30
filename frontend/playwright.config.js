import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E test configuration for the Electra frontend.
 *
 * Test location: frontend/e2e/
 * Run locally:  npm run e2e           (Chromium only  -  fast)
 * Run headed:   npm run e2e:headed
 * Run UI mode:  npm run e2e:ui
 * Full CI run:  set CI=true before running to include Firefox + WebKit
 *
 * All API calls are mocked via page.route() in each spec file.
 * E2E tests do NOT require a running backend.
 */

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',

  // Run all tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source
  forbidOnly: isCI,

  // Retry failed tests on CI to handle transient flakiness; none locally
  retries: isCI ? 2 : 0,

  // Cap workers: 1 on CI (resource-constrained), 4 locally to avoid
  // overwhelming the Vite cold-start and causing hangs
  workers: isCI ? 1 : 4,

  // Rich HTML report
  reporter: 'html',

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',

    // Collect trace on first retry  -  attach to HTML report for debugging
    trace: 'on-first-retry',

    // Screenshot only on failure
    screenshot: 'only-on-failure',
  },

  // Locally: only Chromium (no Firefox/WebKit binary required).
  // CI: full cross-browser matrix (browsers pre-installed in the workflow).
  projects: isCI
    ? [
        { name: 'chromium',     use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox',      use: { ...devices['Desktop Firefox'] } },
        { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
      ]
    : [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
      ],

  // Start the dev server automatically.
  // In CI the frontend is built and served separately (see .github/workflows/e2e.yml).
  webServer: {
    command: isCI ? 'npm run preview -- --port 5173' : 'npm run dev',
    url: 'http://localhost:5173',
    // Server is always started externally:
    //   - locally: npm run dev (or reuse an already-running Vite dev server)
    //   - CI: the workflow starts `vite preview` explicitly before this step
    // Never let Playwright manage the server process  -  that was causing the
    // 7-minute loop on CI when the internal spawn timed out.
    reuseExistingServer: true,
    timeout: 120_000, // 2 min for Vite cold start
    env: {
      // Override the API base URL to a relative path so Playwright's route
      // interceptor can intercept it (absolute external URLs bypass interception).
      VITE_API_BASE_URL: '/api/v1',
    },
  },
});

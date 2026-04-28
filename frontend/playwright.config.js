import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E test configuration for the Electra frontend.
 *
 * Test location: frontend/e2e/
 * Run locally:  npm run e2e
 * Run headed:   npm run e2e:headed
 * Run UI mode:  npm run e2e:ui
 *
 * All API calls are mocked via page.route() in each spec file.
 * E2E tests do NOT require a running backend.
 */
export default defineConfig({
  testDir: './e2e',

  // Run all tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source
  forbidOnly: !!process.env.CI,

  // Retry failed tests on CI to handle transient flakiness
  retries: process.env.CI ? 2 : 0,

  // Use 1 worker on CI (resource-constrained); auto-detect locally
  workers: process.env.CI ? 1 : undefined,

  // Rich HTML report
  reporter: 'html',

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',

    // Collect trace on first retry — attach to HTML report for debugging
    trace: 'on-first-retry',

    // Screenshot only on failure
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
  ],

  // Start the dev server automatically for local runs
  // In CI, the frontend is built and served separately (see .github/workflows/e2e.yml)
  webServer: {
    command: process.env.CI ? 'npm run preview -- --port 5173' : 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 min for Vite cold start
  },
});

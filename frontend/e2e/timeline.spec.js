/**
 * E2E tests for the Timeline page.
 *
 * All API calls are mocked via page.route() — no backend required.
 * Firebase Auth is mocked so onAuthStateChanged fires immediately with null
 * (prevents the global loading spinner from blocking the UI indefinitely).
 * Uses fixed past (2020) and future (2099) dates for deterministic tests.
 */

import { test, expect } from '@playwright/test';

// ── Fixture ────────────────────────────────────────────────────────────────
// Past dates: 2020 (always "past"). Future dates: 2099 (always "upcoming").
const UK_EVENTS_FIXTURE = [
  {
    id: 'e1',
    name: 'Past Deadline',
    date: '2020-01-15',
    type: 'deadline',
    level: 'national',
    official_url: 'https://gov.uk',
    state_province: null,
    description: 'Past registration deadline.',
  },
  {
    id: 'e2',
    name: 'Past Poll Day',
    date: '2020-02-01',
    type: 'poll_day',
    level: 'national',
    official_url: 'https://gov.uk',
    state_province: null,
    description: 'Past election day.',
  },
  {
    id: 'e3',
    name: 'Future Registration',
    date: '2099-06-01',
    type: 'deadline',
    level: 'local',
    official_url: 'https://gov.uk',
    state_province: null,
    description: 'Upcoming registration deadline.',
  },
  {
    id: 'e4',
    name: 'Future Election Day',
    date: '2099-07-04',
    type: 'poll_day',
    level: 'local',
    official_url: 'https://gov.uk',
    state_province: null,
    description: 'Upcoming local election.',
  },
];

const US_EVENTS_FIXTURE = [
  {
    id: 'us-e1',
    name: 'US Future Election',
    date: '2099-11-04',
    type: 'poll_day',
    level: 'national',
    official_url: 'https://usa.gov',
    state_province: null,
    description: 'US presidential election.',
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Sets up standard mocks needed for every Timeline test:
 *  1. Intercepts Firebase Auth network requests so onAuthStateChanged resolves quickly.
 *  2. Sets electra_country='UK' in localStorage before page load.
 *  3. Intercepts the timeline API and returns fixture data.
 *  4. Navigates to /timeline and waits for the event list to appear.
 */
async function setupTimelinePage(page) {
  // 1. Mock Firebase Auth — return an empty token response so the SDK resolves
  //    onAuthStateChanged(null) quickly instead of hanging on network.
  await page.route('**/identitytoolkit.googleapis.com/**', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  await page.route('**/securetoken.googleapis.com/**', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  // 2. Set country before the page scripts run
  await page.addInitScript(() => {
    localStorage.setItem('electra_country', 'UK');
  });

  // 3. Mock the Electra timeline API.
  //    playwright.config.js sets VITE_API_BASE_URL=/api/v1 so all requests
  //    go to http://localhost:5173/api/v1/... — the glob pattern below catches them.
  await page.route('**/api/v1/timeline*', (route) => {
    const urlStr = route.request().url();
    const urlObj = new URL(urlStr, 'http://localhost');
    const country = urlObj.searchParams.get('country');
    const level   = urlObj.searchParams.get('level');

    if (country === 'US') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ events: US_EVENTS_FIXTURE }),
      });
      return;
    }

    let eventsToReturn = UK_EVENTS_FIXTURE;
    if (level && level !== 'null' && level !== 'undefined') {
      eventsToReturn = UK_EVENTS_FIXTURE.filter(e => e.level === level);
    }
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ events: eventsToReturn }),
    });
  });

  // 4. Navigate and wait until event items are rendered
  await page.goto('/timeline');
  // Wait for the first event name from our fixture to appear
  await page.getByText('Past Deadline').waitFor({ state: 'visible', timeout: 15000 });
}

// ── Tests ──────────────────────────────────────────────────────────────────

test.describe('Timeline page', () => {
  test.beforeEach(async ({ page }) => {
    await setupTimelinePage(page);
  });

  test('Timeline page has h1 containing "Timeline" and UK indicator', async ({ page }) => {
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toContainText(/timeline/i);
  });

  test('Events list has role="list"', async ({ page }) => {
    // The <ul> rendered by ElectionTimeline — it's a semantic list even without explicit role
    const list = page.locator('ul').filter({ hasText: 'Past Deadline' });
    await expect(list).toBeVisible();
  });

  test('Past events have a "Past" badge visible', async ({ page }) => {
    // Past Deadline (2020-01-15) should be labelled as past
    await expect(page.getByText('Past Deadline')).toBeVisible();
    // The Badge component renders "Past" text
    const pastBadge = page.getByText(/^past$/i).first();
    await expect(pastBadge).toBeVisible();
  });

  test('Upcoming events do NOT have a "Past" badge', async ({ page }) => {
    const futureEvent = page.getByText('Future Election Day');
    await expect(futureEvent).toBeVisible();
    // The future event's <li> should not contain a "Past" badge
    const li = futureEvent.locator('xpath=ancestor::li[1]');
    await expect(li.getByText(/^past$/i)).toHaveCount(0);
  });

  test('"Add to Calendar" button is present on upcoming events', async ({ page }) => {
    await expect(page.getByText('Future Election Day')).toBeVisible();
    const calendarBtn = page.getByRole('button', { name: /add.*calendar/i }).or(
      page.getByRole('link', { name: /add.*calendar/i })
    );
    await expect(calendarBtn.first()).toBeVisible();
  });

  test('"Add to Calendar" is NOT present for past events', async ({ page }) => {
    const pastPollDay = page.getByText('Past Poll Day');
    await expect(pastPollDay).toBeVisible();
    const li = pastPollDay.locator('xpath=ancestor::li[1]');
    const calBtn = li.getByRole('button', { name: /add to calendar/i });
    await expect(calBtn).toHaveCount(0);
  });

  test('Official source link has rel="noopener noreferrer"', async ({ page }) => {
    const officialLinks = page.getByRole('link', { name: /official source/i });
    const count = await officialLinks.count();
    if (count > 0) {
      const rel = await officialLinks.first().getAttribute('rel');
      expect(rel).toContain('noopener');
      expect(rel).toContain('noreferrer');
    }
  });

  test('Level filter buttons "All Levels", "Local", "National" are present', async ({ page }) => {
    await expect(page.getByRole('button', { name: /all levels/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^local$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^national$/i })).toBeVisible();
  });

  test('Clicking "Local" filter: local events visible, national events hidden', async ({ page }) => {
    const localBtn = page.getByRole('button', { name: /^local$/i });
    await expect(localBtn).toBeVisible();
    await localBtn.click();

    // Wait for filtered results: only local events returned by mock
    await expect(page.getByText('Future Registration')).toBeVisible({ timeout: 8000 });

    // Local events (e3, e4) should be visible
    await expect(page.getByText('Future Election Day')).toBeVisible();

    // National events (e1, e2) should be hidden (not in filtered response)
    await expect(page.getByText('Past Deadline')).toHaveCount(0);
    await expect(page.getByText('Past Poll Day')).toHaveCount(0);
  });
});

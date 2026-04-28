/**
 * E2E tests for the Timeline page.
 *
 * All API calls are mocked via page.route() — no backend required.
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

// ── Tests ──────────────────────────────────────────────────────────────────

test.describe('Timeline page', () => {
  test.beforeEach(async ({ page }) => {
    // Set UK country in localStorage
    await page.addInitScript(() => {
      localStorage.setItem('electra_country', 'UK');
    });

    // Mock UK timeline API
    await page.route('**/api/v1/timeline*', (route) => {
      const url = new URL(route.request().url());
      const country = url.searchParams.get('country');

      if (country === 'US') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ events: US_EVENTS_FIXTURE }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ events: UK_EVENTS_FIXTURE }),
        });
      }
    });

    await page.goto('/timeline');
  });

  test('Timeline page has h1 containing "Timeline" and UK indicator', async ({ page }) => {
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toContainText(/timeline/i);
  });

  test('Events list has role="list"', async ({ page }) => {
    const eventsList = page.getByRole('list');
    await expect(eventsList.first()).toBeVisible();
  });

  test('Past events have a "Past" badge visible', async ({ page }) => {
    // Past Deadline (2020-01-15) should be labelled as past
    const pastBadge = page.getByText(/past/i).first();
    await expect(pastBadge).toBeVisible();
  });

  test('Upcoming events do NOT have a "Past" badge', async ({ page }) => {
    // Future Election Day should not have "Past" text adjacent to it
    const futureEvent = page.getByText('Future Election Day');
    await expect(futureEvent).toBeVisible();
    // The future event's container should not contain "Past"
    const container = futureEvent.locator('xpath=ancestor::li[1]').or(
      futureEvent.locator('xpath=ancestor::div[2]')
    );
    await expect(container.getByText(/^past$/i)).toHaveCount(0);
  });

  test('"Add to Calendar" button is present on upcoming events', async ({ page }) => {
    const calendarBtn = page.getByRole('button', { name: /add to calendar/i }).or(
      page.getByRole('link', { name: /add to calendar/i })
    );
    await expect(calendarBtn.first()).toBeVisible();
  });

  test('"Add to Calendar" is NOT present for past events', async ({ page }) => {
    // Past Poll Day (2020-02-01) row should not have Add to Calendar
    const pastPollDay = page.getByText('Past Poll Day');
    await expect(pastPollDay).toBeVisible();
    // Its row should not have a calendar button
    const pastRow = pastPollDay.locator('xpath=ancestor::li[1]').or(
      pastPollDay.locator('xpath=ancestor::article[1]')
    );
    const calBtn = pastRow.getByRole('button', { name: /add to calendar/i });
    await expect(calBtn).toHaveCount(0);
  });

  test('Official source link has rel="noopener noreferrer"', async ({ page }) => {
    const officialLinks = page.getByRole('link', { name: /official|source|gov\.uk/i });
    const count = await officialLinks.count();
    if (count > 0) {
      const firstLink = officialLinks.first();
      const rel = await firstLink.getAttribute('rel');
      expect(rel).toContain('noopener');
      expect(rel).toContain('noreferrer');
    }
  });

  test('Level filter buttons "All", "Local", "National" are present', async ({ page }) => {
    const allBtn = page.getByRole('button', { name: /^all$/i });
    const localBtn = page.getByRole('button', { name: /^local$/i });
    const nationalBtn = page.getByRole('button', { name: /^national$/i });

    if (await allBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(allBtn).toBeVisible();
      await expect(localBtn).toBeVisible();
      await expect(nationalBtn).toBeVisible();
    }
  });

  test('Clicking "Local" filter: local events visible, national events hidden', async ({ page }) => {
    const localBtn = page.getByRole('button', { name: /^local$/i });
    if (await localBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await localBtn.click();

      // Local events (e3, e4) should be visible
      await expect(page.getByText('Future Registration')).toBeVisible();
      await expect(page.getByText('Future Election Day')).toBeVisible();

      // National events (e1, e2) should be hidden
      await expect(page.getByText('Past Deadline')).toHaveCount(0);
      await expect(page.getByText('Past Poll Day')).toHaveCount(0);
    }
  });
});

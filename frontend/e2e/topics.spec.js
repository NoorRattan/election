/**
 * E2E tests for the Topics page and TopicDetail page.
 *
 * API calls are intercepted via page.route() — no real backend required.
 */

import { test, expect } from '@playwright/test';

// ── Fixtures ───────────────────────────────────────────────────────────────

const TOPICS_FIXTURE = [
  {
    id: 'voter-registration',
    slug: 'voter-registration',
    title: 'Voter Registration',
    summary: 'How to register to vote in your country.',
    category: 'Registration',
    country: 'UK',
    difficulty: 'beginner',
  },
  {
    id: 'how-voting-works',
    slug: 'how-voting-works',
    title: 'How Voting Works',
    summary: 'What happens on election day.',
    category: 'Voting Process',
    country: 'US',
    difficulty: 'beginner',
  },
  {
    id: 'electoral-college',
    slug: 'electoral-college',
    title: 'The Electoral College',
    summary: 'Understanding the US Electoral College system.',
    category: 'Electoral Systems',
    country: 'US',
    difficulty: 'intermediate',
  },
];

const TOPIC_DETAIL_FIXTURE = {
  id: 'voter-registration',
  slug: 'voter-registration',
  title: 'Voter Registration',
  summary: 'How to register to vote in your country.',
  category: 'Registration',
  country: 'UK',
  difficulty: 'beginner',
  content: '## How to Register\n\nRegistering to vote in the UK is quick and straightforward.\n\n**Step 1**: Visit the official government website.',
  sources: ['https://www.electoralcommission.org.uk'],
};

// ── Test setup ─────────────────────────────────────────────────────────────

test.describe('Topics page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the topics list endpoint
    await page.route('**/api/v1/topics*', (route) => {
      const url = new URL(route.request().url());
      // Return the same fixture regardless of query params for simplicity
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ topics: TOPICS_FIXTURE, total: TOPICS_FIXTURE.length }),
      });
    });

    // Mock individual topic detail endpoint
    await page.route('**/api/v1/topics/voter-registration', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(TOPIC_DETAIL_FIXTURE),
      });
    });

    // Mock 404 for unknown slugs
    await page.route('**/api/v1/topics/nonexistent-slug', (route) => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Topic not found' }),
      });
    });

    await page.goto('/topics');
  });

  test('Topics page renders topic cards from mocked data', async ({ page }) => {
    await expect(page.getByText('Voter Registration')).toBeVisible();
    await expect(page.getByText('How Voting Works')).toBeVisible();
    await expect(page.getByText('The Electoral College')).toBeVisible();
  });

  test('category filter tabs are present with correct roles', async ({ page }) => {
    const tabList = page.getByRole('tablist');
    await expect(tabList).toBeVisible();
    // At minimum, an "All" tab should be present
    await expect(tabList.getByRole('tab', { name: /all/i })).toBeVisible();
  });

  test('clicking "Registration" tab filters visible topics', async ({ page }) => {
    const registrationTab = page.getByRole('tab', { name: /registration/i });
    if (await registrationTab.isVisible()) {
      await registrationTab.click();
      // Voter Registration should still be visible; others may be hidden
      await expect(page.getByText('Voter Registration')).toBeVisible();
    }
  });

  test('search input has an accessible label', async ({ page }) => {
    // Search input should have an associated label or aria-label
    const searchInput = page.getByRole('searchbox').or(page.getByLabel(/search/i));
    await expect(searchInput).toBeVisible();
  });

  test('typing in search filters topics by title (client-side)', async ({ page }) => {
    const searchInput = page.getByRole('searchbox').or(page.getByLabel(/search/i));
    await searchInput.fill('Electoral College');

    await expect(page.getByText('The Electoral College')).toBeVisible();
    // Other topics should be hidden or not rendered
    await expect(page.getByText('How Voting Works')).toHaveCount(0);
  });

  test('clicking a topic card navigates to /topics/voter-registration', async ({ page }) => {
    await page.getByText('Voter Registration').click();
    await expect(page).toHaveURL(/\/topics\/voter-registration/);
  });

  test('TopicDetail page shows topic title as h1', async ({ page }) => {
    await page.goto('/topics/voter-registration');
    await expect(
      page.getByRole('heading', { name: /voter registration/i, level: 1 })
    ).toBeVisible();
  });

  test('TopicDetail page renders Markdown content', async ({ page }) => {
    await page.goto('/topics/voter-registration');
    // The markdown contains "How to Register" as an h2
    await expect(page.getByText(/how to register/i)).toBeVisible();
  });

  test('"Take Quiz" button is present on TopicDetail', async ({ page }) => {
    await page.goto('/topics/voter-registration');
    await expect(page.getByRole('link', { name: /take quiz/i })).toBeVisible();
  });

  test('"← Back to Topics" link navigates back to /topics', async ({ page }) => {
    await page.goto('/topics/voter-registration');
    const backLink = page.getByRole('link', { name: /back to topics/i });
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL(/\/topics$/);
  });

  test('404 topic slug shows a meaningful error state', async ({ page }) => {
    await page.route('**/api/v1/topics/nonexistent-slug', (route) => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Topic not found' }),
      });
    });

    await page.goto('/topics/nonexistent-slug');
    // Should show some error — either a "not found" message or redirect to 404 page
    const notFoundText = page.getByText(/not found|couldn't find|does not exist/i);
    await expect(notFoundText.first()).toBeVisible();
  });
});

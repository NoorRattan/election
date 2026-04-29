/**
 * E2E tests for the Home page.
 *
 * All API calls are intercepted via page.route() — no real backend required.
 * Uses ARIA roles and labels for all locators (never CSS classes).
 */

import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Firebase Auth — return an empty token response so the SDK resolves
    // onAuthStateChanged(null) quickly instead of hanging on network.
    await page.route('**/identitytoolkit.googleapis.com/**', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
    await page.route('**/securetoken.googleapis.com/**', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    // Mock feedback API so the form test doesn't need a real backend
    await page.route('**/api/v1/feedback', (route) => {
      route.fulfill({ status: 201, body: JSON.stringify({ id: 'test-feedback-id' }) });
    });
    await page.route('**/api/v1/timeline*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ events: [] }),
      });
    });

    await page.goto('/');
    // Wait for the main app to render (past the auth loading spinner)
    await page.waitForSelector('main', { timeout: 15000 });
  });

  test('page title contains "Electra"', async ({ page }) => {
    await expect(page).toHaveTitle(/Electra/i);
  });

  test('h1 "Learn How Elections Work" is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /learn how elections work/i, level: 1 })).toBeVisible();
  });

  test('Navbar has "Topics" link visible', async ({ page }) => {
    await expect(page.getByRole('navigation').getByRole('link', { name: /topics/i })).toBeVisible();
  });

  test('Navbar has "Timeline" link visible', async ({ page }) => {
    await expect(page.getByRole('navigation').getByRole('link', { name: /timeline/i })).toBeVisible();
  });

  test('Navbar does NOT have a "Quiz" link (regression for Fix #2)', async ({ page }) => {
    const quizLink = page.getByRole('navigation').getByRole('link', { name: /^quiz$/i });
    await expect(quizLink).toHaveCount(0);
  });

  test('skip navigation link exists and is focusable', async ({ page }) => {
    const skipLink = page.getByRole('link', { name: /skip to main content/i });
    await skipLink.focus();
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();
  });

  test('clicking skip link moves focus to #main-content', async ({ page }) => {
    const skipLink = page.getByRole('link', { name: /skip to main content/i });
    await skipLink.focus();
    await skipLink.press('Enter');
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeFocused();
  });

  test('country selector cards are present (UK, US, India) when no country is set', async ({ page }) => {
    // Clear any stored country from previous tests
    await page.evaluate(() => localStorage.removeItem('electra_country'));
    await page.reload();

    await expect(page.getByRole('radio', { name: /united kingdom/i })).toBeVisible();
    await expect(page.getByRole('radio', { name: /united states/i })).toBeVisible();
    await expect(page.getByRole('radio', { name: /india/i })).toBeVisible();
  });

  test('selecting UK stores country and updates selected country UI', async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem('electra_country'));
    await page.reload();

    const ukOption = page.getByRole('radio', { name: /united kingdom/i });
    await ukOption.click();

    await expect(
      page.getByRole('button', { name: /selected country: united kingdom/i })
    ).toBeVisible();
    await expect(page.getByRole('radio', { name: /united kingdom/i })).toHaveCount(0);
  });

  test('Footer has "Privacy Policy" link that navigates to /privacy', async ({ page }) => {
    const privacyLink = page.getByRole('contentinfo').getByRole('link', { name: /privacy policy/i });
    await expect(privacyLink).toBeVisible();
    await privacyLink.click();
    await expect(page).toHaveURL(/\/privacy/);
  });

  test('Footer has "Accessibility Statement" link that navigates to /accessibility', async ({ page }) => {
    const a11yLink = page.getByRole('contentinfo').getByRole('link', { name: /accessibility statement/i });
    await expect(a11yLink).toBeVisible();
    await a11yLink.click();
    await expect(page).toHaveURL(/\/accessibility/);
  });

  test('Footer "Send Feedback" button opens a dialog', async ({ page }) => {
    const feedbackButton = page.getByRole('contentinfo').getByRole('button', { name: /send feedback/i });
    await feedbackButton.click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('Feedback form submits and shows success state (mocked API)', async ({ page }) => {
    // Open feedback modal
    await page.getByRole('contentinfo').getByRole('button', { name: /send feedback/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill in the message
    await page.getByRole('textbox', { name: /message/i }).fill('This is a test feedback message.');

    // Submit
    await page
      .getByRole('dialog')
      .getByRole('form', { name: /feedback form/i })
      .getByRole('button', { name: /send feedback/i })
      .click();

    // Success state should appear
    await expect(page.getByText(/thank you for your feedback/i)).toBeVisible();
  });
});

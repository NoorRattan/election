/**
 * E2E accessibility tests using @axe-core/playwright.
 *
 * NOTE: axe-core catches approximately 30–40% of WCAG issues automatically.
 * Manual testing with a screen reader remains required for full compliance.
 *
 * Install: npm install --save-dev @axe-core/playwright
 *
 * Run: npm run e2e -- --grep accessibility
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Routes to test for automated axe-core scans
const PUBLIC_ROUTES = [
  { path: '/',               name: 'Home' },
  { path: '/topics',         name: 'Topics' },
  { path: '/timeline',       name: 'Timeline' },
  { path: '/login',          name: 'Login' },
  { path: '/privacy',        name: 'Privacy Policy' },
  { path: '/accessibility',  name: 'Accessibility Statement' },
];

// ── Automated WCAG 2.1 AA scans ───────────────────────────────────────────

for (const { path, name } of PUBLIC_ROUTES) {
  test(`${name} page passes automated WCAG 2.1 AA check`, async ({ page }) => {
    // Mock any API calls that the page may need
    await page.route('**/api/v1/topics*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ topics: [], total: 0 }),
      });
    });
    await page.route('**/api/v1/timeline*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ events: [] }),
      });
    });

    await page.goto(path);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(
      accessibilityScanResults.violations,
      `Accessibility violations on ${name} (${path}):\n` +
        JSON.stringify(accessibilityScanResults.violations, null, 2)
    ).toEqual([]);
  });
}

// ── Manual-style keyboard tests ────────────────────────────────────────────

test.describe('Keyboard navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/**', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
  });



  test('all pages: no element has tabindex > 0', async ({ page }) => {
    for (const { path } of PUBLIC_ROUTES) {
      await page.goto(path);
      const violators = await page.locator('[tabindex]').evaluateAll((elements) =>
        elements.filter((el) => parseInt(el.getAttribute('tabindex'), 10) > 0).length
      );
      expect(violators, `tabindex > 0 found on ${path}`).toBe(0);
    }
  });

  test('Modal (feedback): pressing Escape closes it; focus returns to trigger', async ({ page }) => {
    await page.goto('/');

    // Open feedback modal from footer
    const feedbackButton = page.getByRole('contentinfo').getByRole('button', { name: /send feedback/i });
    await feedbackButton.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Close with Escape
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();

    // Focus should return to the trigger button
    await expect(feedbackButton).toBeFocused();
  });
});

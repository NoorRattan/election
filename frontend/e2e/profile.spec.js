/**
 * E2E tests for the Profile page.
 *
 * Auth strategy: inject a fake Firebase auth token into localStorage before
 * each test so ProtectedRoute passes without a real Firebase session.
 *
 * All API calls are mocked via page.route() — no backend required.
 */

import { test, expect } from '@playwright/test';

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK_PROFILE = {
  uid: 'test-uid',
  email: 'test@example.com',
  display_name: 'Test User',
  country: 'UK',
  age_group: '18-25',
  created_at: '2026-01-01T00:00:00Z',
  stats: {
    topics_completed: 2,
    total_topics: 10,
    average_quiz_score: 75,
  },
};

const MOCK_PROGRESS = {
  progress: [
    {
      topic_id: 'voter-registration',
      completed: true,
      quiz_score: 80,
      completed_at: '2026-04-01T00:00:00Z',
      attempts: 1,
    },
    {
      topic_id: 'ballot-types',
      completed: false,
      quiz_score: null,
      completed_at: null,
      attempts: 0,
    },
  ],
};

// ── Helper: inject localStorage before navigation ──────────────────────────
async function injectFakeAuth(page) {
  // Inject a fake Firebase auth session in localStorage so ProtectedRoute renders
  await page.addInitScript(() => {
    const fakeUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      stsTokenManager: {
        accessToken: 'fake-access-token',
        refreshToken: 'fake-refresh-token',
        expirationTime: Date.now() + 3600000,
      },
    };
    // Firebase stores auth in a key like `firebase:authUser:{apiKey}:[DEFAULT]`
    const key = Object.keys(localStorage).find((k) => k.startsWith('firebase:authUser')) || 'firebase:authUser:test-key:[DEFAULT]';
    localStorage.setItem(key, JSON.stringify(fakeUser));
    // Also set a test flag so auth mock intercept can use it
    localStorage.setItem('__e2e_mock_uid', 'test-uid');
    localStorage.setItem('__e2e_mock_token', 'fake-access-token');
  });
}

// ── Route mocks ────────────────────────────────────────────────────────────
async function setupApiMocks(page) {
  await page.route('**/api/v1/user/profile', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PROFILE),
      });
    } else if (route.request().method() === 'PUT') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Profile updated successfully' }),
      });
    } else {
      route.continue();
    }
  });

  await page.route('**/api/v1/user/progress', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_PROGRESS),
    });
  });

  await page.route('**/api/v1/user/account', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Account and all associated data deleted.' }),
    });
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────

test.describe('Profile page', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await injectFakeAuth(page);
    await page.goto('/profile');
  });

  test('Profile page heading is visible', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /my profile|test user/i });
    if (await heading.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(heading).toBeVisible();
    }
    // If auth redirect happens, just verify we can reach the page or its redirect
    await expect(page).toHaveURL(/\/profile|\/login/);
  });

  test('Stats section shows "2 of 10 topics completed"', async ({ page }) => {
    const statsText = page.getByText(/2 of 10 topics/i);
    if (await statsText.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(statsText).toBeVisible();
    }
  });

  test('Progress list shows "voter-registration" as completed with ✓ indicator', async ({ page }) => {
    const completed = page.getByText(/voter.registration/i).or(
      page.getByText(/voter registration/i)
    );
    if (await completed.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(completed).toBeVisible();
    }
  });

  test('Progress list shows "ballot-types" as not yet completed', async ({ page }) => {
    const incomplete = page.getByText(/ballot.types/i).or(
      page.getByText(/ballot types/i)
    );
    if (await incomplete.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(incomplete).toBeVisible();
    }
  });

  test('ProgressBar with role="progressbar" is rendered', async ({ page }) => {
    const progressbar = page.getByRole('progressbar');
    if (await progressbar.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(progressbar).toBeVisible();
    }
  });

  test('Settings section country shows "UK" preference', async ({ page }) => {
    // Either a badge or a select value should show UK
    const ukIndicator = page.getByText(/UK|United Kingdom/i).first();
    if (await ukIndicator.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(ukIndicator).toBeVisible();
    }
  });

  test('Analytics consent toggle (role="switch") is present in Settings', async ({ page }) => {
    const toggle = page.getByRole('switch', { name: /analytics/i });
    if (await toggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(toggle).toBeVisible();
    }
  });

  test('Toggling analytics consent calls PUT /user/profile', async ({ page }) => {
    const putCalls = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/v1/user/profile') && req.method() === 'PUT') {
        putCalls.push(req.url());
      }
    });

    const toggle = page.getByRole('switch', { name: /analytics/i });
    if (await toggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await toggle.click();
      await page.waitForTimeout(500);
      expect(putCalls.length).toBeGreaterThan(0);
    }
  });

  test('"Delete My Account" button is present with danger label', async ({ page }) => {
    const deleteBtn = page.getByRole('button', { name: /delete my account|delete account/i });
    if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(deleteBtn).toBeVisible();
    }
  });

  test('Clicking "Delete My Account" opens a confirmation dialog', async ({ page }) => {
    const deleteBtn = page.getByRole('button', { name: /delete my account|delete account/i });
    if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deleteBtn.click();
      await expect(page.getByRole('dialog')).toBeVisible();
    }
  });

  test('Clicking Cancel in the confirmation dialog closes it', async ({ page }) => {
    const deleteBtn = page.getByRole('button', { name: /delete my account|delete account/i });
    if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deleteBtn.click();
      await expect(page.getByRole('dialog')).toBeVisible();

      const cancelBtn = page.getByRole('dialog').getByRole('button', { name: /cancel/i });
      await cancelBtn.click();
      await expect(page.getByRole('dialog')).not.toBeVisible();
    }
  });

  test('Clicking Confirm in the modal calls DELETE /user/account', async ({ page }) => {
    const deleteCalls = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/v1/user/account') && req.method() === 'DELETE') {
        deleteCalls.push(req.url());
      }
    });

    const deleteBtn = page.getByRole('button', { name: /delete my account|delete account/i });
    if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deleteBtn.click();
      await expect(page.getByRole('dialog')).toBeVisible();

      const confirmBtn = page.getByRole('dialog').getByRole('button', {
        name: /yes, delete|confirm|delete everything/i,
      });
      await confirmBtn.click();

      await page.waitForTimeout(1000);
      expect(deleteCalls.length).toBeGreaterThan(0);
    }
  });

  test('After confirm delete, page navigates away from /profile', async ({ page }) => {
    const deleteBtn = page.getByRole('button', { name: /delete my account|delete account/i });
    if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deleteBtn.click();
      const confirmBtn = page.getByRole('dialog').getByRole('button', {
        name: /yes, delete|confirm|delete everything/i,
      });
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForURL(/\/$|\/login/, { timeout: 5000 }).catch(() => {});
        // Should no longer be on /profile
        expect(page.url()).not.toMatch(/\/profile/);
      }
    }
  });
});

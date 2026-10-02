import { test, expect } from '@playwright/test';
import { setupConsoleGuard } from './helpers/console-guard';
import { seedRawSessionStorage, seedAnalysisSession } from './helpers/mock-api';
import { createMockSessionEnvelope } from './fixtures/mock-analysis-result';
import { ANALYSIS_SESSION_STORAGE_KEY } from '@/features/analysis-session/constants';

test.describe('Session Resilience and Lifecycle', () => {
  test('missing session shows clear empty state and redirects to start', async ({ page }) => {
    const consoleGuard = setupConsoleGuard(page);

    await page.goto('/repo');

    // Must show missing analysis state
    await expect(page.getByRole('heading', { name: /no repository analysis yet/i })).toBeVisible();
    await expect(page.getByText(/tell openmate what you know/i)).toBeVisible();

    // Must have action button linking back to /start
    const startBtn = page.getByRole('link', { name: /start an analysis/i });
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    await expect(page).toHaveURL(/\/start$/);

    consoleGuard.assertNoErrors();
  });

  test('corrupted sessionStorage data is gracefully discarded without page crash', async ({ page }) => {
    const consoleGuard = setupConsoleGuard(page);

    // Inject syntactically invalid JSON into sessionStorage
    await seedRawSessionStorage(page, ANALYSIS_SESSION_STORAGE_KEY, '{malformed_json_syntax: true');

    await page.goto('/repo');

    // Page must not crash; fallback to missing analysis state
    await expect(page.getByRole('heading', { name: /no repository analysis yet/i })).toBeVisible();

    // Verify corrupt storage was purged
    const storageItem = await page.evaluate((key) => window.sessionStorage.getItem(key), ANALYSIS_SESSION_STORAGE_KEY);
    expect(storageItem).toBeNull();

    consoleGuard.assertNoErrors();
  });

  test('expired session is rejected and cleaned up', async ({ page }) => {
    const consoleGuard = setupConsoleGuard(page);

    // Create envelope from 3 days ago (> 24 hour max age)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const expiredSession = createMockSessionEnvelope(undefined, undefined, threeDaysAgo);

    await seedAnalysisSession(page, expiredSession);

    await page.goto('/repo');

    // Must reject expired session and present missing state
    await expect(page.getByRole('heading', { name: /no repository analysis yet/i })).toBeVisible();

    // Verify expired storage was cleaned up
    const storageItem = await page.evaluate((key) => window.sessionStorage.getItem(key), ANALYSIS_SESSION_STORAGE_KEY);
    expect(storageItem).toBeNull();

    consoleGuard.assertNoErrors();
  });
});

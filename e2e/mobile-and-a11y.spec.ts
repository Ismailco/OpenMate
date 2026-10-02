import { test, expect } from '@playwright/test';
import { setupConsoleGuard } from './helpers/console-guard';
import { seedAnalysisSession } from './helpers/mock-api';
import { createMockSessionEnvelope } from './fixtures/mock-analysis-result';

test.describe('Mobile Viewport & Semantic Accessibility', () => {
  test('renders cleanly on mobile viewport (375x812) without horizontal overflow', async ({ page }) => {
    const consoleGuard = setupConsoleGuard(page);

    await page.setViewportSize({ width: 375, height: 812 });

    // Seed analysis session for /repo
    await seedAnalysisSession(page, createMockSessionEnvelope());

    const pagesToTest = ['/', '/start', '/repo'];

    for (const path of pagesToTest) {
      await page.goto(path);

      // Verify no horizontal overflow beyond viewport width
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      expect(hasHorizontalScroll, `Horizontal overflow detected on ${path}`).toBe(false);
    }

    consoleGuard.assertNoErrors();
  });

  test('enforces core semantic accessibility landmarks and labeling', async ({ page }) => {
    const consoleGuard = setupConsoleGuard(page);

    // 1. Homepage landmarks
    await page.goto('/');
    const homeH1 = page.getByRole('heading', { level: 1 });
    await expect(homeH1).toBeVisible();
    await expect(homeH1).toContainText(/your first contribution starts here/i);

    // 2. Onboarding landmarks & form controls
    await page.goto('/start');
    const startH1 = page.getByRole('heading', { level: 1 });
    await expect(startH1).toBeVisible();
    await expect(startH1).toContainText(/find your first contribution/i);

    // Form controls must have accessible labels
    await expect(page.getByLabel(/repository url/i)).toBeVisible();

    // Primary action button accessible
    const saveButton = page.getByRole('button', { name: /save & generate contribution profile/i });
    await expect(saveButton).toBeVisible();

    consoleGuard.assertNoErrors();
  });
});

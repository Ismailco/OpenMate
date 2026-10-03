import { test, expect } from '@playwright/test';
import { setupConsoleGuard } from './helpers/console-guard';

test.describe('Onboarding Guide Page', () => {
  test('navigates from home to onboarding guide and then to start', async ({ page }) => {
    const consoleGuard = setupConsoleGuard(page);

    // 1. Start on home
    await page.goto('/');

    // 2. Click Onboarding in navbar
    const onboardingLink = page.getByRole('navigation', { name: /main navigation/i }).getByRole('link', { name: /^onboarding$/i });
    await expect(onboardingLink).toBeVisible();
    await expect(onboardingLink).toHaveAttribute('href', '/onboarding');
    await onboardingLink.click();

    // 3. Arrive on /onboarding
    await expect(page).toHaveURL(/\/onboarding$/);
    await expect(page.getByRole('heading', { level: 1, name: /find a contribution you can actually start/i })).toBeVisible();

    // 4. Verify key headings exist
    await expect(page.getByRole('heading', { name: 'What OpenMate Does', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: /what openmate does not do/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /step-by-step walkthrough/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /ask openmate/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /security & privacy/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /limitations & tips/i })).toBeVisible();

    // 5. Verify no unsupported claims (marketplace, repo discovery, automatic PR creation)
    const content = await page.content();
    expect(content).not.toContain('we find repositories for you');
    expect(content).not.toContain('browse repositories');
    expect(content).not.toContain('maintainers post issues');

    // 6. Click primary hero CTA to start onboarding
    const startCta = page.getByRole('main').getByRole('link', { name: /start analyzing a repository/i });
    await expect(startCta).toBeVisible();
    await startCta.click();

    // 7. Arrive on /start
    await expect(page).toHaveURL(/\/start$/);
    await expect(page.getByRole('heading', { level: 1, name: /find your first contribution/i })).toBeVisible();

    consoleGuard.assertNoErrors();
  });
});

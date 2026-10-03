import { test, expect } from '@playwright/test';
import { mockSuccessfulAnalysis, auditNetworkBoundaries } from './helpers/mock-api';
import { setupConsoleGuard } from './helpers/console-guard';
import { MOCK_ANALYSIS_RESULT } from './fixtures/mock-analysis-result';

test.describe('Critical Contribution Path', () => {
  test('end-to-end contribution onboarding and analysis flow with session reload', async ({ page }) => {
    const consoleGuard = setupConsoleGuard(page);
    const networkAudit = auditNetworkBoundaries(page);

    // Mock the backend API boundary with our canonical test fixture
    const { getLastRequestBody } = await mockSuccessfulAnalysis(page, MOCK_ANALYSIS_RESULT);

    // 1. Visit homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/OpenMate/i);

    // Verify navbar "Onboarding" link
    const onboardingNav = page.getByRole('navigation', { name: /main navigation/i }).getByRole('link', { name: /^onboarding$/i });
    await expect(onboardingNav).toBeVisible();
    await expect(onboardingNav).toHaveAttribute('href', '/onboarding');

    // 2. Click primary CTA in main hero section to begin onboarding
    const startCta = page.getByRole('main').getByRole('link', { name: /find my first contribution/i }).first();
    await expect(startCta).toBeVisible();
    await startCta.click();

    // 3. Arrive at /start onboarding form
    await expect(page).toHaveURL(/\/start$/);
    await expect(page.getByRole('heading', { level: 1, name: /find your first contribution/i })).toBeVisible();

    // 4. Fill in repository URL with a trailing slash to verify normalization
    const repoInput = page.getByLabel(/repository url/i);
    await expect(repoInput).toBeVisible();
    await repoInput.fill('https://github.com/openmate/test-repo/');

    // 5. Submit profile form
    const submitProfileBtn = page.getByRole('button', { name: /save & generate contribution profile/i });
    await submitProfileBtn.click();

    // 6. Profile Ready review appears
    await expect(page.getByRole('heading', { name: /openmate\/test-repo/i })).toBeVisible();
    await expect(page.getByText(/ready for analysis/i)).toBeVisible();

    // 7. Click Analyze Repository
    const analyzeBtn = page.getByRole('button', { name: /analyze repository/i });
    await expect(analyzeBtn).toBeVisible();
    await analyzeBtn.click();

    // 8. Intercepted POST /api/repositories/analyze must have occurred
    await page.waitForURL(/\/repo$/);

    // Verify request normalization: trailing slash must be stripped
    const requestBody = getLastRequestBody();
    expect(requestBody).not.toBeNull();
    const profile = requestBody?.profile as { repository?: { url?: string; owner?: string; name?: string } };
    expect(profile?.repository?.url).toBe('https://github.com/openmate/test-repo');
    expect(profile?.repository?.owner).toBe('openmate');
    expect(profile?.repository?.name).toBe('test-repo');

    // 9. Verify /repo renders real-domain recommendation
    await expect(page.getByRole('heading', { name: /openmate\/test-repo/i })).toBeVisible();
    await expect(page.getByText(/your first contribution/i)).toBeVisible();

    // Verify primary issue title and number
    await expect(page.getByRole('heading', { name: /add comprehensive unit tests for format utilities/i })).toBeVisible();
    await expect(page.getByText('#101')).toBeVisible();

    // Verify fit reason
    await expect(page.getByText(/perfect match for your typescript skills/i)).toBeVisible();

    // Verify GitHub issue link attributes (safe external link)
    const issueLink = page.getByRole('link', { name: /view issue on github/i });
    await expect(issueLink).toBeVisible();
    await expect(issueLink).toHaveAttribute('href', 'https://github.com/openmate/test-repo/issues/101');
    await expect(issueLink).toHaveAttribute('target', '_blank');
    await expect(issueLink).toHaveAttribute('rel', 'noopener noreferrer');

    // 10. Verify analysis sections render
    await expect(page.getByText(/repository overview/i)).toBeVisible();
    await expect(page.getByText(/technologies & tooling/i)).toBeVisible();
    await expect(page.getByText(/architecture & key modules/i)).toBeVisible();
    await expect(page.getByText(/files to understand first/i)).toBeVisible();
    await expect(page.getByText(/local setup & verification/i)).toBeVisible();
    await expect(page.getByText(/contribution guidelines & quality notes/i)).toBeVisible();
    await expect(page.getByText(/domain concepts & glossary/i)).toBeVisible();

    // 11. Test Session Refresh: reload page and verify data persists without refetching API
    let additionalApiCallCount = 0;
    await page.route('**/api/repositories/analyze', () => {
      additionalApiCallCount++;
    });

    await page.reload();

    // State is rehydrated from sessionStorage
    await expect(page.getByRole('heading', { name: /openmate\/test-repo/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /add comprehensive unit tests for format utilities/i })).toBeVisible();
    expect(additionalApiCallCount).toBe(0);

    // 12. Security checks: no console errors, no leaks to external providers
    consoleGuard.assertNoErrors();
    expect(networkAudit.getForbiddenCalls()).toHaveLength(0);
  });
});

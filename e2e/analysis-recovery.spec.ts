import { test, expect } from '@playwright/test';
import { seedAnalysisSession } from './helpers/mock-api';
import { MOCK_ANALYSIS_RESULT, createMockSessionEnvelope } from './fixtures/mock-analysis-result';

test.describe('Analysis Error Recovery and Edge Cases', () => {
  test('handles 503 analysis error and recovers on retry', async ({ page }) => {
    let callCount = 0;

    // Fail first call, succeed second call
    await page.route('**/api/repositories/analyze', async (route) => {
      callCount++;
      if (callCount === 1) {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'AI provider is temporarily overloaded. Please retry.',
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: MOCK_ANALYSIS_RESULT,
          }),
        });
      }
    });

    await page.goto('/start');

    // Submit profile to reach ready state
    await page.getByRole('button', { name: /save & generate contribution profile/i }).click();

    // Trigger analysis
    await page.getByRole('button', { name: /analyze repository/i }).click();

    // Verify error state appears without leaving /start
    await expect(page).toHaveURL(/\/start$/);
    const errorAlert = page.locator('#analysis-error-summary');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(/analysis request failed/i);
    await expect(errorAlert).toContainText(/currently unavailable/i);

    // Retry button exists
    const retryBtn = page.getByRole('button', { name: /try again/i });
    await expect(retryBtn).toBeVisible();

    // Click retry
    await retryBtn.click();

    // Second call succeeds -> navigates to /repo
    await page.waitForURL(/\/repo$/);
    await expect(page.getByRole('heading', { name: /add comprehensive unit tests for format utilities/i })).toBeVisible();
  });

  test('handles repository with no open issues as a normal product state', async ({ page }) => {
    const noIssuesResult = {
      ...MOCK_ANALYSIS_RESULT,
      recommendations: {
        status: 'no-open-issues' as const,
      },
    };

    await seedAnalysisSession(page, createMockSessionEnvelope(undefined, noIssuesResult));
    await page.goto('/repo');

    // Normal product state, not an application crash or failure
    await expect(page.getByRole('heading', { name: /no open contribution issues found/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /try another repository/i }).first()).toBeVisible();
  });

  test('handles repository with no suitable matches clearly', async ({ page }) => {
    const customExplanation = 'No open issues matched your specific combination of skills and available time.';
    const noMatchesResult = {
      ...MOCK_ANALYSIS_RESULT,
      recommendations: {
        status: 'no-suitable-issues' as const,
        explanation: customExplanation,
        metadata: {
          candidateIssuesConsidered: 15,
          generatedAt: new Date().toISOString(),
        },
      },
    };

    await seedAnalysisSession(page, createMockSessionEnvelope(undefined, noMatchesResult));
    await page.goto('/repo');

    // Friendly explanation and action to adjust profile
    await expect(page.getByRole('heading', { name: /no strong match found/i })).toBeVisible();
    await expect(page.getByText(customExplanation)).toBeVisible();
    await expect(page.getByRole('link', { name: /edit my profile/i })).toBeVisible();
  });
});

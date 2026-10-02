import { test, expect } from '@playwright/test';
import { seedAnalysisSession, mockChatSession, mockChatMessage, auditNetworkBoundaries } from './helpers/mock-api';
import {
  MOCK_ANALYSIS_RESULT,
  MOCK_PRIMARY_RECOMMENDATION,
  MOCK_RECOMMENDATIONS_RESULT,
  createMockSessionEnvelope,
} from './fixtures/mock-analysis-result';

test.describe('Security Headers, CSP, and XSS Protection', () => {
  test('verifies HTTP security headers in production response', async ({ request }) => {
    const endpoints = ['/', '/start', '/repo'];

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint);
      expect(response.status()).toBe(200);

      const headers = response.headers();

      // X-Content-Type-Options
      expect(headers['x-content-type-options']).toBe('nosniff');

      // X-Frame-Options
      expect(headers['x-frame-options']).toBe('DENY');

      // Referrer-Policy
      expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');

      // Permissions-Policy
      expect(headers['permissions-policy']).toContain('camera=()');
      expect(headers['permissions-policy']).toContain('microphone=()');

      // Content-Security-Policy
      const csp = headers['content-security-policy'];
      expect(csp).toBeDefined();
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("base-uri 'self'");
    }
  });

  test('proves malicious script injection remains inert in browser DOM', async ({ page }) => {
    const xssPayload = '<script>window.__OPENMATE_XSS__ = true</script><img src="x" onerror="window.__OPENMATE_XSS__ = true" />';

    const maliciousResult = {
      ...MOCK_ANALYSIS_RESULT,
      repository: {
        ...MOCK_ANALYSIS_RESULT.repository,
        description: `Malicious Repo: ${xssPayload}`,
      },
      recommendations: {
        status: 'recommended' as const,
        recommendations: [
          {
            ...MOCK_PRIMARY_RECOMMENDATION,
            title: `Exploit Title: ${xssPayload}`,
            fit: {
              ...MOCK_PRIMARY_RECOMMENDATION.fit,
              summary: `Exploit Summary: ${xssPayload}`,
            },
          },
        ],
        metadata: MOCK_RECOMMENDATIONS_RESULT.metadata,
      },
    };

    await seedAnalysisSession(page, createMockSessionEnvelope(undefined, maliciousResult));

    await mockChatSession(page);
    await mockChatMessage(page, `Assistant Exploit: ${xssPayload}`);

    await page.goto('/repo');

    // Start chat to render assistant payload as well
    await page.getByRole('button', { name: /start repository chat/i }).click();
    const chatInput = page.getByPlaceholder(/ask a question about this repository/i);
    await chatInput.fill('Trigger XSS');
    await page.getByRole('button', { name: /send/i }).click();

    // Wait for assistant reply to render
    await expect(page.getByText(/assistant exploit:/i)).toBeVisible();

    // Verify window.__OPENMATE_XSS__ was NEVER executed
    const isXssTriggered = await page.evaluate(() => {
      return (window as unknown as { __OPENMATE_XSS__?: boolean }).__OPENMATE_XSS__;
    });

    expect(isXssTriggered).toBeUndefined();
  });

  test('verifies zero unauthorized external network calls during complete user interaction', async ({ page }) => {
    const networkAudit = auditNetworkBoundaries(page);

    await seedAnalysisSession(page, createMockSessionEnvelope());
    await mockChatSession(page);
    await mockChatMessage(page, 'Safe reply.');

    await page.goto('/repo');

    // Interact with page
    await page.getByRole('button', { name: /start repository chat/i }).click();
    const chatInput = page.getByPlaceholder(/ask a question about this repository/i);
    await chatInput.fill('Test question');
    await page.getByRole('button', { name: /send/i }).click();

    await expect(page.getByText('Safe reply.')).toBeVisible();

    // Audit must be completely clean
    const forbiddenCalls = networkAudit.getForbiddenCalls();
    expect(forbiddenCalls).toHaveLength(0);
  });
});

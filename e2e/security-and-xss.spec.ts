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

  test('verifies production health check endpoint responds with no-store and safe payload', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);

    const headers = response.headers();
    expect(headers['cache-control']).toContain('no-store');
    expect(headers['content-type']).toContain('application/json');

    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('openmate');
    expect(typeof body.timestamp).toBe('string');
  });

  test('proves malicious script injection remains inert in browser DOM', async ({ page }) => {
    const xssPayload = '<script>window.__OPENMATE_XSS__ = true</script><img src="x" onerror="window.__OPENMATE_XSS__ = true" />';

    const maliciousResult = {
      ...MOCK_ANALYSIS_RESULT,
      repository: {
        ...MOCK_ANALYSIS_RESULT.repository,
        description: `Malicious Repo: ${xssPayload}`,
      },
      analysis: {
        ...MOCK_ANALYSIS_RESULT.analysis,
        repositorySummary: {
          ...MOCK_ANALYSIS_RESULT.analysis.repositorySummary,
          purpose: `Malicious purpose: ${xssPayload}`,
        },
      },
      recommendations: {
        ...MOCK_RECOMMENDATIONS_RESULT,
        recommendations: [
          {
            ...MOCK_PRIMARY_RECOMMENDATION,
            fit: {
              ...MOCK_PRIMARY_RECOMMENDATION.fit,
              summary: `Fit summary attack: ${xssPayload}`,
            },
          },
        ],
      },
    };

    await seedAnalysisSession(page, createMockSessionEnvelope(undefined, maliciousResult));
    await page.goto('/repo');

    // Wait for hydration and elements to be painted
    await expect(page.getByRole('heading', { name: /add comprehensive unit tests/i })).toBeVisible();

    // Verify window.__OPENMATE_XSS__ was never set in JavaScript execution context
    const isXssExecuted = await page.evaluate(() => {
      return (window as unknown as { __OPENMATE_XSS__?: boolean }).__OPENMATE_XSS__;
    });
    expect(isXssExecuted).toBeUndefined();

    // Verify the raw string is escaped as text content rather than executed as DOM markup
    const pageContent = await page.content();
    expect(pageContent).not.toContain('<script>window.__OPENMATE_XSS__ = true</script>');
  });

  test('enforces zero unauthorized external network calls during complete user interaction', async ({ page }) => {
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

import type { Page, Request } from '@playwright/test';
import { MOCK_ANALYSIS_RESULT } from '../fixtures/mock-analysis-result';
import type { OpenMateAnalysisResult, AnalysisSession } from '@/features/analysis-session/types';
import { ANALYSIS_SESSION_STORAGE_KEY } from '@/features/analysis-session/constants';

const FORBIDDEN_EXTERNAL_HOSTS = [
  'api.github.com',
  'backboard.io',
  'openrouter.ai',
  'googleapis.com',
];

/**
 * Monitors all network traffic and records any disallowed external provider calls.
 */
export function auditNetworkBoundaries(page: Page): { getForbiddenCalls: () => string[] } {
  const forbiddenCalls: string[] = [];

  page.on('request', (request: Request) => {
    const url = request.url();
    try {
      const parsed = new URL(url);
      if (FORBIDDEN_EXTERNAL_HOSTS.some((host) => parsed.hostname.includes(host))) {
        forbiddenCalls.push(url);
      }
    } catch {
      // Ignore unparseable or relative URLs
    }
  });

  return {
    getForbiddenCalls: () => forbiddenCalls,
  };
}

/**
 * Intercepts POST /api/repositories/analyze and returns a realistic application result.
 */
export async function mockSuccessfulAnalysis(
  page: Page,
  result: OpenMateAnalysisResult = MOCK_ANALYSIS_RESULT
): Promise<{ getLastRequestBody: () => Record<string, unknown> | null }> {
  let lastRequestBody: Record<string, unknown> | null = null;

  await page.route('**/api/repositories/analyze', async (route) => {
    if (route.request().method() === 'POST') {
      try {
        lastRequestBody = route.request().postDataJSON() as Record<string, unknown>;
      } catch {
        lastRequestBody = null;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: result,
        }),
      });
    } else {
      await route.continue();
    }
  });

  return {
    getLastRequestBody: () => lastRequestBody,
  };
}

/**
 * Intercepts POST /api/repositories/analyze and returns a controlled error response.
 */
export async function mockAnalysisError(
  page: Page,
  status: number = 503,
  message: string = 'Service temporarily unavailable. Please retry.'
): Promise<void> {
  await page.route('**/api/repositories/analyze', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({
          error: message,
          message,
        }),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Intercepts POST /api/repositories/chat/session and returns a valid mock token.
 */
export async function mockChatSession(
  page: Page,
  conversationToken = 'fake_payload_base64.fake_signature_base64_for_e2e_tests'
): Promise<void> {
  await page.route('**/api/repositories/chat/session', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          conversationToken,
          repositoryFullName: 'openmate/test-repo',
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        }),
      });
    } else if (route.request().method() === 'DELETE') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Intercepts POST /api/repositories/chat/messages and returns a mock assistant response.
 */
export async function mockChatMessage(
  page: Page,
  messageText: string = 'This repository uses modular directories and requires unit tests before submitting PRs.'
): Promise<void> {
  await page.route('**/api/repositories/chat/messages', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: messageText,
          model: 'google/gemma-3-27b-it',
        }),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Injects a pre-built AnalysisSession directly into browser sessionStorage before page loads.
 */
export async function seedAnalysisSession(page: Page, session: AnalysisSession): Promise<void> {
  await page.addInitScript(
    ({ key, value }) => {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    },
    { key: ANALYSIS_SESSION_STORAGE_KEY, value: session }
  );
}

/**
 * Injects raw string directly into browser sessionStorage (useful for testing corruption).
 */
export async function seedRawSessionStorage(page: Page, key: string, rawValue: string): Promise<void> {
  await page.addInitScript(
    ({ k, v }) => {
      window.sessionStorage.setItem(k, v);
    },
    { k: key, v: rawValue }
  );
}

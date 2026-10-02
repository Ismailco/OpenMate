import type { Page } from '@playwright/test';

/**
 * Tracks unhandled page errors and console.error messages during E2E runs.
 */
export function setupConsoleGuard(page: Page): {
  getErrors: () => string[];
  assertNoErrors: () => void;
} {
  const errors: string[] = [];

  page.on('pageerror', (exception) => {
    errors.push(`Unhandled page error: ${exception.message}\n${exception.stack ?? ''}`);
  });

  page.on('console', (message) => {
    if (message.type() === 'error') {
      const text = message.text();
      // Allow only known non-fatal dev/test noise if any, otherwise record
      errors.push(`Console error: ${text}`);
    }
  });

  return {
    getErrors: () => errors,
    assertNoErrors: () => {
      if (errors.length > 0) {
        throw new Error(
          `Unexpected browser console errors encountered:\n${errors.join('\n---\n')}`
        );
      }
    },
  };
}

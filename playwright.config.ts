import { defineConfig, devices } from '@playwright/test';

/**
 * OpenMate Playwright E2E Configuration
 * Exercises production Next.js server with CSP headers and mock boundaries.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 30_000,
  expect: {
    timeout: 7_000,
  },
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: process.env.PLAYWRIGHT_CHROMIUM_CHANNEL || (process.env.CI ? undefined : 'chrome'),
      },
    },
  ],
  webServer: {
    command: 'pnpm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      PORT: '3000',
      NODE_ENV: 'production',
      BACKBOARD_API_KEY: 'test-fake-backboard-key',
      GITHUB_TOKEN: 'test-fake-github-token',
      OPENMATE_CHAT_SIGNING_SECRET: 'test-secret-at-least-32-chars-for-playwright',
    },
  },
});

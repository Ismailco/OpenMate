import { test, expect } from '@playwright/test';
import { setupConsoleGuard } from './helpers/console-guard';
import { seedAnalysisSession, mockChatSession, mockChatMessage } from './helpers/mock-api';
import { createMockSessionEnvelope } from './fixtures/mock-analysis-result';
import { CHAT_STORAGE_KEY } from '@/features/repository-assistant/constants';

test.describe('Ask OpenMate Conversational Assistant', () => {
  test.beforeEach(async ({ page }) => {
    await seedAnalysisSession(page, createMockSessionEnvelope());
  });

  test('initializes chat, answers contributor question, persists on reload, and clears cleanly', async ({ page }) => {
    const consoleGuard = setupConsoleGuard(page);

    // Mock chat API endpoints
    await mockChatSession(page);
    await mockChatMessage(
      page,
      'Before contributing, check out CONTRIBUTING.md and ensure you have Node.js 22 installed.'
    );

    await page.goto('/repo');

    // 1. Locate Ask OpenMate card
    await expect(page.getByRole('heading', { name: /ask openmate/i })).toBeVisible();

    // 2. Click "Start Repository Chat"
    const startChatBtn = page.getByRole('button', { name: /start repository chat/i });
    await expect(startChatBtn).toBeVisible();
    await startChatBtn.click();

    // 3. Chat input becomes visible
    const chatInput = page.getByPlaceholder(/ask a question about this repository/i);
    await expect(chatInput).toBeVisible();

    // 4. Type and send a question
    await chatInput.fill('What should I read before starting?');
    const sendBtn = page.getByRole('button', { name: /send/i });
    await sendBtn.click();

    // 5. Verify user question and assistant answer in transcript
    await expect(page.getByText('What should I read before starting?')).toBeVisible();
    await expect(
      page.getByText(/before contributing, check out contributing\.md/i)
    ).toBeVisible();

    // 6. Test Chat Refresh: reload page and verify transcript persists
    await page.reload();

    await expect(page.getByText('What should I read before starting?')).toBeVisible();
    await expect(
      page.getByText(/before contributing, check out contributing\.md/i)
    ).toBeVisible();

    // 7. Test Clear Chat
    const clearChatBtn = page.getByRole('button', { name: /clear chat/i });
    await expect(clearChatBtn).toBeVisible();
    await clearChatBtn.click();

    // UI resets to idle state
    await expect(page.getByRole('button', { name: /start repository chat/i })).toBeVisible();

    // Verify sessionStorage cleared
    const storedChat = await page.evaluate((key) => window.sessionStorage.getItem(key), CHAT_STORAGE_KEY);
    expect(storedChat).toBeNull();

    consoleGuard.assertNoErrors();
  });
});

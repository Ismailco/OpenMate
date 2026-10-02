import { describe, it, expect, vi } from 'vitest';
import { handleSendChatMessageRequest } from '../handler';
import { signConversationToken } from '@/features/repository-assistant/tokens/conversation-token';
import type { BackboardAssistantClientLike, BackboardAssistantConfig } from '@/features/repository-assistant/backboard/client';

describe('POST /api/repositories/chat/messages Route Handler', () => {
  const secret = 'valid-test-signing-secret-with-more-than-32-chars-length';
  const repo = {
    owner: 'facebook',
    name: 'react',
    url: 'https://github.com/facebook/react',
  };

  const validToken = signConversationToken(
    {
      assistantId: 'asst_1',
      threadId: 'thrd_1',
      repositoryFullName: 'facebook/react',
    },
    secret
  );

  const mockConfig: BackboardAssistantConfig = {
    apiKey: 'test-key',
    modelProvider: 'openrouter',
    modelName: 'google/gemma-3-27b-it',
    timeoutMs: 30000,
    embeddingProvider: 'google',
    embeddingModelName: 'gemini-embedding-001-1536',
    embeddingDims: 1536,
    tokK: 8,
  };

  it('returns 200 with answer message on valid request', async () => {
    const mockClient = {
      sendMessage: vi.fn().mockResolvedValue({
        content: 'React components return UI descriptions.',
      }),
    } as unknown as BackboardAssistantClientLike;

    const request = new Request('http://localhost:3000/api/repositories/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationToken: validToken,
        repository: repo,
        message: 'How do React components work?',
      }),
    });

    const res = await handleSendChatMessageRequest(request, {
      backboardClient: mockClient,
      config: mockConfig,
      signingSecret: secret,
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toBe('React components return UI descriptions.');
    expect(data.model).toBe('google/gemma-3-27b-it');
  });

  it('returns 400 when request body is not valid JSON', async () => {
    const request = new Request('http://localhost:3000/api/repositories/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-json{{{',
    });

    const res = await handleSendChatMessageRequest(request);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('InvalidJson');
  });

  it('returns 422 when required parameters are missing', async () => {
    const request = new Request('http://localhost:3000/api/repositories/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationToken: validToken,
        // missing repository and message
      }),
    });

    const res = await handleSendChatMessageRequest(request);
    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.error).toBe('ValidationError');
  });

  it('returns 401 when conversation token is tampered', async () => {
    const parts = validToken.split('.');
    const tamperedToken = `${parts[0]}.bad-sig`;

    const request = new Request('http://localhost:3000/api/repositories/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationToken: tamperedToken,
        repository: repo,
        message: 'How does it work?',
      }),
    });

    const res = await handleSendChatMessageRequest(request, {
      signingSecret: secret,
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('UnauthorizedToken');
  });

  it('returns 410 when conversation token has expired', async () => {
    const expiredToken = signConversationToken(
      {
        assistantId: 'asst_1',
        threadId: 'thrd_1',
        repositoryFullName: 'facebook/react',
      },
      secret,
      -1000 // expired
    );

    const request = new Request('http://localhost:3000/api/repositories/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationToken: expiredToken,
        repository: repo,
        message: 'Hello?',
      }),
    });

    const res = await handleSendChatMessageRequest(request, {
      signingSecret: secret,
    });

    expect(res.status).toBe(410);
    const data = await res.json();
    expect(data.error).toBe('TokenExpired');
  });
});

import { describe, it, expect } from 'vitest';
import {
  signConversationToken,
  verifyConversationToken,
  validateSigningSecret,
} from '../conversation-token';
import {
  RepositoryAssistantConfigurationError,
  RepositoryAssistantTokenError,
  RepositoryAssistantTokenExpiredError,
} from '../../errors';

describe('Conversation Token Security and Cryptography', () => {
  const validSecret = 'a-very-strong-secret-key-that-is-at-least-32-chars-long';
  const repoName = 'facebook/react';

  it('rejects secrets shorter than 32 characters', () => {
    expect(() => validateSigningSecret('too-short')).toThrow(
      RepositoryAssistantConfigurationError
    );
    expect(() => validateSigningSecret(undefined)).toThrow(
      RepositoryAssistantConfigurationError
    );
  });

  it('signs and verifies a valid conversation token', () => {
    const token = signConversationToken(
      {
        assistantId: 'asst_123',
        threadId: 'thrd_456',
        repositoryFullName: repoName,
      },
      validSecret,
      60_000
    );

    const payload = verifyConversationToken(token, repoName, validSecret);
    expect(payload.version).toBe(1);
    expect(payload.assistantId).toBe('asst_123');
    expect(payload.threadId).toBe('thrd_456');
    expect(payload.repositoryFullName).toBe(repoName);
    expect(payload.expiresAt).toBeGreaterThan(Date.now());
  });

  it('rejects tampered payload segments', () => {
    const token = signConversationToken(
      {
        assistantId: 'asst_123',
        threadId: 'thrd_456',
        repositoryFullName: repoName,
      },
      validSecret
    );

    const parts = token.split('.');
    // Tamper with payload by changing base64 string
    const tamperedPayload = Buffer.from(
      JSON.stringify({
        version: 1,
        assistantId: 'asst_evil',
        threadId: 'thrd_456',
        repositoryFullName: repoName,
        issuedAt: Date.now(),
        expiresAt: Date.now() + 60000,
      })
    ).toString('base64url');

    const tamperedToken = `${tamperedPayload}.${parts[1]}`;

    expect(() =>
      verifyConversationToken(tamperedToken, repoName, validSecret)
    ).toThrow(RepositoryAssistantTokenError);
  });

  it('rejects tampered signature segments', () => {
    const token = signConversationToken(
      {
        assistantId: 'asst_123',
        threadId: 'thrd_456',
        repositoryFullName: repoName,
      },
      validSecret
    );

    const parts = token.split('.');
    const invalidSignature = Buffer.from('invalid-sig').toString('base64url');
    const tamperedToken = `${parts[0]}.${invalidSignature}`;

    expect(() =>
      verifyConversationToken(tamperedToken, repoName, validSecret)
    ).toThrow(RepositoryAssistantTokenError);
  });

  it('rejects expired conversation tokens with typed RepositoryAssistantTokenExpiredError', () => {
    const expiredTtlMs = -5000; // expired 5 seconds ago
    const token = signConversationToken(
      {
        assistantId: 'asst_123',
        threadId: 'thrd_456',
        repositoryFullName: repoName,
      },
      validSecret,
      expiredTtlMs
    );

    expect(() =>
      verifyConversationToken(token, repoName, validSecret)
    ).toThrow(RepositoryAssistantTokenExpiredError);
  });

  it('rejects tokens presented for a different repository (repository binding guard)', () => {
    const token = signConversationToken(
      {
        assistantId: 'asst_123',
        threadId: 'thrd_456',
        repositoryFullName: 'facebook/react',
      },
      validSecret
    );

    expect(() =>
      verifyConversationToken(token, 'vercel/next.js', validSecret)
    ).toThrow(RepositoryAssistantTokenError);
  });

  it('rejects malformed token strings', () => {
    expect(() =>
      verifyConversationToken('not-a-token', repoName, validSecret)
    ).toThrow(RepositoryAssistantTokenError);

    expect(() =>
      verifyConversationToken('', repoName, validSecret)
    ).toThrow(RepositoryAssistantTokenError);

    expect(() =>
      verifyConversationToken('a.b.c', repoName, validSecret)
    ).toThrow(RepositoryAssistantTokenError);
  });
});

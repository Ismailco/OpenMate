import crypto from 'node:crypto';
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

  it('generates a deterministic 2-part signed token', () => {
    const token = signConversationToken(
      {
        assistantId: 'asst_123',
        threadId: 'thrd_456',
        repositoryFullName: repoName,
      },
      validSecret,
      60_000
    );

    const parts = token.split('.');
    expect(parts).toHaveLength(2);
    expect(parts[0]?.length).toBeGreaterThan(10);
    expect(parts[1]?.length).toBeGreaterThan(10);
  });

  it('verifies a valid token for the correct repository', () => {
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
    expect(payload.assistantId).toBe('asst_123');
    expect(payload.threadId).toBe('thrd_456');
    expect(payload.repositoryFullName).toBe(repoName);
  });

  it('verifies repository name case-insensitively', () => {
    const token = signConversationToken(
      {
        assistantId: 'asst_123',
        threadId: 'thrd_456',
        repositoryFullName: 'Facebook/React',
      },
      validSecret,
      60_000
    );

    const payload = verifyConversationToken(token, 'facebook/react', validSecret);
    expect(payload.assistantId).toBe('asst_123');
  });

  it('rejects token when repository binding does not match', () => {
    const token = signConversationToken(
      {
        assistantId: 'asst_123',
        threadId: 'thrd_456',
        repositoryFullName: 'facebook/react',
      },
      validSecret,
      60_000
    );

    expect(() =>
      verifyConversationToken(token, 'vuejs/core', validSecret)
    ).toThrow(RepositoryAssistantTokenError);
  });

  it('rejects tampered token signature', () => {
    const token = signConversationToken(
      {
        assistantId: 'asst_123',
        threadId: 'thrd_456',
        repositoryFullName: repoName,
      },
      validSecret,
      60_000
    );

    const [payloadBase64Url] = token.split('.');
    const fakeSignature = 'tampered-signature-that-fails-hmac-verification-now';
    const tamperedToken = `${payloadBase64Url}.${fakeSignature}`;

    expect(() =>
      verifyConversationToken(tamperedToken, repoName, validSecret)
    ).toThrow(RepositoryAssistantTokenError);
  });

  it('rejects expired token', () => {
    // Generate token that expired 10 seconds ago, keeping expiresAt > issuedAt invariant
    const now = Date.now();
    const token = signConversationToken(
      {
        assistantId: 'asst_123',
        threadId: 'thrd_456',
        repositoryFullName: repoName,
        issuedAt: now - 10_000,
      },
      validSecret,
      1_000
    );

    expect(() =>
      verifyConversationToken(token, repoName, validSecret)
    ).toThrow(RepositoryAssistantTokenExpiredError);
  });

  it('rejects tokens containing extra un-whitelisted fields', () => {
    const now = Date.now();
    const maliciousPayload = {
      version: 1,
      assistantId: 'asst_123',
      threadId: 'thrd_456',
      repositoryFullName: repoName,
      issuedAt: now,
      expiresAt: now + 60_000,
      role: 'admin', // Injected extra property
    };

    const payloadBase64Url = Buffer.from(JSON.stringify(maliciousPayload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', validSecret)
      .update(payloadBase64Url)
      .digest('base64url');

    const token = `${payloadBase64Url}.${signature}`;

    expect(() =>
      verifyConversationToken(token, repoName, validSecret)
    ).toThrow(RepositoryAssistantTokenError);
  });

  it('rejects tokens with excessive lifetime beyond maximum bounds', () => {
    const now = Date.now();
    const excessiveLifetime = 30 * 24 * 60 * 60 * 1000; // 30 days
    const maliciousPayload = {
      version: 1,
      assistantId: 'asst_123',
      threadId: 'thrd_456',
      repositoryFullName: repoName,
      issuedAt: now,
      expiresAt: now + excessiveLifetime,
    };

    const payloadBase64Url = Buffer.from(JSON.stringify(maliciousPayload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', validSecret)
      .update(payloadBase64Url)
      .digest('base64url');

    const token = `${payloadBase64Url}.${signature}`;

    expect(() =>
      verifyConversationToken(token, repoName, validSecret)
    ).toThrow(RepositoryAssistantTokenError);
  });
});

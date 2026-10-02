import crypto from 'node:crypto';
import {
  CONVERSATION_TOKEN_MAX_AGE_MS,
  OPENMATE_CHAT_SIGNING_SECRET_MIN_LENGTH,
} from '../constants';
import {
  RepositoryAssistantConfigurationError,
  RepositoryAssistantTokenError,
  RepositoryAssistantTokenExpiredError,
} from '../errors';
import type { ConversationTokenPayload } from '../types';
import { ConversationTokenPayloadSchema } from './conversation-token-schema';

/**
 * Validates the chat signing secret meets cryptographic length requirements.
 */
export function validateSigningSecret(secret: string | undefined): string {
  if (!secret || secret.trim().length < OPENMATE_CHAT_SIGNING_SECRET_MIN_LENGTH) {
    throw new RepositoryAssistantConfigurationError(
      `OPENMATE_CHAT_SIGNING_SECRET must be at least ${OPENMATE_CHAT_SIGNING_SECRET_MIN_LENGTH} characters long.`
    );
  }
  return secret.trim();
}

/**
 * Creates an HMAC-SHA-256 signature for a base64url encoded payload.
 */
function createSignature(payloadBase64Url: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payloadBase64Url)
    .digest('base64url');
}

/**
 * Signs an opaque conversation token for Ask OpenMate.
 * Format: base64url(payload).base64url(signature)
 */
export function signConversationToken(
  params: {
    assistantId: string;
    threadId: string;
    repositoryFullName: string;
  },
  secret: string,
  ttlMs: number = CONVERSATION_TOKEN_MAX_AGE_MS
): string {
  const validatedSecret = validateSigningSecret(secret);
  const now = Date.now();

  const payload: ConversationTokenPayload = {
    version: 1,
    assistantId: params.assistantId,
    threadId: params.threadId,
    repositoryFullName: params.repositoryFullName,
    issuedAt: now,
    expiresAt: now + ttlMs,
  };

  const payloadJson = JSON.stringify(payload);
  const payloadBase64Url = Buffer.from(payloadJson, 'utf-8').toString('base64url');
  const signature = createSignature(payloadBase64Url, validatedSecret);

  return `${payloadBase64Url}.${signature}`;
}

/**
 * Verifies and decodes a signed conversation token.
 * Enforces HMAC signature verification, expiration check, and repository binding.
 */
export function verifyConversationToken(
  token: string,
  expectedRepositoryFullName: string,
  secret: string
): ConversationTokenPayload {
  const validatedSecret = validateSigningSecret(secret);

  if (!token || typeof token !== 'string') {
    throw new RepositoryAssistantTokenError('Invalid or missing conversation token.');
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    throw new RepositoryAssistantTokenError('Malformed conversation token structure.');
  }

  const [payloadBase64Url, signature] = parts;
  if (!payloadBase64Url || !signature) {
    throw new RepositoryAssistantTokenError('Malformed conversation token segments.');
  }

  const expectedSignature = createSignature(payloadBase64Url, validatedSecret);

  // Constant-time signature verification
  const sigBuffer = Buffer.from(signature, 'base64url');
  const expectedSigBuffer = Buffer.from(expectedSignature, 'base64url');

  if (
    sigBuffer.length !== expectedSigBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedSigBuffer)
  ) {
    throw new RepositoryAssistantTokenError('Conversation token signature is invalid or tampered.');
  }

  // Parse payload
  let parsedJson: unknown;
  try {
    const rawPayload = Buffer.from(payloadBase64Url, 'base64url').toString('utf-8');
    parsedJson = JSON.parse(rawPayload);
  } catch {
    throw new RepositoryAssistantTokenError('Conversation token payload could not be decoded.');
  }

  const parsed = ConversationTokenPayloadSchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new RepositoryAssistantTokenError('Conversation token payload schema is invalid.');
  }

  const payload = parsed.data;

  // Check expiration
  if (Date.now() > payload.expiresAt) {
    throw new RepositoryAssistantTokenExpiredError(
      `Conversation session expired at ${new Date(payload.expiresAt).toISOString()}. Please start a new chat.`
    );
  }

  // Check repository binding
  const normalizedExpected = expectedRepositoryFullName.trim().toLowerCase();
  const normalizedActual = payload.repositoryFullName.trim().toLowerCase();

  if (normalizedExpected !== normalizedActual) {
    throw new RepositoryAssistantTokenError(
      `Conversation token is bound to repository "${payload.repositoryFullName}" but was presented for "${expectedRepositoryFullName}".`
    );
  }

  return payload;
}

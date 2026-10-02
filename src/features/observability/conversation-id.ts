import { createHash } from 'crypto';

/**
 * Derives a stable, non-reversible Sentry conversation identifier
 * from an underlying provider thread ID.
 *
 * Invariant: Never sends raw thread IDs or signed tokens to observability systems.
 * Uses SHA-256 to ensure 100% deterministic grouping across conversation turns
 * while preventing any reverse lookup or token leakage.
 */
export function deriveSafeConversationId(threadId: string): string {
  if (!threadId || typeof threadId !== 'string') {
    return 'anonymous-conversation';
  }

  const hash = createHash('sha256').update(threadId.trim()).digest('hex');
  // Truncate to standard 32-character hex identifier for clean Sentry display
  return `conv_${hash.slice(0, 32)}`;
}

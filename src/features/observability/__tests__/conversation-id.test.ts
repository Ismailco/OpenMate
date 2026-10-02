import { describe, it, expect } from 'vitest';
import { deriveSafeConversationId } from '../conversation-id';

describe('deriveSafeConversationId', () => {
  it('deterministically derives the exact same identifier for identical thread IDs', () => {
    const threadId = 'thread_abc123_xyz789';
    const id1 = deriveSafeConversationId(threadId);
    const id2 = deriveSafeConversationId(threadId);

    expect(id1).toBe(id2);
    expect(id1.startsWith('conv_')).toBe(true);
    expect(id1.length).toBe(37); // 'conv_' (5) + 32 hex chars
  });

  it('produces different identifiers for distinct thread IDs', () => {
    const id1 = deriveSafeConversationId('thread_1');
    const id2 = deriveSafeConversationId('thread_2');

    expect(id1).not.toBe(id2);
  });

  it('never leaks the raw thread ID or token in the derived ID', () => {
    const rawThreadId = 'backboard_thread_secret_849204';
    const derived = deriveSafeConversationId(rawThreadId);

    expect(derived).not.toContain(rawThreadId);
    expect(derived).not.toContain('secret');
    expect(derived).not.toContain('backboard');
  });

  it('safely handles empty or missing inputs without throwing', () => {
    expect(deriveSafeConversationId('')).toBe('anonymous-conversation');
    // @ts-expect-error test undefined input
    expect(deriveSafeConversationId(undefined)).toBe('anonymous-conversation');
    // @ts-expect-error test null input
    expect(deriveSafeConversationId(null)).toBe('anonymous-conversation');
  });
});

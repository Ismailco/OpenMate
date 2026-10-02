import { describe, it, expect } from 'vitest';
import { sanitizeSpanAttributes } from '../attributes';
import { deriveSafeConversationId } from '../conversation-id';

describe('Observability Privacy & Security Boundary', () => {
  it('strictly blocks secrets from being included in span attributes', () => {
    const rawAttributes = {
      BACKBOARD_API_KEY: 'bb_live_94819481048',
      GITHUB_TOKEN: 'ghp_secrettokenvalue12345',
      OPENMATE_CHAT_SIGNING_SECRET: 'secret_key_value_999',
      'authorization.header': 'Bearer topsecret',
      'openmate.repository.full_name': 'Ismailco/OpenMate',
    };

    const sanitized = sanitizeSpanAttributes(rawAttributes);

    expect(sanitized).toEqual({
      'openmate.repository.full_name': 'Ismailco/OpenMate',
    });
    expect(sanitized.BACKBOARD_API_KEY).toBeUndefined();
    expect(sanitized.GITHUB_TOKEN).toBeUndefined();
    expect(sanitized.OPENMATE_CHAT_SIGNING_SECRET).toBeUndefined();
    expect(sanitized['authorization.header']).toBeUndefined();
  });

  it('strictly blocks prompt texts, source code bodies, and chunks from attributes', () => {
    const rawAttributes = {
      system_prompt: 'You are an AI assistant...',
      user_prompt_body: 'Here is the source code of the entire file...',
      source_code: 'function execute() { return true; }',
      rag_chunk_payload: 'import React from "react";',
      'openmate.profile.skill_count': 3,
    };

    const sanitized = sanitizeSpanAttributes(rawAttributes);

    expect(sanitized).toEqual({
      'openmate.profile.skill_count': 3,
    });
  });

  it('guarantees derived conversation ID is one-way and cannot be inverted to the raw thread ID', () => {
    const threadId = 'backboard_thread_9a2f7c01-3829-4d6b-9c21-f091823746a5';
    const safeId = deriveSafeConversationId(threadId);

    expect(safeId).not.toBe(threadId);
    expect(safeId).not.toContain('backboard');
    expect(safeId).not.toContain('thread');
    expect(safeId).not.toContain('9a2f7c01');
    expect(safeId.length).toBe(37);
  });
});

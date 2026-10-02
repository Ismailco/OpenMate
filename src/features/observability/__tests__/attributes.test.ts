import { describe, it, expect } from 'vitest';
import {
  sanitizeSpanAttributes,
  ATTR_GEN_AI_USAGE_INPUT_TOKENS,
  ATTR_GEN_AI_USAGE_OUTPUT_TOKENS,
  ATTR_GEN_AI_USAGE_TOTAL_TOKENS,
} from '../attributes';

describe('sanitizeSpanAttributes', () => {
  it('preserves safe metadata attributes and counts', () => {
    const clean = sanitizeSpanAttributes({
      'openmate.repository.full_name': 'Ismailco/OpenMate',
      'openmate.profile.skill_count': 3,
      'openmate.profile.experience': 'first-time',
      'github.has_readme': true,
    });

    expect(clean).toEqual({
      'openmate.repository.full_name': 'Ismailco/OpenMate',
      'openmate.profile.skill_count': 3,
      'openmate.profile.experience': 'first-time',
      'github.has_readme': true,
    });
  });

  it('redacts sensitive keys matching forbidden patterns', () => {
    const sanitized = sanitizeSpanAttributes({
      'user.api_key': 'secret-123',
      authorization: 'Bearer xyz',
      github_token: 'ghp_abc',
      password: 'password123',
      cookie: 'session=1',
      prompt_body: 'Instructions to LLM',
      source_content: 'export const x = 1;',
      chunk_data: 'raw chunk',
    });

    expect(sanitized).toEqual({});
  });

  it('allows safe gen_ai token usage metrics', () => {
    const sanitized = sanitizeSpanAttributes({
      [ATTR_GEN_AI_USAGE_INPUT_TOKENS]: 1500,
      [ATTR_GEN_AI_USAGE_OUTPUT_TOKENS]: 350,
      [ATTR_GEN_AI_USAGE_TOTAL_TOKENS]: 1850,
    });

    expect(sanitized).toEqual({
      [ATTR_GEN_AI_USAGE_INPUT_TOKENS]: 1500,
      [ATTR_GEN_AI_USAGE_OUTPUT_TOKENS]: 350,
      [ATTR_GEN_AI_USAGE_TOTAL_TOKENS]: 1850,
    });
  });

  it('omits undefined or null attributes', () => {
    const sanitized = sanitizeSpanAttributes({
      defined: 'ok',
      missing: undefined,
      // @ts-expect-error test null input
      empty: null,
    });

    expect(sanitized).toEqual({ defined: 'ok' });
  });

  it('truncates excessively long string values', () => {
    const longString = 'a'.repeat(600);
    const sanitized = sanitizeSpanAttributes({
      description: longString,
    });

    expect(typeof sanitized.description).toBe('string');
    expect((sanitized.description as string).endsWith('... [truncated]')).toBe(true);
    expect((sanitized.description as string).length).toBeLessThan(550);
  });
});

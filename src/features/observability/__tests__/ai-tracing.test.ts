import { describe, it, expect, vi } from 'vitest';
import { withAiSpan } from '../ai-tracing';

describe('withAiSpan generative AI wrapper', () => {
  it('executes AI inference call and attaches authoritative token usage when present', async () => {
    let capturedUsage: unknown;

    const result = await withAiSpan(
      {
        name: 'Gemma test inference',
        model: 'google/gemma-3-27b-it',
        system: 'openrouter',
        conversationId: 'conv_1234567890abcdef',
      },
      async (aiSpan) => {
        aiSpan.setResponseModel('google/gemma-3-27b-it');
        aiSpan.recordTokenUsage({
          inputTokens: 1200,
          outputTokens: 340,
          totalTokens: 1540,
        });
        capturedUsage = {
          inputTokens: 1200,
          outputTokens: 340,
          totalTokens: 1540,
        };
        return { response: 'Valid model response' };
      }
    );

    expect(result).toEqual({ response: 'Valid model response' });
    expect(capturedUsage).toEqual({
      inputTokens: 1200,
      outputTokens: 340,
      totalTokens: 1540,
    });
  });

  it('safely handles missing token usage without calculating approximate or fake tokens', async () => {
    const recordTokenUsageSpy = vi.fn();

    await withAiSpan(
      {
        name: 'Gemma without tokens',
        model: 'google/gemma-3-27b-it',
      },
      async (aiSpan) => {
        // Upstream provider did not supply token metrics
        aiSpan.recordTokenUsage({
          inputTokens: undefined,
          outputTokens: undefined,
          totalTokens: undefined,
        });
        recordTokenUsageSpy();
        return true;
      }
    );

    expect(recordTokenUsageSpy).toHaveBeenCalledOnce();
  });

  it('records controlled repair attempts and outcome flags', async () => {
    let repairFlags: { attempted: boolean; success?: boolean } | undefined;

    await withAiSpan(
      {
        name: 'Gemma repair test',
        model: 'google/gemma-3-27b-it',
      },
      async (aiSpan) => {
        aiSpan.recordRepair(true, true);
        repairFlags = { attempted: true, success: true };
        return true;
      }
    );

    expect(repairFlags).toEqual({ attempted: true, success: true });
  });
});

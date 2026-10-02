import type { AiSpanOptions, AuthoritativeTokenUsage } from './types';
import { withSpan, SpanAdapter } from './tracing';
import {
  ATTR_GEN_AI_SYSTEM,
  ATTR_GEN_AI_OPERATION_TYPE,
  ATTR_GEN_AI_REQUEST_MODEL,
  ATTR_GEN_AI_RESPONSE_MODEL,
  ATTR_GEN_AI_CONVERSATION_ID,
  ATTR_GEN_AI_USAGE_INPUT_TOKENS,
  ATTR_GEN_AI_USAGE_OUTPUT_TOKENS,
  ATTR_GEN_AI_USAGE_TOTAL_TOKENS,
  ATTR_OPENMATE_AI_PROVIDER,
} from './attributes';

export interface AiSpanAdapter extends SpanAdapter {
  recordTokenUsage(usage: AuthoritativeTokenUsage): void;
  recordRepair(attempted: boolean, success?: boolean): void;
  setResponseModel(model: string): void;
}

class SafeAiSpanAdapter implements AiSpanAdapter {
  constructor(private readonly base: SpanAdapter) {}

  setAttribute(key: string, value: string | number | boolean): void {
    this.base.setAttribute(key, value);
  }

  setAttributes(attributes: Record<string, string | number | boolean>): void {
    this.base.setAttributes(attributes);
  }

  recordError(error: unknown): void {
    this.base.recordError(error);
  }

  setResponseModel(model: string): void {
    if (model) {
      this.base.setAttribute(ATTR_GEN_AI_RESPONSE_MODEL, model);
    }
  }

  /**
   * Records token usage ONLY when authoritatively provided by the upstream provider.
   * Never fabricates, estimates, or approximates token numbers.
   */
  recordTokenUsage(usage: AuthoritativeTokenUsage): void {
    if (typeof usage.inputTokens === 'number' && Number.isFinite(usage.inputTokens)) {
      this.base.setAttribute(ATTR_GEN_AI_USAGE_INPUT_TOKENS, usage.inputTokens);
    }
    if (typeof usage.outputTokens === 'number' && Number.isFinite(usage.outputTokens)) {
      this.base.setAttribute(ATTR_GEN_AI_USAGE_OUTPUT_TOKENS, usage.outputTokens);
    }
    if (typeof usage.totalTokens === 'number' && Number.isFinite(usage.totalTokens)) {
      this.base.setAttribute(ATTR_GEN_AI_USAGE_TOTAL_TOKENS, usage.totalTokens);
    }
  }

  recordRepair(attempted: boolean, success?: boolean): void {
    this.base.setAttribute('openmate.ai.repair_attempted', attempted);
    if (success !== undefined) {
      this.base.setAttribute('openmate.ai.repair_success', success);
    }
  }
}

/**
 * Traces a generative AI inference call adhering to Sentry's OpenTelemetry gen_ai conventions.
 */
export async function withAiSpan<T>(
  options: AiSpanOptions,
  fn: (span: AiSpanAdapter) => Promise<T>
): Promise<T> {
  const initialAttributes: Record<string, string | number | boolean | undefined> = {
    [ATTR_GEN_AI_OPERATION_TYPE]: options.operationType ?? 'ai_client',
    [ATTR_GEN_AI_SYSTEM]: options.system ?? 'openrouter',
    [ATTR_GEN_AI_REQUEST_MODEL]: options.model,
    [ATTR_OPENMATE_AI_PROVIDER]: 'backboard',
    ...(options.conversationId ? { [ATTR_GEN_AI_CONVERSATION_ID]: options.conversationId } : {}),
    ...options.attributes,
  };

  return withSpan(
    {
      name: options.name,
      op: options.op || 'gen_ai.chat',
      attributes: initialAttributes,
    },
    async (baseSpan) => {
      const aiSpan = new SafeAiSpanAdapter(baseSpan);
      return await fn(aiSpan);
    }
  );
}

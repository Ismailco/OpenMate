/**
 * OpenTelemetry Generative AI and OpenMate Semantic Span Attributes.
 */
export const ATTR_GEN_AI_SYSTEM = 'gen_ai.system';
export const ATTR_GEN_AI_OPERATION_NAME = 'gen_ai.operation.name';
export const ATTR_GEN_AI_OPERATION_TYPE = 'gen_ai.operation.type';
export const ATTR_GEN_AI_REQUEST_MODEL = 'gen_ai.request.model';
export const ATTR_GEN_AI_RESPONSE_MODEL = 'gen_ai.response.model';
export const ATTR_GEN_AI_CONVERSATION_ID = 'gen_ai.conversation.id';
export const ATTR_GEN_AI_USAGE_INPUT_TOKENS = 'gen_ai.usage.input_tokens';
export const ATTR_GEN_AI_USAGE_OUTPUT_TOKENS = 'gen_ai.usage.output_tokens';
export const ATTR_GEN_AI_USAGE_TOTAL_TOKENS = 'gen_ai.usage.total_tokens';

export const ATTR_OPENMATE_REPOSITORY_FULL_NAME = 'openmate.repository.full_name';
export const ATTR_OPENMATE_AI_PROVIDER = 'openmate.ai.provider';
export const ATTR_OPENMATE_AI_REPAIR_ATTEMPTED = 'openmate.ai.repair_attempted';
export const ATTR_OPENMATE_AI_REPAIR_SUCCESS = 'openmate.ai.repair_success';

const FORBIDDEN_KEY_PATTERNS = [
  /token/i,
  /secret/i,
  /key/i,
  /auth/i,
  /password/i,
  /cookie/i,
  /credential/i,
  /prompt/i,
  /body/i,
  /source/i,
  /chunk/i,
];

/**
 * Sanitizes attributes before recording on Sentry spans.
 * Strips undefined values and blocks any potentially sensitive keys.
 */
export function sanitizeSpanAttributes(
  attributes?: Record<string, string | number | boolean | undefined>
): Record<string, string | number | boolean> {
  if (!attributes) return {};

  const clean: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(attributes)) {
    if (value === undefined || value === null) continue;

    // Allow known safe OpenTelemetry / Sentry gen_ai attributes that happen to contain 'token' (e.g. usage tokens)
    const isAllowedTokenUsageKey =
      key === ATTR_GEN_AI_USAGE_INPUT_TOKENS ||
      key === ATTR_GEN_AI_USAGE_OUTPUT_TOKENS ||
      key === ATTR_GEN_AI_USAGE_TOTAL_TOKENS;

    if (!isAllowedTokenUsageKey) {
      const isForbidden = FORBIDDEN_KEY_PATTERNS.some((pattern) => pattern.test(key));
      if (isForbidden) {
        continue;
      }
    }

    // Ensure strings don't leak known secret values or huge payloads
    if (typeof value === 'string') {
      if (value.length > 500) {
        clean[key] = `${value.slice(0, 500)}... [truncated]`;
      } else {
        clean[key] = value;
      }
    } else {
      clean[key] = value;
    }
  }

  return clean;
}

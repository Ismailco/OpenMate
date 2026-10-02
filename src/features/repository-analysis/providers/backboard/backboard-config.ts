import 'server-only';
import { z } from 'zod';
import { AiConfigurationError } from '../../errors';

const BackboardConfigSchema = z.object({
  apiKey: z.string().min(1, 'BACKBOARD_API_KEY must not be empty.'),
  modelProvider: z.string().min(1).default('openrouter'),
  modelName: z.string().min(1).default('google/gemma-3-27b-it'),
  timeoutMs: z.number().int().positive().default(60_000),
});

export type BackboardConfig = z.infer<typeof BackboardConfigSchema>;

export function getBackboardConfig(): BackboardConfig {
  const apiKey = process.env.BACKBOARD_API_KEY;
  if (!apiKey) {
    throw new AiConfigurationError(
      'BACKBOARD_API_KEY is not configured in environment variables.'
    );
  }

  const modelProvider = process.env.BACKBOARD_MODEL_PROVIDER || 'openrouter';
  const modelName = process.env.BACKBOARD_MODEL_NAME || 'google/gemma-3-27b-it';
  const timeoutMs = process.env.BACKBOARD_TIMEOUT_MS
    ? parseInt(process.env.BACKBOARD_TIMEOUT_MS, 10)
    : 60_000;

  const result = BackboardConfigSchema.safeParse({
    apiKey,
    modelProvider,
    modelName,
    timeoutMs,
  });

  if (!result.success) {
    throw new AiConfigurationError(
      `Invalid Backboard configuration: ${result.error.issues.map((i) => i.message).join(', ')}`
    );
  }

  return result.data;
}

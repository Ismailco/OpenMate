import {
  RawRecommendationsResponse,
  RawRecommendationsResponseSchema,
} from '../schema';
import { InvalidRecommendationResponseError } from '../errors';

/**
 * Extracts and cleans JSON from raw AI model response.
 * Handles markdown fences (```json ... ```) and whitespace.
 */
export function parseRawRecommendationResponse(
  rawOutput: string
): RawRecommendationsResponse {
  if (!rawOutput || rawOutput.trim().length === 0) {
    throw new InvalidRecommendationResponseError(
      'Empty response received from recommendation model.'
    );
  }

  let cleaned = rawOutput.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/, '');
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(cleaned);
  } catch (err) {
    throw new InvalidRecommendationResponseError(
      `Failed to parse JSON response from recommendation model: ${err instanceof Error ? err.message : String(err)}`,
      rawOutput.slice(0, 500)
    );
  }

  const result = RawRecommendationsResponseSchema.safeParse(parsedJson);
  if (!result.success) {
    const errorDetails = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new InvalidRecommendationResponseError(
      `Recommendation response failed schema validation: ${errorDetails}`,
      rawOutput.slice(0, 500)
    );
  }

  return result.data;
}

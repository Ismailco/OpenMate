import { RawRepositoryAnalysis, RawRepositoryAnalysisSchema } from '../schema';
import { AiInvalidResponseError } from '../errors';

/**
 * Clean and extract raw JSON text from a model response, stripping code blocks if present.
 */
export function extractJsonSnippet(rawText: string): string {
  let cleaned = rawText.trim();

  // Strip markdown code fences if present (e.g. ```json ... ``` or ``` ...)
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
    const closingFenceIndex = cleaned.lastIndexOf('```');
    if (closingFenceIndex !== -1) {
      cleaned = cleaned.substring(0, closingFenceIndex).trim();
    }
  }

  return cleaned;
}

/**
 * Parses and validates raw model text against the RawRepositoryAnalysisSchema.
 */
export function parseRawAnalysisResponse(rawText: string): RawRepositoryAnalysis {
  if (!rawText || rawText.trim().length === 0) {
    throw new AiInvalidResponseError('AI model returned an empty response.');
  }

  const jsonString = extractJsonSnippet(rawText);

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(jsonString);
  } catch (err) {
    const snippet = rawText.slice(0, 150);
    throw new AiInvalidResponseError(
      `AI model response could not be parsed as JSON: ${err instanceof Error ? err.message : String(err)}`,
      snippet
    );
  }

  const result = RawRepositoryAnalysisSchema.safeParse(parsedJson);
  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ');
    throw new AiInvalidResponseError(
      `AI model response failed schema validation: ${errorDetails}`,
      jsonString.slice(0, 150)
    );
  }

  return result.data;
}

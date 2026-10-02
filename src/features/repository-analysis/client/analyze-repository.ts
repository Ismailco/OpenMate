import { DeveloperProfile } from '@/features/developer-profile/types';
import {
  OpenMateAnalysisResult,
  OpenMateAnalysisResultSchema,
} from '@/features/analysis-session';

export type AnalysisClientErrorCode =
  | 'invalid-input'
  | 'repository-not-found'
  | 'rate-limited'
  | 'provider-unavailable'
  | 'timeout'
  | 'invalid-response'
  | 'network-failure'
  | 'aborted'
  | 'unknown';

export class AnalysisClientError extends Error {
  readonly code: AnalysisClientErrorCode;
  readonly userMessage: string;
  readonly status?: number;

  constructor(code: AnalysisClientErrorCode, userMessage: string, status?: number) {
    super(userMessage);
    this.name = 'AnalysisClientError';
    this.code = code;
    this.userMessage = userMessage;
    this.status = status;
  }
}

/**
 * Submits developer profile to the internal OpenMate analysis endpoint and validates the response.
 */
export async function analyzeRepository(
  profile: DeveloperProfile,
  signal?: AbortSignal
): Promise<OpenMateAnalysisResult> {
  let response: Response;

  try {
    response = await fetch('/api/repositories/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profile }),
      signal,
    });
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new AnalysisClientError('aborted', 'Analysis request was canceled.');
    }

    if (err instanceof Error && err.name === 'AbortError') {
      throw new AnalysisClientError('aborted', 'Analysis request was canceled.');
    }

    throw new AnalysisClientError(
      'network-failure',
      'OpenMate could not reach the analysis service. Check your connection and try again.'
    );
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new AnalysisClientError(
      'invalid-response',
      'The server returned an unreadable response format.',
      response.status
    );
  }

  if (!response.ok) {
    const errorPayload = json as { error?: string; code?: string } | null;
    const serverMessage = errorPayload?.error;

    if (response.status === 400 || response.status === 422) {
      throw new AnalysisClientError(
        'invalid-input',
        serverMessage || 'The repository or profile input is invalid. Please review your settings.',
        response.status
      );
    }

    if (response.status === 404) {
      throw new AnalysisClientError(
        'repository-not-found',
        serverMessage ||
          `The repository ${profile.repository.owner}/${profile.repository.name} could not be found or is private.`,
        response.status
      );
    }

    if (response.status === 429) {
      throw new AnalysisClientError(
        'rate-limited',
        'API rate limit reached. Please wait a moment before trying again.',
        response.status
      );
    }

    if (response.status === 503) {
      throw new AnalysisClientError(
        'provider-unavailable',
        'OpenMate analysis service is currently unavailable or configuration is incomplete.',
        response.status
      );
    }

    if (response.status === 504) {
      throw new AnalysisClientError(
        'timeout',
        'The repository analysis timed out. The repository may be unusually large.',
        response.status
      );
    }

    if (response.status === 502) {
      throw new AnalysisClientError(
        'invalid-response',
        serverMessage || 'The analysis service returned an invalid reasoning structure.',
        response.status
      );
    }

    throw new AnalysisClientError(
      'unknown',
      serverMessage || 'An unexpected error occurred during repository analysis.',
      response.status
    );
  }

  // Validate the 200 OK payload
  const envelope = json as { success?: boolean; data?: unknown };
  if (!envelope || !envelope.success || !envelope.data) {
    throw new AnalysisClientError(
      'invalid-response',
      'The server returned an invalid success response envelope.'
    );
  }

  const parseResult = OpenMateAnalysisResultSchema.safeParse(envelope.data);
  if (!parseResult.success) {
    throw new AnalysisClientError(
      'invalid-response',
      'The analysis response structure did not match the expected application schema.'
    );
  }

  return parseResult.data as OpenMateAnalysisResult;
}

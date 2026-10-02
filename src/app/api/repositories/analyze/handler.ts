import {
  DeveloperProfileSchema,
  NormalizedRepositorySchema,
} from '@/features/developer-profile/schemas';
import {
  createRepositoryAnalysisService,
  RepositoryAnalysisService,
} from '@/features/repository-analysis';
import {
  GitHubAuthenticationError,
  GitHubRateLimitError,
  GitHubTimeoutError,
  RepositoryAccessError,
  RepositoryNotFoundError,
} from '@/features/github/errors';
import {
  AiConfigurationError,
  AiInvalidResponseError,
  AiModelUnavailableError,
  AiProviderError,
  AiRateLimitError,
  AiTimeoutError,
} from '@/features/repository-analysis/errors';
import {
  InvalidRecommendationResponseError,
  NoCandidateIssuesError,
} from '@/features/contribution-recommendations/errors';
import {
  validateApiRequestHeaders,
  createSafeJsonResponse,
} from '@/lib/api-security';

export async function handleAnalyzeRequest(
  request: Request,
  serviceOverride?: RepositoryAnalysisService
) {
  try {
    const headerValidation = validateApiRequestHeaders(request);
    if (!headerValidation.valid && headerValidation.response) {
      return headerValidation.response;
    }

    const body = (await request.json()) as unknown;

    if (!body || typeof body !== 'object') {
      return createSafeJsonResponse(
        { error: 'Missing request payload.' },
        { status: 400 }
      );
    }

    const payloadObj = body as Record<string, unknown>;

    // Case 1: Full DeveloperProfile provided
    if ('profile' in payloadObj) {
      const profileResult = DeveloperProfileSchema.safeParse(payloadObj.profile);
      if (!profileResult.success) {
        return createSafeJsonResponse(
          {
            error: 'Invalid developer profile specification.',
            details: profileResult.error.flatten(),
          },
          { status: 422 }
        );
      }

      const service = serviceOverride ?? createRepositoryAnalysisService();
      const analysisResult = await service.analyzeAndRecommend(profileResult.data);

      return createSafeJsonResponse({
        success: true,
        data: analysisResult,
      });
    }

    // Case 2: Repository-only provided
    if ('repository' in payloadObj) {
      const repoResult = NormalizedRepositorySchema.safeParse(payloadObj.repository);
      if (!repoResult.success) {
        return createSafeJsonResponse(
          {
            error: 'Invalid repository specification.',
            details: repoResult.error.issues.map((i) => i.message),
          },
          { status: 422 }
        );
      }

      const service = serviceOverride ?? createRepositoryAnalysisService();
      const analysisResult = await service.analyzeRepository(repoResult.data);

      return createSafeJsonResponse({
        success: true,
        data: analysisResult,
      });
    }

    return createSafeJsonResponse(
      {
        error:
          'Request payload must contain either a "profile" or a "repository" object.',
      },
      { status: 400 }
    );
  } catch (error: unknown) {
    if (error instanceof RepositoryNotFoundError) {
      return createSafeJsonResponse(
        { error: `Repository not found: ${error.owner}/${error.repo}.` },
        { status: 404 }
      );
    }

    if (error instanceof GitHubAuthenticationError) {
      return createSafeJsonResponse(
        { error: 'GitHub authentication failed. Check GITHUB_TOKEN configuration.' },
        { status: 401 }
      );
    }

    if (error instanceof GitHubRateLimitError) {
      return createSafeJsonResponse(
        { error: 'GitHub API rate limit exceeded. Please retry shortly.' },
        { status: 429 }
      );
    }

    if (error instanceof GitHubTimeoutError || error instanceof AiTimeoutError) {
      return createSafeJsonResponse(
        { error: 'Analysis timed out while fetching repository data or model generation.' },
        { status: 504 }
      );
    }

    if (error instanceof RepositoryAccessError) {
      return createSafeJsonResponse(
        { error: 'Access to the target repository is restricted or forbidden.' },
        { status: 403 }
      );
    }

    if (error instanceof AiModelUnavailableError) {
      return createSafeJsonResponse(
        { error: 'AI analysis model is currently overloaded or unavailable.' },
        { status: 503 }
      );
    }

    if (error instanceof AiRateLimitError) {
      return createSafeJsonResponse(
        { error: 'AI provider rate limit reached. Please wait a moment and try again.' },
        { status: 429 }
      );
    }

    if (error instanceof AiInvalidResponseError || error instanceof InvalidRecommendationResponseError) {
      return createSafeJsonResponse(
        { error: 'AI provider produced a malformed or invalid analysis structure.' },
        { status: 502 }
      );
    }

    if (error instanceof NoCandidateIssuesError) {
      return createSafeJsonResponse(
        { error: 'No open issues were found in the repository to evaluate for recommendations.' },
        { status: 422 }
      );
    }

    if (error instanceof AiConfigurationError || error instanceof AiProviderError) {
      return createSafeJsonResponse(
        { error: 'AI service configuration error. Please check server environment settings.' },
        { status: 500 }
      );
    }

    return createSafeJsonResponse(
      { error: 'Internal repository analysis failed. An unexpected error occurred.' },
      { status: 500 }
    );
  }
}

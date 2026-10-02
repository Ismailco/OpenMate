import { NextResponse } from 'next/server';
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

export async function handleAnalyzeRequest(
  request: Request,
  serviceOverride?: RepositoryAnalysisService
) {
  try {
    const body = (await request.json()) as unknown;

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Missing request payload.' },
        { status: 400 }
      );
    }

    const payloadObj = body as Record<string, unknown>;

    // Case 1: Full DeveloperProfile provided
    if ('profile' in payloadObj) {
      const profileResult = DeveloperProfileSchema.safeParse(payloadObj.profile);
      if (!profileResult.success) {
        return NextResponse.json(
          {
            error: 'Invalid developer profile specification.',
            details: profileResult.error.flatten(),
          },
          { status: 422 }
        );
      }

      const service = serviceOverride ?? createRepositoryAnalysisService();
      const analysisResult = await service.analyzeAndRecommend(profileResult.data);

      return NextResponse.json({
        success: true,
        data: analysisResult,
      });
    }

    // Case 2: NormalizedRepository provided
    if ('repository' in payloadObj) {
      const parseResult = NormalizedRepositorySchema.safeParse(payloadObj.repository);
      if (!parseResult.success) {
        return NextResponse.json(
          {
            error: 'Invalid repository specification.',
            details: parseResult.error.flatten(),
          },
          { status: 422 }
        );
      }

      const service = serviceOverride ?? createRepositoryAnalysisService();
      const analysisResult = await service.analyzeRepository(parseResult.data);

      return NextResponse.json({
        success: true,
        data: analysisResult,
      });
    }

    return NextResponse.json(
      { error: 'Request payload must contain either a "profile" or a "repository" field.' },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof RepositoryNotFoundError) {
      return NextResponse.json(
        { error: 'The requested GitHub repository could not be found or is private.' },
        { status: 404 }
      );
    }

    if (error instanceof GitHubAuthenticationError) {
      return NextResponse.json(
        { error: 'GitHub authentication failed. Check GITHUB_TOKEN configuration.' },
        { status: 401 }
      );
    }

    if (error instanceof GitHubRateLimitError) {
      return NextResponse.json(
        { error: 'GitHub API rate limit exceeded. Please retry shortly.' },
        { status: 429 }
      );
    }

    if (error instanceof GitHubTimeoutError || error instanceof AiTimeoutError) {
      return NextResponse.json(
        { error: 'Analysis timed out while fetching repository data or model generation.' },
        { status: 504 }
      );
    }

    if (error instanceof RepositoryAccessError) {
      return NextResponse.json(
        { error: 'Access to the target repository is restricted or forbidden.' },
        { status: 403 }
      );
    }

    if (error instanceof AiModelUnavailableError) {
      return NextResponse.json(
        { error: 'AI analysis model is currently overloaded or unavailable.' },
        { status: 503 }
      );
    }

    if (error instanceof AiRateLimitError) {
      return NextResponse.json(
        { error: 'AI provider rate limit reached. Please wait a moment and try again.' },
        { status: 429 }
      );
    }

    if (error instanceof AiInvalidResponseError || error instanceof InvalidRecommendationResponseError) {
      return NextResponse.json(
        { error: 'AI provider produced a malformed or invalid analysis structure.' },
        { status: 502 }
      );
    }

    if (error instanceof NoCandidateIssuesError) {
      return NextResponse.json(
        { error: 'No open issues were found in the repository to evaluate for recommendations.' },
        { status: 422 }
      );
    }

    if (error instanceof AiConfigurationError || error instanceof AiProviderError) {
      return NextResponse.json(
        { error: 'AI service configuration error. Please check server environment settings.' },
        { status: 500 }
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown internal error';
    return NextResponse.json(
      { error: `Internal repository analysis failed: ${message}` },
      { status: 500 }
    );
  }
}

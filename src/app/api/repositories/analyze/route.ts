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

    const payload = body as {
      repository?: unknown;
      profile?: unknown;
    };

    if (!payload.repository && !payload.profile) {
      return NextResponse.json(
        { error: 'Missing repository or profile field in request payload.' },
        { status: 400 }
      );
    }

    const getService = () => serviceOverride ?? createRepositoryAnalysisService();

    // Mode A: Profile is provided -> Integrated Analysis + Personalized Recommendations
    if (payload.profile) {
      const profileResult = DeveloperProfileSchema.safeParse(payload.profile);
      if (!profileResult.success) {
        return NextResponse.json(
          {
            error: 'Invalid developer profile specification.',
            details: profileResult.error.issues.map((i) => i.message),
          },
          { status: 422 }
        );
      }

      const profile = profileResult.data;

      // Verify consistency if repository is also explicitly passed
      if (payload.repository) {
        const repoResult = NormalizedRepositorySchema.safeParse(payload.repository);
        if (repoResult.success) {
          const r1 = repoResult.data;
          const r2 = profile.repository;
          if (
            r1.owner.toLowerCase() !== r2.owner.toLowerCase() ||
            r1.name.toLowerCase() !== r2.name.toLowerCase()
          ) {
            return NextResponse.json(
              {
                error:
                  'Conflicting repository identities specified in repository and profile payloads.',
              },
              { status: 422 }
            );
          }
        }
      }

      const service = getService();
      const result = await service.analyzeAndRecommend(profile);
      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    // Mode B: Repository-only analysis (backward-compatible Phase 5 behavior)
    const parseResult = NormalizedRepositorySchema.safeParse(payload.repository);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid repository specification.',
          details: parseResult.error.issues.map((i) => i.message),
        },
        { status: 422 }
      );
    }

    const repository = parseResult.data;
    const service = getService();
    const result = await service.analyzeRepository(repository);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: unknown) {
    if (err instanceof RepositoryNotFoundError) {
      return NextResponse.json(
        { error: err.message, code: 'REPOSITORY_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (err instanceof RepositoryAccessError) {
      return NextResponse.json(
        { error: err.message, code: 'REPOSITORY_ACCESS_DENIED' },
        { status: 403 }
      );
    }

    if (err instanceof GitHubRateLimitError) {
      return NextResponse.json(
        { error: err.message, code: 'GITHUB_RATE_LIMIT_EXCEEDED' },
        { status: 429 }
      );
    }

    if (err instanceof GitHubAuthenticationError) {
      return NextResponse.json(
        { error: err.message, code: 'GITHUB_AUTHENTICATION_ERROR' },
        { status: 401 }
      );
    }

    if (err instanceof GitHubTimeoutError) {
      return NextResponse.json(
        { error: err.message, code: 'GITHUB_REQUEST_TIMEOUT' },
        { status: 408 }
      );
    }

    if (err instanceof AiConfigurationError) {
      return NextResponse.json(
        { error: err.message, code: 'AI_CONFIGURATION_ERROR' },
        { status: 503 }
      );
    }

    if (err instanceof AiRateLimitError) {
      return NextResponse.json(
        { error: err.message, code: 'AI_RATE_LIMIT_EXCEEDED' },
        { status: 429 }
      );
    }

    if (err instanceof AiModelUnavailableError) {
      return NextResponse.json(
        { error: err.message, code: 'AI_MODEL_UNAVAILABLE' },
        { status: 503 }
      );
    }

    if (err instanceof AiTimeoutError) {
      return NextResponse.json(
        { error: err.message, code: 'AI_TIMEOUT' },
        { status: 504 }
      );
    }

    if (
      err instanceof AiInvalidResponseError ||
      err instanceof InvalidRecommendationResponseError
    ) {
      return NextResponse.json(
        { error: err.message, code: 'AI_INVALID_RESPONSE' },
        { status: 502 }
      );
    }

    if (err instanceof NoCandidateIssuesError) {
      return NextResponse.json(
        { error: err.message, code: 'NO_CANDIDATE_ISSUES' },
        { status: 200 }
      );
    }

    if (err instanceof AiProviderError) {
      return NextResponse.json(
        { error: err.message, code: 'AI_PROVIDER_ERROR' },
        { status: 502 }
      );
    }

    const message =
      err instanceof Error ? err.message : 'Internal repository analysis failure.';
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return handleAnalyzeRequest(request);
}

import { NormalizedRepositorySchema } from '@/features/developer-profile/schemas';
import { ingestGitHubRepository } from '@/features/github';
import {
  GitHubAuthenticationError,
  GitHubRateLimitError,
  GitHubTimeoutError,
  RepositoryAccessError,
  RepositoryNotFoundError,
} from '@/features/github/errors';
import {
  validateApiRequestHeaders,
  createSafeJsonResponse,
} from '@/lib/api-security';

export async function POST(request: Request) {
  try {
    const headerValidation = validateApiRequestHeaders(request);
    if (!headerValidation.valid && headerValidation.response) {
      return headerValidation.response;
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createSafeJsonResponse(
        { error: 'Request body must be valid JSON.', code: 'INVALID_JSON' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object' || !('repository' in body)) {
      return createSafeJsonResponse(
        { error: 'Missing repository field in request payload.' },
        { status: 400 }
      );
    }

    const parseResult = NormalizedRepositorySchema.safeParse(
      (body as { repository: unknown }).repository
    );

    if (!parseResult.success) {
      return createSafeJsonResponse(
        {
          error: 'Invalid repository specification.',
          details: parseResult.error.issues.map((i) => i.message),
        },
        { status: 422 }
      );
    }

    const repository = parseResult.data;
    const ingested = await ingestGitHubRepository(repository);

    // Return a safe summary without dumping massive raw source blobs into browser
    return createSafeJsonResponse({
      success: true,
      data: {
        metadata: ingested.metadata,
        documents: {
          hasReadme: Boolean(ingested.documents.readme),
          readmeSize: ingested.documents.readme?.size ?? 0,
          hasContributing: Boolean(ingested.documents.contributing),
          contributingSize: ingested.documents.contributing?.size ?? 0,
        },
        treeCount: ingested.tree.length,
        manifestPaths: ingested.manifests.map((m) => m.path),
        sourceFilePaths: ingested.sourceFiles.map((s) => s.path),
        issueCount: ingested.issues.length,
        ingestion: ingested.ingestion,
      },
    });
  } catch (err: unknown) {
    if (err instanceof RepositoryNotFoundError) {
      return createSafeJsonResponse(
        { error: err.message, code: 'REPOSITORY_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (err instanceof RepositoryAccessError) {
      return createSafeJsonResponse(
        { error: err.message, code: 'REPOSITORY_ACCESS_DENIED' },
        { status: 403 }
      );
    }

    if (err instanceof GitHubRateLimitError) {
      return createSafeJsonResponse(
        { error: err.message, code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429 }
      );
    }

    if (err instanceof GitHubAuthenticationError) {
      return createSafeJsonResponse(
        { error: err.message, code: 'AUTHENTICATION_ERROR' },
        { status: 401 }
      );
    }

    if (err instanceof GitHubTimeoutError) {
      return createSafeJsonResponse(
        { error: err.message, code: 'REQUEST_TIMEOUT' },
        { status: 408 }
      );
    }

    return createSafeJsonResponse(
      { error: 'Internal repository inspection failure.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

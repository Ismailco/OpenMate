import { type NextResponse } from 'next/server';
import { InitializeChatRequestSchema, DeleteChatSessionRequestSchema } from '@/features/repository-assistant/schemas';
import {
  initializeRepositoryChat,
  type InitializeRepositoryChatDependencies,
} from '@/features/repository-assistant/service/initialize-repository-chat';
import {
  cleanupRepositoryChat,
  type CleanupRepositoryChatDependencies,
} from '@/features/repository-assistant/service/cleanup-repository-chat';
import {
  RepositoryAssistantConfigurationError,
  RepositoryAssistantIndexingError,
  RepositoryAssistantInitializationError,
  RepositoryAssistantTimeoutError,
} from '@/features/repository-assistant/errors';
import {
  RepositoryNotFoundError,
  GitHubRateLimitError,
} from '@/features/github/errors';
import {
  validateApiRequestHeaders,
  createSafeJsonResponse,
} from '@/lib/api-security';

export async function handleInitializeChatRequest(
  request: Request,
  deps: InitializeRepositoryChatDependencies = {}
): Promise<NextResponse> {
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
        { error: 'InvalidJson', message: 'Request body must be valid JSON.' },
        { status: 400 }
      );
    }

    const parsed = InitializeChatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return createSafeJsonResponse(
        {
          error: 'ValidationError',
          message: 'Invalid developer profile payload.',
          details: parsed.error.issues.map((i) => i.message),
        },
        { status: 422 }
      );
    }

    const result = await initializeRepositoryChat(parsed.data.profile, deps);
    return createSafeJsonResponse(result, { status: 200 });
  } catch (error) {
    if (error instanceof RepositoryNotFoundError) {
      return createSafeJsonResponse(
        { error: 'RepositoryNotFound', message: error.message },
        { status: 404 }
      );
    }

    if (error instanceof GitHubRateLimitError) {
      return createSafeJsonResponse(
        { error: 'RateLimited', message: 'GitHub API rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    if (error instanceof RepositoryAssistantConfigurationError) {
      return createSafeJsonResponse(
        { error: 'ConfigurationError', message: 'Assistant service is misconfigured.' },
        { status: 503 }
      );
    }

    if (error instanceof RepositoryAssistantTimeoutError) {
      return createSafeJsonResponse(
        { error: 'TimeoutError', message: error.message },
        { status: 504 }
      );
    }

    if (error instanceof RepositoryAssistantIndexingError) {
      return createSafeJsonResponse(
        { error: 'IndexingError', message: 'Context indexing failed for the repository.' },
        { status: 502 }
      );
    }

    if (error instanceof RepositoryAssistantInitializationError) {
      return createSafeJsonResponse(
        { error: 'InitializationError', message: 'Failed to initialize repository assistant session.' },
        { status: 502 }
      );
    }

    return createSafeJsonResponse(
      {
        error: 'InternalError',
        message: 'An unexpected error occurred while preparing the repository assistant.',
      },
      { status: 500 }
    );
  }
}

export async function handleDeleteChatSessionRequest(
  request: Request,
  deps: CleanupRepositoryChatDependencies = {}
): Promise<NextResponse> {
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
        { error: 'InvalidJson', message: 'Request body must be valid JSON.' },
        { status: 400 }
      );
    }

    const parsed = DeleteChatSessionRequestSchema.safeParse(body);
    if (!parsed.success) {
      return createSafeJsonResponse(
        { error: 'ValidationError', message: 'Invalid delete chat session payload.' },
        { status: 422 }
      );
    }

    await cleanupRepositoryChat(parsed.data.conversationToken, deps);
    return createSafeJsonResponse({ success: true }, { status: 200 });
  } catch {
    return createSafeJsonResponse({ success: true }, { status: 200 });
  }
}

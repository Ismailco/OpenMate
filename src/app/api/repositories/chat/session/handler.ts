import { NextResponse } from 'next/server';
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

export async function handleInitializeChatRequest(
  request: Request,
  deps: InitializeRepositoryChatDependencies = {}
): Promise<NextResponse> {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'InvalidJson', message: 'Request body must be valid JSON.' },
        { status: 400 }
      );
    }

    const parsed = InitializeChatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'ValidationError',
          message: 'Invalid developer profile payload.',
          details: parsed.error.issues.map((i) => i.message),
        },
        { status: 422 }
      );
    }

    const result = await initializeRepositoryChat(parsed.data.profile, deps);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof RepositoryNotFoundError) {
      return NextResponse.json(
        { error: 'RepositoryNotFound', message: error.message },
        { status: 404 }
      );
    }

    if (error instanceof GitHubRateLimitError) {
      return NextResponse.json(
        { error: 'RateLimited', message: 'GitHub API rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    if (error instanceof RepositoryAssistantConfigurationError) {
      return NextResponse.json(
        { error: 'ConfigurationError', message: 'Assistant service is misconfigured.' },
        { status: 503 }
      );
    }

    if (error instanceof RepositoryAssistantIndexingError) {
      return NextResponse.json(
        { error: 'IndexingError', message: error.message },
        { status: 502 }
      );
    }

    if (error instanceof RepositoryAssistantTimeoutError) {
      return NextResponse.json(
        { error: 'TimeoutError', message: 'Indexing timed out. Please try again.' },
        { status: 504 }
      );
    }

    if (error instanceof RepositoryAssistantInitializationError) {
      return NextResponse.json(
        { error: 'InitializationError', message: error.message },
        { status: 502 }
      );
    }

    return NextResponse.json(
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
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'InvalidJson', message: 'Request body must be valid JSON.' },
        { status: 400 }
      );
    }

    const parsed = DeleteChatSessionRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'ValidationError', message: 'Invalid delete chat session payload.' },
        { status: 422 }
      );
    }

    await cleanupRepositoryChat(parsed.data.conversationToken, deps);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

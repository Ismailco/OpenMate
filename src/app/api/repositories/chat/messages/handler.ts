import { NextResponse } from 'next/server';
import { SendChatMessageRequestSchema } from '@/features/repository-assistant/schemas';
import {
  answerRepositoryQuestion,
  type AnswerRepositoryQuestionDependencies,
} from '@/features/repository-assistant/service/answer-repository-question';
import {
  RepositoryAssistantConfigurationError,
  RepositoryAssistantInvalidResponseError,
  RepositoryAssistantProviderError,
  RepositoryAssistantTimeoutError,
  RepositoryAssistantTokenError,
  RepositoryAssistantTokenExpiredError,
} from '@/features/repository-assistant/errors';

export async function handleSendChatMessageRequest(
  request: Request,
  deps: AnswerRepositoryQuestionDependencies = {}
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

    const parsed = SendChatMessageRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'ValidationError',
          message: 'Invalid message request payload.',
          details: parsed.error.issues.map((i) => i.message),
        },
        { status: 422 }
      );
    }

    const answer = await answerRepositoryQuestion(parsed.data, deps);
    return NextResponse.json(answer, { status: 200 });
  } catch (error) {
    if (error instanceof RepositoryAssistantTokenExpiredError) {
      return NextResponse.json(
        { error: 'TokenExpired', message: error.message },
        { status: 410 }
      );
    }

    if (error instanceof RepositoryAssistantTokenError) {
      return NextResponse.json(
        { error: 'UnauthorizedToken', message: error.message },
        { status: 401 }
      );
    }

    if (error instanceof RepositoryAssistantConfigurationError) {
      return NextResponse.json(
        { error: 'ConfigurationError', message: 'Assistant service is misconfigured.' },
        { status: 503 }
      );
    }

    if (error instanceof RepositoryAssistantTimeoutError) {
      return NextResponse.json(
        { error: 'TimeoutError', message: 'Assistant response timed out.' },
        { status: 504 }
      );
    }

    if (error instanceof RepositoryAssistantInvalidResponseError) {
      return NextResponse.json(
        { error: 'InvalidResponse', message: 'Provider returned an unreadable response structure.' },
        { status: 502 }
      );
    }

    if (error instanceof RepositoryAssistantProviderError) {
      return NextResponse.json(
        { error: 'ProviderError', message: error.message },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        error: 'InternalError',
        message: 'An unexpected error occurred while communicating with the assistant.',
      },
      { status: 500 }
    );
  }
}

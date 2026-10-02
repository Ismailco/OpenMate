import { type NextResponse } from 'next/server';
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
import {
  validateApiRequestHeaders,
  createSafeJsonResponse,
} from '@/lib/api-security';

export async function handleSendChatMessageRequest(
  request: Request,
  deps: AnswerRepositoryQuestionDependencies = {}
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

    const parsed = SendChatMessageRequestSchema.safeParse(body);
    if (!parsed.success) {
      return createSafeJsonResponse(
        {
          error: 'ValidationError',
          message: 'Invalid message request payload.',
          details: parsed.error.issues.map((i) => i.message),
        },
        { status: 422 }
      );
    }

    const answer = await answerRepositoryQuestion(parsed.data, deps);
    return createSafeJsonResponse(answer, { status: 200 });
  } catch (error) {
    if (error instanceof RepositoryAssistantTokenExpiredError) {
      return createSafeJsonResponse(
        { error: 'TokenExpired', message: error.message },
        { status: 410 }
      );
    }

    if (error instanceof RepositoryAssistantTokenError) {
      return createSafeJsonResponse(
        { error: 'UnauthorizedToken', message: error.message },
        { status: 401 }
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
        { error: 'TimeoutError', message: 'Assistant response timed out.' },
        { status: 504 }
      );
    }

    if (error instanceof RepositoryAssistantInvalidResponseError) {
      return createSafeJsonResponse(
        { error: 'InvalidResponse', message: 'Provider returned an unreadable response structure.' },
        { status: 502 }
      );
    }

    if (error instanceof RepositoryAssistantProviderError) {
      return createSafeJsonResponse(
        { error: 'ProviderError', message: 'The AI assistant provider reported an upstream service failure.' },
        { status: 502 }
      );
    }

    return createSafeJsonResponse(
      {
        error: 'InternalError',
        message: 'An unexpected error occurred while communicating with the assistant.',
      },
      { status: 500 }
    );
  }
}

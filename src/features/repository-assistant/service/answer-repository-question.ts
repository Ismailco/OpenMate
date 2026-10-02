import 'server-only';
import type { NormalizedRepository } from '@/features/developer-profile/types';
import { CHAT_MESSAGE_MAX_LENGTH } from '../constants';
import {
  RepositoryAssistantConfigurationError,
  RepositoryAssistantError,
} from '../errors';
import { verifyConversationToken } from '../tokens/conversation-token';
import { sendChatMessageToThread } from '../backboard/send-chat-message';
import {
  type BackboardAssistantClientLike,
  type BackboardAssistantConfig,
  createBackboardAssistantClient,
  getBackboardAssistantConfig,
} from '../backboard/client';
import type { RepositoryAssistantAnswer } from '../types';

export interface AnswerRepositoryQuestionDependencies {
  backboardClient?: BackboardAssistantClientLike;
  config?: BackboardAssistantConfig;
  signingSecret?: string;
}

/**
 * Validates the conversation token and answers a follow-up question using the Backboard thread and RAG context.
 */
export async function answerRepositoryQuestion(
  params: {
    conversationToken: string;
    repository: NormalizedRepository;
    message: string;
  },
  deps: AnswerRepositoryQuestionDependencies = {}
): Promise<RepositoryAssistantAnswer> {
  const secret = deps.signingSecret ?? process.env.OPENMATE_CHAT_SIGNING_SECRET;
  if (!secret) {
    throw new RepositoryAssistantConfigurationError(
      'OPENMATE_CHAT_SIGNING_SECRET is not configured in environment variables.'
    );
  }

  const cleanMessage = params.message.trim();
  if (!cleanMessage) {
    throw new RepositoryAssistantError('Question message cannot be empty.');
  }
  if (cleanMessage.length > CHAT_MESSAGE_MAX_LENGTH) {
    throw new RepositoryAssistantError(
      `Question message exceeds maximum limit of ${CHAT_MESSAGE_MAX_LENGTH} characters.`
    );
  }

  const expectedRepoFullName = `${params.repository.owner}/${params.repository.name}`;

  // Verify token signature, expiration, and repository binding
  const payload = verifyConversationToken(
    params.conversationToken,
    expectedRepoFullName,
    secret
  );

  const config = deps.config ?? getBackboardAssistantConfig();
  const client = deps.backboardClient ?? createBackboardAssistantClient(config);

  return sendChatMessageToThread(
    client,
    {
      threadId: payload.threadId,
      repositoryFullName: payload.repositoryFullName,
      content: cleanMessage,
    },
    config
  );
}

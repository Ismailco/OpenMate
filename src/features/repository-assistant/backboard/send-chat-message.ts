import 'server-only';
import { BACKBOARD_DEFAULT_MODEL } from '../constants';
import { RepositoryAssistantError } from '../errors';
import type {
  BackboardAssistantClientLike,
  BackboardAssistantConfig,
} from './client';
import type { RepositoryAssistantAnswer } from '../types';
import { withAiSpan, deriveSafeConversationId } from '@/features/observability';

export interface SendChatMessageParams {
  threadId: string;
  repositoryFullName: string;
  content: string;
}

/**
 * Strips accidental Gemma tool_code blocks from model output if present.
 */
export function sanitizeAssistantResponse(rawContent: string): string {
  if (!rawContent) return '';

  let cleaned = rawContent
    .replace(/```(?:tool_code|json)?\s*\[search_documents\([^)]*\)\]\s*```/gi, '')
    .replace(/```tool_code[\s\S]*?```/gi, '')
    .trim();

  // If the model only emitted a tool call block and nothing else
  if (!cleaned) {
    cleaned = "I reviewed the indexed repository context, but I don't have enough specific evidence in the bounded files to answer that question directly.";
  }

  return cleaned;
}

/**
 * Sends a contributor message to the isolated Backboard thread and returns the grounded answer.
 */
export async function sendChatMessageToThread(
  client: BackboardAssistantClientLike,
  params: SendChatMessageParams,
  config: BackboardAssistantConfig
): Promise<RepositoryAssistantAnswer> {
  const modelName = config.modelName ?? BACKBOARD_DEFAULT_MODEL;
  const safeConversationId = deriveSafeConversationId(params.threadId);

  return withAiSpan(
    {
      name: 'Ask OpenMate generation',
      model: modelName,
      system: 'openrouter',
      operationType: 'ai_client',
      conversationId: safeConversationId,
      attributes: {
        'openmate.repository.full_name': params.repositoryFullName,
      },
    },
    async (aiSpan) => {
      try {
        const threadResponse = (await client.sendMessage({
          threadId: params.threadId,
          content: params.content,
          model: modelName,
          memory: 'off',
          web_search: 'off',
        })) as {
          content?: string;
          modelName?: string;
          inputTokens?: number;
          outputTokens?: number;
          totalTokens?: number;
        };

        if (threadResponse) {
          if (typeof threadResponse.modelName === 'string') {
            aiSpan.setResponseModel(threadResponse.modelName);
          }
          aiSpan.recordTokenUsage({
            inputTokens: typeof threadResponse.inputTokens === 'number' ? threadResponse.inputTokens : undefined,
            outputTokens: typeof threadResponse.outputTokens === 'number' ? threadResponse.outputTokens : undefined,
            totalTokens: typeof threadResponse.totalTokens === 'number' ? threadResponse.totalTokens : undefined,
          });
        }

        const sanitizedAnswer = sanitizeAssistantResponse(threadResponse?.content ?? '');

        return {
          message: sanitizedAnswer,
          model: modelName,
        };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new RepositoryAssistantError(`Failed to receive assistant reply: ${message}`);
      }
    }
  );
}

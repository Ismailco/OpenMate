import 'server-only';
import { buildRepositoryAssistantSystemPrompt } from '../prompts/system-prompt';
import { RepositoryAssistantInitializationError } from '../errors';
import type { BackboardAssistantClientLike, BackboardAssistantConfig } from './client';

export interface CreatedChatSession {
  assistantId: string;
  threadId: string;
}

/**
 * Creates an isolated Backboard assistant and conversation thread for a repository chat session.
 */
export async function createChatSession(
  client: BackboardAssistantClientLike,
  repositoryFullName: string,
  config: BackboardAssistantConfig
): Promise<CreatedChatSession> {
  let assistantId: string | undefined;

  try {
    const systemPrompt = buildRepositoryAssistantSystemPrompt(repositoryFullName);
    const assistant = await client.createAssistant({
      name: `OpenMate Assistant: ${repositoryFullName}`,
      description: `Grounding contributor assistant for ${repositoryFullName}`,
      system_prompt: systemPrompt,
      tok_k: config.tokK,
      embedding_provider: config.embeddingProvider,
      embedding_model_name: config.embeddingModelName,
      embedding_dims: config.embeddingDims,
    });

    assistantId = assistant.assistantId;

    const thread = await client.createThread(assistantId);
    return {
      assistantId,
      threadId: thread.threadId,
    };
  } catch (error) {
    if (assistantId) {
      try {
        await client.deleteAssistant(assistantId);
      } catch {
        // Best-effort cleanup
      }
    }

    throw new RepositoryAssistantInitializationError(
      `Failed to initialize Backboard chat session for ${repositoryFullName}: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { cause: error }
    );
  }
}

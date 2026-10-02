import 'server-only';
import {
  type BackboardAssistantClientLike,
  type BackboardAssistantConfig,
  createBackboardAssistantClient,
  getBackboardAssistantConfig,
} from '../backboard/client';
import { cleanupChatSessionResources } from '../backboard/cleanup-chat-session';
import { verifyConversationToken } from '../tokens/conversation-token';
import { RepositoryAssistantConfigurationError } from '../errors';

export interface CleanupRepositoryChatDependencies {
  backboardClient?: BackboardAssistantClientLike;
  config?: BackboardAssistantConfig;
  signingSecret?: string;
}

/**
 * Validates a conversation token and performs best-effort cleanup of provider assistant and thread resources.
 */
export async function cleanupRepositoryChat(
  conversationToken: string,
  deps: CleanupRepositoryChatDependencies = {}
): Promise<{ success: true }> {
  const secret = deps.signingSecret ?? process.env.OPENMATE_CHAT_SIGNING_SECRET;
  if (!secret) {
    throw new RepositoryAssistantConfigurationError(
      'OPENMATE_CHAT_SIGNING_SECRET is not configured in environment variables.'
    );
  }

  try {
    // Decodes and verifies token without repository binding check
    // We pass the payload's own repositoryFullName to verify signature & expiration
    const parts = conversationToken.split('.');
    if (parts.length === 2 && parts[0]) {
      const rawPayload = Buffer.from(parts[0], 'base64url').toString('utf-8');
      const parsed = JSON.parse(rawPayload);
      if (parsed && typeof parsed.repositoryFullName === 'string') {
        const payload = verifyConversationToken(
          conversationToken,
          parsed.repositoryFullName,
          secret
        );

        const config = deps.config ?? getBackboardAssistantConfig();
        const client = deps.backboardClient ?? createBackboardAssistantClient(config);

        await cleanupChatSessionResources(client, {
          assistantId: payload.assistantId,
          threadId: payload.threadId,
        });
      }
    }
  } catch {
    // Best-effort cleanup: never throw on cleanup failure
  }

  return { success: true };
}

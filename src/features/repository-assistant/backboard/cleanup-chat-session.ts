import 'server-only';
import type { BackboardAssistantClientLike } from './client';

export interface CleanupChatSessionParams {
  assistantId: string;
  threadId: string;
}

/**
 * Best-effort cleanup of provider assistant and thread resources.
 * Swallows errors so client operations are never blocked.
 */
export async function cleanupChatSessionResources(
  client: BackboardAssistantClientLike,
  params: CleanupChatSessionParams
): Promise<void> {
  try {
    if (params.threadId) {
      await client.deleteThread(params.threadId);
    }
  } catch (err) {
    console.warn(`[OpenMate] Best-effort thread cleanup failed for ${params.threadId}:`, err);
  }

  try {
    if (params.assistantId) {
      await client.deleteAssistant(params.assistantId);
    }
  } catch (err) {
    console.warn(`[OpenMate] Best-effort assistant cleanup failed for ${params.assistantId}:`, err);
  }
}

import type { DeveloperProfile, NormalizedRepository } from '@/features/developer-profile/types';
import type {
  ChatSessionInitializationResult,
  RepositoryAssistantAnswer,
} from '../types';

export class ChatClientError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ChatClientError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Initializes a repository chat session with Backboard RAG.
 */
export async function initializeChat(
  profile: DeveloperProfile,
  signal?: AbortSignal
): Promise<ChatSessionInitializationResult> {
  const response = await fetch('/api/repositories/chat/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile }),
    signal,
  });

  if (!response.ok) {
    let errorMsg = `Chat initialization failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData?.message) errorMsg = errorData.message;
    } catch {
      // Use fallback errorMsg
    }
    throw new ChatClientError(errorMsg, response.status);
  }

  return response.json();
}

/**
 * Sends a message in the active chat session.
 */
export async function sendChatMessage(
  params: {
    conversationToken: string;
    repository: NormalizedRepository;
    message: string;
  },
  signal?: AbortSignal
): Promise<RepositoryAssistantAnswer> {
  const response = await fetch('/api/repositories/chat/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal,
  });

  if (!response.ok) {
    let errorMsg = `Sending message failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData?.message) errorMsg = errorData.message;
    } catch {
      // Use fallback errorMsg
    }
    throw new ChatClientError(errorMsg, response.status);
  }

  return response.json();
}

/**
 * Deletes the active chat session (best-effort cleanup).
 */
export async function deleteChatSession(conversationToken: string): Promise<void> {
  try {
    await fetch('/api/repositories/chat/session', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationToken }),
    });
  } catch {
    // Swallow client cleanup errors
  }
}

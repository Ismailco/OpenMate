import {
  CHAT_STORAGE_KEY,
  CHAT_STORAGE_VERSION,
  MAX_STORED_CHAT_MESSAGES,
} from '../constants';
import { StoredChatSessionSchema } from '../schemas';
import type { ChatMessage, StoredChatSession } from '../types';

/**
 * Loads the active chat session from sessionStorage for a specific repository.
 * Returns null if missing, corrupted, or bound to a different repository.
 */
export function loadChatSession(expectedRepositoryFullName: string): StoredChatSession | null {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return null;

    const parsedJson = JSON.parse(raw);
    const parsed = StoredChatSessionSchema.safeParse(parsedJson);

    if (!parsed.success) {
      clearChatStorage();
      return null;
    }

    const session = parsed.data;

    // Validate repository match
    const normalizedExpected = expectedRepositoryFullName.trim().toLowerCase();
    const normalizedActual = session.repositoryFullName.trim().toLowerCase();

    if (normalizedExpected !== normalizedActual) {
      // Discard chat session if bound to a different repository
      clearChatStorage();
      return null;
    }

    return session;
  } catch {
    clearChatStorage();
    return null;
  }
}

/**
 * Persists the current chat messages and conversation token to sessionStorage.
 */
export function saveChatSession(session: {
  conversationToken: string;
  repositoryFullName: string;
  messages: ChatMessage[];
}): void {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return;
  }

  try {
    const trimmedMessages = session.messages.slice(-MAX_STORED_CHAT_MESSAGES);

    const payload: StoredChatSession = {
      version: CHAT_STORAGE_VERSION,
      conversationToken: session.conversationToken,
      repositoryFullName: session.repositoryFullName,
      messages: trimmedMessages,
      updatedAt: new Date().toISOString(),
    };

    const validated = StoredChatSessionSchema.parse(payload);
    window.sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(validated));
  } catch {
    // Non-fatal if session storage write fails
  }
}

/**
 * Removes the chat session from sessionStorage.
 */
export function clearChatStorage(): void {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return;
  }

  try {
    window.sessionStorage.removeItem(CHAT_STORAGE_KEY);
  } catch {
    // Ignore error
  }
}

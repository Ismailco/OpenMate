import type { NormalizedRepository } from '@/features/developer-profile/types';

export type ChatMessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  timestamp: string;
}

export interface ConversationTokenPayload {
  version: 1;
  assistantId: string;
  threadId: string;
  repositoryFullName: string;
  issuedAt: number;
  expiresAt: number;
}

export interface ChatSessionInitializationResult {
  success: true;
  conversationToken: string;
  repositoryFullName: string;
  expiresAt: number;
}

export interface RepositoryAssistantAnswer {
  message: string;
  model: string;
}

export interface StoredChatSession {
  version: number;
  conversationToken: string;
  repositoryFullName: string;
  messages: ChatMessage[];
  updatedAt: string;
}

export interface SendChatMessageInput {
  conversationToken: string;
  repository: NormalizedRepository;
  message: string;
}

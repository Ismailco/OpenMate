import { z } from 'zod';
import {
  DeveloperProfileSchema,
  NormalizedRepositorySchema,
} from '@/features/developer-profile/schemas';
import { CHAT_MESSAGE_MAX_LENGTH, CHAT_STORAGE_VERSION } from './constants';

export const ChatMessageRoleSchema = z.enum(['user', 'assistant']);

export const ChatMessageSchema = z.object({
  id: z.string().min(1),
  role: ChatMessageRoleSchema,
  content: z.string().min(1).max(CHAT_MESSAGE_MAX_LENGTH * 2),
  timestamp: z.string().datetime(),
});

export const InitializeChatRequestSchema = z.object({
  profile: DeveloperProfileSchema,
});

export const SendChatMessageRequestSchema = z.object({
  conversationToken: z.string().min(10, 'A valid conversation token is required'),
  repository: NormalizedRepositorySchema,
  message: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(CHAT_MESSAGE_MAX_LENGTH, `Message exceeds maximum length of ${CHAT_MESSAGE_MAX_LENGTH} characters`),
});

export const DeleteChatSessionRequestSchema = z.object({
  conversationToken: z.string().min(10, 'A valid conversation token is required'),
});

export const StoredChatSessionSchema = z.object({
  version: z.literal(CHAT_STORAGE_VERSION),
  conversationToken: z.string().min(10),
  repositoryFullName: z.string().min(1),
  messages: z.array(ChatMessageSchema),
  updatedAt: z.string().datetime(),
});

import { z } from 'zod';

export const ConversationTokenPayloadSchema = z.object({
  version: z.literal(1),
  assistantId: z.string().min(1),
  threadId: z.string().min(1),
  repositoryFullName: z.string().min(1),
  issuedAt: z.number().int().positive(),
  expiresAt: z.number().int().positive(),
});

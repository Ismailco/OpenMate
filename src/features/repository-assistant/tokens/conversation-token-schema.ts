import { z } from 'zod';
import { CONVERSATION_TOKEN_MAX_AGE_MS } from '../constants';

export const ConversationTokenPayloadSchema = z
  .object({
    version: z.literal(1),
    assistantId: z.string().min(1).max(256),
    threadId: z.string().min(1).max(256),
    repositoryFullName: z.string().min(3).max(141),
    issuedAt: z.number().int().positive(),
    expiresAt: z.number().int().positive(),
  })
  .strict()
  .refine((data) => data.expiresAt > data.issuedAt, {
    message: 'expiresAt must be strictly greater than issuedAt.',
  })
  .refine(
    (data) => data.expiresAt <= data.issuedAt + CONVERSATION_TOKEN_MAX_AGE_MS + 60_000,
    {
      message: 'Token lifetime exceeds maximum allowed duration.',
    }
  );

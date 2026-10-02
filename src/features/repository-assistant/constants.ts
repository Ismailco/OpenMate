/**
 * Repository assistant domain constants.
 */

export const OPENMATE_CHAT_SIGNING_SECRET_MIN_LENGTH = 32;

/**
 * 24 hour lifetime for conversation tokens, matching analysis sessions.
 */
export const CONVERSATION_TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Maximum character limit for contributor chat questions.
 */
export const CHAT_MESSAGE_MAX_LENGTH = 3000;

/**
 * Maximum time to wait for a Backboard thread document to be indexed (45 seconds).
 */
export const DOCUMENT_INDEX_TIMEOUT_MS = 45000;

/**
 * Polling interval for document indexing status (1 second).
 */
export const DOCUMENT_INDEX_POLL_INTERVAL_MS = 1000;

/**
 * Default retrieval depth (k chunks) for RAG context.
 */
export const DEFAULT_RETRIEVAL_K = 8;

/**
 * Default Backboard embedding configuration.
 */
export const DEFAULT_EMBEDDING_PROVIDER = 'google';
export const DEFAULT_EMBEDDING_MODEL = 'gemini-embedding-001-1536';
export const DEFAULT_EMBEDDING_DIMS = 1536;

/**
 * Open-weight reasoning model for Ask OpenMate.
 */
export const ASSISTANT_MODEL_PROVIDER = 'openrouter';
export const ASSISTANT_MODEL_NAME = 'google/gemma-3-27b-it';
export const BACKBOARD_DEFAULT_MODEL = ASSISTANT_MODEL_NAME;

/**
 * Chat storage key for browser sessionStorage.
 */
export const CHAT_STORAGE_KEY = 'openmate.chat.v1';
export const CHAT_STORAGE_VERSION = 1;
export const MAX_STORED_CHAT_MESSAGES = 40;

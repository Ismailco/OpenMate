import 'server-only';
import { BackboardClient } from 'backboard-sdk';
import {
  ASSISTANT_MODEL_NAME,
  ASSISTANT_MODEL_PROVIDER,
  DEFAULT_EMBEDDING_DIMS,
  DEFAULT_EMBEDDING_MODEL,
  DEFAULT_EMBEDDING_PROVIDER,
  DEFAULT_RETRIEVAL_K,
} from '../constants';
import { RepositoryAssistantConfigurationError } from '../errors';

export interface BackboardAssistantConfig {
  apiKey: string;
  modelProvider: string;
  modelName: string;
  timeoutMs: number;
  embeddingProvider: string;
  embeddingModelName: string;
  embeddingDims: number;
  tokK: number;
}

export function getBackboardAssistantConfig(): BackboardAssistantConfig {
  const apiKey = process.env.BACKBOARD_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new RepositoryAssistantConfigurationError(
      'BACKBOARD_API_KEY is not configured in environment variables.'
    );
  }

  const modelProvider = process.env.BACKBOARD_MODEL_PROVIDER || ASSISTANT_MODEL_PROVIDER;
  const modelName = process.env.BACKBOARD_MODEL_NAME || ASSISTANT_MODEL_NAME;
  const timeoutMs = process.env.BACKBOARD_TIMEOUT_MS
    ? parseInt(process.env.BACKBOARD_TIMEOUT_MS, 10)
    : 60000;

  return {
    apiKey: apiKey.trim(),
    modelProvider,
    modelName,
    timeoutMs,
    embeddingProvider: DEFAULT_EMBEDDING_PROVIDER,
    embeddingModelName: DEFAULT_EMBEDDING_MODEL,
    embeddingDims: DEFAULT_EMBEDDING_DIMS,
    tokK: DEFAULT_RETRIEVAL_K,
  };
}

export interface BackboardAssistantClientLike {
  createAssistant(options: {
    name: string;
    description?: string;
    system_prompt?: string;
    tok_k?: number;
    embedding_provider?: string;
    embedding_model_name?: string;
    embedding_dims?: number;
    [key: string]: unknown;
  }): Promise<{ assistantId: string; [key: string]: unknown }>;

  createThread(assistantId: string): Promise<{ threadId: string; [key: string]: unknown }>;

  uploadDocumentToThread(
    threadId: string,
    filePath: string
  ): Promise<{ documentId: string; status: string; [key: string]: unknown }>;

  getDocumentStatus(
    documentId: string
  ): Promise<{ documentId: string; status: string; statusMessage?: string; [key: string]: unknown }>;

  sendMessage(options: {
    threadId?: string;
    assistantId?: string;
    content?: string;
    systemPrompt?: string;
    llm_provider?: string;
    model_name?: string;
    memory?: string;
    web_search?: string;
    stream?: boolean;
    send_to_llm?: string;
    [key: string]: unknown;
  }): Promise<{
    content?: string;
    messages?: Array<{ role: string; content: string; [key: string]: unknown }>;
    [key: string]: unknown;
  }>;

  deleteThread(threadId: string): Promise<unknown>;
  deleteAssistant(assistantId: string): Promise<unknown>;
}

export function createBackboardAssistantClient(
  config: BackboardAssistantConfig = getBackboardAssistantConfig()
): BackboardAssistantClientLike {
  return new BackboardClient({
    apiKey: config.apiKey,
    timeout: config.timeoutMs,
  }) as unknown as BackboardAssistantClientLike;
}

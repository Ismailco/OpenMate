import 'server-only';
import type { DeveloperProfile } from '@/features/developer-profile/types';
import { DeveloperProfileSchema } from '@/features/developer-profile/schemas';
import { ingestGitHubRepository } from '@/features/github/ingestion/ingest-repository';
import { buildRepositoryContext } from '@/features/repository-context/build-context';
import type { RepositoryContext } from '@/features/repository-context/types';
import type { IngestedRepository } from '@/features/github/types';
import { formatDeveloperProfileContext } from '../prompts/system-prompt';
import { signConversationToken } from '../tokens/conversation-token';
import { createChatSession } from '../backboard/create-chat-session';
import { uploadRepositoryContextToThread } from '../backboard/upload-repository-context';
import { awaitDocumentIndexed } from '../backboard/document-status';
import {
  type BackboardAssistantClientLike,
  type BackboardAssistantConfig,
  createBackboardAssistantClient,
  getBackboardAssistantConfig,
} from '../backboard/client';
import { CONVERSATION_TOKEN_MAX_AGE_MS } from '../constants';
import {
  RepositoryAssistantConfigurationError,
  RepositoryAssistantInitializationError,
} from '../errors';
import type { ChatSessionInitializationResult } from '../types';

export interface InitializeRepositoryChatDependencies {
  ingestRepo?: (repo: DeveloperProfile['repository']) => Promise<IngestedRepository>;
  buildContext?: (ingested: IngestedRepository) => RepositoryContext;
  backboardClient?: BackboardAssistantClientLike;
  config?: BackboardAssistantConfig;
  signingSecret?: string;
}

/**
 * Initializes a grounded repository chat session with Backboard RAG.
 */
export async function initializeRepositoryChat(
  profileInput: DeveloperProfile,
  deps: InitializeRepositoryChatDependencies = {}
): Promise<ChatSessionInitializationResult> {
  const profileParsed = DeveloperProfileSchema.safeParse(profileInput);
  if (!profileParsed.success) {
    throw new RepositoryAssistantInitializationError(
      `Invalid developer profile: ${profileParsed.error.issues.map((i) => i.message).join(', ')}`
    );
  }
  const profile = profileParsed.data;

  const secret = deps.signingSecret ?? process.env.OPENMATE_CHAT_SIGNING_SECRET;
  if (!secret) {
    throw new RepositoryAssistantConfigurationError(
      'OPENMATE_CHAT_SIGNING_SECRET is not configured in environment variables.'
    );
  }

  const config = deps.config ?? getBackboardAssistantConfig();
  const client = deps.backboardClient ?? createBackboardAssistantClient(config);
  const ingest = deps.ingestRepo ?? ingestGitHubRepository;
  const contextBuilder = deps.buildContext ?? buildRepositoryContext;

  const repoFullName = `${profile.repository.owner}/${profile.repository.name}`;

  // 1. Ingest repository and build bounded repository context
  const ingested = await ingest(profile.repository);
  const context = contextBuilder(ingested);

  // 2. Create isolated Backboard assistant and thread
  const session = await createChatSession(client, repoFullName, config);

  try {
    // 3. Upload serialized context document to thread
    const doc = await uploadRepositoryContextToThread(client, session.threadId, context);

    // 4. Wait for document indexing to reach 'indexed'
    await awaitDocumentIndexed(client, doc.documentId);

    // 5. Seed developer profile context quietly (send_to_llm: 'false' avoids burning inference)
    try {
      const profileContextMessage = formatDeveloperProfileContext(profile);
      await client.sendMessage({
        threadId: session.threadId,
        content: profileContextMessage,
        send_to_llm: 'false',
      });
    } catch {
      // Non-fatal if seeding message fails
    }

    // 6. Sign opaque conversation token
    const token = signConversationToken(
      {
        assistantId: session.assistantId,
        threadId: session.threadId,
        repositoryFullName: repoFullName,
      },
      secret,
      CONVERSATION_TOKEN_MAX_AGE_MS
    );

    return {
      success: true,
      conversationToken: token,
      repositoryFullName: repoFullName,
      expiresAt: Date.now() + CONVERSATION_TOKEN_MAX_AGE_MS,
    };
  } catch (error) {
    // Cleanup created resources if indexing/setup fails
    try {
      await client.deleteThread(session.threadId);
      await client.deleteAssistant(session.assistantId);
    } catch {
      // Ignore cleanup error
    }

    throw error;
  }
}

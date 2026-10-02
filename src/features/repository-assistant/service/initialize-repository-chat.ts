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
import { withSpan } from '@/features/observability';

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

  return withSpan(
    {
      name: 'OpenMate chat initialization',
      op: 'openmate.chat.init',
      attributes: {
        'openmate.repository.full_name': repoFullName,
        'openmate.profile.skill_count': profile.skills.length,
        'openmate.profile.interest_count': profile.interests.length,
      },
    },
    async (initSpan) => {
      // 1. Ingest repository
      const ingested = await withSpan(
        {
          name: 'GitHub repository ingestion',
          op: 'github.ingest',
          attributes: {
            'openmate.repository.full_name': repoFullName,
          },
        },
        async (ingestSpan) => {
          const res = await ingest(profile.repository);
          ingestSpan.setAttributes({
            'github.tree_entry_count': res.tree?.length ?? 0,
            'github.issue_count': res.issues?.length ?? 0,
            'github.source_file_count': res.sourceFiles?.length ?? 0,
            'github.manifest_count': res.manifests?.length ?? 0,
            'github.has_readme': Boolean(res.documents?.readme),
            'github.has_contributing': Boolean(res.documents?.contributing),
          });
          return res;
        }
      );

      // 2. Build context
      const context = await withSpan(
        {
          name: 'Repository context build',
          op: 'openmate.context.build',
        },
        async (contextSpan) => {
          const ctx = contextBuilder(ingested);
          contextSpan.setAttributes({
            'openmate.context.character_count': ctx.contextMetadata?.approximateCharacters ?? 0,
            'openmate.context.source_files_included': ctx.contextMetadata?.sourceFilesIncluded ?? 0,
            'openmate.context.issues_included': ctx.contextMetadata?.issuesIncluded ?? 0,
          });
          return ctx;
        }
      );

      initSpan.setAttribute(
        'openmate.context.character_count',
        context.contextMetadata?.approximateCharacters ?? 0
      );

      // 3. Create isolated Backboard assistant and thread
      const session = await createChatSession(client, repoFullName, config);

      try {
        // 4. Upload serialized context document to thread
        const doc = await withSpan(
          {
            name: 'Backboard RAG document upload',
            op: 'openmate.rag.upload',
            attributes: {
              'openmate.rag.character_count': context.contextMetadata?.approximateCharacters ?? 0,
              'openmate.rag.embedding_model': config.embeddingModelName ?? 'gemini-embedding-001-1536',
              'openmate.rag.top_k': config.tokK ?? 8,
            },
          },
          async () => uploadRepositoryContextToThread(client, session.threadId, context)
        );

        // 5. Wait for document indexing to reach 'indexed'
        await withSpan(
          {
            name: 'Backboard RAG indexing',
            op: 'openmate.rag.index',
            attributes: {
              'openmate.rag.outcome': 'indexed',
            },
          },
          async () => awaitDocumentIndexed(client, doc.documentId)
        );

        // 6. Seed developer profile context quietly
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

        // 7. Sign opaque conversation token
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
  );
}

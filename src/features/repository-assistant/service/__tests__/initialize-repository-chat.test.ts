import { describe, it, expect, vi } from 'vitest';
import { initializeRepositoryChat } from '../initialize-repository-chat';
import type { DeveloperProfile } from '@/features/developer-profile/types';
import type { IngestedRepository } from '@/features/github/types';
import type { RepositoryContext } from '@/features/repository-context/types';
import type { BackboardAssistantClientLike, BackboardAssistantConfig } from '../../backboard/client';
import { verifyConversationToken } from '../../tokens/conversation-token';

describe('Initialize Repository Chat Service', () => {
  const secret = 'valid-test-signing-secret-with-more-than-32-chars-length';

  const mockProfile: DeveloperProfile = {
    repository: {
      owner: 'facebook',
      name: 'react',
      url: 'https://github.com/facebook/react',
    },
    skills: [{ name: 'TypeScript', level: 'advanced' }],
    interests: ['frontend'],
    availableHours: 5,
    contributionExperience: 'some-experience',
  };

  const dummyIngested: IngestedRepository = {
    metadata: {
      id: 12345,
      owner: 'facebook',
      name: 'react',
      fullName: 'facebook/react',
      description: 'The library for web and native user interfaces.',
      defaultBranch: 'main',
      primaryLanguage: 'JavaScript',
      topics: ['javascript'],
      stars: 220000,
      forks: 45000,
      openIssuesCount: 500,
      isArchived: false,
      isFork: false,
      license: 'MIT',
      htmlUrl: 'https://github.com/facebook/react',
    },
    documents: {},
    tree: [],
    manifests: [],
    sourceFiles: [],
    issues: [],
    ingestion: {
      fetchedAt: '2026-03-29T12:00:00.000Z',
      truncatedTree: false,
      truncatedIssues: false,
      skippedFiles: 0,
    },
  };

  const dummyContext: RepositoryContext = {
    repository: {
      owner: 'facebook',
      name: 'react',
      fullName: 'facebook/react',
      defaultBranch: 'main',
      primaryLanguage: 'JavaScript',
      description: 'The library for web and native user interfaces.',
      license: 'MIT',
      stars: 220000,
      forks: 45000,
      topics: ['javascript'],
    },
    documentation: {
      readme: undefined,
      contributing: undefined,
    },
    projectStructure: {
      treeSummary: 'src/\npackage.json',
      topDirectories: ['src'],
      entrypointFiles: ['package.json'],
      totalFilesObserved: 10,
      truncated: false,
    },
    manifests: [],
    sourceFiles: [],
    issues: [],
    contextMetadata: {
      generatedAt: '2026-03-29T12:00:00.000Z',
      sourceFilesIncluded: 0,
      issuesIncluded: 0,
      truncatedDocuments: 0,
      truncatedFiles: 0,
      truncatedIssues: 0,
      approximateCharacters: 500,
    },
    trust: 'untrusted-repository-content',
  };

  const mockConfig: BackboardAssistantConfig = {
    apiKey: 'test-key',
    modelProvider: 'openrouter',
    modelName: 'google/gemma-3-27b-it',
    timeoutMs: 30000,
    embeddingProvider: 'google',
    embeddingModelName: 'gemini-embedding-001-1536',
    embeddingDims: 1536,
    tokK: 8,
  };

  it('runs complete initialization pipeline and returns signed conversation token', async () => {
    const mockIngest = vi.fn().mockResolvedValue(dummyIngested);
    const mockBuildContext = vi.fn().mockReturnValue(dummyContext);

    const mockClient = {
      createAssistant: vi.fn().mockResolvedValue({ assistantId: 'asst_live_123' }),
      createThread: vi.fn().mockResolvedValue({ threadId: 'thrd_live_456' }),
      uploadDocumentToThread: vi.fn().mockResolvedValue({ documentId: 'doc_live_789', status: 'pending' }),
      getDocumentStatus: vi.fn().mockResolvedValue({ documentId: 'doc_live_789', status: 'indexed' }),
      sendMessage: vi.fn().mockResolvedValue({ content: 'Seed acknowledged' }),
      deleteThread: vi.fn().mockResolvedValue({}),
      deleteAssistant: vi.fn().mockResolvedValue({}),
    } as unknown as BackboardAssistantClientLike;

    const res = await initializeRepositoryChat(mockProfile, {
      ingestRepo: mockIngest,
      buildContext: mockBuildContext,
      backboardClient: mockClient,
      config: mockConfig,
      signingSecret: secret,
    });

    expect(res.success).toBe(true);
    expect(res.repositoryFullName).toBe('facebook/react');
    expect(res.conversationToken).toBeDefined();

    // Verify token can be verified
    const payload = verifyConversationToken(res.conversationToken, 'facebook/react', secret);
    expect(payload.assistantId).toBe('asst_live_123');
    expect(payload.threadId).toBe('thrd_live_456');

    // Ingest called once
    expect(mockIngest).toHaveBeenCalledTimes(1);
    expect(mockBuildContext).toHaveBeenCalledTimes(1);

    // Document uploaded
    expect(mockClient.uploadDocumentToThread).toHaveBeenCalledWith('thrd_live_456', expect.any(String));

    // Profile context seeded quietly with send_to_llm: 'false'
    expect(mockClient.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        threadId: 'thrd_live_456',
        send_to_llm: 'false',
      })
    );
  });

  it('cleans up created assistant and thread if document indexing fails', async () => {
    const mockIngest = vi.fn().mockResolvedValue(dummyIngested);
    const mockBuildContext = vi.fn().mockReturnValue(dummyContext);

    const mockClient = {
      createAssistant: vi.fn().mockResolvedValue({ assistantId: 'asst_fail_123' }),
      createThread: vi.fn().mockResolvedValue({ threadId: 'thrd_fail_456' }),
      uploadDocumentToThread: vi.fn().mockResolvedValue({ documentId: 'doc_fail_789', status: 'pending' }),
      getDocumentStatus: vi.fn().mockResolvedValue({ documentId: 'doc_fail_789', status: 'failed', statusMessage: 'Parse error' }),
      deleteThread: vi.fn().mockResolvedValue({}),
      deleteAssistant: vi.fn().mockResolvedValue({}),
    } as unknown as BackboardAssistantClientLike;

    await expect(
      initializeRepositoryChat(mockProfile, {
        ingestRepo: mockIngest,
        buildContext: mockBuildContext,
        backboardClient: mockClient,
        config: mockConfig,
        signingSecret: secret,
      })
    ).rejects.toThrow('Document doc_fail_789 failed indexing');

    expect(mockClient.deleteThread).toHaveBeenCalledWith('thrd_fail_456');
    expect(mockClient.deleteAssistant).toHaveBeenCalledWith('asst_fail_123');
  });
});

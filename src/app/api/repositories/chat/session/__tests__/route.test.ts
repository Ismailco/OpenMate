import { describe, it, expect, vi } from 'vitest';
import {
  handleInitializeChatRequest,
  handleDeleteChatSessionRequest,
} from '../handler';
import {
  RepositoryNotFoundError,
  GitHubRateLimitError,
} from '@/features/github/errors';
import {
  RepositoryAssistantIndexingError,
  RepositoryAssistantTimeoutError,
} from '@/features/repository-assistant/errors';
import type { DeveloperProfile } from '@/features/developer-profile/types';
import type { IngestedRepository } from '@/features/github/types';
import type { RepositoryContext } from '@/features/repository-context/types';
import type { BackboardAssistantClientLike, BackboardAssistantConfig } from '@/features/repository-assistant/backboard/client';

describe('POST /api/repositories/chat/session Route Handler', () => {
  const secret = 'valid-test-signing-secret-with-more-than-32-chars-length';

  const validProfile: DeveloperProfile = {
    repository: {
      owner: 'facebook',
      name: 'react',
      url: 'https://github.com/facebook/react',
    },
    skills: [{ name: 'JavaScript', level: 'intermediate' }],
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
      description: 'Test repo',
      defaultBranch: 'main',
      primaryLanguage: 'JavaScript',
      topics: ['javascript'],
      stars: 100,
      forks: 10,
      openIssuesCount: 10,
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
      description: 'Test repo',
      license: 'MIT',
      stars: 100,
      forks: 10,
      topics: [],
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

  it('returns 200 with conversationToken on successful initialization', async () => {
    const mockClient = {
      createAssistant: vi.fn().mockResolvedValue({ assistantId: 'asst_1' }),
      createThread: vi.fn().mockResolvedValue({ threadId: 'thrd_1' }),
      uploadDocumentToThread: vi.fn().mockResolvedValue({ documentId: 'doc_1', status: 'pending' }),
      getDocumentStatus: vi.fn().mockResolvedValue({ documentId: 'doc_1', status: 'indexed' }),
      sendMessage: vi.fn().mockResolvedValue({}),
      deleteThread: vi.fn().mockResolvedValue({}),
      deleteAssistant: vi.fn().mockResolvedValue({}),
    } as unknown as BackboardAssistantClientLike;

    const request = new Request('http://localhost:3000/api/repositories/chat/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: validProfile }),
    });

    const res = await handleInitializeChatRequest(request, {
      ingestRepo: vi.fn().mockResolvedValue(dummyIngested),
      buildContext: vi.fn().mockReturnValue(dummyContext),
      backboardClient: mockClient,
      config: mockConfig,
      signingSecret: secret,
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.conversationToken).toBeDefined();
    expect(data.repositoryFullName).toBe('facebook/react');
  });

  it('returns 400 when request body is not valid JSON', async () => {
    const request = new Request('http://localhost:3000/api/repositories/chat/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-json{{{',
    });

    const res = await handleInitializeChatRequest(request);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('InvalidJson');
  });

  it('returns 422 when profile schema is invalid', async () => {
    const request = new Request('http://localhost:3000/api/repositories/chat/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: { repository: 'not-an-object' } }),
    });

    const res = await handleInitializeChatRequest(request);
    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.error).toBe('ValidationError');
  });

  it('returns 404 when repository is not found on GitHub', async () => {
    const request = new Request('http://localhost:3000/api/repositories/chat/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: validProfile }),
    });

    const res = await handleInitializeChatRequest(request, {
      ingestRepo: vi.fn().mockRejectedValue(new RepositoryNotFoundError('facebook', 'react')),
      config: mockConfig,
      signingSecret: secret,
    });

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe('RepositoryNotFound');
  });

  it('returns 429 when GitHub rate limit is exceeded', async () => {
    const request = new Request('http://localhost:3000/api/repositories/chat/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: validProfile }),
    });

    const res = await handleInitializeChatRequest(request, {
      ingestRepo: vi.fn().mockRejectedValue(
        new GitHubRateLimitError({
          limit: 60,
          remaining: 0,
          resetAt: new Date(Date.now() + 60000),
          used: 60,
        })
      ),
      config: mockConfig,
      signingSecret: secret,
    });

    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toBe('RateLimited');
  });

  it('returns 502 when document indexing fails', async () => {
    const request = new Request('http://localhost:3000/api/repositories/chat/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: validProfile }),
    });

    const mockClient = {
      createAssistant: vi.fn().mockResolvedValue({ assistantId: 'asst_1' }),
      createThread: vi.fn().mockResolvedValue({ threadId: 'thrd_1' }),
      uploadDocumentToThread: vi.fn().mockResolvedValue({ documentId: 'doc_1', status: 'pending' }),
      getDocumentStatus: vi.fn().mockRejectedValue(new RepositoryAssistantIndexingError('Failed')),
      deleteThread: vi.fn().mockResolvedValue({}),
      deleteAssistant: vi.fn().mockResolvedValue({}),
    } as unknown as BackboardAssistantClientLike;

    const res = await handleInitializeChatRequest(request, {
      ingestRepo: vi.fn().mockResolvedValue(dummyIngested),
      buildContext: vi.fn().mockReturnValue(dummyContext),
      backboardClient: mockClient,
      config: mockConfig,
      signingSecret: secret,
    });

    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error).toBe('IndexingError');
  });

  it('returns 504 when document indexing times out', async () => {
    const request = new Request('http://localhost:3000/api/repositories/chat/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: validProfile }),
    });

    const mockClient = {
      createAssistant: vi.fn().mockResolvedValue({ assistantId: 'asst_1' }),
      createThread: vi.fn().mockResolvedValue({ threadId: 'thrd_1' }),
      uploadDocumentToThread: vi.fn().mockResolvedValue({ documentId: 'doc_1', status: 'pending' }),
      getDocumentStatus: vi.fn().mockRejectedValue(new RepositoryAssistantTimeoutError('Timed out')),
      deleteThread: vi.fn().mockResolvedValue({}),
      deleteAssistant: vi.fn().mockResolvedValue({}),
    } as unknown as BackboardAssistantClientLike;

    const res = await handleInitializeChatRequest(request, {
      ingestRepo: vi.fn().mockResolvedValue(dummyIngested),
      buildContext: vi.fn().mockReturnValue(dummyContext),
      backboardClient: mockClient,
      config: mockConfig,
      signingSecret: secret,
    });

    expect(res.status).toBe(504);
    const data = await res.json();
    expect(data.error).toBe('TimeoutError');
  });

  it('returns 503 when assistant service is misconfigured', async () => {
    const request = new Request('http://localhost:3000/api/repositories/chat/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: validProfile }),
    });

    const res = await handleInitializeChatRequest(request, {
      ingestRepo: vi.fn().mockResolvedValue(dummyIngested),
      buildContext: vi.fn().mockReturnValue(dummyContext),
      signingSecret: '', // triggers configuration error
    });

    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toBe('ConfigurationError');
  });
});

describe('DELETE /api/repositories/chat/session Route Handler', () => {
  it('returns 200 on best-effort cleanup', async () => {
    const request = new Request('http://localhost:3000/api/repositories/chat/session', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationToken: 'some.valid.token' }),
    });

    const res = await handleDeleteChatSessionRequest(request);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});

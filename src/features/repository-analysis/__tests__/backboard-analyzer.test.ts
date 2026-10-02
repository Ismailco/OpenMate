import { describe, it, expect, vi } from 'vitest';
import {
  BackboardClientLike,
  BackboardRepositoryAnalyzer,
} from '../providers/backboard/backboard-analyzer';
import { RepositoryContext } from '../../repository-context/types';
import {
  AiInvalidResponseError,
  AiModelUnavailableError,
  AiRateLimitError,
  AiTimeoutError,
} from '../errors';

describe('BackboardRepositoryAnalyzer', () => {
  const mockContext: RepositoryContext = {
    repository: {
      owner: 'test-org',
      name: 'test-repo',
      fullName: 'test-org/test-repo',
      description: 'Test repository',
      defaultBranch: 'main',
      primaryLanguage: 'TypeScript',
      topics: [],
      license: 'MIT',
      stars: 10,
      forks: 2,
    },
    documentation: {
      readme: {
        path: 'README.md',
        content: '# Readme',
        originalBytes: 50,
        includedCharacters: 50,
        truncated: false,
        trust: 'untrusted-repository-content',
        kind: 'readme',
      },
    },
    projectStructure: {
      treeSummary: 'README.md\nsrc/index.ts',
      topDirectories: ['src'],
      entrypointFiles: ['src/index.ts'],
      totalFilesObserved: 2,
      truncated: false,
    },
    manifests: [],
    sourceFiles: [
      {
        path: 'src/index.ts',
        content: 'export const hello = "world";',
        originalBytes: 30,
        includedCharacters: 30,
        truncated: false,
        trust: 'untrusted-repository-content',
        kind: 'source',
      },
    ],
    issues: [],
    contextMetadata: {
      generatedAt: '2026-01-01T00:00:00Z',
      sourceFilesIncluded: 1,
      issuesIncluded: 0,
      truncatedDocuments: 0,
      truncatedFiles: 0,
      truncatedIssues: 0,
      approximateCharacters: 500,
    },
    trust: 'untrusted-repository-content',
  };

  const validResponsePayload = {
    repositorySummary: {
      purpose: 'A utility library for asynchronous stream handling.',
      audience: 'TypeScript developers',
      maturity: 'established',
    },
    technologies: [
      {
        name: 'TypeScript',
        category: 'language',
        evidence: ['src/index.ts'],
      },
    ],
    architecture: {
      overview: 'Single entrypoint exporting async utilities.',
      components: [
        {
          name: 'Core Library',
          description: 'Exports async utilities',
          relevantPaths: ['src/index.ts'],
        },
      ],
      dataFlow: null,
    },
    filesToUnderstand: [
      {
        path: 'src/index.ts',
        reason: 'Main index export',
        priority: 'high',
      },
    ],
    localSetup: {
      prerequisites: ['Node.js 20+'],
      steps: ['pnpm install', 'pnpm build'],
      caveats: [],
    },
    glossary: [],
    contributionNotes: {
      contributionProcess: null,
      testingExpectations: [],
      styleExpectations: [],
      importantWarnings: [],
    },
  };

  it('passes required Gemma parameters, disables memory, web search, and enables JSON output', async () => {
    const sendMessageMock = vi.fn().mockResolvedValue({
      messages: [
        {
          role: 'assistant',
          content: JSON.stringify(validResponsePayload),
        },
      ],
    });

    const mockClient: BackboardClientLike = {
      sendMessage: sendMessageMock,
    };

    const analyzer = new BackboardRepositoryAnalyzer(
      {
        apiKey: 'test-api-key',
        modelProvider: 'openrouter',
        modelName: 'google/gemma-3-27b-it',
        timeoutMs: 30000,
      },
      mockClient
    );

    const result = await analyzer.analyze(mockContext);

    expect(sendMessageMock).toHaveBeenCalledTimes(1);
    const callArgs = sendMessageMock.mock.calls[0]?.[0] as Record<string, unknown>;

    expect(callArgs.llm_provider).toBe('openrouter');
    expect(callArgs.model_name).toBe('google/gemma-3-27b-it');
    expect(callArgs.memory).toBe('off');
    expect(callArgs.web_search).toBe('off');
    expect(callArgs.json_output).toBe(true);
    expect(callArgs.stream).toBe(false);

    expect(result.repositorySummary.purpose).toContain('asynchronous stream handling');
    expect(result.analysisMetadata.modelName).toBe('google/gemma-3-27b-it');
    expect(result.analysisMetadata.modelProvider).toBe('openrouter');
  });

  it('translates rate limit error to AiRateLimitError', async () => {
    const mockClient: BackboardClientLike = {
      sendMessage: vi.fn().mockRejectedValue({
        statusCode: 429,
        message: 'Rate limit exceeded: 60 requests per minute',
      }),
    };

    const analyzer = new BackboardRepositoryAnalyzer(
      { apiKey: 'test-key', modelProvider: 'openrouter', modelName: 'google/gemma-3-27b-it' },
      mockClient
    );

    await expect(analyzer.analyze(mockContext)).rejects.toThrow(AiRateLimitError);
  });

  it('translates model not found / unavailable to AiModelUnavailableError without falling back to proprietary models', async () => {
    const mockClient: BackboardClientLike = {
      sendMessage: vi.fn().mockRejectedValue({
        statusCode: 404,
        message: 'Model google/gemma-3-27b-it not found or currently unavailable',
      }),
    };

    const analyzer = new BackboardRepositoryAnalyzer(
      { apiKey: 'test-key', modelProvider: 'openrouter', modelName: 'google/gemma-3-27b-it' },
      mockClient
    );

    await expect(analyzer.analyze(mockContext)).rejects.toThrow(AiModelUnavailableError);
  });

  it('handles caller AbortSignal', async () => {
    const mockClient: BackboardClientLike = {
      sendMessage: vi.fn(),
    };

    const analyzer = new BackboardRepositoryAnalyzer(
      { apiKey: 'test-key' },
      mockClient
    );

    const controller = new AbortController();
    controller.abort();

    await expect(analyzer.analyze(mockContext, { signal: controller.signal })).rejects.toThrow(
      AiTimeoutError
    );
    expect(mockClient.sendMessage).not.toHaveBeenCalled();
  });

  it('executes a single controlled repair attempt when first response fails schema validation', async () => {
    const invalidSchemaPayload = {
      repositorySummary: { purpose: 'short' }, // fails min length 10
    };

    const mockClient: BackboardClientLike = {
      sendMessage: vi
        .fn()
        .mockResolvedValueOnce({
          messages: [{ content: JSON.stringify(invalidSchemaPayload) }],
        })
        .mockResolvedValueOnce({
          messages: [{ content: JSON.stringify(validResponsePayload) }],
        }),
    };

    const analyzer = new BackboardRepositoryAnalyzer(
      { apiKey: 'test-key', modelProvider: 'openrouter', modelName: 'google/gemma-3-27b-it' },
      mockClient
    );

    const result = await analyzer.analyze(mockContext);

    // Initial attempt + 1 repair attempt = 2 calls
    expect(mockClient.sendMessage).toHaveBeenCalledTimes(2);
    expect(result.repositorySummary.purpose).toContain('asynchronous stream handling');
  });

  it('throws AiInvalidResponseError if controlled repair also fails', async () => {
    const invalidSchemaPayload = {
      repositorySummary: { purpose: 'short' },
    };

    const mockClient: BackboardClientLike = {
      sendMessage: vi
        .fn()
        .mockResolvedValueOnce({
          messages: [{ content: JSON.stringify(invalidSchemaPayload) }],
        })
        .mockResolvedValueOnce({
          messages: [{ content: JSON.stringify(invalidSchemaPayload) }],
        }),
    };

    const analyzer = new BackboardRepositoryAnalyzer(
      { apiKey: 'test-key', modelProvider: 'openrouter', modelName: 'google/gemma-3-27b-it' },
      mockClient
    );

    await expect(analyzer.analyze(mockContext)).rejects.toThrow(AiInvalidResponseError);
  });
});

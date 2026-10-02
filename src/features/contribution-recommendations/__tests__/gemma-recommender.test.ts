import { describe, it, expect, vi } from 'vitest';
import { GemmaContributionRecommender } from '../providers/gemma-recommender';
import { DeveloperProfile } from '../../developer-profile/types';
import { RepositoryAnalysis } from '../../repository-analysis/types';
import { RepositoryContext } from '../../repository-context/types';
import { RecommendationCandidate } from '../types';
import {
  AiModelUnavailableError,
  AiRateLimitError,
  AiTimeoutError,
} from '../../repository-analysis/errors';
import { BackboardClientLike } from '../../repository-analysis/providers/backboard/backboard-analyzer';

describe('GemmaContributionRecommender', () => {
  const profile: DeveloperProfile = {
    repository: { owner: 'o', name: 'r', url: 'https://github.com/o/r' },
    skills: [{ name: 'TypeScript', level: 'intermediate' }],
    interests: ['frontend'],
    availableHours: 4,
    contributionExperience: 'some-experience',
  };

  const analysis: RepositoryAnalysis = {
    repositorySummary: { purpose: 'Demo purpose for framework', audience: null, maturity: null },
    technologies: [{ name: 'TypeScript', category: 'language', evidence: ['src/index.ts'] }],
    architecture: { overview: 'Overview', components: [], dataFlow: null },
    filesToUnderstand: [],
    localSetup: { prerequisites: [], steps: [], caveats: [] },
    glossary: [],
    contributionNotes: {
      contributionProcess: null,
      testingExpectations: [],
      styleExpectations: [],
      importantWarnings: [],
    },
    analysisMetadata: {
      modelProvider: 'openrouter',
      modelName: 'google/gemma-3-27b-it',
      analyzedAt: '2026-01-01T00:00:00Z',
    },
  };

  const context: RepositoryContext = {
    repository: {
      owner: 'o',
      name: 'r',
      fullName: 'o/r',
      description: 'Demo',
      defaultBranch: 'main',
      primaryLanguage: 'TypeScript',
      topics: [],
      license: 'MIT',
      stars: 1,
      forks: 0,
    },
    documentation: {},
    projectStructure: {
      treeSummary: 'src/index.ts',
      topDirectories: ['src'],
      entrypointFiles: ['src/index.ts'],
      totalFilesObserved: 1,
      truncated: false,
    },
    manifests: [],
    sourceFiles: [
      {
        path: 'src/index.ts',
        content: 'export const x = 1;',
        originalBytes: 20,
        includedCharacters: 20,
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
      approximateCharacters: 50,
    },
    trust: 'untrusted-repository-content',
  };

  const candidates: RecommendationCandidate[] = [
    {
      issue: {
        number: 42,
        title: 'Fix edge case in TypeScript parser',
        labels: ['frontend'],
        body: 'Parser fails on trailing comma in object expressions.',
        htmlUrl: 'https://github.com/o/r/issues/42',
        commentsCount: 1,
        truncated: false,
        isGoodFirstIssue: true,
        isHelpWanted: true,
        trust: 'untrusted-repository-content',
      },
      signals: {
        labels: ['frontend'],
        matchedInterests: ['frontend'],
        matchedSkills: ['TypeScript'],
        beginnerFriendly: true,
        deterministicScope: 'small',
        heuristicScore: 50,
      },
    },
  ];

  const validResponsePayload = {
    recommendations: [
      {
        issueNumber: 42,
        fit: {
          summary: 'Fits TypeScript skill and frontend interest well.',
          relevantSkills: ['TypeScript'],
          matchedInterests: ['frontend'],
          experienceFit: 'good',
        },
        scope: {
          level: 'small',
          reasoning: 'Scoped to single parser function.',
        },
        likelyFiles: [{ path: 'src/index.ts', reason: 'Parser entrypoint' }],
        conceptsToUnderstand: ['AST manipulation'],
        startingPoint: {
          summary: 'Inspect parser function.',
          steps: ['Read src/index.ts', 'Add a test case.'],
        },
        cautions: [],
      },
    ],
  };

  it('passes required Gemma parameters, disables memory, web search, and enables JSON output', async () => {
    const sendMessageMock = vi.fn().mockResolvedValue({
      messages: [{ content: JSON.stringify(validResponsePayload) }],
    });

    const mockClient: BackboardClientLike = { sendMessage: sendMessageMock };

    const recommender = new GemmaContributionRecommender(
      {
        apiKey: 'test-key',
        modelProvider: 'openrouter',
        modelName: 'google/gemma-3-27b-it',
        timeoutMs: 30000,
      },
      mockClient
    );

    const recs = await recommender.recommend(profile, analysis, candidates, context);

    expect(sendMessageMock).toHaveBeenCalledTimes(1);
    const callArgs = sendMessageMock.mock.calls[0]?.[0] as Record<string, unknown>;

    expect(callArgs.llm_provider).toBe('openrouter');
    expect(callArgs.model_name).toBe('google/gemma-3-27b-it');
    expect(callArgs.memory).toBe('off');
    expect(callArgs.web_search).toBe('off');
    expect(callArgs.json_output).toBe(true);
    expect(callArgs.stream).toBe(false);

    expect(recs).toHaveLength(1);
    expect(recs[0]?.issueNumber).toBe(42);
    expect(recs[0]?.title).toBe('Fix edge case in TypeScript parser');
  });

  it('handles caller AbortSignal', async () => {
    const mockClient: BackboardClientLike = { sendMessage: vi.fn() };
    const recommender = new GemmaContributionRecommender({ apiKey: 'test-key' }, mockClient);

    const controller = new AbortController();
    controller.abort();

    await expect(
      recommender.recommend(profile, analysis, candidates, context, { signal: controller.signal })
    ).rejects.toThrow(AiTimeoutError);
    expect(mockClient.sendMessage).not.toHaveBeenCalled();
  });

  it('executes a single controlled repair attempt when first response fails schema validation', async () => {
    const invalidPayload = { recommendations: [{ issueNumber: 42, fit: { summary: 'short' } }] };

    const sendMessageMock = vi
      .fn()
      .mockResolvedValueOnce({
        messages: [{ content: JSON.stringify(invalidPayload) }],
      })
      .mockResolvedValueOnce({
        messages: [{ content: JSON.stringify(validResponsePayload) }],
      });

    const mockClient: BackboardClientLike = { sendMessage: sendMessageMock };
    const recommender = new GemmaContributionRecommender({ apiKey: 'test-key' }, mockClient);

    const recs = await recommender.recommend(profile, analysis, candidates, context);

    // Initial attempt + 1 repair attempt = 2 calls
    expect(sendMessageMock).toHaveBeenCalledTimes(2);
    expect(recs).toHaveLength(1);
    expect(recs[0]?.issueNumber).toBe(42);
  });

  it('translates rate limit error to AiRateLimitError', async () => {
    const mockClient: BackboardClientLike = {
      sendMessage: vi.fn().mockRejectedValue({
        statusCode: 429,
        message: 'Rate limit exceeded',
      }),
    };

    const recommender = new GemmaContributionRecommender({ apiKey: 'test-key' }, mockClient);
    await expect(
      recommender.recommend(profile, analysis, candidates, context)
    ).rejects.toThrow(AiRateLimitError);
  });

  it('translates model not found / unavailable to AiModelUnavailableError without falling back to proprietary models', async () => {
    const mockClient: BackboardClientLike = {
      sendMessage: vi.fn().mockRejectedValue({
        statusCode: 404,
        message: 'Model google/gemma-3-27b-it not found',
      }),
    };

    const recommender = new GemmaContributionRecommender({ apiKey: 'test-key' }, mockClient);
    await expect(
      recommender.recommend(profile, analysis, candidates, context)
    ).rejects.toThrow(AiModelUnavailableError);
  });
});

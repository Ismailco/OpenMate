import { describe, it, expect, vi } from 'vitest';
import { ContributionRecommendationService } from '../recommendation-service';
import { DeveloperProfile } from '../../developer-profile/types';
import { RepositoryAnalysis } from '../../repository-analysis/types';
import { RepositoryContext } from '../../repository-context/types';
import { ContributionRecommender } from '../types';

describe('ContributionRecommendationService', () => {
  const profile: DeveloperProfile = {
    repository: { owner: 'o', name: 'r', url: 'https://github.com/o/r' },
    skills: [{ name: 'TypeScript', level: 'intermediate' }],
    interests: ['frontend'],
    availableHours: 4,
    contributionExperience: 'some-experience',
  };

  const analysis: RepositoryAnalysis = {
    repositorySummary: { purpose: 'Demo purpose', audience: null, maturity: null },
    technologies: [],
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

  const makeContext = (issuesCount: number): RepositoryContext => ({
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
      treeSummary: 'README.md',
      topDirectories: [],
      entrypointFiles: [],
      totalFilesObserved: 1,
      truncated: false,
    },
    manifests: [],
    sourceFiles: [],
    issues: Array.from({ length: issuesCount }, (_, i) => ({
      number: i + 1,
      title: `Issue ${i + 1}`,
      body: 'Body description',
      labels: ['frontend'],
      htmlUrl: `https://github.com/o/r/issues/${i + 1}`,
      commentsCount: 0,
      truncated: false,
      isGoodFirstIssue: true,
      isHelpWanted: true,
      trust: 'untrusted-repository-content',
    })),
    contextMetadata: {
      generatedAt: '2026-01-01T00:00:00Z',
      sourceFilesIncluded: 0,
      issuesIncluded: issuesCount,
      truncatedDocuments: 0,
      truncatedFiles: 0,
      truncatedIssues: 0,
      approximateCharacters: 100,
    },
    trust: 'untrusted-repository-content',
  });

  it('returns no-open-issues without invoking the AI recommender when context has 0 issues', async () => {
    const mockRecommender: ContributionRecommender = {
      recommend: vi.fn(),
    };

    const service = new ContributionRecommendationService({ recommender: mockRecommender });
    const result = await service.generateRecommendations(profile, analysis, makeContext(0));

    expect(result.status).toBe('no-open-issues');
    expect(mockRecommender.recommend).not.toHaveBeenCalled();
  });

  it('returns no-suitable-issues when the recommender produces no valid grounded matches', async () => {
    const mockRecommender: ContributionRecommender = {
      recommend: vi.fn().mockResolvedValue([]),
    };

    const service = new ContributionRecommendationService({ recommender: mockRecommender });
    const result = await service.generateRecommendations(profile, analysis, makeContext(3));

    expect(result.status).toBe('no-suitable-issues');
    if (result.status === 'no-suitable-issues') {
      expect(result.explanation).toContain('could not be confidently recommended');
    }
  });

  it('returns recommended state with metadata when recommendations are found', async () => {
    const mockRec = {
      issueNumber: 1,
      title: 'Issue 1',
      url: 'https://github.com/o/r/issues/1',
      fit: {
        summary: 'Fits well.',
        relevantSkills: ['TypeScript'],
        matchedInterests: ['frontend' as const],
        experienceFit: 'good' as const,
      },
      scope: { level: 'small' as const, reasoning: 'Small' },
      likelyFiles: [],
      conceptsToUnderstand: [],
      startingPoint: { summary: 'Start', steps: [] },
      cautions: [],
    };

    const mockRecommender: ContributionRecommender = {
      recommend: vi.fn().mockResolvedValue([mockRec]),
    };

    const service = new ContributionRecommendationService({ recommender: mockRecommender });
    const result = await service.generateRecommendations(profile, analysis, makeContext(3));

    expect(result.status).toBe('recommended');
    if (result.status === 'recommended') {
      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0]?.issueNumber).toBe(1);
      expect(result.metadata.candidateIssuesConsidered).toBe(3);
    }
  });
});

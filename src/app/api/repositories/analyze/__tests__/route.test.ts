import { describe, it, expect, vi } from 'vitest';
import { handleAnalyzeRequest } from '../route';
import {
  RepositoryAnalysisService,
} from '@/features/repository-analysis';
import { RepositoryNotFoundError } from '@/features/github/errors';
import {
  AiModelUnavailableError,
  AiRateLimitError,
  AiTimeoutError,
} from '@/features/repository-analysis/errors';

describe('POST /api/repositories/analyze', () => {
  const validRequestPayload = {
    repository: {
      owner: 'facebook',
      name: 'react',
      url: 'https://github.com/facebook/react',
    },
  };

  const validProfilePayload = {
    profile: {
      repository: {
        owner: 'facebook',
        name: 'react',
        url: 'https://github.com/facebook/react',
      },
      skills: [{ name: 'TypeScript', level: 'intermediate' }],
      interests: ['frontend'],
      availableHours: 4,
      contributionExperience: 'some-experience',
    },
  };

  const mockAnalysis = {
    repositorySummary: {
      purpose: 'A JavaScript library for building user interfaces.',
      audience: 'Frontend developers',
      maturity: 'established' as const,
    },
    technologies: [],
    architecture: {
      overview: 'Component-based virtual DOM engine.',
      components: [],
      dataFlow: null,
    },
    filesToUnderstand: [],
    localSetup: {
      prerequisites: ['Node.js'],
      steps: ['yarn install'],
      caveats: [],
    },
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

  const mockRepositoryMetadata = {
    id: 10270250,
    owner: 'facebook',
    name: 'react',
    fullName: 'facebook/react',
    description: 'The library for web and native user interfaces.',
    defaultBranch: 'main',
    primaryLanguage: 'JavaScript',
    topics: ['react', 'ui'],
    stars: 230000,
    forks: 46000,
    openIssuesCount: 900,
    isArchived: false,
    isFork: false,
    license: 'MIT',
    htmlUrl: 'https://github.com/facebook/react',
  };

  const mockRecommendationsResult = {
    status: 'recommended' as const,
    recommendations: [
      {
        issueNumber: 1,
        title: 'Fix issue 1',
        url: 'https://github.com/facebook/react/issues/1',
        fit: {
          summary: 'Fits well.',
          relevantSkills: ['TypeScript'],
          matchedInterests: ['frontend' as const],
          experienceFit: 'good' as const,
        },
        scope: { level: 'small' as const, reasoning: 'Small' },
        likelyFiles: [],
        conceptsToUnderstand: [],
        startingPoint: { summary: 'Start here', steps: [] },
        cautions: [],
      },
    ],
    metadata: {
      candidateIssuesConsidered: 1,
      generatedAt: '2026-01-01T00:00:00Z',
      modelProvider: 'openrouter',
      modelName: 'google/gemma-3-27b-it',
    },
  };

  it('rejects requests with missing repository and profile fields with 400', async () => {
    const req = new Request('http://localhost/api/repositories/analyze', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await handleAnalyzeRequest(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Missing repository or profile field');
  });

  it('rejects invalid repository specifications with 422', async () => {
    const req = new Request('http://localhost/api/repositories/analyze', {
      method: 'POST',
      body: JSON.stringify({
        repository: { owner: '', name: '', url: 'not-a-valid-github-url' },
      }),
    });

    const res = await handleAnalyzeRequest(req);
    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.error).toContain('Invalid repository specification');
  });

  it('rejects invalid developer profile specifications with 422', async () => {
    const req = new Request('http://localhost/api/repositories/analyze', {
      method: 'POST',
      body: JSON.stringify({
        profile: {
          repository: { owner: 'o', name: 'r', url: 'https://github.com/o/r' },
          skills: [], // minimum 1 required
          interests: ['frontend'],
          availableHours: 2,
          contributionExperience: 'first-time',
        },
      }),
    });

    const res = await handleAnalyzeRequest(req);
    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.error).toContain('Invalid developer profile specification');
  });

  it('rejects conflicting repository identities between repository and profile with 422', async () => {
    const req = new Request('http://localhost/api/repositories/analyze', {
      method: 'POST',
      body: JSON.stringify({
        repository: { owner: 'facebook', name: 'react', url: 'https://github.com/facebook/react' },
        profile: {
          repository: { owner: 'vercel', name: 'next.js', url: 'https://github.com/vercel/next.js' },
          skills: [{ name: 'TypeScript', level: 'intermediate' }],
          interests: ['frontend'],
          availableHours: 2,
          contributionExperience: 'first-time',
        },
      }),
    });

    const res = await handleAnalyzeRequest(req);
    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.error).toContain('Conflicting repository identities');
  });

  it('successfully returns repository and AI analysis without leaking raw context or secrets', async () => {
    const mockService = {
      analyzeRepository: vi.fn().mockResolvedValue({
        repository: mockRepositoryMetadata,
        analysis: mockAnalysis,
      }),
    } as unknown as RepositoryAnalysisService;

    const req = new Request('http://localhost/api/repositories/analyze', {
      method: 'POST',
      body: JSON.stringify(validRequestPayload),
    });

    const res = await handleAnalyzeRequest(req, mockService);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.repository.name).toBe('react');
    expect(json.data.analysis.repositorySummary.purpose).toContain('user interfaces');

    // Ensure raw source code, full README, or API keys are NOT returned in response
    const jsonString = JSON.stringify(json);
    expect(jsonString).not.toContain('BACKBOARD_API_KEY');
    expect(jsonString).not.toContain('untrusted-repository-content');
  });

  it('successfully processes profile with single-pass analyzeAndRecommend returning recommendations', async () => {
    const mockService = {
      analyzeAndRecommend: vi.fn().mockResolvedValue({
        repository: mockRepositoryMetadata,
        analysis: mockAnalysis,
        recommendations: mockRecommendationsResult,
      }),
    } as unknown as RepositoryAnalysisService;

    const req = new Request('http://localhost/api/repositories/analyze', {
      method: 'POST',
      body: JSON.stringify(validProfilePayload),
    });

    const res = await handleAnalyzeRequest(req, mockService);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.recommendations.status).toBe('recommended');
    expect(json.data.recommendations.recommendations).toHaveLength(1);
    expect(mockService.analyzeAndRecommend).toHaveBeenCalledTimes(1);
  });

  it('maps RepositoryNotFoundError to 404', async () => {
    const mockService = {
      analyzeRepository: vi
        .fn()
        .mockRejectedValue(new RepositoryNotFoundError('facebook', 'react')),
    } as unknown as RepositoryAnalysisService;

    const req = new Request('http://localhost/api/repositories/analyze', {
      method: 'POST',
      body: JSON.stringify(validRequestPayload),
    });

    const res = await handleAnalyzeRequest(req, mockService);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.code).toBe('REPOSITORY_NOT_FOUND');
  });

  it('maps AiRateLimitError to 429', async () => {
    const mockService = {
      analyzeRepository: vi
        .fn()
        .mockRejectedValue(new AiRateLimitError('Rate limit exceeded')),
    } as unknown as RepositoryAnalysisService;

    const req = new Request('http://localhost/api/repositories/analyze', {
      method: 'POST',
      body: JSON.stringify(validRequestPayload),
    });

    const res = await handleAnalyzeRequest(req, mockService);
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.code).toBe('AI_RATE_LIMIT_EXCEEDED');
  });

  it('maps AiModelUnavailableError to 503', async () => {
    const mockService = {
      analyzeRepository: vi
        .fn()
        .mockRejectedValue(
          new AiModelUnavailableError('google/gemma-3-27b-it')
        ),
    } as unknown as RepositoryAnalysisService;

    const req = new Request('http://localhost/api/repositories/analyze', {
      method: 'POST',
      body: JSON.stringify(validRequestPayload),
    });

    const res = await handleAnalyzeRequest(req, mockService);
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.code).toBe('AI_MODEL_UNAVAILABLE');
  });

  it('maps AiTimeoutError to 504', async () => {
    const mockService = {
      analyzeRepository: vi
        .fn()
        .mockRejectedValue(new AiTimeoutError()),
    } as unknown as RepositoryAnalysisService;

    const req = new Request('http://localhost/api/repositories/analyze', {
      method: 'POST',
      body: JSON.stringify(validRequestPayload),
    });

    const res = await handleAnalyzeRequest(req, mockService);
    expect(res.status).toBe(504);
    const data = await res.json();
    expect(data.code).toBe('AI_TIMEOUT');
  });
});

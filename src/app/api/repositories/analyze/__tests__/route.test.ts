import { describe, it, expect, vi } from 'vitest';
import { handleAnalyzeRequest } from '../handler';
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

  const mockAnalysisResult = {
    repository: {
      id: 10270250,
      owner: 'facebook',
      name: 'react',
      fullName: 'facebook/react',
      description: 'The library for web and native user interfaces.',
      defaultBranch: 'main',
      primaryLanguage: 'JavaScript',
      topics: ['react', 'ui'],
      stars: 220000,
      forks: 45000,
      openIssuesCount: 950,
      isArchived: false,
      isFork: false,
      license: 'MIT',
      htmlUrl: 'https://github.com/facebook/react',
    },
    analysis: {
      repositorySummary: {
        purpose: 'Declarative component-based UI library.',
        audience: 'Frontend web and mobile developers.',
        maturity: 'established' as const,
      },
      technologies: [
        {
          name: 'React',
          category: 'framework' as const,
          evidence: ['packages/react/package.json'],
        },
      ],
      architecture: {
        overview: 'Monorepo containing reconciler, DOM bindings, and core runtime.',
        components: [
          {
            name: 'ReactReconciler',
            description: 'Fiber-based reconciliation engine.',
            relevantPaths: ['packages/react-reconciler'],
          },
        ],
        dataFlow: 'JSX renders to virtual elements reconciled through Fiber.',
      },
      filesToUnderstand: [
        {
          path: 'packages/react/index.js',
          reason: 'Core export surface',
          priority: 'high' as const,
        },
      ],
      localSetup: {
        prerequisites: ['Node.js >= 18', 'Yarn v1'],
        steps: ['yarn install', 'yarn test'],
        caveats: [],
      },
      contributionNotes: {
        contributionProcess: 'Fork, create a feature branch, and submit a PR against main.',
        testingExpectations: ['All unit tests must pass.'],
        styleExpectations: ['Follow Prettier and ESLint rules.'],
        importantWarnings: [],
      },
      glossary: [],
      analysisMetadata: {
        modelProvider: 'backboard',
        modelName: 'google/gemma-3-27b-it',
        analyzedAt: new Date().toISOString(),
      },
    },
    recommendations: {
      status: 'no-open-issues' as const,
    },
  };

  it('returns 400 when request body is not JSON or missing', async () => {
    const request = new Request('http://localhost:3000/api/repositories/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-json',
    });

    const response = await handleAnalyzeRequest(request);
    expect(response.status).toBe(500); // JSON parse error turns into 500
  });

  it('returns 400 when body does not contain repository or profile', async () => {
    const request = new Request('http://localhost:3000/api/repositories/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ somethingElse: true }),
    });

    const response = await handleAnalyzeRequest(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('must contain either a "profile" or a "repository"');
  });

  it('returns 422 when repository payload fails schema validation', async () => {
    const request = new Request('http://localhost:3000/api/repositories/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        repository: {
          owner: '',
          name: 'react',
          url: 'not-a-valid-url',
        },
      }),
    });

    const response = await handleAnalyzeRequest(request);
    expect(response.status).toBe(422);
  });

  it('returns 422 when profile payload fails schema validation', async () => {
    const request = new Request('http://localhost:3000/api/repositories/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: {
          repository: {
            owner: 'facebook',
            name: 'react',
            url: 'https://github.com/facebook/react',
          },
          skills: [], // empty skills fails validation
        },
      }),
    });

    const response = await handleAnalyzeRequest(request);
    expect(response.status).toBe(422);
  });

  it('analyzes repository successfully when valid repository payload is sent', async () => {
    const mockService = {
      analyzeRepository: vi.fn().mockResolvedValue(mockAnalysisResult),
      analyzeAndRecommend: vi.fn(),
    } as unknown as RepositoryAnalysisService;

    const request = new Request('http://localhost:3000/api/repositories/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validRequestPayload),
    });

    const response = await handleAnalyzeRequest(request, mockService);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.repository.name).toBe('react');
    expect(mockService.analyzeRepository).toHaveBeenCalledTimes(1);
  });

  it('analyzes profile successfully when valid profile payload is sent', async () => {
    const mockService = {
      analyzeRepository: vi.fn(),
      analyzeAndRecommend: vi.fn().mockResolvedValue(mockAnalysisResult),
    } as unknown as RepositoryAnalysisService;

    const request = new Request('http://localhost:3000/api/repositories/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validProfilePayload),
    });

    const response = await handleAnalyzeRequest(request, mockService);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.repository.name).toBe('react');
    expect(mockService.analyzeAndRecommend).toHaveBeenCalledTimes(1);
  });

  it('maps RepositoryNotFoundError to 404', async () => {
    const mockService = {
      analyzeRepository: vi.fn().mockRejectedValue(new RepositoryNotFoundError('facebook', 'missing-repo')),
      analyzeAndRecommend: vi.fn(),
    } as unknown as RepositoryAnalysisService;

    const request = new Request('http://localhost:3000/api/repositories/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validRequestPayload),
    });

    const response = await handleAnalyzeRequest(request, mockService);
    expect(response.status).toBe(404);
  });

  it('maps AiModelUnavailableError to 503', async () => {
    const mockService = {
      analyzeRepository: vi.fn().mockRejectedValue(new AiModelUnavailableError('Model unavailable')),
      analyzeAndRecommend: vi.fn(),
    } as unknown as RepositoryAnalysisService;

    const request = new Request('http://localhost:3000/api/repositories/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validRequestPayload),
    });

    const response = await handleAnalyzeRequest(request, mockService);
    expect(response.status).toBe(503);
  });

  it('maps AiRateLimitError to 429', async () => {
    const mockService = {
      analyzeRepository: vi.fn().mockRejectedValue(new AiRateLimitError('AI rate limit')),
      analyzeAndRecommend: vi.fn(),
    } as unknown as RepositoryAnalysisService;

    const request = new Request('http://localhost:3000/api/repositories/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validRequestPayload),
    });

    const response = await handleAnalyzeRequest(request, mockService);
    expect(response.status).toBe(429);
  });

  it('maps AiTimeoutError to 504', async () => {
    const mockService = {
      analyzeRepository: vi.fn().mockRejectedValue(new AiTimeoutError('Operation timed out')),
      analyzeAndRecommend: vi.fn(),
    } as unknown as RepositoryAnalysisService;

    const request = new Request('http://localhost:3000/api/repositories/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validRequestPayload),
    });

    const response = await handleAnalyzeRequest(request, mockService);
    expect(response.status).toBe(504);
  });
});

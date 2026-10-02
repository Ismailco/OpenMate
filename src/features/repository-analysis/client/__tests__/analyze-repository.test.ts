import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeRepository, AnalysisClientError } from '../analyze-repository';
import { DeveloperProfile } from '@/features/developer-profile/types';

const mockProfile: DeveloperProfile = {
  repository: {
    owner: 'colinhacks',
    name: 'zod',
    url: 'https://github.com/colinhacks/zod',
  },
  skills: [{ name: 'TypeScript', level: 'intermediate' }],
  interests: ['frontend', 'testing'],
  availableHours: 4,
  contributionExperience: 'first-time',
};

const mockValidSuccessPayload = {
  success: true,
  data: {
    repository: {
      id: 247852328,
      owner: 'colinhacks',
      name: 'zod',
      fullName: 'colinhacks/zod',
      description: 'TypeScript-first schema validation with static type inference',
      defaultBranch: 'master',
      primaryLanguage: 'TypeScript',
      topics: ['typescript', 'validation'],
      stars: 35000,
      forks: 1200,
      openIssuesCount: 45,
      isArchived: false,
      isFork: false,
      license: 'MIT',
      htmlUrl: 'https://github.com/colinhacks/zod',
    },
    analysis: {
      repositorySummary: {
        purpose: 'TypeScript schema declaration and validation library.',
        audience: 'TypeScript and JavaScript application developers.',
        maturity: 'established',
      },
      technologies: [
        {
          name: 'TypeScript',
          category: 'language',
          evidence: ['tsconfig.json'],
        },
      ],
      architecture: {
        overview: 'Single-package schema parser with zero dependencies.',
        components: [
          {
            name: 'ZodType',
            description: 'Abstract base schema class.',
            relevantPaths: ['src/types.ts'],
          },
        ],
        dataFlow: 'Schemas parse unknown input returning typed result.',
      },
      filesToUnderstand: [
        {
          path: 'src/types.ts',
          reason: 'Core type definitions',
          priority: 'high',
        },
      ],
      localSetup: {
        prerequisites: ['Node.js >= 16', 'pnpm'],
        steps: ['pnpm install', 'pnpm test'],
        caveats: [],
      },
      contributionNotes: {
        contributionProcess: 'Submit PR against master branch.',
        testingExpectations: ['All unit tests in tests/ directory must pass.'],
        styleExpectations: ['Follow standard TypeScript code style.'],
        importantWarnings: [],
      },
      glossary: [
        {
          term: 'SafeParse',
          explanation: 'Parsing method returning a discriminated union instead of throwing.',
        },
      ],
      analysisMetadata: {
        modelProvider: 'backboard',
        modelName: 'google/gemma-3-27b-it',
        analyzedAt: new Date().toISOString(),
      },
    },
    recommendations: {
      status: 'recommended',
      recommendations: [
        {
          issueNumber: 2841,
          title: 'Add support for ISO date-time duration parsing',
          url: 'https://github.com/colinhacks/zod/issues/2841',
          fit: {
            summary: 'Fits TypeScript validation and testing profile.',
            relevantSkills: ['TypeScript'],
            matchedInterests: ['testing'],
            experienceFit: 'good',
          },
          scope: {
            level: 'small',
            reasoning: 'Scoped to duration validator regex.',
          },
          likelyFiles: [
            {
              path: 'src/types.ts',
              reason: 'Houses ZodString schema definition.',
            },
          ],
          conceptsToUnderstand: ['ISO 8601 Durations'],
          startingPoint: {
            summary: 'Read existing datetime regex in src/types.ts.',
            steps: ['Inspect ZodString.datetime()', 'Add duration() helper method'],
          },
          cautions: ['Do not break backwards compatibility of parse.'],
        },
      ],
      metadata: {
        candidateIssuesConsidered: 5,
        generatedAt: new Date().toISOString(),
        modelProvider: 'backboard',
        modelName: 'google/gemma-3-27b-it',
      },
    },
  },
};

describe('analyzeRepository client', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('posts developer profile to /api/repositories/analyze and validates response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockValidSuccessPayload,
    } as Response);

    const result = await analyzeRepository(mockProfile);

    expect(global.fetch).toHaveBeenCalledWith('/api/repositories/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: mockProfile }),
      signal: undefined,
    });

    expect(result.repository.name).toBe('zod');
    expect(result.recommendations.status).toBe('recommended');
  });

  it('maps 400/422 status to invalid-input error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Invalid profile payload provided.' }),
    } as Response);

    await expect(analyzeRepository(mockProfile)).rejects.toMatchObject({
      code: 'invalid-input',
      userMessage: 'Invalid profile payload provided.',
      status: 400,
    });
  });

  it('maps 404 status to repository-not-found error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Repository not found on GitHub.' }),
    } as Response);

    await expect(analyzeRepository(mockProfile)).rejects.toMatchObject({
      code: 'repository-not-found',
      userMessage: 'Repository not found on GitHub.',
      status: 404,
    });
  });

  it('maps 429 status to rate-limited error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: 'Rate limit exceeded.' }),
    } as Response);

    await expect(analyzeRepository(mockProfile)).rejects.toMatchObject({
      code: 'rate-limited',
      status: 429,
    });
  });

  it('maps 503 status to provider-unavailable error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: 'AI provider unavailable.' }),
    } as Response);

    await expect(analyzeRepository(mockProfile)).rejects.toMatchObject({
      code: 'provider-unavailable',
      status: 503,
    });
  });

  it('maps 504 status to timeout error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 504,
      json: async () => ({ error: 'Gateway timeout.' }),
    } as Response);

    await expect(analyzeRepository(mockProfile)).rejects.toMatchObject({
      code: 'timeout',
      status: 504,
    });
  });

  it('maps fetch network failure to network-failure error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(analyzeRepository(mockProfile)).rejects.toMatchObject({
      code: 'network-failure',
    });
  });

  it('maps AbortError to aborted error', async () => {
    const abortError = new DOMException('The user aborted a request.', 'AbortError');
    global.fetch = vi.fn().mockRejectedValue(abortError);

    const controller = new AbortController();
    await expect(analyzeRepository(mockProfile, controller.signal)).rejects.toMatchObject({
      code: 'aborted',
    });
  });

  it('rejects schema-invalid 200 payload as invalid-response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { unexpectedShape: 123 } }),
    } as Response);

    await expect(analyzeRepository(mockProfile)).rejects.toBeInstanceOf(AnalysisClientError);
  });
});

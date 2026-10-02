import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveAnalysisSession,
  loadAnalysisSession,
  clearAnalysisSession,
  ANALYSIS_SESSION_STORAGE_KEY,
  AnalysisSession,
} from '../index';

const createValidMockSession = (overrides?: Partial<AnalysisSession>): AnalysisSession => ({
  version: 1,
  createdAt: new Date().toISOString(),
  profile: {
    repository: {
      owner: 'facebook',
      name: 'react',
      url: 'https://github.com/facebook/react',
    },
    skills: [{ name: 'TypeScript', level: 'intermediate' }],
    interests: ['frontend', 'testing'],
    availableHours: 5,
    contributionExperience: 'some-experience',
  },
  result: {
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
        maturity: 'established',
      },
      technologies: [
        {
          name: 'React',
          category: 'framework',
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
          priority: 'high',
        },
      ],
      localSetup: {
        prerequisites: ['Node.js >= 18', 'Yarn v1'],
        steps: ['yarn install', 'yarn test'],
        caveats: ['Requires building before running some package tests.'],
      },
      contributionNotes: {
        contributionProcess: 'Fork, create a feature branch, and submit a PR against main.',
        testingExpectations: ['All unit tests must pass.'],
        styleExpectations: ['Follow Prettier and ESLint rules.'],
        importantWarnings: ['Do not edit compiled output files directly.'],
      },
      glossary: [
        {
          term: 'Fiber',
          explanation: 'Internal work unit representation for incremental reconciliation.',
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
          issueNumber: 12345,
          title: 'Fix edge case in React.memo hook comparison',
          url: 'https://github.com/facebook/react/issues/12345',
          fit: {
            summary: 'Fits your TypeScript and testing background nicely.',
            relevantSkills: ['TypeScript', 'Testing'],
            matchedInterests: ['frontend', 'testing'],
            experienceFit: 'good',
          },
          scope: {
            level: 'small',
            reasoning: 'Scoped to single hook comparator utility.',
          },
          likelyFiles: [
            {
              path: 'packages/react/src/ReactMemo.js',
              reason: 'Contains comparator logic.',
            },
          ],
          conceptsToUnderstand: ['React.memo', 'Shallow equality'],
          startingPoint: {
            summary: 'Inspect ReactMemo.js test fixture.',
            steps: ['Run yarn test ReactMemo', 'Add test reproduction case'],
          },
          cautions: ['Do not alter public API signatures.'],
        },
      ],
      metadata: {
        candidateIssuesConsidered: 8,
        generatedAt: new Date().toISOString(),
        modelProvider: 'backboard',
        modelName: 'google/gemma-3-27b-it',
      },
    },
  },
  ...overrides,
});

describe('Analysis Session Storage', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('saves and loads a valid analysis session', () => {
    const session = createValidMockSession();
    const saved = saveAnalysisSession(session);
    expect(saved).toBe(true);

    const loaded = loadAnalysisSession();
    expect(loaded).not.toBeNull();
    expect(loaded?.version).toBe(1);
    expect(loaded?.profile.repository.name).toBe('react');
    expect(loaded?.result.repository.owner).toBe('facebook');
    expect(loaded?.result.recommendations.status).toBe('recommended');
  });

  it('clears analysis session on request', () => {
    const session = createValidMockSession();
    saveAnalysisSession(session);
    expect(loadAnalysisSession()).not.toBeNull();

    clearAnalysisSession();
    expect(loadAnalysisSession()).toBeNull();
    expect(window.sessionStorage.getItem(ANALYSIS_SESSION_STORAGE_KEY)).toBeNull();
  });

  it('safely handles missing session by returning null', () => {
    expect(loadAnalysisSession()).toBeNull();
  });

  it('discards corrupt non-JSON data and cleans up storage', () => {
    window.sessionStorage.setItem(ANALYSIS_SESSION_STORAGE_KEY, '{invalid json');
    expect(loadAnalysisSession()).toBeNull();
    expect(window.sessionStorage.getItem(ANALYSIS_SESSION_STORAGE_KEY)).toBeNull();
  });

  it('discards schema-invalid session objects and cleans up storage', () => {
    window.sessionStorage.setItem(
      ANALYSIS_SESSION_STORAGE_KEY,
      JSON.stringify({ version: 999, invalidField: true })
    );
    expect(loadAnalysisSession()).toBeNull();
    expect(window.sessionStorage.getItem(ANALYSIS_SESSION_STORAGE_KEY)).toBeNull();
  });

  it('discards expired sessions (> 24 hours old)', () => {
    const oldTimestamp = new Date(Date.now() - (25 * 60 * 60 * 1000)).toISOString();
    const expiredSession = createValidMockSession({ createdAt: oldTimestamp });

    saveAnalysisSession(expiredSession);
    expect(loadAnalysisSession()).toBeNull();
    expect(window.sessionStorage.getItem(ANALYSIS_SESSION_STORAGE_KEY)).toBeNull();
  });
});

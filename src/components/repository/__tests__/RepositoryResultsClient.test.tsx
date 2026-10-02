import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RepositoryResultsClient } from '../RepositoryResultsClient';
import {
  saveAnalysisSession,
  clearAnalysisSession,
  AnalysisSession,
} from '@/features/analysis-session';

const createMockSession = (overrides?: Partial<AnalysisSession>): AnalysisSession => ({
  version: 1,
  createdAt: new Date().toISOString(),
  profile: {
    repository: {
      owner: 'colinhacks',
      name: 'zod',
      url: 'https://github.com/colinhacks/zod',
    },
    skills: [{ name: 'TypeScript', level: 'intermediate' }],
    interests: ['frontend', 'testing'],
    availableHours: 4,
    contributionExperience: 'first-time',
  },
  result: {
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
        caveats: ['Must run build before running benchmarks.'],
      },
      contributionNotes: {
        contributionProcess: 'Submit PR against master branch.',
        testingExpectations: ['All unit tests must pass.'],
        styleExpectations: ['Follow standard code style.'],
        importantWarnings: ['Do not break backward compatibility.'],
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
        {
          issueNumber: 2900,
          title: 'Document coerce with custom types',
          url: 'https://github.com/colinhacks/zod/issues/2900',
          fit: {
            summary: 'Good documentation task for beginners.',
            relevantSkills: ['TypeScript'],
            matchedInterests: ['frontend'],
            experienceFit: 'good',
          },
          scope: {
            level: 'small',
            reasoning: 'Markdown doc only.',
          },
          likelyFiles: [
            {
              path: 'README.md',
              reason: 'Documentation site content.',
            },
          ],
          conceptsToUnderstand: ['Coercion'],
          startingPoint: {
            summary: 'Read README.md coerce section.',
            steps: ['Add example for custom type coercion'],
          },
          cautions: [],
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
  ...overrides,
});

describe('RepositoryResultsClient', () => {
  beforeEach(() => {
    clearAnalysisSession();
    vi.restoreAllMocks();
  });

  it('renders missing state when no session exists in sessionStorage', () => {
    render(<RepositoryResultsClient />);

    expect(screen.getByText(/no repository analysis yet/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /start an analysis/i })).toBeInTheDocument();
  });

  it('renders real repository header, primary recommendation, and other matches when session is valid', () => {
    const session = createMockSession();
    const saved = saveAnalysisSession(session);
    expect(saved).toBe(true);

    render(<RepositoryResultsClient />);

    // Header
    expect(screen.getByText('colinhacks/')).toBeInTheDocument();
    expect(screen.getByText('zod')).toBeInTheDocument();
    expect(
      screen.getByText(/TypeScript-first schema validation with static type inference/i)
    ).toBeInTheDocument();

    // Primary Recommendation
    expect(screen.getByText(/your first contribution/i)).toBeInTheDocument();
    expect(screen.getByText(/#2841/i)).toBeInTheDocument();
    expect(
      screen.getByText('Add support for ISO date-time duration parsing')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/fits typescript validation and testing profile/i)
    ).toBeInTheDocument();

    // Additional Recommendation
    expect(screen.getByText(/other good matches/i)).toBeInTheDocument();
    expect(screen.getByText(/#2900/i)).toBeInTheDocument();

    // Deep Analysis Sections
    expect(screen.getByText(/repository overview/i)).toBeInTheDocument();
    expect(
      screen.getByText(/typescript schema declaration and validation library/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/architecture & key modules/i)).toBeInTheDocument();
    expect(screen.getByText(/files to understand first/i)).toBeInTheDocument();
    expect(screen.getByText(/local setup & verification/i)).toBeInTheDocument();
    expect(screen.getByText(/contribution guidelines/i)).toBeInTheDocument();
    expect(screen.getByText(/domain concepts & glossary/i)).toBeInTheDocument();
    expect(screen.getByText('SafeParse')).toBeInTheDocument();
  });

  it('renders no-open-issues state when recommendations status is no-open-issues', () => {
    const session = createMockSession();
    session.result.recommendations = { status: 'no-open-issues' };
    saveAnalysisSession(session);

    render(<RepositoryResultsClient />);

    expect(
      screen.getByText(/no open contribution issues found/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /view repository on github/i })
    ).toHaveAttribute('href', 'https://github.com/colinhacks/zod');
  });

  it('renders no-suitable-issues state when recommendations status is no-suitable-issues', () => {
    const session = createMockSession();
    session.result.recommendations = {
      status: 'no-suitable-issues',
      explanation: 'Open issues required extensive domain familiarity beyond starter scope.',
      metadata: {
        candidateIssuesConsidered: 4,
        generatedAt: new Date().toISOString(),
      },
    };
    saveAnalysisSession(session);

    render(<RepositoryResultsClient />);

    expect(screen.getByText(/no strong match found/i)).toBeInTheDocument();
    expect(
      screen.getByText(/open issues required extensive domain familiarity/i)
    ).toBeInTheDocument();
  });

  it('clears session when clicking analyze another repository', () => {
    const session = createMockSession();
    saveAnalysisSession(session);

    render(<RepositoryResultsClient />);

    const resetButtons = screen.getAllByRole('button', {
      name: /analyze another/i,
    });
    expect(resetButtons.length).toBeGreaterThan(0);
    const firstReset = resetButtons[0];
    if (!firstReset) throw new Error('Reset button not found');
    fireEvent.click(firstReset);

    // Session should be cleared
    expect(window.sessionStorage.getItem('openmate.analysis.v1')).toBeNull();
  });
});

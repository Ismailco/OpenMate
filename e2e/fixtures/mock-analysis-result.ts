import type { OpenMateAnalysisResult, AnalysisSession } from '@/features/analysis-session/types';
import type { DeveloperProfile } from '@/features/developer-profile/types';
import type { ContributionRecommendation } from '@/features/contribution-recommendations/types';

export const MOCK_DEVELOPER_PROFILE: DeveloperProfile = {
  repository: {
    owner: 'openmate',
    name: 'test-repo',
    url: 'https://github.com/openmate/test-repo',
  },
  skills: [
    { name: 'TypeScript', level: 'intermediate' },
    { name: 'JavaScript', level: 'intermediate' },
  ],
  interests: ['frontend', 'testing'],
  availableHours: 3,
  contributionExperience: 'first-time',
};

export const MOCK_PRIMARY_RECOMMENDATION: ContributionRecommendation = {
  issueNumber: 101,
  title: 'Add comprehensive unit tests for format utilities',
  url: 'https://github.com/openmate/test-repo/issues/101',
  fit: {
    summary: 'Perfect match for your TypeScript skills and first-time contributor experience.',
    relevantSkills: ['TypeScript'],
    matchedInterests: ['frontend', 'testing'],
    experienceFit: 'good',
  },
  scope: {
    level: 'small',
    reasoning: 'Scoped to utility function tests without touching core architecture.',
  },
  likelyFiles: [
    {
      path: 'src/utils/format.ts',
      reason: 'Utility functions that need unit test coverage.',
    },
  ],
  conceptsToUnderstand: ['Unit Testing', 'Vitest assertions'],
  startingPoint: {
    summary: 'Inspect existing tests in src/utils/__tests__ and mirror their conventions.',
    steps: [
      'Clone repository and checkout a new branch.',
      'Open src/utils/format.ts to see uncovered helpers.',
      'Write tests in src/utils/__tests__/format.test.ts.',
    ],
  },
  cautions: ['Do not modify the public signature of format functions.'],
};

export const MOCK_SECONDARY_RECOMMENDATION: ContributionRecommendation = {
  issueNumber: 102,
  title: 'Document local environment setup guide in README',
  url: 'https://github.com/openmate/test-repo/issues/102',
  fit: {
    summary: 'Good documentation task suited for initial contribution.',
    relevantSkills: ['JavaScript'],
    matchedInterests: ['frontend'],
    experienceFit: 'good',
  },
  scope: {
    level: 'small',
    reasoning: 'Markdown edits to setup documentation.',
  },
  likelyFiles: [
    {
      path: 'README.md',
      reason: 'Root documentation file.',
    },
  ],
  conceptsToUnderstand: ['Markdown conventions'],
  startingPoint: {
    summary: 'Review local setup steps and update README.md.',
    steps: ['Read existing README.md.', 'Add step-by-step setup guide.'],
  },
  cautions: [],
};

export const MOCK_RECOMMENDATIONS_RESULT = {
  status: 'recommended' as const,
  recommendations: [MOCK_PRIMARY_RECOMMENDATION, MOCK_SECONDARY_RECOMMENDATION],
  metadata: {
    candidateIssuesConsidered: 5,
    generatedAt: '2026-10-02T12:00:00.000Z',
    modelProvider: 'openrouter',
    modelName: 'google/gemma-3-27b-it',
  },
};

export const MOCK_ANALYSIS_RESULT: OpenMateAnalysisResult = {
  repository: {
    id: 1001,
    owner: 'openmate',
    name: 'test-repo',
    fullName: 'openmate/test-repo',
    description: 'An open-source test repository for browser E2E verification.',
    defaultBranch: 'main',
    primaryLanguage: 'TypeScript',
    topics: ['open-source', 'developer-tools'],
    stars: 42,
    forks: 7,
    openIssuesCount: 3,
    isArchived: false,
    isFork: false,
    license: 'MIT',
    htmlUrl: 'https://github.com/openmate/test-repo',
  },
  analysis: {
    repositorySummary: {
      purpose: 'Demonstration and end-to-end verification application for OpenMate.',
      audience: 'New open-source contributors',
      maturity: 'established',
    },
    technologies: [
      { name: 'TypeScript', category: 'language', evidence: ['tsconfig.json'] },
      { name: 'React', category: 'framework', evidence: ['package.json'] },
      { name: 'Vitest', category: 'tooling', evidence: ['package.json'] },
    ],
    architecture: {
      overview: 'Modular architecture separating domain logic, API routes, and UI components.',
      components: [
        {
          name: 'Core Engine',
          description: 'Handles repository ingestion and context formulation.',
          relevantPaths: ['src/features/repository-context'],
        },
        {
          name: 'UI Primitives',
          description: 'Design system components and accessible layouts.',
          relevantPaths: ['src/components/ui'],
        },
      ],
      dataFlow: 'Client sends profile to Next.js API, which coordinates ingestion and analysis.',
    },
    filesToUnderstand: [
      {
        path: 'src/index.ts',
        reason: 'Main application entry point and public export surface.',
        priority: 'high',
      },
      {
        path: 'src/config.ts',
        reason: 'Application configuration and environment bounds.',
        priority: 'medium',
      },
    ],
    localSetup: {
      prerequisites: ['Node.js 22.x', 'pnpm 11.x'],
      steps: ['pnpm install', 'pnpm test', 'pnpm dev'],
      caveats: ['Requires mock or valid environment keys for live APIs.'],
    },
    glossary: [
      {
        term: 'RAG',
        explanation: 'Retrieval-Augmented Generation using semantic index searches.',
      },
      {
        term: 'PR',
        explanation: 'Pull Request submitted for code review and merge.',
      },
    ],
    contributionNotes: {
      contributionProcess: 'Fork repository, create branch, submit pull request with tests.',
      testingExpectations: ['All unit tests must pass via pnpm test.'],
      styleExpectations: ['Enforce ESLint and Prettier standards.'],
      importantWarnings: ['Never commit private tokens or credentials.'],
    },
    analysisMetadata: {
      modelProvider: 'openrouter',
      modelName: 'google/gemma-3-27b-it',
      analyzedAt: '2026-10-02T12:00:00.000Z',
    },
  },
  recommendations: MOCK_RECOMMENDATIONS_RESULT,
};

export function createMockSessionEnvelope(
  profile = MOCK_DEVELOPER_PROFILE,
  result = MOCK_ANALYSIS_RESULT,
  createdAt = new Date().toISOString()
): AnalysisSession {
  return {
    version: 1,
    createdAt,
    profile,
    result,
  };
}

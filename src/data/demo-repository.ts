/**
 * Static demonstration fixture for OpenMate UI scaffolding.
 *
 * NOTE: This is purely static demo fixture data for presentation layout development
 * and component verification in Phase 1. It is not produced by real AI analysis.
 */

export interface DemoFileToUnderstand {
  path: string;
  role: string;
  importance: 'critical' | 'recommended' | 'optional';
}

export interface DemoRecommendedIssue {
  number: number;
  title: string;
  url: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedScope: string;
  fitReason: string;
  relevantSkills: string[];
  likelyFiles: string[];
  conceptsToUnderstand: string[];
  suggestedStartingPoint: string;
}

export interface DemoRepositoryAnalysis {
  isDemoFixture: true;
  repository: {
    owner: string;
    name: string;
    fullName: string;
    description: string;
    stars: number;
    forks: number;
    primaryLanguage: string;
    defaultBranch: string;
    url: string;
  };
  matchedProfile: {
    skills: string[];
    experienceLevel: string;
    availableHours: number;
  };
  summary: string;
  architecture: {
    overview: string;
    keyModules: Array<{
      name: string;
      description: string;
      path: string;
    }>;
  };
  startHere: {
    heading: string;
    explanation: string;
    initialSteps: string[];
  };
  filesToUnderstand: DemoFileToUnderstand[];
  recommendedIssues: DemoRecommendedIssue[];
  localSetup: {
    prerequisites: string[];
    steps: Array<{
      step: number;
      label: string;
      command: string;
    }>;
  };
  glossary: Array<{
    term: string;
    definition: string;
  }>;
}

export const DEMO_REPOSITORY: DemoRepositoryAnalysis = {
  isDemoFixture: true,
  repository: {
    owner: 'colinhacks',
    name: 'zod',
    fullName: 'colinhacks/zod',
    description: 'TypeScript-first schema validation with static type inference',
    stars: 34500,
    forks: 1400,
    primaryLanguage: 'TypeScript',
    defaultBranch: 'master',
    url: 'https://github.com/colinhacks/zod',
  },
  matchedProfile: {
    skills: ['TypeScript', 'Testing', 'JavaScript'],
    experienceLevel: 'Intermediate',
    availableHours: 3,
  },
  summary:
    'Zod is a TypeScript-first schema declaration and validation library. The goal is to eliminate duplicate type declarations by inferring static TypeScript types from runtime validators.',
  architecture: {
    overview:
      'The core engine centers around the base `ZodType` class from which all primitive and composite validators inherit (e.g., `ZodString`, `ZodObject`, `ZodArray`). Parsing transforms raw inputs through an internal `ParseContext` into a `SyncParseReturnType` or `AsyncParseReturnType`.',
    keyModules: [
      {
        name: 'Type Hierarchy',
        description: 'Base ZodType class defining the parse contract and static type inference hooks.',
        path: 'src/types.ts',
      },
      {
        name: 'Error Handling',
        description: 'Issue mapping, error maps, and formatters for validation errors.',
        path: 'src/ZodError.ts',
      },
      {
        name: 'Helpers & Utilities',
        description: 'Type guards, functional utilities, and object manipulation helpers.',
        path: 'src/helpers/util.ts',
      },
    ],
  },
  startHere: {
    heading: 'Start with Custom Refinements and String Validators',
    explanation:
      'Because you have TypeScript experience and 3 hours, the safest, highest-leverage entry point is adding or improving dedicated string format checks or refining custom error maps rather than altering core type inference.',
    initialSteps: [
      'Clone repository and run test suite with `pnpm test` to verify your environment.',
      'Examine `src/types.ts` around `ZodString` to understand how string checks are chained.',
      'Check existing tests in `src/__tests__/string.test.ts` for patterns on testing edge cases.',
    ],
  },
  filesToUnderstand: [
    {
      path: 'src/types.ts',
      role: 'Defines the main class hierarchy and every schema validator in the library.',
      importance: 'critical',
    },
    {
      path: 'src/ZodError.ts',
      role: 'Manages error formatting, custom issue codes, and localization maps.',
      importance: 'recommended',
    },
    {
      path: 'src/__tests__/string.test.ts',
      role: 'Comprehensive test coverage demonstrating how inputs are asserted and verified.',
      importance: 'recommended',
    },
  ],
  recommendedIssues: [
    {
      number: 2841,
      title: 'Add support for validating ISO 8601 duration strings in z.string()',
      url: 'https://github.com/colinhacks/zod/issues/2841',
      difficulty: 'beginner',
      estimatedScope: '2–3 hours',
      fitReason:
        'Matches your TypeScript knowledge without requiring modifications to the recursive type inference engine.',
      relevantSkills: ['TypeScript', 'Regex / Parsing', 'Vitest / Jest'],
      likelyFiles: ['src/types.ts', 'src/__tests__/string.test.ts'],
      conceptsToUnderstand: [
        'ZodStringCheck refinement chain',
        'ISO 8601 duration specification (PnYnMnDTnHnMnS)',
      ],
      suggestedStartingPoint:
        'Add a new `ZodStringCheck` kind `"duration"` in `src/types.ts` and write positive/negative test cases in `src/__tests__/string.test.ts`.',
    },
    {
      number: 2914,
      title: 'Improve error message clarity when schema validation fails in deep nested unions',
      url: 'https://github.com/colinhacks/zod/issues/2914',
      difficulty: 'intermediate',
      estimatedScope: '3–4 hours',
      fitReason:
        'Directly uses your error-handling and debugging skills to improve developer ergonomics.',
      relevantSkills: ['TypeScript', 'ZodError', 'Union Types'],
      likelyFiles: ['src/ZodError.ts', 'src/types.ts'],
      conceptsToUnderstand: ['ZodIssueCode.invalid_union', 'Custom error maps'],
      suggestedStartingPoint:
        'Inspect how `ZodUnion` gathers issues from branches and reports the deepest failure path.',
    },
  ],
  localSetup: {
    prerequisites: ['Node.js >= 18', 'pnpm >= 8', 'git'],
    steps: [
      { step: 1, label: 'Clone repository', command: 'git clone https://github.com/colinhacks/zod.git' },
      { step: 2, label: 'Install dependencies', command: 'pnpm install' },
      { step: 3, label: 'Run test suite', command: 'pnpm test' },
      { step: 4, label: 'Build types', command: 'pnpm build' },
    ],
  },
  glossary: [
    {
      term: 'Static Type Inference',
      definition: 'Deriving compile-time TypeScript types from runtime schema definitions using `z.infer<typeof schema>`.',
    },
    {
      term: 'Refinement',
      definition: 'A custom validation predicate attached to an existing schema that runs after basic type checks pass.',
    },
    {
      term: 'ParseContext',
      definition: 'Internal state object passed down during validation that accumulates issues and handles async resolution.',
    },
  ],
};

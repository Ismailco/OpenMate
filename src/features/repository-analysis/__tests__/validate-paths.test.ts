import { describe, it, expect } from 'vitest';
import { validateAnalysisPaths } from '../parsing/validate-paths';
import { RepositoryContext } from '../../repository-context/types';
import { RawRepositoryAnalysis } from '../schema';

describe('validateAnalysisPaths', () => {
  const mockContext: RepositoryContext = {
    repository: {
      owner: 'acme',
      name: 'widget',
      fullName: 'acme/widget',
      description: 'Acme widget project',
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
      contributing: {
        path: 'CONTRIBUTING.md',
        content: '# Contributing',
        originalBytes: 50,
        includedCharacters: 50,
        truncated: false,
        trust: 'untrusted-repository-content',
        kind: 'contributing',
      },
    },
    projectStructure: {
      treeSummary: 'src/\n  index.ts\n  components/\n    Button.tsx\npackage.json',
      topDirectories: ['src'],
      entrypointFiles: ['src/index.ts'],
      totalFilesObserved: 3,
      truncated: false,
    },
    manifests: [
      {
        path: 'package.json',
        content: '{}',
        originalBytes: 2,
        includedCharacters: 2,
        truncated: false,
        trust: 'untrusted-repository-content',
        kind: 'manifest',
      },
    ],
    sourceFiles: [
      {
        path: 'src/index.ts',
        content: 'export const a = 1;',
        originalBytes: 20,
        includedCharacters: 20,
        truncated: false,
        trust: 'untrusted-repository-content',
        kind: 'source',
      },
      {
        path: 'src/components/Button.tsx',
        content: 'export const Button = () => null;',
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
      sourceFilesIncluded: 2,
      issuesIncluded: 0,
      truncatedDocuments: 0,
      truncatedFiles: 0,
      truncatedIssues: 0,
      approximateCharacters: 500,
    },
    trust: 'untrusted-repository-content',
  };

  const rawAnalysisWithHallucinations: RawRepositoryAnalysis = {
    repositorySummary: {
      purpose: 'Acme widget repository for UI components.',
      audience: 'Web developers',
      maturity: 'established',
    },
    technologies: [
      {
        name: 'TypeScript',
        category: 'language',
        evidence: ['package.json', 'fictional/tsconfig.prod.json', 'not/real/path.ts'],
      },
    ],
    architecture: {
      overview: 'Component library architecture with central index export.',
      components: [
        {
          name: 'Buttons',
          description: 'UI button components',
          relevantPaths: ['src/components/Button.tsx', 'fake/dir/Dialog.tsx'],
        },
      ],
      dataFlow: null,
    },
    filesToUnderstand: [
      {
        path: 'src/index.ts',
        reason: 'Main export',
        priority: 'high',
      },
      {
        path: 'secret/hidden/database.ts', // fictional
        reason: 'Hallucinated database file',
        priority: 'high',
      },
      {
        path: 'src/index.ts', // duplicate
        reason: 'Duplicate entry',
        priority: 'medium',
      },
    ],
    localSetup: {
      prerequisites: ['Node.js'],
      steps: ['pnpm install'],
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

  it('filters out hallucinated paths from evidence and relevantPaths', () => {
    const sanitized = validateAnalysisPaths(rawAnalysisWithHallucinations, mockContext);

    // fictional/tsconfig.prod.json and not/real/path.ts removed
    expect(sanitized.technologies[0]?.evidence).toEqual(['package.json']);

    // fake/dir/Dialog.tsx removed
    expect(sanitized.architecture.components[0]?.relevantPaths).toEqual([
      'src/components/Button.tsx',
    ]);
  });

  it('filters fictional paths and deduplicates filesToUnderstand', () => {
    const sanitized = validateAnalysisPaths(rawAnalysisWithHallucinations, mockContext);

    expect(sanitized.filesToUnderstand).toHaveLength(1);
    expect(sanitized.filesToUnderstand[0]?.path).toBe('src/index.ts');
  });

  it('falls back to genuine context entrypoints if model hallucinates all filesToUnderstand', () => {
    const allHallucinated: RawRepositoryAnalysis = {
      ...rawAnalysisWithHallucinations,
      filesToUnderstand: [
        {
          path: 'totally/fake/path.ts',
          reason: 'Made up',
          priority: 'high',
        },
      ],
    };

    const sanitized = validateAnalysisPaths(allHallucinated, mockContext);
    expect(sanitized.filesToUnderstand.length).toBeGreaterThan(0);
    // Should fallback to README or known source files
    expect(sanitized.filesToUnderstand[0]?.path).toBe('README.md');
  });
});

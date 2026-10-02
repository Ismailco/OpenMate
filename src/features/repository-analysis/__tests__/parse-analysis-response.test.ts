import { describe, it, expect } from 'vitest';
import { parseRawAnalysisResponse } from '../parsing/parse-analysis-response';
import { AiInvalidResponseError } from '../errors';

describe('parseRawAnalysisResponse', () => {
  const validPayload = {
    repositorySummary: {
      purpose: 'A comprehensive full-stack testing framework for distributed systems.',
      audience: 'Backend engineers and QA teams',
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
      overview: 'Modular micro-architecture with separate runner and reporter modules.',
      components: [
        {
          name: 'Core Runner',
          description: 'Coordinates test execution suites.',
          relevantPaths: ['src/runner.ts'],
        },
      ],
      dataFlow: 'CLI inputs parse configs and dispatch execution events.',
    },
    filesToUnderstand: [
      {
        path: 'src/runner.ts',
        reason: 'Main execution loop entrypoint.',
        priority: 'high',
      },
    ],
    localSetup: {
      prerequisites: ['Node.js 20+'],
      steps: ['pnpm install', 'pnpm test'],
      caveats: ['Requires Docker for integration tests.'],
    },
    glossary: [
      {
        term: 'Runner Suite',
        explanation: 'The internal grouping of isolated unit tests.',
      },
    ],
    contributionNotes: {
      contributionProcess: 'Fork, create feature branch, and submit PR.',
      testingExpectations: ['Run vitest before submitting'],
      styleExpectations: ['Prettier formatting required'],
      importantWarnings: ['Do not commit secrets'],
    },
  };

  it('parses valid raw JSON directly', () => {
    const raw = JSON.stringify(validPayload);
    const parsed = parseRawAnalysisResponse(raw);
    expect(parsed.repositorySummary.purpose).toContain('testing framework');
    expect(parsed.technologies[0]?.name).toBe('TypeScript');
  });

  it('extracts JSON cleanly from markdown code fences', () => {
    const raw = '```json\n' + JSON.stringify(validPayload, null, 2) + '\n```';
    const parsed = parseRawAnalysisResponse(raw);
    expect(parsed.repositorySummary.maturity).toBe('established');
  });

  it('throws AiInvalidResponseError for empty responses', () => {
    expect(() => parseRawAnalysisResponse('')).toThrow(AiInvalidResponseError);
    expect(() => parseRawAnalysisResponse('   \n  ')).toThrow(AiInvalidResponseError);
  });

  it('throws AiInvalidResponseError for invalid JSON syntax', () => {
    const broken = '{ repositorySummary: { purpose: "invalid" ';
    expect(() => parseRawAnalysisResponse(broken)).toThrow(AiInvalidResponseError);
  });

  it('throws AiInvalidResponseError when required schema fields are missing', () => {
    const missing = {
      repositorySummary: { purpose: 'Too short' }, // min length 10
    };
    expect(() => parseRawAnalysisResponse(JSON.stringify(missing))).toThrow(
      AiInvalidResponseError
    );
  });

  it('rejects oversized arrays exceeding budget constraints', () => {
    const oversized = {
      ...validPayload,
      technologies: Array.from({ length: 30 }, (_, i) => ({
        name: `Tech-${i}`,
        category: 'library',
        evidence: ['package.json'],
      })),
    };
    expect(() => parseRawAnalysisResponse(JSON.stringify(oversized))).toThrow(
      AiInvalidResponseError
    );
  });
});

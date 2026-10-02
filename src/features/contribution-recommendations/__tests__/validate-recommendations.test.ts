import { describe, it, expect } from 'vitest';
import { validateAndGroundRecommendations } from '../parsing/validate-recommendations';
import { RawRecommendationsResponse } from '../schema';
import { RecommendationCandidate } from '../types';
import { DeveloperProfile } from '../../developer-profile/types';
import { RepositoryContext } from '../../repository-context/types';

describe('validateAndGroundRecommendations', () => {
  const dummyProfile: DeveloperProfile = {
    repository: { owner: 'facebook', name: 'react', url: 'https://github.com/facebook/react' },
    skills: [
      { name: 'TypeScript', level: 'intermediate' },
      { name: 'React', level: 'advanced' },
    ],
    interests: ['frontend', 'testing'],
    availableHours: 4,
    contributionExperience: 'some-experience',
  };

  const dummyContext: RepositoryContext = {
    repository: {
      owner: 'facebook',
      name: 'react',
      fullName: 'facebook/react',
      description: 'React library',
      defaultBranch: 'main',
      primaryLanguage: 'JavaScript',
      topics: [],
      license: 'MIT',
      stars: 100,
      forks: 50,
    },
    documentation: {
      readme: {
        path: 'README.md',
        content: '# React',
        originalBytes: 100,
        includedCharacters: 100,
        truncated: false,
        trust: 'untrusted-repository-content',
        kind: 'readme',
      },
    },
    projectStructure: {
      treeSummary: 'README.md\npackages/react/src/React.js\npackages/react-dom/client.js',
      topDirectories: ['packages'],
      entrypointFiles: ['packages/react/src/React.js'],
      totalFilesObserved: 3,
      truncated: false,
    },
    manifests: [
      {
        path: 'package.json',
        content: '{}',
        originalBytes: 10,
        includedCharacters: 10,
        truncated: false,
        trust: 'untrusted-repository-content',
        kind: 'manifest',
      },
    ],
    sourceFiles: [
      {
        path: 'packages/react/src/React.js',
        content: 'export default {};',
        originalBytes: 50,
        includedCharacters: 50,
        truncated: false,
        trust: 'untrusted-repository-content',
        kind: 'source',
      },
    ],
    issues: [],
    contextMetadata: {
      generatedAt: '2026-01-01T00:00:00Z',
      sourceFilesIncluded: 1,
      issuesIncluded: 0,
      truncatedDocuments: 0,
      truncatedFiles: 0,
      truncatedIssues: 0,
      approximateCharacters: 500,
    },
    trust: 'untrusted-repository-content',
  };

  const createCandidate = (number: number, title: string): RecommendationCandidate => ({
    issue: {
      number,
      title,
      labels: ['frontend'],
      body: 'Canonical description from GitHub',
      htmlUrl: `https://github.com/facebook/react/issues/${number}`,
      commentsCount: 2,
      truncated: false,
      isGoodFirstIssue: true,
      isHelpWanted: true,
      trust: 'untrusted-repository-content',
    },
    signals: {
      labels: ['frontend'],
      matchedInterests: ['frontend'],
      matchedSkills: ['React'],
      beginnerFriendly: true,
      deterministicScope: 'small',
      heuristicScore: 50,
    },
  });

  const candidates: RecommendationCandidate[] = [
    createCandidate(101, 'Canonical Issue 101'),
    createCandidate(102, 'Canonical Issue 102'),
    createCandidate(103, 'Canonical Issue 103'),
    createCandidate(104, 'Canonical Issue 104'),
  ];

  it('restores canonical title and URL from candidate data and discards model alterations', () => {
    const rawResponse: RawRecommendationsResponse = {
      recommendations: [
        {
          issueNumber: 101,
          fit: {
            summary: 'Fits React skill nicely.',
            relevantSkills: ['React'],
            matchedInterests: ['frontend'],
            experienceFit: 'good',
          },
          scope: { level: 'small', reasoning: 'Isolated bug' },
          likelyFiles: [{ path: 'packages/react/src/React.js', reason: 'Primary file' }],
          conceptsToUnderstand: ['Hooks'],
          startingPoint: { summary: 'Start here', steps: ['Read the file'] },
          cautions: [],
        },
      ],
    };

    const results = validateAndGroundRecommendations(
      rawResponse,
      candidates,
      dummyProfile,
      dummyContext
    );

    expect(results).toHaveLength(1);
    expect(results[0]?.issueNumber).toBe(101);
    // Verified canonical restoration:
    expect(results[0]?.title).toBe('Canonical Issue 101');
    expect(results[0]?.url).toBe('https://github.com/facebook/react/issues/101');
  });

  it('discards hallucinated issue numbers that were not supplied in candidates', () => {
    const rawResponse: RawRecommendationsResponse = {
      recommendations: [
        {
          issueNumber: 99999, // Hallucinated
          fit: {
            summary: 'Made up issue summary.',
            relevantSkills: ['React'],
            matchedInterests: ['frontend'],
            experienceFit: 'good',
          },
          scope: { level: 'small', reasoning: 'Small' },
          likelyFiles: [],
          conceptsToUnderstand: [],
          startingPoint: { summary: 'Investigate', steps: [] },
          cautions: [],
        },
        {
          issueNumber: 102, // Genuine candidate
          fit: {
            summary: 'Genuine match summary.',
            relevantSkills: ['React'],
            matchedInterests: ['frontend'],
            experienceFit: 'good',
          },
          scope: { level: 'small', reasoning: 'Small' },
          likelyFiles: [],
          conceptsToUnderstand: [],
          startingPoint: { summary: 'Investigate', steps: [] },
          cautions: [],
        },
      ],
    };

    const results = validateAndGroundRecommendations(
      rawResponse,
      candidates,
      dummyProfile,
      dummyContext
    );

    expect(results).toHaveLength(1);
    expect(results[0]?.issueNumber).toBe(102);
  });

  it('deduplicates recommendations when the model outputs the same issue twice', () => {
    const rawResponse: RawRecommendationsResponse = {
      recommendations: [
        {
          issueNumber: 101,
          fit: {
            summary: 'First recommendation of 101.',
            relevantSkills: ['React'],
            matchedInterests: ['frontend'],
            experienceFit: 'good',
          },
          scope: { level: 'small', reasoning: 'Small' },
          likelyFiles: [],
          conceptsToUnderstand: [],
          startingPoint: { summary: 'Investigate', steps: [] },
          cautions: [],
        },
        {
          issueNumber: 101, // Duplicate
          fit: {
            summary: 'Duplicate recommendation of 101.',
            relevantSkills: ['React'],
            matchedInterests: ['frontend'],
            experienceFit: 'good',
          },
          scope: { level: 'small', reasoning: 'Small' },
          likelyFiles: [],
          conceptsToUnderstand: [],
          startingPoint: { summary: 'Investigate', steps: [] },
          cautions: [],
        },
      ],
    };

    const results = validateAndGroundRecommendations(
      rawResponse,
      candidates,
      dummyProfile,
      dummyContext
    );

    expect(results).toHaveLength(1);
    expect(results[0]?.issueNumber).toBe(101);
  });

  it('grounds relevant skills and matched interests strictly against the developer profile', () => {
    const rawResponse: RawRecommendationsResponse = {
      recommendations: [
        {
          issueNumber: 101,
          fit: {
            summary: 'Great match.',
            // User knows React and TypeScript. Model returned 'Rust' and 'Go'
            relevantSkills: ['react', 'Rust', 'Go'],
            // User selected 'frontend' and 'testing'. Model returned 'devops'
            matchedInterests: ['frontend', 'devops'],
            experienceFit: 'good',
          },
          scope: { level: 'small', reasoning: 'Small' },
          likelyFiles: [],
          conceptsToUnderstand: [],
          startingPoint: { summary: 'Investigate', steps: [] },
          cautions: [],
        },
      ],
    };

    const results = validateAndGroundRecommendations(
      rawResponse,
      candidates,
      dummyProfile,
      dummyContext
    );

    expect(results[0]?.fit.relevantSkills).toEqual(['React']); // Rust and Go discarded, canonicalized to 'React'
    expect(results[0]?.fit.matchedInterests).toEqual(['frontend']); // devops discarded
  });

  it('grounds likelyFiles against repository context and removes fictional paths', () => {
    const rawResponse: RawRecommendationsResponse = {
      recommendations: [
        {
          issueNumber: 101,
          fit: {
            summary: 'File test.',
            relevantSkills: ['React'],
            matchedInterests: ['frontend'],
            experienceFit: 'good',
          },
          scope: { level: 'small', reasoning: 'Small' },
          likelyFiles: [
            { path: 'packages/react/src/React.js', reason: 'Genuine file' },
            { path: 'fictional/unrelated/secret.ts', reason: 'Hallucinated path' },
            { path: 'package.json', reason: 'Manifest file' },
          ],
          conceptsToUnderstand: [],
          startingPoint: { summary: 'Investigate', steps: [] },
          cautions: [],
        },
      ],
    };

    const results = validateAndGroundRecommendations(
      rawResponse,
      candidates,
      dummyProfile,
      dummyContext
    );

    expect(results[0]?.likelyFiles).toEqual([
      { path: 'packages/react/src/React.js', reason: 'Genuine file' },
      { path: 'package.json', reason: 'Manifest file' },
    ]);
  });

  it('enforces hard cap of maximum 3 recommendations', () => {
    const rawResponse: RawRecommendationsResponse = {
      recommendations: [
        {
          issueNumber: 101,
          fit: { summary: 'Summary 1', relevantSkills: [], matchedInterests: [], experienceFit: 'good' },
          scope: { level: 'small', reasoning: 'Small' },
          likelyFiles: [],
          conceptsToUnderstand: [],
          startingPoint: { summary: 'Investigate', steps: [] },
          cautions: [],
        },
        {
          issueNumber: 102,
          fit: { summary: 'Summary 2', relevantSkills: [], matchedInterests: [], experienceFit: 'good' },
          scope: { level: 'small', reasoning: 'Small' },
          likelyFiles: [],
          conceptsToUnderstand: [],
          startingPoint: { summary: 'Investigate', steps: [] },
          cautions: [],
        },
        {
          issueNumber: 103,
          fit: { summary: 'Summary 3', relevantSkills: [], matchedInterests: [], experienceFit: 'good' },
          scope: { level: 'small', reasoning: 'Small' },
          likelyFiles: [],
          conceptsToUnderstand: [],
          startingPoint: { summary: 'Investigate', steps: [] },
          cautions: [],
        },
        {
          issueNumber: 104,
          fit: { summary: 'Summary 4', relevantSkills: [], matchedInterests: [], experienceFit: 'good' },
          scope: { level: 'small', reasoning: 'Small' },
          likelyFiles: [],
          conceptsToUnderstand: [],
          startingPoint: { summary: 'Investigate', steps: [] },
          cautions: [],
        },
      ],
    };

    const results = validateAndGroundRecommendations(
      rawResponse,
      candidates,
      dummyProfile,
      dummyContext
    );

    expect(results).toHaveLength(3);
    expect(results.map((r) => r.issueNumber)).toEqual([101, 102, 103]);
  });
});

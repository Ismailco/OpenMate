import { describe, it, expect } from 'vitest';
import { selectCandidateIssues, MAX_CANDIDATE_ISSUES } from '../candidate-selection';
import { DeveloperProfile } from '../../developer-profile/types';
import { RepositoryAnalysis } from '../../repository-analysis/types';
import { ContextIssue } from '../../repository-context/types';

describe('Candidate selection (deterministic shortlist)', () => {
  const mockAnalysis: RepositoryAnalysis = {
    repositorySummary: {
      purpose: 'A web application framework.',
      audience: 'Web developers',
      maturity: 'established',
    },
    technologies: [
      { name: 'TypeScript', category: 'language', evidence: ['package.json'] },
      { name: 'React', category: 'framework', evidence: ['package.json'] },
    ],
    architecture: {
      overview: 'Modular web framework',
      components: [],
      dataFlow: null,
    },
    filesToUnderstand: [],
    localSetup: { prerequisites: [], steps: [], caveats: [] },
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

  const createIssue = (
    number: number,
    title: string,
    labels: string[],
    body: string,
    isGoodFirstIssue = false,
    isHelpWanted = false
  ): ContextIssue => ({
    number,
    title,
    labels,
    body,
    htmlUrl: `https://github.com/test-org/test-repo/issues/${number}`,
    commentsCount: 1,
    truncated: false,
    isGoodFirstIssue,
    isHelpWanted,
    trust: 'untrusted-repository-content',
  });

  it('returns an empty array when context has no issues', () => {
    const profile: DeveloperProfile = {
      repository: { owner: 'o', name: 'r', url: 'https://github.com/o/r' },
      skills: [{ name: 'TypeScript', level: 'beginner' }],
      interests: ['frontend'],
      availableHours: 2,
      contributionExperience: 'first-time',
    };

    const candidates = selectCandidateIssues([], profile, mockAnalysis);
    expect(candidates).toEqual([]);
  });

  it('caps candidates to MAX_CANDIDATE_ISSUES (8)', () => {
    const profile: DeveloperProfile = {
      repository: { owner: 'o', name: 'r', url: 'https://github.com/o/r' },
      skills: [{ name: 'TypeScript', level: 'intermediate' }],
      interests: ['frontend'],
      availableHours: 5,
      contributionExperience: 'some-experience',
    };

    const issues: ContextIssue[] = Array.from({ length: 15 }, (_, i) =>
      createIssue(i + 1, `Issue ${i + 1}`, ['frontend'], 'Detailed description of the issue.')
    );

    const candidates = selectCandidateIssues(issues, profile, mockAnalysis);
    expect(candidates.length).toBe(MAX_CANDIDATE_ISSUES);
  });

  it('heavily prioritizes beginner-friendly issues and penalizes large refactors for first-time contributors', () => {
    const profile: DeveloperProfile = {
      repository: { owner: 'o', name: 'r', url: 'https://github.com/o/r' },
      skills: [{ name: 'React', level: 'beginner' }],
      interests: ['frontend'],
      availableHours: 2,
      contributionExperience: 'first-time',
    };

    const issues: ContextIssue[] = [
      createIssue(10, 'Complete architectural rewrite of state manager', ['architecture'], 'Huge rewrite touching all modules'),
      createIssue(20, 'Fix button alignment in header', ['good first issue', 'frontend'], 'Small CSS fix for header component', true),
      createIssue(30, 'Update getting started docs with React 19 instructions', ['documentation', 'help wanted'], 'Small docs update', false, true),
    ];

    const candidates = selectCandidateIssues(issues, profile, mockAnalysis);

    // Issue #20 (good first issue + frontend) should be ranked first
    expect(candidates[0]?.issue.number).toBe(20);
    // Issue #30 (help wanted docs) should be ranked before the huge architectural rewrite #10
    expect(candidates[1]?.issue.number).toBe(30);
    expect(candidates[2]?.issue.number).toBe(10);
  });

  it('does not penalize large scope issues for experienced contributors', () => {
    const profile: DeveloperProfile = {
      repository: { owner: 'o', name: 'r', url: 'https://github.com/o/r' },
      skills: [{ name: 'TypeScript', level: 'advanced' }],
      interests: ['backend'],
      availableHours: 10,
      contributionExperience: 'experienced',
    };

    const issues: ContextIssue[] = [
      createIssue(10, 'Minor typo in comment', ['good first issue'], 'Typo fix', true),
      createIssue(20, 'Migrate database connector to pool architecture', ['backend'], 'Large scale migration of the database connection layer'),
    ];

    const candidates = selectCandidateIssues(issues, profile, mockAnalysis);

    // For experienced profile with backend interest and 10 hours, issue 20 with backend match should rank higher
    expect(candidates[0]?.issue.number).toBe(20);
  });

  it('boosts testing-related issues when developer interest is testing', () => {
    const profile: DeveloperProfile = {
      repository: { owner: 'o', name: 'r', url: 'https://github.com/o/r' },
      skills: [{ name: 'TypeScript', level: 'intermediate' }],
      interests: ['testing'],
      availableHours: 4,
      contributionExperience: 'some-experience',
    };

    const issues: ContextIssue[] = [
      createIssue(1, 'Add unit test coverage for parser module', ['testing'], 'Need vitest coverage for edge cases'),
      createIssue(2, 'Update landing page typography', ['design'], 'Change font sizes'),
    ];

    const candidates = selectCandidateIssues(issues, profile, mockAnalysis);
    expect(candidates[0]?.issue.number).toBe(1);
  });

  it('uses issue number descending as a stable tie-breaker when scores are equal', () => {
    const profile: DeveloperProfile = {
      repository: { owner: 'o', name: 'r', url: 'https://github.com/o/r' },
      skills: [{ name: 'TypeScript', level: 'intermediate' }],
      interests: ['frontend'],
      availableHours: 4,
      contributionExperience: 'some-experience',
    };

    const issues: ContextIssue[] = [
      createIssue(100, 'Frontend UI component fix', ['frontend'], 'Fix component behavior'),
      createIssue(200, 'Frontend UI component fix 2', ['frontend'], 'Fix component behavior'),
      createIssue(50, 'Frontend UI component fix 3', ['frontend'], 'Fix component behavior'),
    ];

    const candidates = selectCandidateIssues(issues, profile, mockAnalysis);
    expect(candidates.map((c) => c.issue.number)).toEqual([200, 100, 50]);
  });
});

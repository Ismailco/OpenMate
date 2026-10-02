import { describe, it, expect } from 'vitest';
import { extractIssueSignals, isBeginnerFriendly, isHelpWanted } from '../issue-signals';
import { estimateDeterministicScope } from '../scope';
import { ContextIssue } from '../../repository-context/types';
import { DeveloperProfile } from '../../developer-profile/types';
import { RepositoryAnalysis } from '../../repository-analysis/types';

describe('Issue signals and scope heuristics', () => {
  const dummyProfile: DeveloperProfile = {
    repository: { owner: 'acme', name: 'repo', url: 'https://github.com/acme/repo' },
    skills: [{ name: 'TypeScript', level: 'intermediate' }, { name: 'React', level: 'advanced' }],
    interests: ['frontend', 'testing'],
    availableHours: 4,
    contributionExperience: 'some-experience',
  };

  const dummyAnalysis: RepositoryAnalysis = {
    repositorySummary: { purpose: 'Demo repo', audience: null, maturity: null },
    technologies: [{ name: 'TypeScript', category: 'language', evidence: [] }],
    architecture: { overview: 'Overview', components: [], dataFlow: null },
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

  const makeIssue = (overrides: Partial<ContextIssue>): ContextIssue => ({
    number: 1,
    title: 'Test issue',
    body: 'Sample issue body text that provides sufficient context for heuristic evaluation.',
    labels: [],
    htmlUrl: 'https://github.com/acme/repo/issues/1',
    commentsCount: 0,
    truncated: false,
    isGoodFirstIssue: false,
    isHelpWanted: false,
    trust: 'untrusted-repository-content',
    ...overrides,
  });

  it('detects beginner friendly issues by label and boolean flag', () => {
    expect(isBeginnerFriendly(makeIssue({ isGoodFirstIssue: true }))).toBe(true);
    expect(isBeginnerFriendly(makeIssue({ labels: ['good first issue'] }))).toBe(true);
    expect(isBeginnerFriendly(makeIssue({ labels: ['Starter'] }))).toBe(true);
    expect(isBeginnerFriendly(makeIssue({ labels: ['bug'] }))).toBe(false);
  });

  it('detects help wanted issues by label and boolean flag', () => {
    expect(isHelpWanted(makeIssue({ isHelpWanted: true }))).toBe(true);
    expect(isHelpWanted(makeIssue({ labels: ['Help Wanted'] }))).toBe(true);
    expect(isHelpWanted(makeIssue({ labels: ['documentation'] }))).toBe(false);
  });

  it('estimates scope deterministically without claiming precise hours', () => {
    expect(
      estimateDeterministicScope(
        makeIssue({ title: 'Fix typo in README documentation', body: 'Small spelling error.' })
      )
    ).toBe('small');

    expect(
      estimateDeterministicScope(
        makeIssue({ title: 'Complete refactor and migration of database engine', body: 'Major architecture rewrite.' })
      )
    ).toBe('large');

    expect(
      estimateDeterministicScope(
        makeIssue({ title: 'Add search filter to user table', body: 'Standard feature to filter user table.' })
      )
    ).toBe('medium');

    expect(
      estimateDeterministicScope(makeIssue({ title: 'Hi', body: '' }))
    ).toBe('unknown');
  });

  it('extracts matched interests and skills from issue text and labels', () => {
    const issue = makeIssue({
      title: 'Fix React button component UI rendering bug in frontend',
      body: 'The TypeScript button component fails when clicked.',
      labels: ['ui', 'bug'],
    });

    const signals = extractIssueSignals(issue, dummyProfile, dummyAnalysis);

    expect(signals.matchedInterests).toContain('frontend');
    expect(signals.matchedSkills).toContain('TypeScript');
    expect(signals.matchedSkills).toContain('React');
  });
});

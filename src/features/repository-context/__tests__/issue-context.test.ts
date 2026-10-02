import { describe, it, expect } from 'vitest';
import { normalizeIssues } from '../issue-context';
import { RepositoryIssue } from '../../github/types';

describe('normalizeIssues', () => {
  it('prioritizes good first issues and help wanted issues', () => {
    const rawIssues: RepositoryIssue[] = [
      {
        number: 10,
        title: 'Regular complex bug',
        body: 'Details here',
        htmlUrl: 'https://github.com/owner/repo/issues/10',
        labels: ['bug'],
        state: 'open',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        commentsCount: 0,
      },
      {
        number: 20,
        title: 'Add starter docs',
        body: 'Great beginner task',
        htmlUrl: 'https://github.com/owner/repo/issues/20',
        labels: ['documentation', 'good first issue'],
        state: 'open',
        createdAt: '2026-01-02',
        updatedAt: '2026-01-02',
        commentsCount: 2,
      },
      {
        number: 30,
        title: 'Need help with CLI command',
        body: 'Help wanted',
        htmlUrl: 'https://github.com/owner/repo/issues/30',
        labels: ['help-wanted'],
        state: 'open',
        createdAt: '2026-01-03',
        updatedAt: '2026-01-03',
        commentsCount: 1,
      },
    ];

    const results = normalizeIssues(rawIssues);

    expect(results[0]?.number).toBe(20); // good first issue
    expect(results[0]?.isGoodFirstIssue).toBe(true);

    expect(results[1]?.number).toBe(30); // help wanted
    expect(results[1]?.isHelpWanted).toBe(true);

    expect(results[2]?.number).toBe(10); // regular bug
  });

  it('normalizes labels case-insensitively and handles hyphen variations', () => {
    const rawIssues: RepositoryIssue[] = [
      {
        number: 1,
        title: 'Task 1',
        body: 'Desc',
        htmlUrl: 'https://github.com/owner/repo/issues/1',
        labels: ['Good-First-Issue'],
        state: 'open',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        commentsCount: 0,
      },
    ];

    const results = normalizeIssues(rawIssues);
    expect(results[0]?.isGoodFirstIssue).toBe(true);
  });

  it('truncates large issue bodies cleanly', () => {
    const rawIssues: RepositoryIssue[] = [
      {
        number: 5,
        title: 'Giant stack trace',
        body: 'Error line\n'.repeat(200),
        htmlUrl: 'https://github.com/owner/repo/issues/5',
        labels: ['bug'],
        state: 'open',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        commentsCount: 0,
      },
    ];

    const results = normalizeIssues(rawIssues);
    expect(results[0]?.truncated).toBe(true);
    expect(results[0]?.body.length).toBeLessThanOrEqual(600);
  });
});

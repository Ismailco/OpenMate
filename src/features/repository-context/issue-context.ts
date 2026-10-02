import { RepositoryIssue } from '../github/types';
import { CONTEXT_BUDGETS } from './budgets';
import { normalizeText } from './normalize-text';
import { truncateDocument } from './truncate';
import { ContextIssue } from './types';

function isGoodFirstIssueLabel(label: string): boolean {
  const normalized = label.trim().toLowerCase().replace(/[-_]/g, ' ');
  return normalized === 'good first issue';
}

function isHelpWantedLabel(label: string): boolean {
  const normalized = label.trim().toLowerCase().replace(/[-_]/g, ' ');
  return normalized === 'help wanted';
}

function scoreIssue(issue: RepositoryIssue): number {
  let score = 0;

  const hasGoodFirst = issue.labels.some(isGoodFirstIssueLabel);
  const hasHelpWanted = issue.labels.some(isHelpWantedLabel);

  if (hasGoodFirst) score += 100;
  if (hasHelpWanted) score += 50;
  if (issue.body && issue.body.trim().length > 20) score += 20;

  return score;
}

export function normalizeIssues(rawIssues: RepositoryIssue[]): ContextIssue[] {
  // Sort issues by priority score descending, then number descending for determinism
  const sorted = [...rawIssues].sort((a, b) => {
    const scoreA = scoreIssue(a);
    const scoreB = scoreIssue(b);
    if (scoreA !== scoreB) return scoreB - scoreA;
    return b.number - a.number;
  });

  const results: ContextIssue[] = [];
  let cumulativeChars = 0;

  for (const raw of sorted) {
    if (
      results.length >= CONTEXT_BUDGETS.MAX_ISSUES_INCLUDED ||
      cumulativeChars >= CONTEXT_BUDGETS.ISSUES_TOTAL_CHARACTERS
    ) {
      break;
    }

    const title = normalizeText(raw.title);
    const rawBody = raw.body ? normalizeText(raw.body) : '';

    const remainingBudget = Math.min(
      CONTEXT_BUDGETS.INDIVIDUAL_ISSUE_BODY_CHARACTERS,
      CONTEXT_BUDGETS.ISSUES_TOTAL_CHARACTERS - cumulativeChars
    );

    const { content: body, truncated } = truncateDocument(rawBody, remainingBudget);

    const isGoodFirstIssue = raw.labels.some(isGoodFirstIssueLabel);
    const isHelpWanted = raw.labels.some(isHelpWantedLabel);

    cumulativeChars += title.length + body.length;

    results.push({
      number: raw.number,
      title,
      body,
      labels: raw.labels.map((l) => l.trim()),
      htmlUrl: raw.htmlUrl,
      commentsCount: raw.commentsCount,
      truncated,
      isGoodFirstIssue,
      isHelpWanted,
      trust: 'untrusted-repository-content',
    });
  }

  return results;
}

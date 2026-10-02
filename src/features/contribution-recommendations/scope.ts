import { ContextIssue } from '../repository-context/types';
import { ScopeLevel } from './types';

const SMALL_SCOPE_KEYWORDS = [
  'typo',
  'documentation',
  'docs',
  'readme',
  'spelling',
  'rename',
  'minor',
  'trivial',
  'small',
  'single test',
  'unit test',
  'lint',
  'format',
];

const LARGE_SCOPE_KEYWORDS = [
  'refactor',
  'rewrite',
  'migration',
  'migrate',
  'redesign',
  'architecture',
  'architectural',
  'breaking change',
  'cross-platform',
  'monorepo',
  'multi-package',
  'overhaul',
];

/**
 * Deterministically estimates issue scope from labels, title, and body.
 * Returns 'unknown' freely when evidence is sparse.
 */
export function estimateDeterministicScope(issue: ContextIssue): ScopeLevel {
  const text = `${issue.title} ${issue.labels.join(' ')} ${issue.body}`.toLowerCase();

  const isSmall = SMALL_SCOPE_KEYWORDS.some((kw) => text.includes(kw));
  const isLarge = LARGE_SCOPE_KEYWORDS.some((kw) => text.includes(kw));

  if (isSmall && !isLarge) {
    return 'small';
  }

  if (isLarge && !isSmall) {
    return 'large';
  }

  // If issue body is very short or labels are empty, classify as unknown
  if (text.trim().length < 40) {
    return 'unknown';
  }

  return 'medium';
}

import { DeveloperProfile } from '../developer-profile/types';
import { ContextIssue } from '../repository-context/types';
import { RepositoryAnalysis } from '../repository-analysis/types';
import { RecommendationCandidate } from './types';
import { extractIssueSignals } from './issue-signals';

export const MAX_CANDIDATE_ISSUES = 8;

/**
 * Deterministically filters, scores, and shortlists candidate issues from the
 * repository context before passing them to the recommendation model.
 *
 * Guarantees:
 * - Pure deterministic execution with no network or AI calls.
 * - Maximum of MAX_CANDIDATE_ISSUES (8) returned.
 * - Stable tie-breaking by issue number descending.
 */
export function selectCandidateIssues(
  issues: ContextIssue[],
  profile: DeveloperProfile,
  analysis: RepositoryAnalysis
): RecommendationCandidate[] {
  if (!issues || issues.length === 0) {
    return [];
  }

  const candidates: RecommendationCandidate[] = issues.map((issue) => ({
    issue,
    signals: extractIssueSignals(issue, profile, analysis),
  }));

  // Sort deterministically: highest heuristic score first, then tie-break by issue number descending
  candidates.sort((a, b) => {
    if (b.signals.heuristicScore !== a.signals.heuristicScore) {
      return b.signals.heuristicScore - a.signals.heuristicScore;
    }
    return b.issue.number - a.issue.number;
  });

  return candidates.slice(0, MAX_CANDIDATE_ISSUES);
}

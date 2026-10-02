import { DeveloperProfile } from '../../developer-profile/types';
import { RepositoryContext } from '../../repository-context/types';
import { extractKnownContextPaths } from '../../repository-analysis/parsing/validate-paths';
import { RawRecommendationsResponse } from '../schema';
import {
  ContributionRecommendation,
  LikelyFile,
  RecommendationCandidate,
} from '../types';

/**
 * Validates, grounds, and sanitizes model recommendations against genuine application data:
 *
 * Guarantees:
 * 1. Issue Grounding: Issue numbers MUST exist in the candidate set.
 * 2. Identity Integrity: Title and URL are ALWAYS overwritten with canonical GitHub data.
 * 3. Profile Grounding: Relevant skills and interests MUST be subsets of developer profile.
 * 4. Path Grounding: Likely file paths MUST exist in repository context.
 * 5. Deduplication: The same issue number cannot appear more than once.
 * 6. Hard Cap: Maximum 3 recommendations returned.
 */
export function validateAndGroundRecommendations(
  rawResponse: RawRecommendationsResponse,
  candidates: RecommendationCandidate[],
  profile: DeveloperProfile,
  context: RepositoryContext
): ContributionRecommendation[] {
  const candidateMap = new Map<number, RecommendationCandidate>();
  for (const c of candidates) {
    candidateMap.set(c.issue.number, c);
  }

  // Developer profile skill lookup (case-insensitive -> canonical profile skill name)
  const profileSkillMap = new Map<string, string>();
  for (const s of profile.skills) {
    profileSkillMap.set(s.name.trim().toLowerCase(), s.name);
  }

  const profileInterestsSet = new Set(profile.interests);
  const knownPaths = extractKnownContextPaths(context);

  const seenIssueNumbers = new Set<number>();
  const groundedRecommendations: ContributionRecommendation[] = [];

  for (const rec of rawResponse.recommendations) {
    // 1. Issue Grounding: Verify candidate exists
    const candidate = candidateMap.get(rec.issueNumber);
    if (!candidate) {
      continue; // Discard hallucinated issue number
    }

    // 2. Deduplication
    if (seenIssueNumbers.has(rec.issueNumber)) {
      continue;
    }
    seenIssueNumbers.add(rec.issueNumber);

    // 3. Profile Skills Grounding
    const groundedSkills: string[] = [];
    const seenSkills = new Set<string>();
    for (const skillName of rec.fit.relevantSkills) {
      const canonical = profileSkillMap.get(skillName.trim().toLowerCase());
      if (canonical && !seenSkills.has(canonical.toLowerCase())) {
        groundedSkills.push(canonical);
        seenSkills.add(canonical.toLowerCase());
      }
    }

    // 4. Profile Interests Grounding
    const groundedInterests = rec.fit.matchedInterests.filter((interest) =>
      profileInterestsSet.has(interest)
    );

    // 5. Path Grounding
    const groundedFiles: LikelyFile[] = [];
    const seenFiles = new Set<string>();
    for (const f of rec.likelyFiles) {
      const normalizedPath = f.path.trim().replace(/^\/+/g, '');
      if (knownPaths.has(normalizedPath) && !seenFiles.has(normalizedPath)) {
        groundedFiles.push({
          path: normalizedPath,
          reason: f.reason,
        });
        seenFiles.add(normalizedPath);
      }
    }

    // 6. Canonical Title and URL Overwrite
    groundedRecommendations.push({
      issueNumber: candidate.issue.number,
      title: candidate.issue.title,
      url: candidate.issue.htmlUrl,
      fit: {
        summary: rec.fit.summary,
        relevantSkills: groundedSkills,
        matchedInterests: groundedInterests,
        experienceFit: rec.fit.experienceFit,
      },
      scope: rec.scope,
      likelyFiles: groundedFiles,
      conceptsToUnderstand: rec.conceptsToUnderstand,
      startingPoint: rec.startingPoint,
      cautions: rec.cautions,
    });

    if (groundedRecommendations.length >= 3) {
      break;
    }
  }

  return groundedRecommendations;
}

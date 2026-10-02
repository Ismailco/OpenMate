import { DeveloperProfile } from '../../developer-profile/types';
import { RepositoryAnalysis } from '../../repository-analysis/types';
import { RepositoryContext } from '../../repository-context/types';
import { RecommendationCandidate } from '../types';

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Builds the personalized recommendation user prompt.
 *
 * Cost & Latency Discipline:
 * - Does NOT resend the entire 60k character raw repository context.
 * - Sends only the concise RepositoryAnalysis, DeveloperProfile, candidate issues,
 *   and known repository file paths inventory.
 */
export function buildRecommendationUserPrompt(
  profile: DeveloperProfile,
  analysis: RepositoryAnalysis,
  candidates: RecommendationCandidate[],
  context: RepositoryContext
): string {
  // Collect known file paths for model reference
  const knownPaths = new Set<string>();
  if (context.documentation.readme) knownPaths.add(context.documentation.readme.path);
  if (context.documentation.contributing)
    knownPaths.add(context.documentation.contributing.path);
  for (const m of context.manifests) knownPaths.add(m.path);
  for (const s of context.sourceFiles) knownPaths.add(s.path);
  for (const e of context.projectStructure.entrypointFiles) knownPaths.add(e);

  const profileSummary = `
- Skills: ${profile.skills.map((s) => `${s.name} (${s.level})`).join(', ')}
- Interests: ${profile.interests.join(', ')}
- Available Time: ${profile.availableHours} hour(s)
- Contribution Experience: ${profile.contributionExperience}
`.trim();

  const repoSummary = `
- Purpose: ${analysis.repositorySummary.purpose}
- Audience: ${analysis.repositorySummary.audience ?? 'General developers'}
- Architecture Overview: ${analysis.architecture.overview}
- Core Technologies: ${analysis.technologies.map((t) => t.name).join(', ')}
- Setup Steps: ${analysis.localSetup.steps.slice(0, 4).join('; ')}
`.trim();

  const candidateIssuesXml = candidates
    .map((c) => {
      const issue = c.issue;
      return `  <candidate_issue number="${issue.number}" beginnerFriendly="${c.signals.beginnerFriendly}" scopeHint="${c.signals.deterministicScope}">
    <title>${escapeXml(issue.title)}</title>
    <labels>${escapeXml(issue.labels.join(', '))}</labels>
    <body>
${escapeXml(issue.body.slice(0, 800))}
    </body>
  </candidate_issue>`;
    })
    .join('\n');

  const knownPathsList = Array.from(knownPaths).sort().join('\n');

  return `Please evaluate the following real candidate GitHub issues and select the top contribution recommendations (maximum 3) for this developer.

<developer_profile>
${profileSummary}
</developer_profile>

<repository_analysis>
${repoSummary}
</repository_analysis>

<known_repository_paths>
${knownPathsList}
</known_repository_paths>

<candidate_issues count="${candidates.length}">
${candidateIssuesXml}
</candidate_issues>

REQUIRED JSON FORMAT:
{
  "recommendations": [
    {
      "issueNumber": 123,
      "fit": {
        "summary": "Detailed explanation of why this issue fits the developer's skills and interests...",
        "relevantSkills": ["TypeScript"],
        "matchedInterests": ["frontend"],
        "experienceFit": "good"
      },
      "scope": {
        "level": "small",
        "reasoning": "Explanation of scope bounded to evidence in the issue description..."
      },
      "likelyFiles": [
        {
          "path": "src/components/Button.tsx",
          "reason": "Component where the UI fix likely resides."
        }
      ],
      "conceptsToUnderstand": [
        "React state management",
        "Jest test assertions"
      ],
      "startingPoint": {
        "summary": "How to begin investigating the issue...",
        "steps": [
          "Run the test suite to observe current behavior.",
          "Inspect src/components/Button.tsx."
        ]
      },
      "cautions": [
        "Issue description is concise; confirm expected behavior before submitting PR."
      ]
    }
  ]
}

Only return JSON. Return at most 3 recommendations.`;
}

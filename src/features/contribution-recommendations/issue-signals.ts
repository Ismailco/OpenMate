import {
  ContributionInterest,
  DeveloperProfile,
} from '../developer-profile/types';
import { ContextIssue } from '../repository-context/types';
import { RepositoryAnalysis } from '../repository-analysis/types';
import { RecommendationCandidateSignals } from './types';
import { estimateDeterministicScope } from './scope';

const INTEREST_KEYWORD_MAP: Record<ContributionInterest, readonly string[]> = {
  frontend: [
    'frontend',
    'ui',
    'ux',
    'component',
    'css',
    'html',
    'web',
    'react',
    'vue',
    'svelte',
    'tailwind',
  ],
  backend: [
    'backend',
    'api',
    'server',
    'database',
    'db',
    'endpoint',
    'sql',
    'graphql',
    'rest',
    'route',
  ],
  'full-stack': ['fullstack', 'full-stack', 'integration', 'e2e'],
  documentation: [
    'documentation',
    'docs',
    'readme',
    'typo',
    'guide',
    'tutorial',
    'contributing',
  ],
  testing: [
    'test',
    'tests',
    'testing',
    'spec',
    'coverage',
    'vitest',
    'jest',
    'playwright',
    'cypress',
  ],
  'developer-tools': [
    'tooling',
    'cli',
    'dx',
    'devtools',
    'linter',
    'script',
    'codegen',
    'bundler',
  ],
  performance: [
    'performance',
    'perf',
    'optimization',
    'memory',
    'speed',
    'latency',
    'bundle',
  ],
  accessibility: [
    'accessibility',
    'a11y',
    'aria',
    'screen-reader',
    'wcag',
    'contrast',
  ],
  devops: [
    'devops',
    'ci',
    'cd',
    'docker',
    'github-actions',
    'workflow',
    'deploy',
    'pipeline',
  ],
};

const BEGINNER_LABELS = [
  'good first issue',
  'good-first-issue',
  'first-timers-only',
  'beginner',
  'starter',
  'easy',
  'up-for-grabs',
];

const HELP_WANTED_LABELS = ['help wanted', 'help-wanted'];

export function isBeginnerFriendly(issue: ContextIssue): boolean {
  if (issue.isGoodFirstIssue) return true;
  const labelMatches = issue.labels.some((l) =>
    BEGINNER_LABELS.some((b) => l.toLowerCase().includes(b))
  );
  return labelMatches;
}

export function isHelpWanted(issue: ContextIssue): boolean {
  if (issue.isHelpWanted) return true;
  return issue.labels.some((l) =>
    HELP_WANTED_LABELS.some((h) => l.toLowerCase().includes(h))
  );
}

export function extractIssueSignals(
  issue: ContextIssue,
  profile: DeveloperProfile,
  analysis: RepositoryAnalysis
): RecommendationCandidateSignals {
  const issueText = `${issue.title} ${issue.labels.join(' ')} ${issue.body}`.toLowerCase();
  const beginnerFriendly = isBeginnerFriendly(issue);
  const helpWanted = isHelpWanted(issue);
  const deterministicScope = estimateDeterministicScope(issue);

  // 1. Matched Interests
  const matchedInterests: ContributionInterest[] = [];
  for (const interest of profile.interests) {
    const keywords = INTEREST_KEYWORD_MAP[interest] ?? [];
    const hasMatch = keywords.some((kw) => issueText.includes(kw));
    if (hasMatch) {
      matchedInterests.push(interest);
    }
  }

  // 2. Matched Skills
  const matchedSkills: string[] = [];
  const repoTechNames = new Set(
    analysis.technologies.map((t) => t.name.trim().toLowerCase())
  );

  for (const skill of profile.skills) {
    const norm = skill.name.trim().toLowerCase();
    if (!norm) continue;

    // Direct mention in issue text or labels
    const mentionedInIssue = issueText.includes(norm);
    if (mentionedInIssue) {
      matchedSkills.push(skill.name);
    }
  }

  // 3. Heuristic Scoring (used strictly for candidate shortlisting, never exposed to user)
  let score = 0;

  if (beginnerFriendly) {
    score += 40;
  }
  if (helpWanted) {
    score += 25;
  }

  // Interest match (+20 per matched interest, max 40)
  score += Math.min(matchedInterests.length * 20, 40);

  // Skill match (+20 per matched skill, max 40)
  score += Math.min(matchedSkills.length * 20, 40);

  // Project-level technology overlap
  const hasRepoTechOverlap = profile.skills.some((s) =>
    repoTechNames.has(s.name.trim().toLowerCase())
  );
  if (hasRepoTechOverlap) {
    score += 10;
  }

  // Well-described issue body
  if (issue.body.trim().length > 100) {
    score += 10;
  }

  // Experience level adjustments
  if (profile.contributionExperience === 'first-time') {
    if (deterministicScope === 'large') {
      score -= 50; // heavily penalize huge refactors for first timers
    }
    if (beginnerFriendly) {
      score += 20; // extra boost for first timers
    }
  } else if (profile.contributionExperience === 'experienced') {
    if (deterministicScope === 'large') {
      score += 10; // experienced developers can tackle larger scopes
    }
  }

  // Available time adjustments
  if (profile.availableHours <= 3) {
    if (deterministicScope === 'small') {
      score += 20;
    } else if (deterministicScope === 'large') {
      score -= 40;
    }
  } else if (profile.availableHours >= 8) {
    if (deterministicScope === 'large') {
      score += 15;
    }
  }

  return {
    labels: issue.labels,
    matchedInterests,
    matchedSkills,
    beginnerFriendly,
    deterministicScope,
    heuristicScore: score,
  };
}

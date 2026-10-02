import {
  SkillLevel,
  ContributionInterest,
  ContributionExperience,
} from './types';

export const VALIDATION_LIMITS = {
  MIN_SKILLS: 1,
  MAX_SKILLS: 12,
  MIN_SKILL_NAME_LENGTH: 1,
  MAX_SKILL_NAME_LENGTH: 40,
  MIN_INTERESTS: 1,
  MAX_INTERESTS: 8,
  MIN_HOURS: 1,
  MAX_HOURS: 40,
  DEFAULT_HOURS: 3,
} as const;

export const SKILL_LEVELS: Array<{ value: SkillLevel; label: string; description: string }> = [
  { value: 'beginner', label: 'Beginner', description: 'Basic familiarity, learning syntax' },
  { value: 'intermediate', label: 'Intermediate', description: 'Comfortable reading & writing idioms' },
  { value: 'advanced', label: 'Advanced', description: 'Deep architectural and debugging expertise' },
];

export const CONTRIBUTION_INTERESTS: Array<{
  value: ContributionInterest;
  label: string;
  description: string;
}> = [
  { value: 'frontend', label: 'Frontend', description: 'UI, components, state, styling' },
  { value: 'backend', label: 'Backend', description: 'API routes, data processing, server logic' },
  { value: 'full-stack', label: 'Full Stack', description: 'End-to-end integration and features' },
  { value: 'documentation', label: 'Documentation', description: 'Guides, API reference, onboarding examples' },
  { value: 'testing', label: 'Testing', description: 'Unit tests, mock boundaries, regression coverage' },
  { value: 'developer-tools', label: 'Developer Tools', description: 'CLI tools, build pipelines, DX improvements' },
  { value: 'performance', label: 'Performance', description: 'Memory optimization, latency reduction, caching' },
  { value: 'accessibility', label: 'Accessibility', description: 'Screen readers, keyboard navigation, WCAG' },
  { value: 'devops', label: 'DevOps & CI', description: 'Workflows, containerization, deployment configs' },
];

export const CONTRIBUTION_EXPERIENCES: Array<{
  value: ContributionExperience;
  label: string;
  description: string;
}> = [
  {
    value: 'first-time',
    label: 'First-time contributor',
    description: 'New to open source; seeking small, well-scoped starter issues',
  },
  {
    value: 'some-experience',
    label: "I've contributed a few times",
    description: 'Comfortable with Git forks, branching, PR workflows, and code reviews',
  },
  {
    value: 'experienced',
    label: 'Experienced contributor',
    description: 'Regular open-source author or contributor ready for non-trivial refactors',
  },
];

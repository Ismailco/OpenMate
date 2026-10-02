import { parseRepositoryUrl } from './repository-url';
import {
  ContributionInterest,
  DeveloperProfile,
  DeveloperSkill,
  RawProfileInput,
} from './types';
import { RawProfileInputSchema, DeveloperProfileSchema } from './schemas';

export class ProfileValidationError extends Error {
  readonly fieldErrors: Record<string, string>;

  constructor(message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = 'ProfileValidationError';
    this.fieldErrors = fieldErrors;
  }
}

/**
 * Deterministically parses, validates, and normalizes raw profile form input
 * into a canonical DeveloperProfile ready for downstream repository analysis.
 */
export function normalizeProfile(raw: RawProfileInput): DeveloperProfile {
  const result = RawProfileInputSchema.safeParse(raw);

  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join('.');
      if (!fieldErrors[path]) {
        fieldErrors[path] = issue.message;
      }
    }
    throw new ProfileValidationError(
      'Profile validation failed. Please check the provided fields.',
      fieldErrors
    );
  }

  const validData = result.data;
  const repoResult = parseRepositoryUrl(validData.repositoryUrl);
  if (!repoResult.success) {
    throw new ProfileValidationError('Invalid repository URL.', {
      repositoryUrl: repoResult.error,
    });
  }

  // Deduplicate and trim skills while preserving user-entered casing of the first instance
  const seenSkillNames = new Set<string>();
  const normalizedSkills: DeveloperSkill[] = [];

  for (const skill of validData.skills) {
    const trimmed = skill.name.trim();
    const key = trimmed.toLowerCase();
    if (!seenSkillNames.has(key)) {
      seenSkillNames.add(key);
      normalizedSkills.push({
        name: trimmed,
        level: skill.level,
      });
    }
  }

  // Deduplicate and filter interests
  const uniqueInterests = Array.from(
    new Set<ContributionInterest>(validData.interests)
  );

  const profile: DeveloperProfile = {
    repository: repoResult.data,
    skills: normalizedSkills,
    interests: uniqueInterests,
    availableHours: validData.availableHours,
    contributionExperience: validData.contributionExperience,
  };

  // Re-verify canonical schema invariant
  return DeveloperProfileSchema.parse(profile);
}

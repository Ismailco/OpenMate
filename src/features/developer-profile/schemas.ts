import { z } from 'zod';
import { parseRepositoryUrl } from './repository-url';
import { VALIDATION_LIMITS } from './constants';
import {
  SkillLevel,
  ContributionInterest,
  ContributionExperience,
} from './types';

export const SkillLevelSchema = z.enum([
  'beginner',
  'intermediate',
  'advanced',
] as const satisfies readonly [SkillLevel, ...SkillLevel[]]);

export const ContributionInterestSchema = z.enum([
  'frontend',
  'backend',
  'full-stack',
  'documentation',
  'testing',
  'developer-tools',
  'performance',
  'accessibility',
  'devops',
] as const satisfies readonly [ContributionInterest, ...ContributionInterest[]]);

export const ContributionExperienceSchema = z.enum([
  'first-time',
  'some-experience',
  'experienced',
] as const satisfies readonly [ContributionExperience, ...ContributionExperience[]]);

export const DeveloperSkillSchema = z.object({
  name: z
    .string({
      error: 'Skill name is required.',
    })
    .trim()
    .min(
      VALIDATION_LIMITS.MIN_SKILL_NAME_LENGTH,
      'Skill name cannot be empty.'
    )
    .max(
      VALIDATION_LIMITS.MAX_SKILL_NAME_LENGTH,
      `Skill name must be ${VALIDATION_LIMITS.MAX_SKILL_NAME_LENGTH} characters or fewer.`
    ),
  level: SkillLevelSchema,
});

export const NormalizedRepositorySchema = z.object({
  owner: z.string().min(1),
  name: z.string().min(1),
  url: z.string().url(),
});

export const RepositoryUrlStringSchema = z
  .string({
    error: 'Repository URL is required.',
  })
  .trim()
  .min(1, 'Repository URL is required.')
  .superRefine((val, ctx) => {
    const result = parseRepositoryUrl(val);
    if (!result.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: result.error,
      });
    }
  });

/**
 * Validates the raw input form before normalization.
 */
export const RawProfileInputSchema = z.object({
  repositoryUrl: RepositoryUrlStringSchema,
  skills: z
    .array(DeveloperSkillSchema)
    .min(
      VALIDATION_LIMITS.MIN_SKILLS,
      'Please add at least one technology or skill you are comfortable with.'
    )
    .max(
      VALIDATION_LIMITS.MAX_SKILLS,
      `You can specify a maximum of ${VALIDATION_LIMITS.MAX_SKILLS} skills.`
    )
    .superRefine((skills, ctx) => {
      const seen = new Set<string>();
      for (let i = 0; i < skills.length; i++) {
        const skill = skills[i];
        if (!skill) continue;
        const normalized = skill.name.trim().toLowerCase();
        if (seen.has(normalized)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Duplicate skill "${skill.name.trim()}" detected. Each skill must be unique.`,
            path: [i, 'name'],
          });
        }
        seen.add(normalized);
      }
    }),
  interests: z
    .array(ContributionInterestSchema)
    .min(
      VALIDATION_LIMITS.MIN_INTERESTS,
      'Please select at least one contribution interest or focus area.'
    )
    .max(
      VALIDATION_LIMITS.MAX_INTERESTS,
      `You can select at most ${VALIDATION_LIMITS.MAX_INTERESTS} interests.`
    ),
  availableHours: z
    .number({
      error: 'Available hours must be a number.',
    })
    .int('Available hours must be an integer.')
    .min(
      VALIDATION_LIMITS.MIN_HOURS,
      `Available time must be at least ${VALIDATION_LIMITS.MIN_HOURS} hour.`
    )
    .max(
      VALIDATION_LIMITS.MAX_HOURS,
      `Available time cannot exceed ${VALIDATION_LIMITS.MAX_HOURS} hours.`
    ),
  contributionExperience: ContributionExperienceSchema,
});

/**
 * Validates the final normalized domain DeveloperProfile.
 */
export const DeveloperProfileSchema = z.object({
  repository: NormalizedRepositorySchema,
  skills: z
    .array(DeveloperSkillSchema)
    .min(VALIDATION_LIMITS.MIN_SKILLS)
    .max(VALIDATION_LIMITS.MAX_SKILLS),
  interests: z
    .array(ContributionInterestSchema)
    .min(VALIDATION_LIMITS.MIN_INTERESTS)
    .max(VALIDATION_LIMITS.MAX_INTERESTS),
  availableHours: z
    .number()
    .int()
    .min(VALIDATION_LIMITS.MIN_HOURS)
    .max(VALIDATION_LIMITS.MAX_HOURS),
  contributionExperience: ContributionExperienceSchema,
});

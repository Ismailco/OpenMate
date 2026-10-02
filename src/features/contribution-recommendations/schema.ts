import { z } from 'zod';
import { ContributionInterestSchema } from '../developer-profile/schemas';

export const ExperienceFitSchema = z.enum(['good', 'stretch', 'uncertain']);

export const ScopeLevelSchema = z.enum(['small', 'medium', 'large', 'unknown']);

export const LikelyFileSchema = z.object({
  path: z.string().min(1).max(300),
  reason: z.string().min(1).max(500),
});

export const ContributionRecommendationFitSchema = z.object({
  summary: z.string().min(10).max(1000),
  relevantSkills: z.array(z.string().min(1).max(100)).max(8),
  matchedInterests: z.array(ContributionInterestSchema).max(8),
  experienceFit: ExperienceFitSchema,
});

export const ContributionRecommendationScopeSchema = z.object({
  level: ScopeLevelSchema,
  reasoning: z.string().min(5).max(500),
});

export const ContributionRecommendationStartingPointSchema = z.object({
  summary: z.string().min(10).max(1000),
  steps: z.array(z.string().min(5).max(400)).max(6),
});

export const RawContributionRecommendationSchema = z.object({
  issueNumber: z.number().int().positive(),
  fit: ContributionRecommendationFitSchema,
  scope: ContributionRecommendationScopeSchema,
  likelyFiles: z.array(LikelyFileSchema).max(8).default([]),
  conceptsToUnderstand: z.array(z.string().min(2).max(150)).max(5).default([]),
  startingPoint: ContributionRecommendationStartingPointSchema,
  cautions: z.array(z.string().min(5).max(400)).max(5).default([]),
});

export const RawRecommendationsResponseSchema = z.object({
  recommendations: z
    .array(RawContributionRecommendationSchema)
    .max(3)
    .default([]),
});

export const ContributionRecommendationSchema = z.object({
  issueNumber: z.number().int().positive(),
  title: z.string().min(1).max(500),
  url: z.string().url(),
  fit: ContributionRecommendationFitSchema,
  scope: ContributionRecommendationScopeSchema,
  likelyFiles: z.array(LikelyFileSchema).max(8).default([]),
  conceptsToUnderstand: z.array(z.string().min(2).max(150)).max(5).default([]),
  startingPoint: ContributionRecommendationStartingPointSchema,
  cautions: z.array(z.string().min(5).max(400)).max(5).default([]),
});

export const ContributionRecommendationResultSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('recommended'),
    recommendations: z.array(ContributionRecommendationSchema).min(1).max(3),
    metadata: z.object({
      candidateIssuesConsidered: z.number().int().nonnegative(),
      generatedAt: z.string(),
      modelProvider: z.string(),
      modelName: z.string(),
    }),
  }),
  z.object({
    status: z.literal('no-open-issues'),
  }),
  z.object({
    status: z.literal('no-suitable-issues'),
    explanation: z.string(),
    metadata: z.object({
      candidateIssuesConsidered: z.number().int().nonnegative(),
      generatedAt: z.string(),
    }),
  }),
]);

export type RawContributionRecommendation = z.infer<
  typeof RawContributionRecommendationSchema
>;
export type RawRecommendationsResponse = z.infer<
  typeof RawRecommendationsResponseSchema
>;
export type ContributionRecommendationValid = z.infer<
  typeof ContributionRecommendationSchema
>;
export type ContributionRecommendationResultValid = z.infer<
  typeof ContributionRecommendationResultSchema
>;

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

export type RawContributionRecommendation = z.infer<
  typeof RawContributionRecommendationSchema
>;
export type RawRecommendationsResponse = z.infer<
  typeof RawRecommendationsResponseSchema
>;

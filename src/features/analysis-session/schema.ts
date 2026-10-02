import { z } from 'zod';
import { DeveloperProfileSchema } from '../developer-profile/schemas';
import { RepositoryAnalysisSchema } from '../repository-analysis/schema';
import { ContributionRecommendationResultSchema } from '../contribution-recommendations/schema';
import { ANALYSIS_SESSION_VERSION } from './constants';

export const RepositoryMetadataSchema = z.object({
  id: z.number().int().positive(),
  owner: z.string().min(1),
  name: z.string().min(1),
  fullName: z.string().min(1),
  description: z.string().nullable(),
  defaultBranch: z.string().min(1),
  primaryLanguage: z.string().nullable(),
  topics: z.array(z.string()),
  stars: z.number().int().nonnegative(),
  forks: z.number().int().nonnegative(),
  openIssuesCount: z.number().int().nonnegative(),
  isArchived: z.boolean(),
  isFork: z.boolean(),
  license: z.string().nullable(),
  htmlUrl: z.string().url(),
});

export const OpenMateAnalysisResultSchema = z.object({
  repository: RepositoryMetadataSchema,
  analysis: RepositoryAnalysisSchema,
  recommendations: ContributionRecommendationResultSchema,
});

export const AnalysisSessionSchema = z.object({
  version: z.literal(ANALYSIS_SESSION_VERSION),
  createdAt: z.string(),
  profile: DeveloperProfileSchema,
  result: OpenMateAnalysisResultSchema,
});

export type RepositoryMetadataValid = z.infer<typeof RepositoryMetadataSchema>;
export type OpenMateAnalysisResultValid = z.infer<typeof OpenMateAnalysisResultSchema>;
export type AnalysisSessionValid = z.infer<typeof AnalysisSessionSchema>;

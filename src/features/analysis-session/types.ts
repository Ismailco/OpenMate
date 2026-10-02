import { DeveloperProfile } from '../developer-profile/types';
import { RepositoryMetadata } from '../github/types';
import { RepositoryAnalysis } from '../repository-analysis/types';
import { ContributionRecommendationResult } from '../contribution-recommendations/types';
import { ANALYSIS_SESSION_VERSION } from './constants';

export interface OpenMateAnalysisResult {
  repository: RepositoryMetadata;
  analysis: RepositoryAnalysis;
  recommendations: ContributionRecommendationResult;
}

export interface AnalysisSession {
  version: typeof ANALYSIS_SESSION_VERSION;
  createdAt: string;
  profile: DeveloperProfile;
  result: OpenMateAnalysisResult;
}

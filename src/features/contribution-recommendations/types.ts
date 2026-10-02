import {
  ContributionInterest,
  DeveloperProfile,
} from '../developer-profile/types';
import { ContextIssue, RepositoryContext } from '../repository-context/types';
import { RepositoryAnalysis } from '../repository-analysis/types';

export type ExperienceFit = 'good' | 'stretch' | 'uncertain';

export type ScopeLevel = 'small' | 'medium' | 'large' | 'unknown';

export interface LikelyFile {
  path: string;
  reason: string;
}

export interface ContributionRecommendationFit {
  summary: string;
  relevantSkills: string[];
  matchedInterests: ContributionInterest[];
  experienceFit: ExperienceFit;
}

export interface ContributionRecommendationScope {
  level: ScopeLevel;
  reasoning: string;
}

export interface ContributionRecommendationStartingPoint {
  summary: string;
  steps: string[];
}

export interface ContributionRecommendation {
  issueNumber: number;
  title: string;
  url: string;
  fit: ContributionRecommendationFit;
  scope: ContributionRecommendationScope;
  likelyFiles: LikelyFile[];
  conceptsToUnderstand: string[];
  startingPoint: ContributionRecommendationStartingPoint;
  cautions: string[];
}

export type ContributionRecommendationResult =
  | {
      status: 'recommended';
      recommendations: ContributionRecommendation[];
      metadata: {
        candidateIssuesConsidered: number;
        generatedAt: string;
        modelProvider: string;
        modelName: string;
      };
    }
  | {
      status: 'no-open-issues';
    }
  | {
      status: 'no-suitable-issues';
      explanation: string;
      metadata: {
        candidateIssuesConsidered: number;
        generatedAt: string;
      };
    };

export interface RecommendationCandidateSignals {
  labels: string[];
  matchedInterests: ContributionInterest[];
  matchedSkills: string[];
  beginnerFriendly: boolean;
  deterministicScope: ScopeLevel;
  heuristicScore: number;
}

export interface RecommendationCandidate {
  issue: ContextIssue;
  signals: RecommendationCandidateSignals;
}

export interface RecommenderOptions {
  signal?: AbortSignal;
}

export interface ContributionRecommender {
  recommend(
    profile: DeveloperProfile,
    analysis: RepositoryAnalysis,
    candidates: RecommendationCandidate[],
    context: RepositoryContext,
    options?: RecommenderOptions
  ): Promise<ContributionRecommendation[]>;
}

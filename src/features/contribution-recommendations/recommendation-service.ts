import 'server-only';
import { DeveloperProfile } from '../developer-profile/types';
import { RepositoryAnalysis } from '../repository-analysis/types';
import { RepositoryContext } from '../repository-context/types';
import {
  ContributionRecommendationResult,
  ContributionRecommender,
  RecommenderOptions,
} from './types';
import { selectCandidateIssues } from './candidate-selection';
import { GemmaContributionRecommender } from './providers/gemma-recommender';

export interface RecommendationServiceDependencies {
  recommender?: ContributionRecommender;
}

export class ContributionRecommendationService {
  private readonly recommender: ContributionRecommender;

  constructor(deps?: RecommendationServiceDependencies) {
    this.recommender = deps?.recommender ?? new GemmaContributionRecommender();
  }

  async generateRecommendations(
    profile: DeveloperProfile,
    analysis: RepositoryAnalysis,
    context: RepositoryContext,
    options?: RecommenderOptions
  ): Promise<ContributionRecommendationResult> {
    // 1. Explicit check: if repository context has zero open issues, return early without AI call
    if (!context.issues || context.issues.length === 0) {
      return {
        status: 'no-open-issues',
      };
    }

    // 2. Deterministically shortlist candidate issues (max 8)
    const candidates = selectCandidateIssues(context.issues, profile, analysis);
    if (candidates.length === 0) {
      return {
        status: 'no-suitable-issues',
        explanation:
          'No open issues matched your background, skills, or available time constraints.',
        metadata: {
          candidateIssuesConsidered: context.issues.length,
          generatedAt: new Date().toISOString(),
        },
      };
    }

    // 3. Generate personalized recommendations via Gemma
    const recommendations = await this.recommender.recommend(
      profile,
      analysis,
      candidates,
      context,
      options
    );

    // 4. Return result state
    if (recommendations.length === 0) {
      return {
        status: 'no-suitable-issues',
        explanation:
          'The candidate issues in this repository could not be confidently recommended for your profile based on available evidence.',
        metadata: {
          candidateIssuesConsidered: candidates.length,
          generatedAt: new Date().toISOString(),
        },
      };
    }

    return {
      status: 'recommended',
      recommendations,
      metadata: {
        candidateIssuesConsidered: candidates.length,
        generatedAt: new Date().toISOString(),
        modelProvider: analysis.analysisMetadata.modelProvider,
        modelName: analysis.analysisMetadata.modelName,
      },
    };
  }
}

export function createContributionRecommendationService(
  deps?: RecommendationServiceDependencies
): ContributionRecommendationService {
  return new ContributionRecommendationService(deps);
}

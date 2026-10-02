import 'server-only';
import {
  DeveloperProfile,
  NormalizedRepository,
} from '../developer-profile/types';
import { IngestedRepository, RepositoryMetadata } from '../github/types';
import { ingestGitHubRepository } from '../github/ingestion/ingest-repository';
import { buildRepositoryContext } from '../repository-context/build-context';
import { RepositoryAnalysis, RepositoryAnalyzer } from './types';
import { BackboardRepositoryAnalyzer } from './providers/backboard/backboard-analyzer';
import {
  ContributionRecommendationResult,
  ContributionRecommendationService,
  createContributionRecommendationService,
} from '../contribution-recommendations';

export interface RepositoryGateway {
  ingest(identity: NormalizedRepository): Promise<IngestedRepository>;
}

export interface RepositoryAnalysisServiceDependencies {
  repositoryGateway?: RepositoryGateway;
  repositoryAnalyzer?: RepositoryAnalyzer;
  recommendationService?: ContributionRecommendationService;
}

export interface RepositoryAnalysisResult {
  repository: RepositoryMetadata;
  analysis: RepositoryAnalysis;
  recommendations?: ContributionRecommendationResult;
}

export class RepositoryAnalysisService {
  private readonly gateway: RepositoryGateway;
  private readonly analyzer: RepositoryAnalyzer;
  private readonly recommendationService: ContributionRecommendationService;

  constructor(deps?: RepositoryAnalysisServiceDependencies) {
    this.gateway = deps?.repositoryGateway ?? {
      ingest: (identity) => ingestGitHubRepository(identity),
    };
    this.analyzer = deps?.repositoryAnalyzer ?? new BackboardRepositoryAnalyzer();
    this.recommendationService =
      deps?.recommendationService ?? createContributionRecommendationService();
  }

  /**
   * Performs repository-only ingestion, context extraction, and Gemma analysis.
   */
  async analyzeRepository(
    identity: NormalizedRepository,
    options?: { signal?: AbortSignal }
  ): Promise<RepositoryAnalysisResult> {
    const ingested = await this.gateway.ingest(identity);
    const context = buildRepositoryContext(ingested);
    const analysis = await this.analyzer.analyze(context, options);

    return {
      repository: ingested.metadata,
      analysis,
    };
  }

  /**
   * Unified single-pass pipeline:
   * 1. Ingest GitHub repository ONCE
   * 2. Construct bounded RepositoryContext ONCE
   * 3. Analyze repository architecture & stack with Gemma
   * 4. Select candidate issues deterministically and personalize recommendations with Gemma
   *
   * Prevents duplicate network operations and duplicate LLM context building.
   */
  async analyzeAndRecommend(
    profile: DeveloperProfile,
    options?: { signal?: AbortSignal }
  ): Promise<RepositoryAnalysisResult> {
    const ingested = await this.gateway.ingest(profile.repository);
    const context = buildRepositoryContext(ingested);
    const analysis = await this.analyzer.analyze(context, options);
    const recommendations =
      await this.recommendationService.generateRecommendations(
        profile,
        analysis,
        context,
        options
      );

    return {
      repository: ingested.metadata,
      analysis,
      recommendations,
    };
  }
}

export function createRepositoryAnalysisService(
  deps?: RepositoryAnalysisServiceDependencies
): RepositoryAnalysisService {
  return new RepositoryAnalysisService(deps);
}

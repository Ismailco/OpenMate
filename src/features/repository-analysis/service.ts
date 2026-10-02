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
import { withSpan } from '../observability';

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
    const repoFullName = `${identity.owner}/${identity.name}`;

    return withSpan(
      {
        name: 'OpenMate repository analysis',
        op: 'openmate.analysis',
        attributes: {
          'openmate.repository.full_name': repoFullName,
        },
      },
      async (analysisSpan) => {
        const ingested = await withSpan(
          {
            name: 'GitHub repository ingestion',
            op: 'github.ingest',
            attributes: {
              'openmate.repository.full_name': repoFullName,
            },
          },
          async (ingestSpan) => {
            const res = await this.gateway.ingest(identity);
            ingestSpan.setAttributes({
              'github.tree_entry_count': res.tree?.length ?? 0,
              'github.issue_count': res.issues?.length ?? 0,
              'github.source_file_count': res.sourceFiles?.length ?? 0,
              'github.manifest_count': res.manifests?.length ?? 0,
              'github.has_readme': Boolean(res.documents?.readme),
              'github.has_contributing': Boolean(res.documents?.contributing),
              'github.tree_truncated': Boolean(res.ingestion?.truncatedTree),
              'github.issues_truncated': Boolean(res.ingestion?.truncatedIssues),
            });
            return res;
          }
        );

        const context = await withSpan(
          {
            name: 'Repository context build',
            op: 'openmate.context.build',
          },
          async (contextSpan) => {
            const ctx = buildRepositoryContext(ingested);
            contextSpan.setAttributes({
              'openmate.context.character_count': ctx.contextMetadata?.approximateCharacters ?? 0,
              'openmate.context.source_files_included': ctx.contextMetadata?.sourceFilesIncluded ?? 0,
              'openmate.context.issues_included': ctx.contextMetadata?.issuesIncluded ?? 0,
              'openmate.context.documents_truncated': (ctx.contextMetadata?.truncatedDocuments ?? 0) > 0,
              'openmate.context.files_truncated': (ctx.contextMetadata?.truncatedFiles ?? 0) > 0,
              'openmate.context.issues_truncated': (ctx.contextMetadata?.truncatedIssues ?? 0) > 0,
            });
            return ctx;
          }
        );

        analysisSpan.setAttribute(
          'openmate.context.character_count',
          context.contextMetadata?.approximateCharacters ?? 0
        );
        analysisSpan.setAttribute('openmate.repository.issue_count', context.issues?.length ?? 0);

        const analysis = await this.analyzer.analyze(context, options);

        return {
          repository: ingested.metadata,
          analysis,
        };
      }
    );
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
    const repoFullName = `${profile.repository.owner}/${profile.repository.name}`;

    return withSpan(
      {
        name: 'OpenMate repository analysis',
        op: 'openmate.analysis',
        attributes: {
          'openmate.repository.full_name': repoFullName,
          'openmate.profile.skill_count': profile.skills.length,
          'openmate.profile.interest_count': profile.interests.length,
          'openmate.profile.experience': profile.contributionExperience,
          'openmate.profile.available_hours': profile.availableHours,
        },
      },
      async (analysisSpan) => {
        const ingested = await withSpan(
          {
            name: 'GitHub repository ingestion',
            op: 'github.ingest',
            attributes: {
              'openmate.repository.full_name': repoFullName,
            },
          },
          async (ingestSpan) => {
            const res = await this.gateway.ingest(profile.repository);
            ingestSpan.setAttributes({
              'github.tree_entry_count': res.tree?.length ?? 0,
              'github.issue_count': res.issues?.length ?? 0,
              'github.source_file_count': res.sourceFiles?.length ?? 0,
              'github.manifest_count': res.manifests?.length ?? 0,
              'github.has_readme': Boolean(res.documents?.readme),
              'github.has_contributing': Boolean(res.documents?.contributing),
              'github.tree_truncated': Boolean(res.ingestion?.truncatedTree),
              'github.issues_truncated': Boolean(res.ingestion?.truncatedIssues),
            });
            return res;
          }
        );

        const context = await withSpan(
          {
            name: 'Repository context build',
            op: 'openmate.context.build',
          },
          async (contextSpan) => {
            const ctx = buildRepositoryContext(ingested);
            contextSpan.setAttributes({
              'openmate.context.character_count': ctx.contextMetadata?.approximateCharacters ?? 0,
              'openmate.context.source_files_included': ctx.contextMetadata?.sourceFilesIncluded ?? 0,
              'openmate.context.issues_included': ctx.contextMetadata?.issuesIncluded ?? 0,
              'openmate.context.documents_truncated': (ctx.contextMetadata?.truncatedDocuments ?? 0) > 0,
              'openmate.context.files_truncated': (ctx.contextMetadata?.truncatedFiles ?? 0) > 0,
              'openmate.context.issues_truncated': (ctx.contextMetadata?.truncatedIssues ?? 0) > 0,
            });
            return ctx;
          }
        );

        analysisSpan.setAttribute(
          'openmate.context.character_count',
          context.contextMetadata?.approximateCharacters ?? 0
        );
        analysisSpan.setAttribute('openmate.repository.issue_count', context.issues?.length ?? 0);

        const analysis = await this.analyzer.analyze(context, options);

        const recommendations =
          await this.recommendationService.generateRecommendations(
            profile,
            analysis,
            context,
            options
          );

        analysisSpan.setAttribute(
          'openmate.recommendation.status',
          recommendations.status
        );
        if (recommendations.status === 'recommended') {
          analysisSpan.setAttribute(
            'openmate.recommendation.result_count',
            recommendations.recommendations.length
          );
        }

        return {
          repository: ingested.metadata,
          analysis,
          recommendations,
        };
      }
    );
  }
}

export function createRepositoryAnalysisService(
  deps?: RepositoryAnalysisServiceDependencies
): RepositoryAnalysisService {
  return new RepositoryAnalysisService(deps);
}

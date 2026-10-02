import 'server-only';
import { NormalizedRepository } from '../developer-profile/types';
import { IngestedRepository, RepositoryMetadata } from '../github/types';
import { ingestGitHubRepository } from '../github/ingestion/ingest-repository';
import { buildRepositoryContext } from '../repository-context/build-context';
import { RepositoryAnalysis, RepositoryAnalyzer } from './types';
import { BackboardRepositoryAnalyzer } from './providers/backboard/backboard-analyzer';

export interface RepositoryGateway {
  ingest(identity: NormalizedRepository): Promise<IngestedRepository>;
}

export interface RepositoryAnalysisServiceDependencies {
  repositoryGateway?: RepositoryGateway;
  repositoryAnalyzer?: RepositoryAnalyzer;
}

export interface RepositoryAnalysisResult {
  repository: RepositoryMetadata;
  analysis: RepositoryAnalysis;
}

export class RepositoryAnalysisService {
  private readonly gateway: RepositoryGateway;
  private readonly analyzer: RepositoryAnalyzer;

  constructor(deps?: RepositoryAnalysisServiceDependencies) {
    this.gateway = deps?.repositoryGateway ?? {
      ingest: (identity) => ingestGitHubRepository(identity),
    };
    this.analyzer = deps?.repositoryAnalyzer ?? new BackboardRepositoryAnalyzer();
  }

  async analyzeRepository(
    identity: NormalizedRepository,
    options?: { signal?: AbortSignal }
  ): Promise<RepositoryAnalysisResult> {
    // 1. Ingest repository from GitHub
    const ingested = await this.gateway.ingest(identity);

    // 2. Build deterministic, bounded RepositoryContext
    const context = buildRepositoryContext(ingested);

    // 3. Analyze with AI (Gemma via Backboard)
    const analysis = await this.analyzer.analyze(context, options);

    // 4. Return safe result
    return {
      repository: ingested.metadata,
      analysis,
    };
  }
}

export function createRepositoryAnalysisService(
  deps?: RepositoryAnalysisServiceDependencies
): RepositoryAnalysisService {
  return new RepositoryAnalysisService(deps);
}

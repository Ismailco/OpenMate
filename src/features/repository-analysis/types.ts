import { RepositoryContext } from '../repository-context/types';

export type TechnologyCategory =
  | 'language'
  | 'framework'
  | 'library'
  | 'database'
  | 'tooling'
  | 'infrastructure'
  | 'other';

export type FilePriority = 'high' | 'medium' | 'low';

export type RepositoryMaturity = 'early-stage' | 'established' | 'unknown';

export interface RepositoryTechnology {
  name: string;
  category: TechnologyCategory;
  evidence: string[];
}

export interface ArchitectureComponent {
  name: string;
  description: string;
  relevantPaths: string[];
}

export interface FileToUnderstand {
  path: string;
  reason: string;
  priority: FilePriority;
}

export interface LocalSetupGuide {
  prerequisites: string[];
  steps: string[];
  caveats: string[];
}

export interface ProjectGlossaryTerm {
  term: string;
  explanation: string;
}

export interface ContributionNotes {
  contributionProcess: string | null;
  testingExpectations: string[];
  styleExpectations: string[];
  importantWarnings: string[];
}

export interface RepositoryAnalysis {
  repositorySummary: {
    purpose: string;
    audience: string | null;
    maturity: RepositoryMaturity | null;
  };

  technologies: RepositoryTechnology[];

  architecture: {
    overview: string;
    components: ArchitectureComponent[];
    dataFlow: string | null;
  };

  filesToUnderstand: FileToUnderstand[];

  localSetup: LocalSetupGuide;

  glossary: ProjectGlossaryTerm[];

  contributionNotes: ContributionNotes;

  analysisMetadata: {
    modelProvider: string;
    modelName: string;
    analyzedAt: string;
  };
}

export interface RepositoryAnalysisOptions {
  signal?: AbortSignal;
}

export interface RepositoryAnalyzer {
  analyze(
    context: RepositoryContext,
    options?: RepositoryAnalysisOptions
  ): Promise<RepositoryAnalysis>;
}

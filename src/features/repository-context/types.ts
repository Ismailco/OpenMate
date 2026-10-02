export type UntrustedContentTrust = 'untrusted-repository-content';

export type ContextDocumentKind = 'readme' | 'contributing' | 'manifest' | 'source';

export interface ContextDocument {
  path: string;
  content: string;
  originalBytes: number;
  includedCharacters: number;
  truncated: boolean;
  kind: ContextDocumentKind;
  trust: UntrustedContentTrust;
}

export interface ManifestSummary {
  path: string;
  kind: string;
  packageName?: string;
  scripts?: string[];
  workspaces?: string[];
  topDependencies?: string[];
}

export interface ContextFile extends ContextDocument {
  manifestMeta?: ManifestSummary;
}

export interface ContextIssue {
  number: number;
  title: string;
  body: string;
  labels: string[];
  htmlUrl: string;
  commentsCount: number;
  truncated: boolean;
  isGoodFirstIssue: boolean;
  isHelpWanted: boolean;
  trust: UntrustedContentTrust;
}

export interface ProjectStructure {
  treeSummary: string;
  topDirectories: string[];
  entrypointFiles: string[];
  totalFilesObserved: number;
  truncated: boolean;
}

export interface RepositoryContext {
  repository: {
    owner: string;
    name: string;
    fullName: string;
    description: string | null;
    defaultBranch: string;
    primaryLanguage: string | null;
    topics: string[];
    license: string | null;
    stars: number;
    forks: number;
  };

  documentation: {
    readme?: ContextDocument;
    contributing?: ContextDocument;
  };

  projectStructure: ProjectStructure;

  manifests: ContextFile[];

  sourceFiles: ContextFile[];

  issues: ContextIssue[];

  contextMetadata: {
    generatedAt: string;
    sourceFilesIncluded: number;
    issuesIncluded: number;
    truncatedDocuments: number;
    truncatedFiles: number;
    truncatedIssues: number;
    approximateCharacters: number;
  };

  trust: UntrustedContentTrust;
}

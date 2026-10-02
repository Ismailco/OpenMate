import { NormalizedRepository } from '@/features/developer-profile/types';

export interface RepositoryMetadata {
  id: number;
  owner: string;
  name: string;
  fullName: string;
  description: string | null;
  defaultBranch: string;
  primaryLanguage: string | null;
  topics: string[];
  stars: number;
  forks: number;
  openIssuesCount: number;
  isArchived: boolean;
  isFork: boolean;
  license: string | null;
  htmlUrl: string;
}

export type DocumentSource = 'readme' | 'contributing' | 'manifest' | 'source';

export interface RepositoryDocument {
  path: string;
  content: string;
  size: number;
  source: DocumentSource;
}

export interface RepositoryTreeEntry {
  path: string;
  type: 'blob' | 'tree';
  size?: number;
}

export interface RepositoryIssue {
  number: number;
  title: string;
  body: string | null;
  htmlUrl: string;
  labels: string[];
  state: string;
  createdAt: string;
  updatedAt: string;
  commentsCount: number;
}

export interface IngestedRepository {
  metadata: RepositoryMetadata;
  documents: {
    readme?: RepositoryDocument;
    contributing?: RepositoryDocument;
  };
  tree: RepositoryTreeEntry[];
  manifests: RepositoryDocument[];
  sourceFiles: RepositoryDocument[];
  issues: RepositoryIssue[];
  ingestion: {
    fetchedAt: string;
    truncatedTree: boolean;
    truncatedIssues: boolean;
    skippedFiles: number;
  };
}

export interface GitHubRateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: Date;
  used: number;
}

export interface GitHubRepositoryGateway {
  getRepository(repository: NormalizedRepository): Promise<IngestedRepository>;
}

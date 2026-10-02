import 'server-only';

import { githubRequest } from './github-request';
import {
  GitHubRepositoryResponseSchema,
  mapRepositoryMetadata,
} from '../schemas/repository';
import {
  decodeGitHubContent,
  GitHubContentResponseSchema,
} from '../schemas/content';
import { GitHubTreeResponseSchema, mapTreeEntries } from '../schemas/tree';
import { GitHubIssuesResponseSchema, mapRepositoryIssues } from '../schemas/issue';
import {
  DocumentSource,
  RepositoryDocument,
  RepositoryIssue,
  RepositoryMetadata,
  RepositoryTreeEntry,
} from '../types';
import { GITHUB_LIMITS } from '../ingestion/limits';
import {
  InvalidGitHubResponseError,
  RepositoryNotFoundError,
} from '../errors';

const OWNER_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
const REPO_REGEX = /^[a-zA-Z0-9_.-]+$/;

/**
 * Validates repository owner and name coordinates against GitHub naming specifications.
 */
export function assertValidRepositoryCoordinates(owner: string, repo: string): void {
  if (
    !owner ||
    typeof owner !== 'string' ||
    owner.length > 39 ||
    !OWNER_REGEX.test(owner)
  ) {
    throw new Error(`Invalid repository owner name: "${owner}".`);
  }

  if (
    !repo ||
    typeof repo !== 'string' ||
    repo.length > 100 ||
    repo === '.' ||
    repo === '..' ||
    !REPO_REGEX.test(repo)
  ) {
    throw new Error(`Invalid repository name: "${repo}".`);
  }
}

/**
 * Validates that an internal file path does not contain path traversal sequences.
 */
export function assertValidFilePath(filePath: string): void {
  if (
    !filePath ||
    typeof filePath !== 'string' ||
    filePath.includes('..') ||
    filePath.startsWith('/') ||
    filePath.startsWith('\\')
  ) {
    throw new Error(`Invalid file path "${filePath}". Path traversal is not permitted.`);
  }
}

export class GitHubClient {
  /**
   * Fetches and validates public repository metadata.
   */
  async getRepositoryMetadata(
    owner: string,
    repo: string
  ): Promise<RepositoryMetadata> {
    assertValidRepositoryCoordinates(owner, repo);

    const res = await githubRequest(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, {
      owner,
      repo,
    });

    const parsed = GitHubRepositoryResponseSchema.safeParse(res.data);
    if (!parsed.success) {
      throw new InvalidGitHubResponseError(
        `Failed to parse GitHub repository metadata for ${owner}/${repo}.`,
        parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
      );
    }

    return mapRepositoryMetadata(parsed.data);
  }

  /**
   * Fetches the default README document if one exists.
   * Returns null if no README is found (non-fatal).
   */
  async getReadme(
    owner: string,
    repo: string
  ): Promise<RepositoryDocument | null> {
    assertValidRepositoryCoordinates(owner, repo);

    try {
      const res = await githubRequest(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`,
        { owner, repo }
      );

      const parsed = GitHubContentResponseSchema.safeParse(res.data);
      if (!parsed.success) {
        return null;
      }

      if (parsed.data.size > GITHUB_LIMITS.MAX_README_BYTES) {
        // Enforce content length limit
        const doc = decodeGitHubContent(parsed.data, 'readme');
        return {
          ...doc,
          content: doc.content.slice(0, GITHUB_LIMITS.MAX_README_BYTES),
        };
      }

      return decodeGitHubContent(parsed.data, 'readme');
    } catch (err) {
      if (err instanceof RepositoryNotFoundError) {
        return null;
      }
      throw err;
    }
  }

  /**
   * Searches for a CONTRIBUTING guide across standard deterministic locations:
   * 1. CONTRIBUTING.md
   * 2. .github/CONTRIBUTING.md
   * 3. docs/CONTRIBUTING.md
   */
  async getContributing(
    owner: string,
    repo: string
  ): Promise<RepositoryDocument | null> {
    assertValidRepositoryCoordinates(owner, repo);

    const candidatePaths = [
      'CONTRIBUTING.md',
      '.github/CONTRIBUTING.md',
      'docs/CONTRIBUTING.md',
    ];

    for (const path of candidatePaths) {
      try {
        const doc = await this.getFileContent(
          owner,
          repo,
          path,
          'contributing',
          GITHUB_LIMITS.MAX_CONTRIBUTING_BYTES
        );
        if (doc) {
          return doc;
        }
      } catch {
        // Try next candidate
      }
    }

    return null;
  }

  /**
   * Fetches the repository Git tree recursively.
   */
  async getRepositoryTree(
    owner: string,
    repo: string,
    defaultBranch: string
  ): Promise<{ entries: RepositoryTreeEntry[]; isTruncated: boolean }> {
    assertValidRepositoryCoordinates(owner, repo);

    try {
      const res = await githubRequest(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(
          defaultBranch
        )}?recursive=1`,
        { owner, repo }
      );

      const parsed = GitHubTreeResponseSchema.safeParse(res.data);
      if (!parsed.success) {
        throw new InvalidGitHubResponseError(
          `Failed to parse GitHub tree response for ${owner}/${repo}.`,
          parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
        );
      }

      return mapTreeEntries(parsed.data, GITHUB_LIMITS.MAX_TREE_ENTRIES);
    } catch (err) {
      if (err instanceof RepositoryNotFoundError) {
        // Fallback: return empty tree if git tree endpoint is 404 (e.g. empty repository)
        return { entries: [], isTruncated: false };
      }
      throw err;
    }
  }

  /**
   * Fetches content of a specific file by path with defensive bounds.
   */
  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    source: DocumentSource,
    maxBytes: number = GITHUB_LIMITS.MAX_INDIVIDUAL_FILE_BYTES
  ): Promise<RepositoryDocument | null> {
    assertValidRepositoryCoordinates(owner, repo);
    assertValidFilePath(path);

    try {
      const res = await githubRequest(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeURI(path)}`,
        { owner, repo }
      );

      const parsed = GitHubContentResponseSchema.safeParse(res.data);
      if (!parsed.success) {
        return null;
      }

      if (parsed.data.type !== 'file') {
        return null;
      }

      const doc = decodeGitHubContent(parsed.data, source);
      if (doc.size > maxBytes || doc.content.length > maxBytes) {
        return {
          ...doc,
          content: doc.content.slice(0, maxBytes),
        };
      }

      return doc;
    } catch (err) {
      if (err instanceof RepositoryNotFoundError) {
        return null;
      }
      throw err;
    }
  }

  /**
   * Fetches open issues, automatically filtering out pull requests.
   */
  async getOpenIssues(
    owner: string,
    repo: string,
    limit: number = GITHUB_LIMITS.MAX_ISSUES_FETCHED
  ): Promise<{ issues: RepositoryIssue[]; isTruncated: boolean }> {
    assertValidRepositoryCoordinates(owner, repo);

    const res = await githubRequest(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?state=open&per_page=100`,
      { owner, repo }
    );

    const parsed = GitHubIssuesResponseSchema.safeParse(res.data);
    if (!parsed.success) {
      throw new InvalidGitHubResponseError(
        `Failed to parse GitHub issues response for ${owner}/${repo}.`,
        parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
      );
    }

    return mapRepositoryIssues(parsed.data, limit);
  }
}

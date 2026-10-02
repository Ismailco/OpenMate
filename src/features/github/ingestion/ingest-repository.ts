import 'server-only';

import { NormalizedRepository } from '@/features/developer-profile/types';
import { GitHubClient } from '../client/github-client';
import {
  IngestedRepository,
  RepositoryDocument,
} from '../types';
import { selectCandidateFiles } from './file-selection';
import { GITHUB_LIMITS } from './limits';

/**
 * Concurrently maps items with a fixed maximum pool size.
 */
async function asyncPool<T, R>(
  poolLimit: number,
  items: T[],
  iteratorFn: (item: T) => Promise<R>
): Promise<R[]> {
  const ret: R[] = [];
  const executing: Array<Promise<void>> = [];

  for (const item of items) {
    const p = Promise.resolve().then(() => iteratorFn(item));
    ret.push(null as unknown as R); // placeholder
    const index = ret.length - 1;

    const wrappedPromise: Promise<void> = p.then((res) => {
      ret[index] = res;
      executing.splice(executing.indexOf(wrappedPromise), 1);
    });

    executing.push(wrappedPromise);
    if (executing.length >= poolLimit) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  return ret;
}

/**
 * Ingests a public GitHub repository securely, verifying accessibility and
 * extracting structured metadata, documents, manifests, source samples, and open issues.
 */
export async function ingestGitHubRepository(
  repository: NormalizedRepository,
  client = new GitHubClient()
): Promise<IngestedRepository> {
  const { owner, name: repo } = repository;

  // Step 1: Ingest and verify repository existence
  const metadata = await client.getRepositoryMetadata(owner, repo);

  // Step 2: Fetch primary documents, issues, and tree concurrently
  const [readmeDoc, contributingDoc, treeResult, issuesResult] = await Promise.all([
    client.getReadme(owner, repo),
    client.getContributing(owner, repo),
    client.getRepositoryTree(owner, repo, metadata.defaultBranch),
    client.getOpenIssues(owner, repo, GITHUB_LIMITS.MAX_ISSUES_FETCHED),
  ]);

  // Step 3: Select candidates deterministically
  const candidates = selectCandidateFiles(treeResult.entries);

  // Step 4: Fetch manifests using bounded concurrency
  const fetchedManifests = await asyncPool(
    GITHUB_LIMITS.CONCURRENCY_LIMIT,
    candidates.manifestPaths,
    async (path) => {
      return client.getFileContent(
        owner,
        repo,
        path,
        'manifest',
        GITHUB_LIMITS.MAX_INDIVIDUAL_FILE_BYTES
      );
    }
  );
  const manifests = fetchedManifests.filter(
    (m): m is RepositoryDocument => m !== null
  );

  // Step 5: Fetch candidate source files respecting cumulative byte limit
  const fetchedSources = await asyncPool(
    GITHUB_LIMITS.CONCURRENCY_LIMIT,
    candidates.sourceFilePaths,
    async (path) => {
      return client.getFileContent(
        owner,
        repo,
        path,
        'source',
        GITHUB_LIMITS.MAX_INDIVIDUAL_FILE_BYTES
      );
    }
  );

  let cumulativeBytes = 0;
  const sourceFiles: RepositoryDocument[] = [];

  for (const src of fetchedSources) {
    if (!src) continue;
    if (cumulativeBytes + src.size > GITHUB_LIMITS.MAX_CUMULATIVE_SOURCE_BYTES) {
      break;
    }
    cumulativeBytes += src.size;
    sourceFiles.push(src);
  }

  return {
    metadata,
    documents: {
      readme: readmeDoc ?? undefined,
      contributing: contributingDoc ?? undefined,
    },
    tree: treeResult.entries,
    manifests,
    sourceFiles,
    issues: issuesResult.issues,
    ingestion: {
      fetchedAt: new Date().toISOString(),
      truncatedTree: treeResult.isTruncated,
      truncatedIssues: issuesResult.isTruncated,
      skippedFiles: candidates.skippedFilesCount,
    },
  };
}

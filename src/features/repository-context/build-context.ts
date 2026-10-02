import { IngestedRepository } from '../github/types';
import { CONTEXT_BUDGETS } from './budgets';
import { normalizeText } from './normalize-text';
import { truncateDocument } from './truncate';
import { summarizeRepositoryTree } from './tree-summary';
import { normalizeManifests } from './manifest-context';
import { prioritizeSourceFiles } from './file-priority';
import { normalizeIssues } from './issue-context';
import { ContextDocument, RepositoryContext } from './types';

export interface BuildContextOptions {
  now?: () => Date;
}

/**
 * Builds a deterministic, bounded, AI-ready RepositoryContext from an IngestedRepository.
 * Pure transformation layer: performs NO network calls, NO file system access, and NO AI calls.
 */
export function buildRepositoryContext(
  ingested: IngestedRepository,
  options?: BuildContextOptions
): RepositoryContext {
  const { metadata, documents, tree, manifests: rawManifests, sourceFiles: rawSources, issues: rawIssues } =
    ingested;

  // 1. Process README
  let readmeDoc: ContextDocument | undefined;
  if (documents.readme) {
    const normalized = normalizeText(documents.readme.content);
    const { content, truncated } = truncateDocument(
      normalized,
      CONTEXT_BUDGETS.README_MAX_CHARACTERS
    );
    readmeDoc = {
      path: documents.readme.path,
      content,
      originalBytes: documents.readme.size,
      includedCharacters: content.length,
      truncated,
      kind: 'readme',
      trust: 'untrusted-repository-content',
    };
  }

  // 2. Process CONTRIBUTING
  let contributingDoc: ContextDocument | undefined;
  if (documents.contributing) {
    const normalized = normalizeText(documents.contributing.content);
    const { content, truncated } = truncateDocument(
      normalized,
      CONTEXT_BUDGETS.CONTRIBUTING_MAX_CHARACTERS
    );
    contributingDoc = {
      path: documents.contributing.path,
      content,
      originalBytes: documents.contributing.size,
      includedCharacters: content.length,
      truncated,
      kind: 'contributing',
      trust: 'untrusted-repository-content',
    };
  }

  // 3. Summarize project tree structure
  const projectStructure = summarizeRepositoryTree(tree);

  // 4. Normalize manifests
  const manifests = normalizeManifests(rawManifests);

  // 5. Prioritize and truncate source files
  const sourceFiles = prioritizeSourceFiles(rawSources);

  // 6. Normalize issues
  const issues = normalizeIssues(rawIssues);

  // 7. Calculate context metrics
  let truncatedDocuments = 0;
  if (readmeDoc?.truncated) truncatedDocuments++;
  if (contributingDoc?.truncated) truncatedDocuments++;

  const truncatedFiles =
    manifests.filter((m) => m.truncated).length +
    sourceFiles.filter((s) => s.truncated).length;

  const truncatedIssues = issues.filter((i) => i.truncated).length;

  let approximateCharacters =
    (metadata.description?.length ?? 0) +
    metadata.fullName.length +
    (readmeDoc?.includedCharacters ?? 0) +
    (contributingDoc?.includedCharacters ?? 0) +
    projectStructure.treeSummary.length;

  for (const m of manifests) approximateCharacters += m.includedCharacters;
  for (const s of sourceFiles) approximateCharacters += s.includedCharacters;
  for (const i of issues) approximateCharacters += i.title.length + i.body.length;

  const generatedAt = (options?.now ? options.now() : new Date()).toISOString();

  return {
    repository: {
      owner: metadata.owner,
      name: metadata.name,
      fullName: metadata.fullName,
      description: metadata.description,
      defaultBranch: metadata.defaultBranch,
      primaryLanguage: metadata.primaryLanguage,
      topics: metadata.topics,
      license: metadata.license,
      stars: metadata.stars,
      forks: metadata.forks,
    },
    documentation: {
      readme: readmeDoc,
      contributing: contributingDoc,
    },
    projectStructure,
    manifests,
    sourceFiles,
    issues,
    contextMetadata: {
      generatedAt,
      sourceFilesIncluded: sourceFiles.length,
      issuesIncluded: issues.length,
      truncatedDocuments,
      truncatedFiles,
      truncatedIssues,
      approximateCharacters,
    },
    trust: 'untrusted-repository-content',
  };
}

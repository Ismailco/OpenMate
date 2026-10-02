import path from 'path';
import { RepositoryDocument } from '../github/types';
import { getManifestKind } from '../github/ingestion/manifests';
import { CONTEXT_BUDGETS } from './budgets';
import { normalizeText } from './normalize-text';
import { truncateDocument } from './truncate';
import { ContextFile, ManifestSummary } from './types';

function extractPackageJsonMetadata(rawContent: string, filePath: string): ManifestSummary | undefined {
  if (path.basename(filePath) !== 'package.json') {
    return undefined;
  }

  try {
    const parsed = JSON.parse(rawContent) as {
      name?: unknown;
      scripts?: unknown;
      workspaces?: unknown;
      dependencies?: unknown;
      devDependencies?: unknown;
    };

    if (typeof parsed !== 'object' || parsed === null) {
      return undefined;
    }

    const packageName = typeof parsed.name === 'string' ? parsed.name : undefined;

    const scripts =
      typeof parsed.scripts === 'object' && parsed.scripts !== null
        ? Object.keys(parsed.scripts).slice(0, 10)
        : undefined;

    let workspaces: string[] | undefined;
    if (Array.isArray(parsed.workspaces)) {
      workspaces = parsed.workspaces.filter((w): w is string => typeof w === 'string').slice(0, 8);
    } else if (
      typeof parsed.workspaces === 'object' &&
      parsed.workspaces !== null &&
      'packages' in parsed.workspaces &&
      Array.isArray((parsed.workspaces as { packages: unknown }).packages)
    ) {
      workspaces = (parsed.workspaces as { packages: unknown[] }).packages
        .filter((w): w is string => typeof w === 'string')
        .slice(0, 8);
    }

    const deps =
      typeof parsed.dependencies === 'object' && parsed.dependencies !== null
        ? Object.keys(parsed.dependencies)
        : [];
    const devDeps =
      typeof parsed.devDependencies === 'object' && parsed.devDependencies !== null
        ? Object.keys(parsed.devDependencies)
        : [];

    const topDependencies = Array.from(new Set([...deps, ...devDeps])).slice(0, 15);

    return {
      path: filePath,
      kind: 'node',
      packageName,
      scripts,
      workspaces,
      topDependencies,
    };
  } catch {
    // Malformed JSON is handled gracefully without crashing
    return {
      path: filePath,
      kind: 'node',
    };
  }
}

export function normalizeManifests(
  rawManifests: RepositoryDocument[]
): ContextFile[] {
  // Sort manifests deterministically: root manifests first, then alphabetical
  const sorted = [...rawManifests].sort((a, b) => {
    const depthA = a.path.split('/').length;
    const depthB = b.path.split('/').length;
    if (depthA !== depthB) return depthA - depthB;
    return a.path.localeCompare(b.path);
  });

  const results: ContextFile[] = [];
  let cumulativeChars = 0;

  for (const raw of sorted) {
    if (cumulativeChars >= CONTEXT_BUDGETS.MANIFESTS_TOTAL_CHARACTERS) {
      break;
    }

    const normalized = normalizeText(raw.content);
    const manifestMeta = extractPackageJsonMetadata(raw.content, raw.path) ?? {
      path: raw.path,
      kind: getManifestKind(raw.path) ?? 'other',
    };

    const remainingBudget = Math.min(
      CONTEXT_BUDGETS.INDIVIDUAL_MANIFEST_CHARACTERS,
      CONTEXT_BUDGETS.MANIFESTS_TOTAL_CHARACTERS - cumulativeChars
    );

    const { content, truncated } = truncateDocument(normalized, remainingBudget);

    cumulativeChars += content.length;
    results.push({
      path: raw.path,
      content,
      originalBytes: raw.size,
      includedCharacters: content.length,
      truncated,
      kind: 'manifest',
      manifestMeta,
      trust: 'untrusted-repository-content',
    });
  }

  return results;
}

import path from 'path';
import { RepositoryTreeEntry } from '../types';
import { isEligibleSourceFile } from './content-filter';
import { getManifestKind, isLockfile } from './manifests';
import { GITHUB_LIMITS } from './limits';

// Standard documentation files handled separately
const DOC_FILE_NAMES = new Set([
  'readme.md',
  'readme',
  'contributing.md',
  'contributing',
  'code_of_conduct.md',
  'security.md',
  'license',
  'license.md',
  'license.txt',
]);

const ENTRYPOINT_PATTERNS = [
  /^src\/(index|main|app)\.[a-zA-Z0-9]+$/i,
  /^app\/(page|layout)\.[a-zA-Z0-9]+$/i,
  /^(index|main)\.[a-zA-Z0-9]+$/i,
  /^src\/[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/i,
  /^lib\/(index|main)\.[a-zA-Z0-9]+$/i,
];

function scoreSourceFile(filePath: string): number {
  let score = 0;
  const normalized = filePath.replace(/\\/g, '/');
  const depth = normalized.split('/').length;

  // Penalize deeper nesting
  score -= depth * 10;

  // Reward known entrypoint naming patterns
  for (const pattern of ENTRYPOINT_PATTERNS) {
    if (pattern.test(normalized)) {
      score += 50;
      break;
    }
  }

  // Common source extensions
  const ext = path.extname(normalized).toLowerCase();
  if (['.ts', '.tsx', '.js', '.jsx', '.py', '.rs', '.go', '.rb', '.java'].includes(ext)) {
    score += 15;
  }

  return score;
}

export interface SelectedFileCandidates {
  manifestPaths: string[];
  sourceFilePaths: string[];
  skippedFilesCount: number;
}

/**
 * Deterministically selects manifests and representative source files from repository tree.
 */
export function selectCandidateFiles(
  treeEntries: RepositoryTreeEntry[]
): SelectedFileCandidates {
  const blobEntries = treeEntries.filter((e) => e.type === 'blob');

  const manifestCandidates: Array<{ path: string; depth: number }> = [];
  const sourceCandidates: Array<{ path: string; score: number }> = [];
  let skippedFilesCount = 0;

  for (const entry of blobEntries) {
    const filePath = entry.path;
    const baseName = path.basename(filePath).toLowerCase();

    // Skip root docs and hidden configuration files
    if (DOC_FILE_NAMES.has(baseName) || baseName.startsWith('.')) {
      continue;
    }

    // Skip lockfiles
    if (isLockfile(filePath)) {
      skippedFilesCount++;
      continue;
    }

    // Check if manifest
    if (getManifestKind(filePath)) {
      const depth = filePath.replace(/\\/g, '/').split('/').length;
      manifestCandidates.push({ path: filePath, depth });
      continue;
    }

    // Check if eligible source file
    if (isEligibleSourceFile(filePath)) {
      const score = scoreSourceFile(filePath);
      sourceCandidates.push({ path: filePath, score });
    } else {
      skippedFilesCount++;
    }
  }

  // Sort manifests: shallowest first, then alphabetical
  manifestCandidates.sort((a, b) => {
    if (a.depth !== b.depth) return a.depth - b.depth;
    return a.path.localeCompare(b.path);
  });

  // Sort source files: highest score first, then alphabetical for deterministic ordering
  sourceCandidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.path.localeCompare(b.path);
  });

  const manifestPaths = manifestCandidates
    .slice(0, 5)
    .map((item) => item.path);

  const sourceFilePaths = sourceCandidates
    .slice(0, GITHUB_LIMITS.MAX_SOURCE_FILES)
    .map((item) => item.path);

  return {
    manifestPaths,
    sourceFilePaths,
    skippedFilesCount,
  };
}

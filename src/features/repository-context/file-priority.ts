import path from 'path';
import { RepositoryDocument } from '../github/types';
import { CONTEXT_BUDGETS } from './budgets';
import { normalizeText } from './normalize-text';
import { truncateSourceCode } from './truncate';
import { ContextFile } from './types';

const ENTRYPOINT_NAMES = new Set([
  'index',
  'main',
  'app',
  'server',
  'client',
  'router',
  'config',
  'page',
  'layout',
]);

function scoreSourceFile(filePath: string): number {
  let score = 0;
  const normalized = filePath.replace(/\\/g, '/');
  const depth = normalized.split('/').length;
  const baseName = path.basename(filePath, path.extname(filePath)).toLowerCase();

  // Prefer shallower files
  score -= depth * 10;

  // Penalize test files
  if (
    normalized.includes('__tests__') ||
    normalized.includes('.test.') ||
    normalized.includes('.spec.')
  ) {
    score -= 100;
  }

  // Reward entrypoints
  if (ENTRYPOINT_NAMES.has(baseName)) {
    score += 50;
  }

  // Root or src/ direct file bonus
  if (depth <= 2) {
    score += 25;
  }

  return score;
}

export function prioritizeSourceFiles(
  rawFiles: RepositoryDocument[]
): ContextFile[] {
  // Sort files by score descending, then path ascending for determinism
  const sorted = [...rawFiles].sort((a, b) => {
    const scoreA = scoreSourceFile(a.path);
    const scoreB = scoreSourceFile(b.path);
    if (scoreA !== scoreB) return scoreB - scoreA;
    return a.path.localeCompare(b.path);
  });

  const results: ContextFile[] = [];
  let cumulativeChars = 0;

  for (const raw of sorted) {
    if (cumulativeChars >= CONTEXT_BUDGETS.SOURCE_FILES_TOTAL_CHARACTERS) {
      break;
    }

    const normalized = normalizeText(raw.content);
    const remainingBudget = Math.min(
      CONTEXT_BUDGETS.INDIVIDUAL_SOURCE_FILE_CHARACTERS,
      CONTEXT_BUDGETS.SOURCE_FILES_TOTAL_CHARACTERS - cumulativeChars
    );

    const { content, truncated } = truncateSourceCode(normalized, remainingBudget);

    cumulativeChars += content.length;
    results.push({
      path: raw.path,
      content,
      originalBytes: raw.size,
      includedCharacters: content.length,
      truncated,
      kind: 'source',
      trust: 'untrusted-repository-content',
    });
  }

  return results;
}

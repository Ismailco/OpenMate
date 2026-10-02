import { TRUNCATION_MARKER } from './budgets';

export interface TruncationResult {
  content: string;
  truncated: boolean;
}

/**
 * Truncates document text (README, CONTRIBUTING, manifest) retaining the head.
 */
export function truncateDocument(
  text: string,
  maxCharacters: number
): TruncationResult {
  if (text.length <= maxCharacters) {
    return { content: text, truncated: false };
  }

  const available = Math.max(0, maxCharacters - TRUNCATION_MARKER.length);
  const truncatedHead = text.slice(0, available);

  return {
    content: `${truncatedHead}${TRUNCATION_MARKER}`,
    truncated: true,
  };
}

/**
 * Truncates source code preserving both the beginning (imports/types) and ending (exports/main logic).
 */
export function truncateSourceCode(
  code: string,
  maxCharacters: number
): TruncationResult {
  if (code.length <= maxCharacters) {
    return { content: code, truncated: false };
  }

  const available = Math.max(0, maxCharacters - TRUNCATION_MARKER.length);
  const headBudget = Math.floor(available * 0.65);
  const tailBudget = Math.floor(available * 0.35);

  let headSlice = code.slice(0, headBudget);
  let tailSlice = code.slice(code.length - tailBudget);

  // Align to nearest newline if available within a 100 character window
  const lastHeadNewline = headSlice.lastIndexOf('\n');
  if (lastHeadNewline > headBudget - 100) {
    headSlice = headSlice.slice(0, lastHeadNewline);
  }

  const firstTailNewline = tailSlice.indexOf('\n');
  if (firstTailNewline !== -1 && firstTailNewline < 100) {
    tailSlice = tailSlice.slice(firstTailNewline + 1);
  }

  return {
    content: `${headSlice}${TRUNCATION_MARKER}${tailSlice}`,
    truncated: true,
  };
}

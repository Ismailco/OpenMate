/**
 * Strips non-printable control characters while preserving \t (tab) and \n (newline).
 * Matches characters in range 0x00-0x08, 0x0B-0x0C, 0x0E-0x1F, and 0x7F (DEL).
 */
const CONTROL_CHARACTERS_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/**
 * Normalizes textual content for AI context ingestion.
 * - Standardizes CRLF to LF
 * - Strips hazardous control characters while preserving tabs and newlines
 * - Preserves leading indentation (spaces and tabs) for source code formatting
 * - Strips trailing whitespace per line
 * - Collapses runs of more than 2 consecutive blank lines down to 2
 * - Preserves full UTF-8 Unicode characters
 */
export function normalizeText(rawText: string): string {
  if (!rawText) {
    return '';
  }

  // 1. CRLF -> LF
  let text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 2. Remove harmful control characters
  text = text.replace(CONTROL_CHARACTERS_REGEX, '');

  // 3. Process line-by-line: strip trailing whitespace while preserving leading indentation
  const lines = text.split('\n');
  const cleanedLines: string[] = [];
  let consecutiveEmptyLines = 0;

  for (const line of lines) {
    const trimmedRight = line.replace(/[ \t]+$/, '');

    if (trimmedRight.trim().length === 0) {
      consecutiveEmptyLines++;
      if (consecutiveEmptyLines <= 2) {
        cleanedLines.push('');
      }
    } else {
      consecutiveEmptyLines = 0;
      cleanedLines.push(trimmedRight);
    }
  }

  return cleanedLines.join('\n').trim();
}

import { describe, it, expect } from 'vitest';
import { truncateDocument, truncateSourceCode } from '../truncate';
import { TRUNCATION_MARKER } from '../budgets';

describe('truncate', () => {
  it('leaves documents smaller than budget unchanged', () => {
    const text = '# Small Document\n\nFits easily.';
    const result = truncateDocument(text, 100);
    expect(result.truncated).toBe(false);
    expect(result.content).toBe(text);
  });

  it('truncates large documents by appending the truncation marker', () => {
    const longText = 'A'.repeat(500);
    const result = truncateDocument(longText, 100);
    expect(result.truncated).toBe(true);
    expect(result.content).toContain(TRUNCATION_MARKER);
    expect(result.content.length).toBeLessThanOrEqual(100);
  });

  it('truncates large source code by keeping beginning imports and ending exports', () => {
    const headCode = 'import { a } from "a";\nconst x = 1;\n';
    const fillerCode = '// middle logic\n'.repeat(50);
    const tailCode = '\nexport default function main() { return x; }';
    const fullCode = `${headCode}${fillerCode}${tailCode}`;

    const result = truncateSourceCode(fullCode, 200);

    expect(result.truncated).toBe(true);
    expect(result.content).toContain('import { a }');
    expect(result.content).toContain(TRUNCATION_MARKER);
    expect(result.content).toContain('export default function main');
    expect(result.content.length).toBeLessThanOrEqual(200);
  });
});

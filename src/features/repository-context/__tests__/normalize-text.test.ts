import { describe, it, expect } from 'vitest';
import { normalizeText } from '../normalize-text';

describe('normalizeText', () => {
  it('converts CRLF to LF', () => {
    const input = 'line1\r\nline2\r\nline3';
    expect(normalizeText(input)).toBe('line1\nline2\nline3');
  });

  it('removes hazardous control characters while preserving tabs and newlines', () => {
    // 0x00 (null), 0x07 (bell), 0x1B (escape)
    const input = 'const a\x00 = 1;\t// Tab preserved\nconst b\x07 = 2;\x1b';
    expect(normalizeText(input)).toBe('const a = 1;\t// Tab preserved\nconst b = 2;');
  });

  it('preserves leading source code indentation', () => {
    const input = `function test() {\n  const x = 1;\n\t\treturn x;\n}`;
    expect(normalizeText(input)).toBe(input);
  });

  it('preserves UTF-8 Unicode characters', () => {
    const input = 'const greeting = "こんにちは, 世界! 🚀";';
    expect(normalizeText(input)).toBe(input);
  });

  it('collapses excessive blank lines down to 2', () => {
    const input = 'line1\n\n\n\n\n\nline2';
    expect(normalizeText(input)).toBe('line1\n\n\nline2');
  });

  it('strips trailing whitespace per line', () => {
    const input = 'const x = 10;    \nconst y = 20;\t\t';
    expect(normalizeText(input)).toBe('const x = 10;\nconst y = 20;');
  });

  it('handles empty or whitespace-only strings safely', () => {
    expect(normalizeText('')).toBe('');
    expect(normalizeText('   \n\t  ')).toBe('');
  });
});

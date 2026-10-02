import { describe, it, expect } from 'vitest';
import { prioritizeSourceFiles } from '../file-priority';
import { RepositoryDocument } from '../../github/types';

describe('prioritizeSourceFiles', () => {
  it('prioritizes entrypoints ahead of deeply nested utilities', () => {
    const rawFiles: RepositoryDocument[] = [
      {
        path: 'src/features/deep/nested/utils.ts',
        content: 'export const util = 1;',
        size: 25,
        source: 'source',
      },
      {
        path: 'src/index.ts',
        content: 'export * from "./app";',
        size: 22,
        source: 'source',
      },
    ];

    const results = prioritizeSourceFiles(rawFiles);
    expect(results[0]?.path).toBe('src/index.ts');
  });

  it('penalizes test files compared to production source code', () => {
    const rawFiles: RepositoryDocument[] = [
      {
        path: 'src/components/__tests__/Button.test.tsx',
        content: 'test("renders", () => {});',
        size: 27,
        source: 'source',
      },
      {
        path: 'src/components/Button.tsx',
        content: 'export const Button = () => null;',
        size: 33,
        source: 'source',
      },
    ];

    const results = prioritizeSourceFiles(rawFiles);
    expect(results[0]?.path).toBe('src/components/Button.tsx');
  });

  it('breaks ties deterministically with alphabetical sorting', () => {
    const rawFiles: RepositoryDocument[] = [
      { path: 'src/beta.ts', content: 'const b = 2;', size: 12, source: 'source' },
      { path: 'src/alpha.ts', content: 'const a = 1;', size: 12, source: 'source' },
    ];

    const results = prioritizeSourceFiles(rawFiles);
    expect(results[0]?.path).toBe('src/alpha.ts');
    expect(results[1]?.path).toBe('src/beta.ts');
  });
});

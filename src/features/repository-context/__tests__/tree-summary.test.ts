import { describe, it, expect } from 'vitest';
import { summarizeRepositoryTree } from '../tree-summary';
import { RepositoryTreeEntry } from '../../github/types';

describe('summarizeRepositoryTree', () => {
  it('summarizes a clean repository structure', () => {
    const entries: RepositoryTreeEntry[] = [
      { path: 'src/index.ts', type: 'blob' },
      { path: 'src/components/Button.tsx', type: 'blob' },
      { path: 'package.json', type: 'blob' },
    ];

    const result = summarizeRepositoryTree(entries);

    expect(result.topDirectories).toEqual(['src']);
    expect(result.entrypointFiles).toContain('src/index.ts');
    expect(result.totalFilesObserved).toBe(3);
    expect(result.treeSummary).toContain('src/');
    expect(result.treeSummary).toContain('Button.tsx');
    expect(result.truncated).toBe(false);
  });

  it('filters noise directories from the tree summary', () => {
    const entries: RepositoryTreeEntry[] = [
      { path: 'node_modules/react/index.js', type: 'blob' },
      { path: 'dist/bundle.js', type: 'blob' },
      { path: 'src/main.ts', type: 'blob' },
    ];

    const result = summarizeRepositoryTree(entries);

    expect(result.totalFilesObserved).toBe(1);
    expect(result.treeSummary).not.toContain('node_modules');
    expect(result.treeSummary).not.toContain('dist');
    expect(result.treeSummary).toContain('src/');
  });

  it('truncates trees exceeding depth limit (3)', () => {
    const entries: RepositoryTreeEntry[] = [
      { path: 'a/b/c/d/e/file.ts', type: 'blob' },
    ];

    const result = summarizeRepositoryTree(entries);
    expect(result.truncated).toBe(true);
  });

  it('produces deterministic output regardless of input ordering', () => {
    const entries: RepositoryTreeEntry[] = [
      { path: 'src/z.ts', type: 'blob' },
      { path: 'src/a.ts', type: 'blob' },
      { path: 'docs/guide.md', type: 'blob' },
    ];

    const result1 = summarizeRepositoryTree(entries);
    const result2 = summarizeRepositoryTree([...entries].reverse());

    expect(result1.treeSummary).toBe(result2.treeSummary);
    expect(result1.topDirectories).toEqual(result2.topDirectories);
  });
});

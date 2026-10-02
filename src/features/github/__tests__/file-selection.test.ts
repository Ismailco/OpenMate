import { describe, it, expect } from 'vitest';
import { selectCandidateFiles } from '../ingestion/file-selection';
import { RepositoryTreeEntry } from '../types';

describe('file-selection', () => {
  it('identifies manifests while skipping lockfiles', () => {
    const treeEntries: RepositoryTreeEntry[] = [
      { path: 'package.json', type: 'blob' },
      { path: 'package-lock.json', type: 'blob' },
      { path: 'tsconfig.json', type: 'blob' },
      { path: 'src/index.ts', type: 'blob' },
      { path: 'yarn.lock', type: 'blob' },
    ];

    const result = selectCandidateFiles(treeEntries);

    expect(result.manifestPaths).toEqual(['package.json', 'tsconfig.json']);
    expect(result.sourceFilePaths).toEqual(['src/index.ts']);
    expect(result.skippedFilesCount).toBe(2); // 2 lockfiles
  });

  it('ranks root entrypoints higher than nested files', () => {
    const treeEntries: RepositoryTreeEntry[] = [
      { path: 'src/nested/deep/module/helper.ts', type: 'blob' },
      { path: 'src/index.ts', type: 'blob' },
      { path: 'src/components/ui/button.tsx', type: 'blob' },
      { path: 'app/page.tsx', type: 'blob' },
    ];

    const result = selectCandidateFiles(treeEntries);

    // Root entrypoints (src/index.ts, app/page.tsx) should rank ahead of deeply nested files
    expect(result.sourceFilePaths[0]).toMatch(/src\/index\.ts|app\/page\.tsx/);
    expect(result.sourceFilePaths[result.sourceFilePaths.length - 1]).toBe(
      'src/nested/deep/module/helper.ts'
    );
  });

  it('enforces maximum source files limit (8)', () => {
    const treeEntries: RepositoryTreeEntry[] = Array.from({ length: 20 }, (_, i) => ({
      path: `src/file_${i.toString().padStart(2, '0')}.ts`,
      type: 'blob',
    }));

    const result = selectCandidateFiles(treeEntries);
    expect(result.sourceFilePaths.length).toBe(8);
  });

  it('orders candidate files deterministically across multiple invocations', () => {
    const treeEntries: RepositoryTreeEntry[] = [
      { path: 'src/b.ts', type: 'blob' },
      { path: 'src/a.ts', type: 'blob' },
      { path: 'src/c.ts', type: 'blob' },
      { path: 'package.json', type: 'blob' },
    ];

    const result1 = selectCandidateFiles(treeEntries);
    const result2 = selectCandidateFiles([...treeEntries].reverse());

    expect(result1.sourceFilePaths).toEqual(result2.sourceFilePaths);
    expect(result1.manifestPaths).toEqual(result2.manifestPaths);
  });
});

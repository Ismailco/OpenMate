import { describe, it, expect } from 'vitest';
import { normalizeManifests } from '../manifest-context';
import { RepositoryDocument } from '../../github/types';

describe('normalizeManifests', () => {
  it('extracts metadata from valid package.json', () => {
    const raw: RepositoryDocument[] = [
      {
        path: 'package.json',
        content: JSON.stringify({
          name: 'my-open-source-app',
          scripts: { build: 'tsc', test: 'vitest' },
          workspaces: ['packages/*'],
          dependencies: { react: '^19.0.0' },
        }),
        size: 150,
        source: 'manifest',
      },
    ];

    const results = normalizeManifests(raw);
    expect(results.length).toBe(1);
    expect(results[0]?.manifestMeta?.packageName).toBe('my-open-source-app');
    expect(results[0]?.manifestMeta?.scripts).toEqual(['build', 'test']);
    expect(results[0]?.manifestMeta?.workspaces).toEqual(['packages/*']);
    expect(results[0]?.manifestMeta?.topDependencies).toContain('react');
    expect(results[0]?.kind).toBe('manifest');
  });

  it('handles malformed package.json gracefully without crashing', () => {
    const raw: RepositoryDocument[] = [
      {
        path: 'package.json',
        content: '{ name: "invalid-json", scripts: }',
        size: 34,
        source: 'manifest',
      },
    ];

    const results = normalizeManifests(raw);
    expect(results.length).toBe(1);
    expect(results[0]?.path).toBe('package.json');
    expect(results[0]?.manifestMeta?.kind).toBe('node');
  });

  it('orders manifests deterministically: root first then alphabetical', () => {
    const raw: RepositoryDocument[] = [
      { path: 'packages/core/package.json', content: '{}', size: 2, source: 'manifest' },
      { path: 'package.json', content: '{}', size: 2, source: 'manifest' },
      { path: 'tsconfig.json', content: '{}', size: 2, source: 'manifest' },
    ];

    const results = normalizeManifests(raw);
    expect(results[0]?.path).toBe('package.json');
    expect(results[1]?.path).toBe('tsconfig.json');
    expect(results[2]?.path).toBe('packages/core/package.json');
  });
});

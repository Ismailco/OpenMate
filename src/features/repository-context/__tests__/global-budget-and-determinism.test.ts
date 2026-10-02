import { describe, it, expect } from 'vitest';
import { buildRepositoryContext } from '../build-context';
import { serializeRepositoryContext } from '../serialize-context';
import { RepositoryContextSchema } from '../schema';
import { CONTEXT_BUDGETS } from '../budgets';
import { IngestedRepository } from '../../github/types';

describe('Global budget enforcement and determinism', () => {
  const hugeRepo: IngestedRepository = {
    metadata: {
      id: 101,
      owner: 'giant-org',
      name: 'massive-repo',
      fullName: 'giant-org/massive-repo',
      description: 'A repository designed to test maximum budget stress'.repeat(10),
      defaultBranch: 'main',
      primaryLanguage: 'TypeScript',
      topics: ['massive', 'stress-test', 'budget'],
      stars: 50000,
      forks: 12000,
      openIssuesCount: 400,
      isArchived: false,
      isFork: false,
      license: 'Apache-2.0',
      htmlUrl: 'https://github.com/giant-org/massive-repo',
    },
    documents: {
      readme: {
        path: 'README.md',
        content: '# Massive Readme\n\n' + 'Readme content line.\n'.repeat(2000),
        size: 50000,
        source: 'readme',
      },
      contributing: {
        path: 'CONTRIBUTING.md',
        content: '# Contributing\n\n' + 'Contributing guideline line.\n'.repeat(1000),
        size: 30000,
        source: 'contributing',
      },
    },
    tree: Array.from({ length: 500 }, (_, i) => ({
      path: `packages/pkg-${i % 20}/src/module-${i}.ts`,
      type: 'blob' as const,
      size: 5000,
    })),
    manifests: Array.from({ length: 10 }, (_, i) => ({
      path: i === 0 ? 'package.json' : `packages/pkg-${i}/package.json`,
      content: JSON.stringify({
        name: `@giant/pkg-${i}`,
        scripts: { build: 'tsc', test: 'vitest', lint: 'eslint' },
        dependencies: { react: '^19.0.0', next: '^16.0.0' },
      }),
      size: 200,
      source: 'manifest' as const,
    })),
    sourceFiles: Array.from({ length: 8 }, (_, i) => ({
      path: `src/entry-${i}.ts`,
      content: `// Source file ${i}\n` + 'const codeLine = "logic";\n'.repeat(500),
      size: 15000,
      source: 'source' as const,
    })),
    issues: Array.from({ length: 50 }, (_, i) => ({
      number: i + 1,
      title: `Issue number ${i + 1} with a long detailed title`,
      body: `Body description for issue ${i + 1}.\n` + 'More bug report details.\n'.repeat(50),
      htmlUrl: `https://github.com/giant-org/massive-repo/issues/${i + 1}`,
      labels: i % 2 === 0 ? ['good first issue', 'bug'] : ['help wanted'],
      state: 'open',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-02',
      commentsCount: i,
    })),
    ingestion: {
      fetchedAt: '2026-01-01T00:00:00Z',
      truncatedTree: true,
      truncatedIssues: true,
      skippedFiles: 20,
    },
  };

  it('guarantees final serialized output stays strictly below the global budget ceiling', () => {
    const context = buildRepositoryContext(hugeRepo, {
      now: () => new Date('2026-01-01T00:00:00.000Z'),
    });

    const parsed = RepositoryContextSchema.safeParse(context);
    expect(parsed.success).toBe(true);

    const serialized = serializeRepositoryContext(context);
    expect(serialized.length).toBeLessThanOrEqual(
      CONTEXT_BUDGETS.TOTAL_CONTEXT_CHARACTERS
    );
  });

  it('produces 100% deterministic output across multiple invocations', () => {
    const fixedDate = new Date('2026-05-15T12:00:00.000Z');

    const context1 = buildRepositoryContext(hugeRepo, { now: () => fixedDate });
    const context2 = buildRepositoryContext(hugeRepo, { now: () => fixedDate });

    const serialized1 = serializeRepositoryContext(context1);
    const serialized2 = serializeRepositoryContext(context2);

    expect(serialized1).toBe(serialized2);
    expect(context1).toEqual(context2);
  });
});

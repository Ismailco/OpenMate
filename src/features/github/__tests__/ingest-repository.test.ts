import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ingestGitHubRepository } from '../ingestion/ingest-repository';
import { NormalizedRepository } from '@/features/developer-profile/types';

describe('ingestGitHubRepository', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const testRepo: NormalizedRepository = {
    owner: 'example',
    name: 'open-source-app',
    url: 'https://github.com/example/open-source-app',
  };

  it('successfully ingests metadata, documents, manifests, tree, and issues', async () => {
    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      const urlStr = url.toString();

      // Metadata
      if (urlStr.endsWith('/repos/example/open-source-app')) {
        return new Response(
          JSON.stringify({
            id: 12345,
            name: 'open-source-app',
            full_name: 'example/open-source-app',
            description: 'An example open source project',
            default_branch: 'main',
            language: 'TypeScript',
            topics: ['open-source', 'cli'],
            stargazers_count: 150,
            forks_count: 20,
            open_issues_count: 5,
            archived: false,
            fork: false,
            license: { spdx_id: 'MIT' },
            html_url: 'https://github.com/example/open-source-app',
            owner: { login: 'example' },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // README
      if (urlStr.endsWith('/readme')) {
        return new Response(
          JSON.stringify({
            name: 'README.md',
            path: 'README.md',
            size: 24,
            type: 'file',
            encoding: 'base64',
            content: Buffer.from('# Example Project\n\nWelcome!').toString('base64'),
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // CONTRIBUTING
      if (urlStr.includes('/contents/CONTRIBUTING.md')) {
        return new Response(
          JSON.stringify({
            name: 'CONTRIBUTING.md',
            path: 'CONTRIBUTING.md',
            size: 30,
            type: 'file',
            encoding: 'base64',
            content: Buffer.from('## Contributing guidelines').toString('base64'),
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Tree
      if (urlStr.includes('/git/trees/main')) {
        return new Response(
          JSON.stringify({
            truncated: false,
            tree: [
              { path: 'package.json', mode: '100644', type: 'blob', size: 100 },
              { path: 'src/index.ts', mode: '100644', type: 'blob', size: 200 },
              { path: 'node_modules/fake.js', mode: '100644', type: 'blob', size: 50 },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Issues (including one pull request that must be filtered out)
      if (urlStr.includes('/issues?state=open')) {
        return new Response(
          JSON.stringify([
            {
              number: 1,
              title: 'Fix edge case crash',
              body: 'Issue description text',
              html_url: 'https://github.com/example/open-source-app/issues/1',
              labels: [{ name: 'bug' }, { name: 'good first issue' }],
              state: 'open',
              created_at: '2026-01-01T00:00:00Z',
              updated_at: '2026-01-02T00:00:00Z',
              comments: 2,
            },
            {
              number: 2,
              title: 'Add pull request feature',
              body: 'This is a PR, not an issue',
              html_url: 'https://github.com/example/open-source-app/pull/2',
              labels: [],
              state: 'open',
              created_at: '2026-01-03T00:00:00Z',
              updated_at: '2026-01-03T00:00:00Z',
              comments: 0,
              pull_request: { url: 'https://api.github.com/repos/example/open-source-app/pulls/2' },
            },
          ]),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // File contents: package.json or src/index.ts
      if (urlStr.includes('/contents/package.json')) {
        return new Response(
          JSON.stringify({
            name: 'package.json',
            path: 'package.json',
            size: 50,
            type: 'file',
            encoding: 'base64',
            content: Buffer.from('{"name": "test"}').toString('base64'),
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (urlStr.includes('/contents/src%2Findex.ts') || urlStr.includes('/contents/src/index.ts')) {
        return new Response(
          JSON.stringify({
            name: 'index.ts',
            path: 'src/index.ts',
            size: 35,
            type: 'file',
            encoding: 'base64',
            content: Buffer.from('console.log("hello world");').toString('base64'),
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify({ message: 'Not found' }), { status: 404 });
    });

    const result = await ingestGitHubRepository(testRepo);

    expect(result.metadata.fullName).toBe('example/open-source-app');
    expect(result.metadata.defaultBranch).toBe('main');
    expect(result.metadata.stars).toBe(150);

    // README & CONTRIBUTING
    expect(result.documents.readme?.content).toContain('Example Project');
    expect(result.documents.contributing?.content).toContain('Contributing guidelines');

    // Manifests & source files
    expect(result.manifests.length).toBe(1);
    expect(result.manifests[0]?.path).toBe('package.json');
    expect(result.sourceFiles.length).toBe(1);
    expect(result.sourceFiles[0]?.path).toBe('src/index.ts');

    // Issues filtered (pull request omitted)
    expect(result.issues.length).toBe(1);
    expect(result.issues[0]?.number).toBe(1);
    expect(result.issues[0]?.labels).toEqual(['bug', 'good first issue']);
  });

  it('succeeds even if README and CONTRIBUTING are absent', async () => {
    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      const urlStr = url.toString();

      if (urlStr.endsWith('/repos/example/open-source-app')) {
        return new Response(
          JSON.stringify({
            id: 999,
            name: 'open-source-app',
            full_name: 'example/open-source-app',
            default_branch: 'main',
            stargazers_count: 10,
            forks_count: 1,
            open_issues_count: 0,
            archived: false,
            fork: false,
            html_url: 'https://github.com/example/open-source-app',
            owner: { login: 'example' },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (urlStr.includes('/git/trees/main')) {
        return new Response(
          JSON.stringify({ truncated: false, tree: [] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (urlStr.includes('/issues?state=open')) {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Return 404 for readme and contributing
      return new Response(JSON.stringify({ message: 'Not Found' }), { status: 404 });
    });

    const result = await ingestGitHubRepository(testRepo);
    expect(result.documents.readme).toBeUndefined();
    expect(result.documents.contributing).toBeUndefined();
    expect(result.issues).toEqual([]);
    expect(result.tree).toEqual([]);
  });
});

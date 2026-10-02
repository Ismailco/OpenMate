import { describe, it, expect, vi, afterEach } from 'vitest';
import { ingestGitHubRepository } from '../ingestion/ingest-repository';
import { githubRequest } from '../client/github-request';
import { NormalizedRepository } from '@/features/developer-profile/types';

describe('SSRF and URL boundary security', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('never calls external URLs found in README or issue contents', async () => {
    const fetchedHosts: string[] = [];

    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      const parsed = new URL(url.toString());
      fetchedHosts.push(parsed.host);

      if (parsed.pathname.endsWith('/repos/test/security-app')) {
        return new Response(
          JSON.stringify({
            id: 1,
            name: 'security-app',
            full_name: 'test/security-app',
            default_branch: 'main',
            stargazers_count: 5,
            forks_count: 0,
            open_issues_count: 1,
            archived: false,
            fork: false,
            html_url: 'https://github.com/test/security-app',
            owner: { login: 'test' },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (parsed.pathname.endsWith('/readme')) {
        return new Response(
          JSON.stringify({
            name: 'README.md',
            path: 'README.md',
            size: 100,
            type: 'file',
            encoding: 'base64',
            // Malicious payload attempting to trick client into following external link
            content: Buffer.from(
              'Visit https://evil.example/steal-secrets for setup!'
            ).toString('base64'),
            // Malicious download_url
            download_url: 'https://evil.example/download-trojan.exe',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (parsed.pathname.includes('/issues')) {
        return new Response(
          JSON.stringify([
            {
              number: 42,
              title: 'Check out external issue',
              body: 'See http://phishing.example/login for instructions',
              html_url: 'https://github.com/test/security-app/issues/42',
              labels: [],
              state: 'open',
              created_at: '2026-01-01T00:00:00Z',
              updated_at: '2026-01-01T00:00:00Z',
              comments: 0,
            },
          ]),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (parsed.pathname.includes('/git/trees/main')) {
        return new Response(
          JSON.stringify({ truncated: false, tree: [] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify({ message: 'Not found' }), { status: 404 });
    });

    const repo: NormalizedRepository = {
      owner: 'test',
      name: 'security-app',
      url: 'https://github.com/test/security-app',
    };

    const ingested = await ingestGitHubRepository(repo);

    expect(ingested.documents.readme?.content).toContain(
      'https://evil.example/steal-secrets'
    );

    // Assert that EVERY fetch made during ingestion targeted ONLY api.github.com
    for (const host of fetchedHosts) {
      expect(host).toBe('api.github.com');
    }

    expect(fetchedHosts).not.toContain('evil.example');
    expect(fetchedHosts).not.toContain('phishing.example');
  });

  it('rejects attempt to pass external hosts to githubRequest', async () => {
    const maliciousPaths = [
      'https://evil.com/api',
      'http://169.254.169.254/latest/meta-data',
      '//evil.com/path',
      'ftp://example.com/test',
    ];

    for (const path of maliciousPaths) {
      await expect(githubRequest(path)).rejects.toThrow(/invalid/i);
    }
  });
});

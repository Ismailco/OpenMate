import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { githubRequest } from '../client/github-request';
import {
  GitHubAuthenticationError,
  GitHubRateLimitError,
  GitHubTimeoutError,
  RepositoryNotFoundError,
  GitHubApiError,
} from '../errors';

describe('githubRequest', () => {
  const originalFetch = globalThis.fetch;
  const originalEnvToken = process.env.GITHUB_TOKEN;

  beforeEach(() => {
    delete process.env.GITHUB_TOKEN;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env.GITHUB_TOKEN = originalEnvToken;
    vi.restoreAllMocks();
  });

  it('sends required headers to the fixed GitHub API host', async () => {
    let capturedUrl = '';
    let capturedHeaders: HeadersInit | undefined;

    globalThis.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      capturedUrl = url;
      capturedHeaders = init?.headers;
      return new Response(JSON.stringify({ name: 'openmate' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const res = await githubRequest<{ name: string }>('/repos/test-owner/test-repo');

    expect(capturedUrl).toBe('https://api.github.com/repos/test-owner/test-repo');
    const headers = capturedHeaders as Record<string, string>;
    expect(headers['Accept']).toBe('application/vnd.github+json');
    expect(headers['X-GitHub-Api-Version']).toBe('2022-11-28');
    expect(headers['User-Agent']).toBe('OpenMate-App');
    expect(headers['Authorization']).toBeUndefined();
    expect(res.data).toEqual({ name: 'openmate' });
  });

  it('includes Authorization header when GITHUB_TOKEN is present', async () => {
    process.env.GITHUB_TOKEN = 'ghp_secret_token_123';
    let capturedHeaders: Record<string, string> = {};

    globalThis.fetch = vi.fn().mockImplementation(async (_url: string, init?: RequestInit) => {
      capturedHeaders = init?.headers as Record<string, string>;
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await githubRequest('/repos/owner/repo');
    expect(capturedHeaders['Authorization']).toBe('Bearer ghp_secret_token_123');
  });

  it('maps 401 response to GitHubAuthenticationError', async () => {
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      return new Response(JSON.stringify({ message: 'Bad credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await expect(githubRequest('/repos/owner/repo')).rejects.toThrow(
      GitHubAuthenticationError
    );
  });

  it('maps 404 response to RepositoryNotFoundError', async () => {
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      return new Response(JSON.stringify({ message: 'Not Found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await expect(
      githubRequest('/repos/owner/repo', { owner: 'owner', repo: 'repo' })
    ).rejects.toThrow(RepositoryNotFoundError);
  });

  it('maps 403 rate-limit header response to GitHubRateLimitError', async () => {
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      return new Response(JSON.stringify({ message: 'API rate limit exceeded' }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'x-ratelimit-limit': '60',
          'x-ratelimit-remaining': '0',
          'x-ratelimit-reset': '1893456000',
          'x-ratelimit-used': '60',
        },
      });
    });

    await expect(githubRequest('/repos/owner/repo')).rejects.toThrow(
      GitHubRateLimitError
    );
  });

  it('maps 500 response to GitHubApiError', async () => {
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      return new Response('Internal Server Error', {
        status: 500,
      });
    });

    await expect(githubRequest('/repos/owner/repo')).rejects.toThrow(
      GitHubApiError
    );
  });

  it('maps abort to GitHubTimeoutError', async () => {
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      const error = new Error('The operation was aborted');
      error.name = 'AbortError';
      throw error;
    });

    await expect(
      githubRequest('/repos/owner/repo', { timeoutMs: 100 })
    ).rejects.toThrow(GitHubTimeoutError);
  });

  it('rejects non-relative or protocol-injecting paths', async () => {
    await expect(githubRequest('https://evil.com')).rejects.toThrow(/invalid/i);
    await expect(githubRequest('//evil.com')).rejects.toThrow(/invalid/i);
    await expect(githubRequest('repos/owner/repo')).rejects.toThrow(/invalid/i);
  });
});

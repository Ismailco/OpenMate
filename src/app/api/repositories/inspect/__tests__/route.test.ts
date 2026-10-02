import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import * as githubIngestion from '@/features/github/ingestion/ingest-repository';
import { RepositoryNotFoundError, GitHubRateLimitError } from '@/features/github/errors';
import { IngestedRepository } from '@/features/github/types';

describe('POST /api/repositories/inspect', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockIngested: IngestedRepository = {
    metadata: {
      id: 1,
      owner: 'vercel',
      name: 'next.js',
      fullName: 'vercel/next.js',
      description: 'The React Framework',
      defaultBranch: 'canary',
      primaryLanguage: 'TypeScript',
      topics: ['react', 'framework'],
      stars: 120000,
      forks: 25000,
      openIssuesCount: 300,
      isArchived: false,
      isFork: false,
      license: 'MIT',
      htmlUrl: 'https://github.com/vercel/next.js',
    },
    documents: {
      readme: {
        path: 'README.md',
        content: '# Next.js',
        size: 9,
        source: 'readme',
      },
    },
    tree: [{ path: 'package.json', type: 'blob', size: 100 }],
    manifests: [
      {
        path: 'package.json',
        content: '{"name": "next"}',
        size: 16,
        source: 'manifest',
      },
    ],
    sourceFiles: [
      {
        path: 'src/index.ts',
        content: 'export default {}',
        size: 17,
        source: 'source',
      },
    ],
    issues: [
      {
        number: 10,
        title: 'Fix hydration',
        body: 'Hydration bug description',
        htmlUrl: 'https://github.com/vercel/next.js/issues/10',
        labels: ['bug'],
        state: 'open',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z',
        commentsCount: 1,
      },
    ],
    ingestion: {
      fetchedAt: '2026-01-01T00:00:00Z',
      truncatedTree: false,
      truncatedIssues: false,
      skippedFiles: 0,
    },
  };

  it('returns 400 when repository field is missing', async () => {
    const request = new Request('http://localhost:3000/api/repositories/inspect', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/missing repository field/i);
  });

  it('returns 422 when repository object is structurally invalid', async () => {
    const request = new Request('http://localhost:3000/api/repositories/inspect', {
      method: 'POST',
      body: JSON.stringify({ repository: { owner: '', name: '' } }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(422);
  });

  it('returns safe summary data when ingestion succeeds', async () => {
    vi.spyOn(githubIngestion, 'ingestGitHubRepository').mockResolvedValueOnce(mockIngested);

    const request = new Request('http://localhost:3000/api/repositories/inspect', {
      method: 'POST',
      body: JSON.stringify({
        repository: {
          owner: 'vercel',
          name: 'next.js',
          url: 'https://github.com/vercel/next.js',
        },
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(json.data.metadata.fullName).toBe('vercel/next.js');
    expect(json.data.documents.hasReadme).toBe(true);
    expect(json.data.manifestPaths).toEqual(['package.json']);
    expect(json.data.sourceFilePaths).toEqual(['src/index.ts']);
    expect(json.data.issueCount).toBe(1);
  });

  it('maps RepositoryNotFoundError to 404', async () => {
    vi.spyOn(githubIngestion, 'ingestGitHubRepository').mockRejectedValueOnce(
      new RepositoryNotFoundError('ghost', 'nonexistent')
    );

    const request = new Request('http://localhost:3000/api/repositories/inspect', {
      method: 'POST',
      body: JSON.stringify({
        repository: {
          owner: 'ghost',
          name: 'nonexistent',
          url: 'https://github.com/ghost/nonexistent',
        },
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.code).toBe('REPOSITORY_NOT_FOUND');
  });

  it('maps GitHubRateLimitError to 429', async () => {
    vi.spyOn(githubIngestion, 'ingestGitHubRepository').mockRejectedValueOnce(
      new GitHubRateLimitError()
    );

    const request = new Request('http://localhost:3000/api/repositories/inspect', {
      method: 'POST',
      body: JSON.stringify({
        repository: {
          owner: 'vercel',
          name: 'next.js',
          url: 'https://github.com/vercel/next.js',
        },
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(429);
    const json = await response.json();
    expect(json.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});

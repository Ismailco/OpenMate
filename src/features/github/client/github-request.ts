import 'server-only';

import {
  GitHubApiError,
  GitHubAuthenticationError,
  GitHubRateLimitError,
  GitHubTimeoutError,
  RepositoryAccessError,
  RepositoryNotFoundError,
} from '../errors';
import { GITHUB_LIMITS } from '../ingestion/limits';
import { parseRateLimitHeaders } from './github-response';
import { GitHubRateLimitInfo } from '../types';

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_API_VERSION = '2022-11-28';

export interface GitHubRequestOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
  // Context for error messages
  owner?: string;
  repo?: string;
  acceptHeader?: string;
}

export interface GitHubApiResponse<T> {
  data: T;
  rateLimit?: GitHubRateLimitInfo;
  status: number;
}

/**
 * Low-level, SSRF-safe request dispatcher to GitHub's REST API.
 * Only accepts relative paths on https://api.github.com.
 */
export async function githubRequest<T = unknown>(
  endpointPath: string,
  options: GitHubRequestOptions = {}
): Promise<GitHubApiResponse<T>> {
  // SSRF guard: ensure endpointPath is strictly relative and does not include host or protocol
  if (!endpointPath.startsWith('/') || endpointPath.startsWith('//')) {
    throw new Error('Invalid GitHub API endpoint path. Must start with a single slash.');
  }

  const url = `${GITHUB_API_BASE}${endpointPath}`;
  const timeoutMs = options.timeoutMs ?? GITHUB_LIMITS.REQUEST_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const token = process.env.GITHUB_TOKEN?.trim();

  const headers: Record<string, string> = {
    Accept: options.acceptHeader ?? 'application/vnd.github+json',
    'X-GitHub-Api-Version': GITHUB_API_VERSION,
    'User-Agent': 'OpenMate-App',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
      cache: 'no-store',
    });

    const rateLimit = parseRateLimitHeaders(response.headers);

    if (response.ok) {
      // Content could be JSON or raw text
      const contentType = response.headers.get('content-type') || '';
      let data: T;
      if (contentType.includes('application/json') || contentType.includes('json')) {
        data = (await response.json()) as T;
      } else {
        const text = await response.text();
        data = text as unknown as T;
      }

      return {
        data,
        rateLimit,
        status: response.status,
      };
    }

    // Handle error statuses cleanly
    const status = response.status;
    const owner = options.owner ?? 'unknown';
    const repo = options.repo ?? 'unknown';

    if (status === 401) {
      throw new GitHubAuthenticationError(
        'GitHub authentication failed. Please check GITHUB_TOKEN configuration.'
      );
    }

    if (status === 403 || status === 429) {
      if (rateLimit && rateLimit.remaining === 0) {
        throw new GitHubRateLimitError(rateLimit);
      }
      // Read error body message if available
      let errorDetail = '';
      try {
        const errJson = (await response.json()) as { message?: string };
        errorDetail = errJson.message ?? '';
      } catch {
        // Ignore json parse error on error responses
      }

      if (errorDetail.toLowerCase().includes('rate limit')) {
        throw new GitHubRateLimitError(rateLimit, errorDetail);
      }

      throw new RepositoryAccessError(
        owner,
        repo,
        errorDetail || `Access denied for repository "${owner}/${repo}".`
      );
    }

    if (status === 404) {
      throw new RepositoryNotFoundError(owner, repo);
    }

    let errorMessage = `GitHub request failed with status ${status}`;
    try {
      const errJson = (await response.json()) as { message?: string };
      if (errJson.message) {
        errorMessage = errJson.message;
      }
    } catch {
      // Ignore
    }

    throw new GitHubApiError(status, errorMessage);
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new GitHubTimeoutError(timeoutMs);
    }
    // Re-throw our typed errors directly
    if (
      err instanceof GitHubApiError ||
      err instanceof GitHubAuthenticationError ||
      err instanceof GitHubRateLimitError ||
      err instanceof RepositoryAccessError ||
      err instanceof RepositoryNotFoundError
    ) {
      throw err;
    }

    throw new GitHubApiError(
      500,
      err instanceof Error ? err.message : 'Unknown network failure communicating with GitHub.'
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

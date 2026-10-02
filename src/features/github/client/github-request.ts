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
 * Only accepts relative paths strictly bound to https://api.github.com.
 */
export async function githubRequest<T = unknown>(
  endpointPath: string,
  options: GitHubRequestOptions = {}
): Promise<GitHubApiResponse<T>> {
  // SSRF guard: ensure endpointPath is strictly relative and does not include host or protocol
  if (!endpointPath.startsWith('/') || endpointPath.startsWith('//')) {
    throw new Error('Invalid GitHub API endpoint path. Must start with a single slash.');
  }

  // SSRF guard: verify target origin strictly matches GitHub API base
  const resolved = new URL(endpointPath, GITHUB_API_BASE);
  if (resolved.origin !== GITHUB_API_BASE) {
    throw new Error('Invalid GitHub API endpoint path. Destination must match GitHub API origin.');
  }

  // Path traversal guard
  const decodedPath = decodeURIComponent(endpointPath);
  if (
    decodedPath.includes('/../') ||
    decodedPath.endsWith('/..') ||
    decodedPath.includes('/./') ||
    decodedPath.endsWith('/.')
  ) {
    throw new Error('Invalid GitHub API endpoint path. Path traversal is strictly forbidden.');
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
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    const rateLimit = parseRateLimitHeaders(response.headers);

    if (response.status === 404) {
      throw new RepositoryNotFoundError(
        options.owner ?? 'unknown',
        options.repo ?? 'unknown'
      );
    }

    if (response.status === 401) {
      throw new GitHubAuthenticationError(
        'GitHub authentication failed. Please check GITHUB_TOKEN configuration.'
      );
    }

    if (response.status === 403) {
      if (rateLimit && rateLimit.remaining === 0) {
        throw new GitHubRateLimitError(rateLimit);
      }
      throw new RepositoryAccessError(
        options.owner ?? 'unknown',
        options.repo ?? 'unknown',
        'Repository is private, blocked, or requires additional permissions.'
      );
    }

    if (response.status === 429) {
      throw new GitHubRateLimitError(
        rateLimit ?? {
          limit: 60,
          remaining: 0,
          resetAt: new Date(Date.now() + 60000),
          used: 60,
        }
      );
    }

    if (!response.ok) {
      throw new GitHubApiError(
        response.status,
        `GitHub API returned unexpected status ${response.status} for ${endpointPath}.`
      );
    }

    const data = (await response.json()) as T;
    return {
      data,
      rateLimit,
      status: response.status,
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new GitHubTimeoutError(timeoutMs);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

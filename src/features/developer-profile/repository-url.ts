import { NormalizedRepository } from './types';

export type ParseRepositoryResult =
  | { success: true; data: NormalizedRepository }
  | { success: false; error: string };

// GitHub usernames/orgs: alphanumeric with single hyphens, 1-39 chars, cannot start/end with hyphen
const OWNER_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/;

// GitHub repository names: alphanumeric, dots, underscores, hyphens, 1-100 chars, cannot be '.' or '..'
const REPO_REGEX = /^[a-zA-Z0-9_.-]+$/;

/**
 * Parses and strictly validates a public GitHub repository URL.
 * Rejects non-HTTPS schemes, non-github.com hosts, credentials, ports, query params, fragments,
 * and paths with more or fewer than exactly two segments (owner and repository).
 */
export function parseRepositoryUrl(rawUrl: string): ParseRepositoryResult {
  const trimmed = rawUrl.trim();

  if (!trimmed) {
    return { success: false, error: 'Repository URL is required.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      success: false,
      error: 'Please enter a valid URL (e.g. https://github.com/vercel/next.js).',
    };
  }

  if (parsed.protocol !== 'https:') {
    return {
      success: false,
      error: 'Repository URL must use the HTTPS protocol (https://).',
    };
  }

  // Canonical GitHub host only (case-insensitive in standard URL parsing)
  if (parsed.hostname.toLowerCase() !== 'github.com') {
    return {
      success: false,
      error: 'Only public GitHub repositories on github.com are currently supported.',
    };
  }

  if (parsed.username || parsed.password) {
    return {
      success: false,
      error: 'Repository URL must not contain authentication credentials.',
    };
  }

  if (parsed.port && parsed.port !== '443') {
    return {
      success: false,
      error: 'Repository URL must use standard HTTPS port.',
    };
  }

  if (parsed.search) {
    return {
      success: false,
      error: 'Repository URL must not contain query parameters.',
    };
  }

  if (parsed.hash) {
    return {
      success: false,
      error: 'Repository URL must not contain URL fragments or hashes.',
    };
  }

  // Split path and filter out empty segments caused by leading/trailing slashes
  const segments = parsed.pathname
    .split('/')
    .filter((segment) => segment.length > 0);

  if (segments.length !== 2) {
    return {
      success: false,
      error:
        'URL must point directly to a repository root in https://github.com/owner/repository format (no subdirectories or issues).',
    };
  }

  const rawOwner = segments[0];
  const rawRepo = segments[1];

  if (!rawOwner || !rawRepo) {
    return {
      success: false,
      error: 'Both repository owner and repository name are required.',
    };
  }

  // Strip .git suffix if present (e.g. "next.js.git" -> "next.js")
  const repoName = rawRepo.endsWith('.git')
    ? rawRepo.slice(0, -4)
    : rawRepo;

  if (rawOwner.length > 39 || !OWNER_REGEX.test(rawOwner)) {
    return {
      success: false,
      error: 'Repository owner name contains invalid characters.',
    };
  }

  if (
    !repoName ||
    repoName.length > 100 ||
    repoName === '.' ||
    repoName === '..' ||
    !REPO_REGEX.test(repoName)
  ) {
    return {
      success: false,
      error: 'Repository name contains invalid characters.',
    };
  }

  return {
    success: true,
    data: {
      owner: rawOwner,
      name: repoName,
      url: `https://github.com/${rawOwner}/${repoName}`,
    },
  };
}

import { GitHubRateLimitInfo } from './types';

export class GitHubIntegrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GitHubIntegrationError';
  }
}

export class RepositoryNotFoundError extends GitHubIntegrationError {
  constructor(public readonly owner: string, public readonly repo: string) {
    super(`Repository "${owner}/${repo}" was not found or is private.`);
    this.name = 'RepositoryNotFoundError';
  }
}

export class RepositoryAccessError extends GitHubIntegrationError {
  constructor(
    public readonly owner: string,
    public readonly repo: string,
    message = `Access denied for repository "${owner}/${repo}".`
  ) {
    super(message);
    this.name = 'RepositoryAccessError';
  }
}

export class GitHubAuthenticationError extends GitHubIntegrationError {
  constructor(message = 'Invalid or expired GitHub token.') {
    super(message);
    this.name = 'GitHubAuthenticationError';
  }
}

export class GitHubRateLimitError extends GitHubIntegrationError {
  constructor(
    public readonly rateLimit?: GitHubRateLimitInfo,
    message = 'GitHub API rate limit exceeded.'
  ) {
    super(
      rateLimit
        ? `${message} Resets at ${rateLimit.resetAt.toISOString()}.`
        : message
    );
    this.name = 'GitHubRateLimitError';
  }
}

export class GitHubTimeoutError extends GitHubIntegrationError {
  constructor(public readonly timeoutMs: number) {
    super(`GitHub API request timed out after ${timeoutMs}ms.`);
    this.name = 'GitHubTimeoutError';
  }
}

export class InvalidGitHubResponseError extends GitHubIntegrationError {
  constructor(
    message: string,
    public readonly validationIssues?: string[]
  ) {
    super(message);
    this.name = 'InvalidGitHubResponseError';
  }
}

export class RepositoryTooLargeError extends GitHubIntegrationError {
  constructor(
    public readonly metric: string,
    public readonly value: number,
    public readonly limit: number
  ) {
    super(
      `Repository exceeded safe size threshold: ${metric} (${value} > ${limit}).`
    );
    this.name = 'RepositoryTooLargeError';
  }
}

export class RepositoryContentUnavailableError extends GitHubIntegrationError {
  constructor(public readonly path: string, message?: string) {
    super(message || `Content for file "${path}" could not be retrieved.`);
    this.name = 'RepositoryContentUnavailableError';
  }
}

export class GitHubApiError extends GitHubIntegrationError {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(`GitHub API error (${statusCode}): ${message}`);
    this.name = 'GitHubApiError';
  }
}

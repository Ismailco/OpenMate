import { GitHubRateLimitInfo } from '../types';

export function parseRateLimitHeaders(headers: Headers): GitHubRateLimitInfo | undefined {
  const limitStr = headers.get('x-ratelimit-limit');
  const remainingStr = headers.get('x-ratelimit-remaining');
  const resetStr = headers.get('x-ratelimit-reset');
  const usedStr = headers.get('x-ratelimit-used');

  if (!limitStr || !remainingStr || !resetStr) {
    return undefined;
  }

  const limit = parseInt(limitStr, 10);
  const remaining = parseInt(remainingStr, 10);
  const resetEpoch = parseInt(resetStr, 10);
  const used = usedStr ? parseInt(usedStr, 10) : limit - remaining;

  if (isNaN(limit) || isNaN(remaining) || isNaN(resetEpoch)) {
    return undefined;
  }

  return {
    limit,
    remaining,
    resetAt: new Date(resetEpoch * 1000),
    used,
  };
}

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GET } from '../route';

describe('GET /api/health', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns HTTP 200 with status ok and service identifier', async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.service).toBe('openmate');
    expect(typeof data.timestamp).toBe('string');
    expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp);
  });

  it('enforces no-store caching headers', async () => {
    const response = await GET();
    const cacheControl = response.headers.get('cache-control');
    expect(cacheControl).toContain('no-store');
    expect(cacheControl).toContain('no-cache');
  });

  it('does not expose internal environment secrets or provider keys', async () => {
    process.env.BACKBOARD_API_KEY = 'super-secret-backboard-key';
    process.env.GITHUB_TOKEN = 'super-secret-github-token';
    process.env.OPENMATE_CHAT_SIGNING_SECRET = 'super-secret-signing-secret-key-32';

    const response = await GET();
    const data = await response.json();
    const rawString = JSON.stringify(data);

    expect(data).not.toHaveProperty('env');
    expect(data).not.toHaveProperty('keys');
    expect(data).not.toHaveProperty('secrets');
    expect(data).not.toHaveProperty('tokens');
    expect(rawString).not.toContain('super-secret');
    expect(rawString).not.toContain('backboard');
    expect(rawString).not.toContain('github');
  });

  it('includes trimmed git revision when RENDER_GIT_COMMIT is available', async () => {
    process.env.RENDER_GIT_COMMIT = 'abcdef1234567890';
    const response = await GET();
    const data = await response.json();

    expect(data.revision).toBe('abcdef1');
  });
});

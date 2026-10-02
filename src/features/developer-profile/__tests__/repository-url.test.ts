import { describe, it, expect } from 'vitest';
import { parseRepositoryUrl } from '../repository-url';

describe('parseRepositoryUrl', () => {
  it('parses valid canonical GitHub URLs', () => {
    const result = parseRepositoryUrl('https://github.com/facebook/react');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        owner: 'facebook',
        name: 'react',
        url: 'https://github.com/facebook/react',
      });
    }
  });

  it('normalizes trailing slashes', () => {
    const result = parseRepositoryUrl('https://github.com/vercel/next.js/');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('next.js');
      expect(result.data.url).toBe('https://github.com/vercel/next.js');
    }
  });

  it('strips .git suffix', () => {
    const result = parseRepositoryUrl('https://github.com/colinhacks/zod.git');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('zod');
      expect(result.data.url).toBe('https://github.com/colinhacks/zod');
    }
  });

  it('rejects HTTP protocol', () => {
    const result = parseRepositoryUrl('http://github.com/facebook/react');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/HTTPS protocol/i);
    }
  });

  it('rejects non-GitHub domains', () => {
    const result = parseRepositoryUrl('https://gitlab.com/facebook/react');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/github\.com/i);
    }
  });

  it('rejects lookalike hostnames', () => {
    const lookalikes = [
      'https://github.com.evil.example/facebook/react',
      'https://evilgithub.com/facebook/react',
      'https://notgithub.com/facebook/react',
      'https://github.com@evil.com/facebook/react',
    ];

    for (const url of lookalikes) {
      const result = parseRepositoryUrl(url);
      expect(result.success).toBe(false);
    }
  });

  it('rejects URLs missing the repository name', () => {
    const result = parseRepositoryUrl('https://github.com/facebook');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/repository root/i);
    }
  });

  it('rejects empty root GitHub URL', () => {
    const result = parseRepositoryUrl('https://github.com/');
    expect(result.success).toBe(false);
  });

  it('rejects extra path segments (issues, pulls, blobs)', () => {
    const extraPaths = [
      'https://github.com/facebook/react/issues/123',
      'https://github.com/facebook/react/pull/456',
      'https://github.com/facebook/react/tree/main/src',
    ];

    for (const url of extraPaths) {
      const result = parseRepositoryUrl(url);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/repository root/i);
      }
    }
  });

  it('rejects query parameters', () => {
    const result = parseRepositoryUrl('https://github.com/facebook/react?tab=readme');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/query parameters/i);
    }
  });

  it('rejects URL fragments', () => {
    const result = parseRepositoryUrl('https://github.com/facebook/react#readme');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/fragments or hashes/i);
    }
  });

  it('rejects embedded credentials', () => {
    const result = parseRepositoryUrl('https://user:pass@github.com/facebook/react');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/credentials/i);
    }
  });

  it('rejects non-standard ports', () => {
    const result = parseRepositoryUrl('https://github.com:8443/facebook/react');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/port/i);
    }
  });

  it('rejects non-web schemes', () => {
    const schemes = [
      'javascript:alert(1)',
      'file:///etc/passwd',
      'ftp://github.com/facebook/react',
    ];

    for (const url of schemes) {
      const result = parseRepositoryUrl(url);
      expect(result.success).toBe(false);
    }
  });

  it('rejects empty or whitespace-only inputs', () => {
    expect(parseRepositoryUrl('').success).toBe(false);
    expect(parseRepositoryUrl('   ').success).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import {
  validateApiRequestHeaders,
  createSafeJsonResponse,
  MAX_API_PAYLOAD_BYTES,
} from '../api-security';

describe('API Security Helpers', () => {
  it('validates JSON Content-Type and payload size within bounds', () => {
    const request = new Request('http://localhost:3000/api/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': '1024',
      },
    });

    const result = validateApiRequestHeaders(request);
    expect(result.valid).toBe(true);
    expect(result.response).toBeUndefined();
  });

  it('rejects missing or non-JSON Content-Type with 415', async () => {
    const request = new Request('http://localhost:3000/api/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
    });

    const result = validateApiRequestHeaders(request);
    expect(result.valid).toBe(false);
    expect(result.response?.status).toBe(415);

    const data = await result.response?.json();
    expect(data.error).toBe('UnsupportedMediaType');
  });

  it('rejects oversized payloads with 413', async () => {
    const request = new Request('http://localhost:3000/api/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': String(MAX_API_PAYLOAD_BYTES + 1),
      },
    });

    const result = validateApiRequestHeaders(request);
    expect(result.valid).toBe(false);
    expect(result.response?.status).toBe(413);

    const data = await result.response?.json();
    expect(data.error).toBe('PayloadTooLarge');
  });

  it('sets Cache-Control: no-store and X-Content-Type-Options: nosniff on safe JSON responses', () => {
    const response = createSafeJsonResponse({ success: true });
    expect(response.headers.get('Cache-Control')).toContain('no-store');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });
});

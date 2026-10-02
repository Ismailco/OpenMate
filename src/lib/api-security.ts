import { NextResponse } from 'next/server';

export const MAX_API_PAYLOAD_BYTES = 102_400; // 100 KB

export interface RequestValidationResult {
  valid: boolean;
  response?: NextResponse;
}

/**
 * Validates inbound API request headers for Content-Type and payload size.
 */
export function validateApiRequestHeaders(
  request: Request,
  options: { requireJson?: boolean; maxBytes?: number } = {}
): RequestValidationResult {
  const { requireJson = true, maxBytes = MAX_API_PAYLOAD_BYTES } = options;

  // Check Content-Length if provided
  const contentLengthHeader = request.headers.get('content-length');
  if (contentLengthHeader) {
    const contentLength = parseInt(contentLengthHeader, 10);
    if (!isNaN(contentLength) && contentLength > maxBytes) {
      return {
        valid: false,
        response: createSafeJsonResponse(
          {
            error: 'PayloadTooLarge',
            message: `Request payload exceeds maximum allowed size of ${maxBytes} bytes.`,
          },
          { status: 413 }
        ),
      };
    }
  }

  // Check Content-Type for JSON bodies
  if (requireJson) {
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.toLowerCase().includes('application/json')) {
      return {
        valid: false,
        response: createSafeJsonResponse(
          {
            error: 'UnsupportedMediaType',
            message: 'Content-Type must be application/json.',
          },
          { status: 415 }
        ),
      };
    }
  }

  return { valid: true };
}

/**
 * Creates a standard JSON response with Cache-Control: no-store and security headers.
 */
export function createSafeJsonResponse(
  body: unknown,
  init?: ResponseInit
): NextResponse {
  const headers = new Headers(init?.headers);

  // Guarantee no-store caching for dynamic API responses
  if (!headers.has('Cache-Control')) {
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  }

  if (!headers.has('X-Content-Type-Options')) {
    headers.set('X-Content-Type-Options', 'nosniff');
  }

  return NextResponse.json(body, {
    ...init,
    headers,
  });
}

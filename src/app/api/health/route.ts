import { createSafeJsonResponse } from '@/lib/api-security';

export const dynamic = 'force-dynamic';

/**
 * Lightweight health check endpoint for deployment monitoring.
 * Intentionally does NOT call external providers (GitHub, Backboard, OpenRouter)
 * so that transient provider outages do not trigger container restarts.
 */
export async function GET() {
  const revision = process.env.RENDER_GIT_COMMIT
    ? process.env.RENDER_GIT_COMMIT.slice(0, 7)
    : process.env.GIT_COMMIT
      ? process.env.GIT_COMMIT.slice(0, 7)
      : undefined;

  return createSafeJsonResponse({
    status: 'ok',
    service: 'openmate',
    timestamp: new Date().toISOString(),
    ...(revision ? { revision } : {}),
  });
}

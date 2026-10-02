import * as Sentry from '@sentry/nextjs';

const isEnabled = process.env.NODE_ENV !== 'test' && Boolean(process.env.SENTRY_DSN);

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: isEnabled,
  tracesSampleRate: process.env.NODE_ENV === 'test' ? 0 : 1.0,
  environment:
    process.env.SENTRY_ENVIRONMENT ||
    (process.env.NODE_ENV === 'production' ? 'production' : 'development'),
  release: process.env.RENDER_GIT_COMMIT || undefined,
});

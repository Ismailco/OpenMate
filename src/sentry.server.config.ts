import * as Sentry from '@sentry/nextjs';

function parseTracesSampleRate(): number {
  if (process.env.NODE_ENV === 'test') {
    return 0;
  }
  const raw = process.env.SENTRY_TRACES_SAMPLE_RATE;
  if (raw !== undefined) {
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
      return parsed;
    }
  }
  return 1.0;
}

const isEnabled = process.env.NODE_ENV !== 'test' && Boolean(process.env.SENTRY_DSN);

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: isEnabled,
  tracesSampleRate: parseTracesSampleRate(),
  environment:
    process.env.SENTRY_ENVIRONMENT ||
    (process.env.NODE_ENV === 'production' ? 'production' : 'development'),
  release: process.env.RENDER_GIT_COMMIT || undefined,

  // Redaction: strip sensitive headers and tokens from any captured errors
  beforeSend(event) {
    if (event.request) {
      delete event.request.cookies;
      if (event.request.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
        delete event.request.headers['x-api-key'];
      }
    }
    return event;
  },

  // Redaction: sanitize span attributes
  beforeSendSpan(span) {
    const forbidden = ['token', 'secret', 'key', 'auth', 'password'];
    if (span.attributes) {
      for (const key of Object.keys(span.attributes)) {
        if (key.startsWith('gen_ai.usage')) {
          continue;
        }
        if (forbidden.some((f) => key.toLowerCase().includes(f))) {
          delete span.attributes[key];
        }
      }
    }
    return span;
  },
});

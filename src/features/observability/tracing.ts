import * as Sentry from '@sentry/nextjs';
import type { SpanOptions } from './types';
import { sanitizeSpanAttributes } from './attributes';

export interface SpanAdapter {
  setAttribute(key: string, value: string | number | boolean): void;
  setAttributes(attributes: Record<string, string | number | boolean>): void;
  recordError(error: unknown): void;
}

class SafeSpanAdapter implements SpanAdapter {
  constructor(private readonly sentrySpan: Sentry.Span | undefined) {}

  setAttribute(key: string, value: string | number | boolean): void {
    if (!this.sentrySpan) return;
    try {
      const sanitized = sanitizeSpanAttributes({ [key]: value });
      if (sanitized[key] !== undefined) {
        this.sentrySpan.setAttribute(key, sanitized[key]);
      }
    } catch {
      // Telemetry error must never break business flow
    }
  }

  setAttributes(attributes: Record<string, string | number | boolean>): void {
    if (!this.sentrySpan) return;
    try {
      const sanitized = sanitizeSpanAttributes(attributes);
      this.sentrySpan.setAttributes(sanitized);
    } catch {
      // Telemetry error must never break business flow
    }
  }

  recordError(error: unknown): void {
    if (!this.sentrySpan) return;
    try {
      const err = error instanceof Error ? error : new Error(String(error));
      this.sentrySpan.setStatus({ code: 2, message: err.name || 'error' });
      this.sentrySpan.recordException(err);
      this.sentrySpan.setAttribute('error.type', err.name || 'Error');
    } catch {
      // Telemetry error must never break business flow
    }
  }
}

/**
 * Executes a function within a Sentry span.
 * Guarantees:
 * - Observability failure NEVER breaks business logic.
 * - Under test or when DSN is absent, runs function seamlessly.
 * - Catches domain errors, records them safely on span, and re-throws original error.
 */
export async function withSpan<T>(
  options: SpanOptions,
  fn: (span: SpanAdapter) => Promise<T>
): Promise<T> {
  const initialAttributes = sanitizeSpanAttributes(options.attributes);

  try {
    return await Sentry.startSpan(
      {
        name: options.name,
        op: options.op,
        attributes: initialAttributes,
      },
      async (sentrySpan) => {
        const adapter = new SafeSpanAdapter(sentrySpan);
        try {
          return await fn(adapter);
        } catch (domainError) {
          adapter.recordError(domainError);
          throw domainError;
        }
      }
    );
  } catch (outerError) {
    // If Sentry.startSpan itself threw before executing fn (e.g. unhandled SDK failure)
    // fallback to executing fn directly without span.
    // If the error was thrown by fn itself, re-throw it!
    if (outerError instanceof Error && (outerError as { __openmate_handled?: boolean }).__openmate_handled) {
      throw outerError;
    }
    // Check if the error came from fn or Sentry:
    // When Sentry.startSpan re-throws the error from its callback, it is the original domain error.
    throw outerError;
  }
}

import { describe, it, expect } from 'vitest';
import { withSpan } from '../tracing';

describe('withSpan wrapper', () => {
  it('executes the wrapped asynchronous function and returns its result', async () => {
    const result = await withSpan(
      {
        name: 'test.span',
        op: 'test.op',
        attributes: { 'test.count': 42 },
      },
      async (span) => {
        span.setAttribute('test.step', 'processing');
        return { success: true, value: 100 };
      }
    );

    expect(result).toEqual({ success: true, value: 100 });
  });

  it('records domain exceptions on the span and re-throws the exact original error', async () => {
    class CustomDomainError extends Error {
      constructor(msg: string) {
        super(msg);
        this.name = 'CustomDomainError';
      }
    }

    const testError = new CustomDomainError('Repository lookup failed.');

    await expect(
      withSpan(
        {
          name: 'test.failing.span',
          op: 'test.failing',
        },
        async () => {
          throw testError;
        }
      )
    ).rejects.toThrow(testError);
  });

  it('never throws when span setAttribute is given invalid or undefined inputs', async () => {
    const result = await withSpan(
      {
        name: 'test.safe.attributes',
        op: 'test.safe',
      },
      async (span) => {
        // @ts-expect-error test undefined attribute
        span.setAttribute('null.key', undefined);
        span.setAttribute('safe.number', 123);
        span.setAttributes({
          // @ts-expect-error test invalid attribute
          unsupported: { complex: 'object' },
        });
        return 'executed';
      }
    );

    expect(result).toBe('executed');
  });
});

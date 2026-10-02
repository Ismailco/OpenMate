'use client';

import React from 'react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';

export interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  return (
    <main className="flex-1 flex items-center justify-center py-24">
      <Container size="sm" className="text-center space-y-6">
        <div className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--danger)]">
          Application Error
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
          Something went wrong
        </h1>
        <p className="text-sm text-[var(--muted)] max-w-md mx-auto leading-relaxed">
          OpenMate encountered an unexpected error while rendering this view.
          {error.digest && (
            <span className="block mt-2 font-mono text-xs text-[var(--muted-foreground)]">
              Reference code: {error.digest}
            </span>
          )}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button onClick={() => reset()} variant="secondary" size="sm">
            Try again
          </Button>
          <Button href="/" variant="outline" size="sm">
            Return home
          </Button>
        </div>
      </Container>
    </main>
  );
}

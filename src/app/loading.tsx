import React from 'react';
import { Container } from '@/components/ui/Container';

export default function Loading() {
  return (
    <main className="flex-1 flex items-center justify-center py-24" aria-busy="true" aria-live="polite">
      <Container size="sm" className="text-center">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-md border border-[var(--border)] bg-[var(--surface)] text-xs font-mono text-[var(--muted)]">
          <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" aria-hidden="true" />
          <span>Loading OpenMate workspace...</span>
        </div>
      </Container>
    </main>
  );
}

import React from 'react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center py-24">
      <Container size="sm" className="text-center space-y-6">
        <div className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
          Error 404
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
          Page Not Found
        </h1>
        <p className="text-sm text-[var(--muted)] max-w-md mx-auto leading-relaxed">
          The requested path does not exist in this OpenMate workspace. Check the URL or return to the landing page.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button href="/" variant="outline" size="sm">
            Return Home
          </Button>
          <Button href="/start" variant="primary" size="sm">
            Find my first contribution
          </Button>
        </div>
      </Container>
    </main>
  );
}

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function AnalysisMissingState() {
  return (
    <div className="py-16 sm:py-24 text-center">
      <Card variant="muted" className="p-8 sm:p-12 max-w-xl mx-auto space-y-5">
        <div className="w-14 h-14 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto text-2xl text-[var(--accent)] font-mono">
          &gt;_
        </div>
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
            No repository analysis yet
          </h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed max-w-md mx-auto">
            Tell OpenMate what you know and choose a repository to find your first contribution.
          </p>
        </div>
        <div className="pt-2">
          <Button href="/start" variant="primary" size="md">
            Start an analysis &rarr;
          </Button>
        </div>
      </Card>
    </div>
  );
}

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DemoRepositoryAnalysis } from '@/data/demo-repository';

export interface StartHereCardProps {
  startHere: DemoRepositoryAnalysis['startHere'];
}

export function StartHereCard({ startHere }: StartHereCardProps) {
  return (
    <Card className="border-[var(--accent)]/40 bg-[var(--surface)] shadow-xs relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--accent)]" aria-hidden="true" />
      <div className="pl-2">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="accent" size="sm">Primary Recommendation</Badge>
          <span className="text-xs font-mono font-semibold tracking-wide text-[var(--accent)] uppercase">
            Start Here
          </span>
        </div>

        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--foreground)] mb-2">
          {startHere.heading}
        </h2>

        <p className="text-sm text-[var(--muted)] leading-relaxed mb-4">
          {startHere.explanation}
        </p>

        <div className="space-y-2 pt-2 border-t border-[var(--border-muted)]">
          <span className="text-xs font-semibold text-[var(--foreground)] tracking-wide uppercase">
            Suggested Initial Steps:
          </span>
          <ol className="space-y-1.5 list-decimal list-inside text-xs sm:text-sm text-[var(--muted)]">
            {startHere.initialSteps.map((step, idx) => (
              <li key={idx} className="leading-relaxed pl-1">
                <span className="text-[var(--foreground)]">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Card>
  );
}

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { RepositoryAnalysis } from '@/features/repository-analysis/types';

export interface LocalSetupGuideProps {
  localSetup: RepositoryAnalysis['localSetup'];
}

export function LocalSetupGuide({ localSetup }: LocalSetupGuideProps) {
  return (
    <Card className="space-y-4">
      {localSetup.prerequisites.length > 0 && (
        <div>
          <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider block mb-2">
            System Prerequisites
          </span>
          <div className="flex flex-wrap gap-2">
            {localSetup.prerequisites.map((req) => (
              <Badge key={req} variant="outline" size="sm">
                {req}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {localSetup.steps.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[var(--border-muted)]">
          <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider block mb-2">
            Setup Sequence
          </span>
          <div className="space-y-2">
            {localSetup.steps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2.5 rounded-md bg-[var(--surface-muted)] border border-[var(--border-muted)] text-xs font-mono"
              >
                <span className="text-[var(--accent)] font-bold">{idx + 1}.</span>
                <span className="text-[var(--foreground)] font-mono overflow-x-auto whitespace-pre">
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {localSetup.caveats.length > 0 && (
        <div className="pt-2 border-t border-[var(--border-muted)]">
          <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider block mb-1">
            Setup Caveats
          </span>
          <ul className="list-disc list-inside text-xs text-[var(--muted)] space-y-1">
            {localSetup.caveats.map((caveat, idx) => (
              <li key={idx}>
                <span className="text-[var(--foreground)]">{caveat}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

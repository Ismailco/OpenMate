import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DemoRepositoryAnalysis } from '@/data/demo-repository';

export interface LocalSetupGuideProps {
  localSetup: DemoRepositoryAnalysis['localSetup'];
}

export function LocalSetupGuide({ localSetup }: LocalSetupGuideProps) {
  return (
    <Card className="space-y-4">
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

      <div className="space-y-2 pt-2 border-t border-[var(--border-muted)]">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider block mb-2">
          Setup Sequence
        </span>
        <div className="space-y-2">
          {localSetup.steps.map((step) => (
            <div
              key={step.step}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-md bg-[var(--surface-muted)] border border-[var(--border-muted)] text-xs font-mono"
            >
              <div className="flex items-center gap-2">
                <span className="text-[var(--accent)] font-bold">{step.step}.</span>
                <span className="text-[var(--foreground)] font-sans">{step.label}</span>
              </div>
              <code className="px-2 py-1 rounded-sm bg-[var(--background)] text-[var(--accent)] border border-[var(--border)] overflow-x-auto">
                {step.command}
              </code>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

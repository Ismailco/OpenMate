import React from 'react';
import { Card } from '@/components/ui/Card';
import type { RepositoryAnalysis } from '@/features/repository-analysis/types';

export interface ArchitectureOverviewProps {
  architecture: RepositoryAnalysis['architecture'];
}

export function ArchitectureOverview({ architecture }: ArchitectureOverviewProps) {
  return (
    <Card className="space-y-6">
      <div className="space-y-2">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider block">
          Structural Architecture
        </span>
        <p className="text-xs text-[var(--foreground)] leading-relaxed font-sans">
          {architecture.overview}
        </p>
      </div>

      {architecture.dataFlow && (
        <div className="space-y-2 pt-4 border-t border-[var(--border-muted)]">
          <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider block">
            Data &amp; Control Flow
          </span>
          <p className="text-xs text-[var(--foreground)] leading-relaxed font-sans">
            {architecture.dataFlow}
          </p>
        </div>
      )}

      {architecture.components.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-[var(--border-muted)]">
          <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider block">
            Core Modules &amp; Subsystems
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {architecture.components.map((comp) => (
              <div
                key={comp.name}
                className="p-3 rounded-md bg-[var(--surface-muted)] border border-[var(--border-muted)] space-y-1.5"
              >
                <h4 className="text-xs font-bold text-[var(--foreground)] font-mono">
                  {comp.name}
                </h4>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  {comp.description}
                </p>
                {comp.relevantPaths.length > 0 && (
                  <div className="pt-1 text-[11px] font-mono text-[var(--accent)] truncate">
                    {comp.relevantPaths.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { RepositoryAnalysis } from '@/features/repository-analysis/types';

export interface RepositoryOverviewProps {
  summary: RepositoryAnalysis['repositorySummary'];
}

export function RepositoryOverview({ summary }: RepositoryOverviewProps) {
  return (
    <Card className="space-y-4">
      <div className="space-y-1.5">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider block">
          Primary Purpose
        </span>
        <p className="text-sm text-[var(--foreground)] leading-relaxed font-sans">
          {summary.purpose}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[var(--border-muted)] text-xs">
        {summary.audience && (
          <div>
            <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider block mb-1">
              Target Audience
            </span>
            <p className="text-[var(--foreground)]">{summary.audience}</p>
          </div>
        )}

        {summary.maturity && (
          <div>
            <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider block mb-1">
              Project Maturity
            </span>
            <div>
              <Badge variant="outline" size="sm" className="capitalize">
                {summary.maturity}
              </Badge>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

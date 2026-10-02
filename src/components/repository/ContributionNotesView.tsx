import React from 'react';
import { Card } from '@/components/ui/Card';
import type { RepositoryAnalysis } from '@/features/repository-analysis/types';

export interface ContributionNotesViewProps {
  notes: RepositoryAnalysis['contributionNotes'];
}

export function ContributionNotesView({ notes }: ContributionNotesViewProps) {
  const hasContent =
    notes.contributionProcess ||
    notes.testingExpectations.length > 0 ||
    notes.styleExpectations.length > 0 ||
    notes.importantWarnings.length > 0;

  if (!hasContent) {
    return (
      <p className="text-xs text-[var(--muted)] italic">
        No explicit contribution guidelines or test commands were detected in repository root.
      </p>
    );
  }

  return (
    <Card className="space-y-5">
      {notes.contributionProcess && (
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider block">
            Contribution Process
          </span>
          <p className="text-xs text-[var(--foreground)] leading-relaxed bg-[var(--surface-muted)] p-3 rounded-md border border-[var(--border-muted)]">
            {notes.contributionProcess}
          </p>
        </div>
      )}

      {notes.testingExpectations.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider block">
            Testing Expectations
          </span>
          <ul className="list-disc list-inside text-xs text-[var(--foreground)] space-y-1">
            {notes.testingExpectations.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {notes.styleExpectations.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider block">
            Style &amp; Linting Conventions
          </span>
          <ul className="list-disc list-inside text-xs text-[var(--foreground)] space-y-1">
            {notes.styleExpectations.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {notes.importantWarnings.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-[var(--border-muted)]">
          <span className="text-xs font-semibold text-[var(--danger)] uppercase tracking-wider block">
            Important Warnings
          </span>
          <ul className="list-disc list-inside text-xs text-[var(--danger)] space-y-1">
            {notes.importantWarnings.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

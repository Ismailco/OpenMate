import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export interface RecommendationEmptyStateProps {
  status: 'no-open-issues' | 'no-suitable-issues';
  explanation?: string;
  repositoryUrl?: string;
}

export function RecommendationEmptyState({
  status,
  explanation,
  repositoryUrl,
}: RecommendationEmptyStateProps) {
  if (status === 'no-open-issues') {
    return (
      <Card variant="muted" className="p-8 text-center space-y-4 max-w-2xl mx-auto my-6">
        <div className="w-12 h-12 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto text-xl text-[var(--muted-foreground)]">
          &empty;
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">
            No open contribution issues found
          </h3>
          <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed max-w-lg mx-auto">
            This repository currently has no open GitHub issues available for OpenMate to match against your profile.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button href="/start" variant="primary" size="sm">
            Try another repository
          </Button>
          {repositoryUrl && (
            <a
              href={repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)] text-xs font-mono hover:text-[var(--foreground)] transition-colors"
            >
              <span>View repository on GitHub</span>
              <span aria-hidden="true">&nearr;</span>
            </a>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card variant="muted" className="p-8 text-center space-y-4 max-w-2xl mx-auto my-6">
      <div className="w-12 h-12 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto text-xl text-[var(--accent)]">
        &bull;
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">
          No strong match found
        </h3>
        <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed max-w-lg mx-auto">
          {explanation ||
            'OpenMate found open issues, but none had enough evidence to recommend confidently for your current profile.'}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Button href="/start" variant="primary" size="sm">
          Edit my profile
        </Button>
        <Link
          href="/start"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)] text-xs font-mono hover:text-[var(--foreground)] transition-colors"
        >
          Try another repository
        </Link>
      </div>
    </Card>
  );
}

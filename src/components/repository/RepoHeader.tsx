import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { DemoRepositoryAnalysis } from '@/data/demo-repository';

export interface RepoHeaderProps {
  repository: DemoRepositoryAnalysis['repository'];
  matchedProfile?: DemoRepositoryAnalysis['matchedProfile'];
}

export function RepoHeader({ repository, matchedProfile }: RepoHeaderProps) {
  return (
    <div className="border-b border-[var(--border)] pb-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-[var(--muted)]">Repository Analysis</span>
            <span className="text-[var(--border)]" aria-hidden="true">•</span>
            <Badge variant="accent" size="sm">{repository.primaryLanguage}</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-[var(--foreground)]">
            <span className="text-[var(--muted)]">{repository.owner}/</span>
            <span>{repository.name}</span>
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1.5 max-w-3xl leading-relaxed">
            {repository.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[var(--muted)]">
          <span className="px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--surface)]">
            ★ {repository.stars.toLocaleString()}
          </span>
          <span className="px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--surface)]">
            ⑂ {repository.forks.toLocaleString()}
          </span>
          <a
            href={repository.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--surface)] hover:text-[var(--foreground)] hover:border-[var(--muted)] transition-colors inline-flex items-center gap-1"
          >
            <span>View on GitHub</span>
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>

      {matchedProfile && (
        <div className="mt-4 pt-4 border-t border-[var(--border-muted)] flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[var(--muted-foreground)]">Tailored for:</span>
          {matchedProfile.skills.map((skill) => (
            <Badge key={skill} variant="outline" size="sm">
              {skill}
            </Badge>
          ))}
          <Badge variant="muted" size="sm">
            {matchedProfile.experienceLevel} level
          </Badge>
          <Badge variant="muted" size="sm">
            ~{matchedProfile.availableHours}h budget
          </Badge>
        </div>
      )}
    </div>
  );
}

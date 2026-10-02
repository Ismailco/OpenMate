'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { RepositoryMetadata } from '@/features/github/types';
import { DeveloperProfile } from '@/features/developer-profile/types';
import { CONTRIBUTION_EXPERIENCES } from '@/features/developer-profile/constants';

export interface RepoHeaderProps {
  repository: RepositoryMetadata;
  profile?: DeveloperProfile;
  onReset?: () => void;
}

export function RepoHeader({ repository, profile, onReset }: RepoHeaderProps) {
  const experienceLabel = profile
    ? CONTRIBUTION_EXPERIENCES.find((e) => e.value === profile.contributionExperience)?.label ??
      profile.contributionExperience
    : null;

  return (
    <header className="border-b border-[var(--border)] pb-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-[var(--muted)]">Repository Analysis</span>
            <span className="text-[var(--border)]" aria-hidden="true">
              &bull;
            </span>
            {repository.primaryLanguage && (
              <Badge variant="accent" size="sm">
                {repository.primaryLanguage}
              </Badge>
            )}
            <Badge variant="outline" size="sm">
              Analyzed with Gemma
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-[var(--foreground)] break-words">
            <span className="text-[var(--muted)]">{repository.owner}/</span>
            <span>{repository.name}</span>
          </h1>
          {repository.description && (
            <p className="text-sm text-[var(--muted)] mt-1.5 max-w-3xl leading-relaxed">
              {repository.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[var(--muted)]">
          <span className="px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--surface)]">
            ★ {repository.stars.toLocaleString()}
          </span>
          <span className="px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--surface)]">
            ⑂ {repository.forks.toLocaleString()}
          </span>
          <a
            href={repository.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--surface)] hover:text-[var(--foreground)] hover:border-[var(--muted)] transition-colors inline-flex items-center gap-1"
          >
            <span>View on GitHub</span>
            <span aria-hidden="true">&nearr;</span>
          </a>
          {onReset ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onReset}
              className="text-xs font-mono ml-auto sm:ml-0"
            >
              &larr; Analyze Another
            </Button>
          ) : (
            <Link
              href="/start"
              className="px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--surface)] hover:text-[var(--foreground)] transition-colors text-xs font-mono ml-auto sm:ml-0"
            >
              &larr; Analyze Another
            </Link>
          )}
        </div>
      </div>

      {profile && (
        <div className="mt-4 pt-4 border-t border-[var(--border-muted)] flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[var(--muted-foreground)] font-semibold">Tailored for:</span>
          {profile.skills.map((skill) => (
            <Badge key={skill.name} variant="outline" size="sm">
              {skill.name} ({skill.level})
            </Badge>
          ))}
          {experienceLabel && (
            <Badge variant="muted" size="sm">
              {experienceLabel}
            </Badge>
          )}
          <Badge variant="muted" size="sm">
            ~{profile.availableHours}h budget
          </Badge>
        </div>
      )}
    </header>
  );
}

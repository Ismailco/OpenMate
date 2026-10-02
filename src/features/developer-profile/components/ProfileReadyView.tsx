'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { DeveloperProfile } from '../types';
import { CONTRIBUTION_EXPERIENCES, CONTRIBUTION_INTERESTS } from '../constants';

export interface AnalysisErrorViewModel {
  code: string;
  message: string;
}

export interface ProfileReadyViewProps {
  profile: DeveloperProfile;
  status?: 'ready' | 'analyzing' | 'error';
  error?: AnalysisErrorViewModel | null;
  onEdit: () => void;
  onAnalyze?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
  onChangeRepository?: () => void;
}

export function ProfileReadyView({
  profile,
  status = 'ready',
  error,
  onEdit,
  onAnalyze,
  onCancel,
  onRetry,
  onChangeRepository,
}: ProfileReadyViewProps) {
  const experienceLabel =
    CONTRIBUTION_EXPERIENCES.find(
      (e) => e.value === profile.contributionExperience
    )?.label ?? profile.contributionExperience;

  const isAnalyzing = status === 'analyzing';
  const isError = status === 'error';

  return (
    <div className="space-y-6" aria-live="polite">
      {/* Dynamic Status Alert */}
      {isError && error ? (
        <div
          role="alert"
          id="analysis-error-summary"
          tabIndex={-1}
          className="p-4 rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)] text-[var(--foreground)] space-y-3 focus:outline-none"
        >
          <div className="flex items-center gap-2 text-[var(--danger)] font-semibold text-sm">
            <span aria-hidden="true">⚠</span>
            <span>Analysis Request Failed</span>
          </div>
          <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
            {error.message}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {onRetry && (
              <Button type="button" variant="primary" size="sm" onClick={onRetry}>
                Try Again
              </Button>
            )}
            <Button type="button" variant="outline" size="sm" onClick={onEdit}>
              Edit Profile
            </Button>
            {onChangeRepository && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onChangeRepository}
              >
                Choose Another Repository
              </Button>
            )}
          </div>
        </div>
      ) : isAnalyzing ? (
        <div
          role="status"
          aria-live="polite"
          className="p-4 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--foreground)] space-y-3"
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-4 h-4 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin"
              aria-hidden="true"
            />
            <span className="font-semibold text-xs text-[var(--foreground)]">
              Analyzing {profile.repository.owner}/{profile.repository.name}...
            </span>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
            OpenMate is reading the bounded repository context and matching open issues to your contribution profile.
            This reasoning process evaluates repository structure and runs Google Gemma.
          </p>
          <div className="pt-1">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="text-xs"
              >
                Cancel Analysis
              </Button>
            )}
          </div>
        </div>
      ) : (
        <InlineAlert variant="success" title="Profile Ready">
          Your contribution profile and target repository have been validated and normalized.
        </InlineAlert>
      )}

      {/* Profile Review Card */}
      <Card className="border-[var(--accent)]/40 bg-[var(--surface)]">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-mono text-[var(--accent)] font-semibold uppercase tracking-wider">
              Normalized Contribution Profile
            </span>
            <Badge variant="accent" size="sm">
              {isAnalyzing ? 'Analyzing...' : 'Ready for Analysis'}
            </Badge>
          </div>
          <CardTitle as="h2" className="text-xl font-mono text-[var(--foreground)]">
            {profile.repository.owner}/{profile.repository.name}
          </CardTitle>
          <p className="text-xs font-mono text-[var(--muted)]">
            <a
              href={profile.repository.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline text-[var(--accent)]"
            >
              {profile.repository.url} ↗
            </a>
          </p>
        </CardHeader>

        <CardContent className="space-y-6 divide-y divide-[var(--border-muted)]">
          {/* Skills */}
          <div className="pt-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] block mb-2">
              Declared Technologies ({profile.skills.length})
            </span>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <div
                  key={skill.name}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--surface-muted)] text-xs font-mono"
                >
                  <span className="text-[var(--foreground)]">{skill.name}</span>
                  <span className="text-[var(--border)]" aria-hidden="true">&bull;</span>
                  <span className="text-[var(--accent)] font-sans capitalize">{skill.level}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div className="pt-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] block mb-2">
              Contribution Focus Areas ({profile.interests.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {profile.interests.map((interest) => {
                const item = CONTRIBUTION_INTERESTS.find((i) => i.value === interest);
                return (
                  <Badge key={interest} variant="outline" size="sm">
                    {item?.label ?? interest}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Experience & Time Budget */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] block mb-1">
                Open-Source Experience
              </span>
              <p className="font-medium text-[var(--foreground)]">{experienceLabel}</p>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] block mb-1">
                Available Time Budget
              </span>
              <p className="font-mono font-medium text-[var(--foreground)]">
                {profile.availableHours} {profile.availableHours === 1 ? 'hour' : 'hours'}
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[var(--border-muted)]">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onEdit}
            disabled={isAnalyzing}
            className="w-full sm:w-auto"
          >
            &larr; Edit Profile
          </Button>

          <div className="flex flex-col items-center sm:items-end gap-1 w-full sm:w-auto">
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={onAnalyze}
              disabled={isAnalyzing}
              aria-busy={isAnalyzing}
              className="w-full sm:w-auto"
            >
              {isAnalyzing ? 'Analyzing Repository...' : 'Analyze Repository'}
            </Button>
            {!isAnalyzing && (
              <span className="text-[11px] text-[var(--muted-foreground)] text-center sm:text-right">
                Runs deterministic context extraction and Google Gemma reasoning.
              </span>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

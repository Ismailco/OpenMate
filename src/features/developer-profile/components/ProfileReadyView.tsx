'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { DeveloperProfile } from '../types';
import { CONTRIBUTION_EXPERIENCES, CONTRIBUTION_INTERESTS } from '../constants';

export interface ProfileReadyViewProps {
  profile: DeveloperProfile;
  onEdit: () => void;
}

export function ProfileReadyView({ profile, onEdit }: ProfileReadyViewProps) {
  const experienceLabel =
    CONTRIBUTION_EXPERIENCES.find(
      (e) => e.value === profile.contributionExperience
    )?.label ?? profile.contributionExperience;

  return (
    <div className="space-y-6" aria-live="polite">
      <InlineAlert variant="success" title="Profile Ready">
        Your contribution profile and target repository have been validated and normalized.
      </InlineAlert>

      <Card className="border-[var(--accent)]/40 bg-[var(--surface)]">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-mono text-[var(--accent)] font-semibold uppercase tracking-wider">
              Normalized Contribution Profile
            </span>
            <Badge variant="accent" size="sm">Ready for Analysis</Badge>
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
                  <span className="text-[var(--border)]" aria-hidden="true">•</span>
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
            className="w-full sm:w-auto"
          >
            ← Edit Profile
          </Button>

          <div className="flex flex-col items-center sm:items-end gap-1 w-full sm:w-auto">
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled
              aria-disabled="true"
              className="w-full sm:w-auto opacity-60 cursor-not-allowed"
            >
              Analyze Repository
            </Button>
            <span className="text-[11px] text-[var(--muted-foreground)] text-center sm:text-right">
              Repository analysis is added in the next implementation phase (Phase 3+).
            </span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ContributionRecommendation } from '@/features/contribution-recommendations';

export interface RecommendationCardProps {
  recommendation: ContributionRecommendation;
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const [expanded, setExpanded] = useState(false);

  const {
    issueNumber,
    title,
    url,
    fit,
    scope,
    likelyFiles,
    conceptsToUnderstand,
    startingPoint,
    cautions,
  } = recommendation;

  const experienceFitLabel =
    fit.experienceFit === 'good'
      ? 'Good fit'
      : fit.experienceFit === 'stretch'
      ? 'Stretch'
      : 'Uncertain scope';

  const scopeLabel =
    scope.level === 'small'
      ? 'Small scope'
      : scope.level === 'medium'
      ? 'Medium scope'
      : scope.level === 'large'
      ? 'Large scope'
      : 'Unknown scope';

  return (
    <Card className="border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-muted)] transition-colors">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-[var(--muted-foreground)]">
              #{issueNumber}
            </span>
            <Badge variant="outline" size="sm">
              {scopeLabel}
            </Badge>
            <Badge variant={fit.experienceFit === 'good' ? 'accent' : 'muted'} size="sm">
              {experienceFitLabel}
            </Badge>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-[var(--accent)] hover:underline inline-flex items-center gap-1"
          >
            <span>View on GitHub</span>
            <span aria-hidden="true">&nearr;</span>
          </a>
        </div>

        <CardTitle as="h3" className="text-base sm:text-lg font-bold text-[var(--foreground)] break-words">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Why it matches */}
        <div className="text-xs sm:text-sm">
          <span className="font-semibold text-[var(--foreground)] block mb-1">
            Why this matches you:
          </span>
          <p className="text-[var(--muted)] leading-relaxed">{fit.summary}</p>
        </div>

        {/* Skills */}
        {fit.relevantSkills.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-[var(--muted-foreground)] mr-1">Skills:</span>
            {fit.relevantSkills.map((skill) => (
              <Badge key={skill} variant="outline" size="sm">
                {skill}
              </Badge>
            ))}
          </div>
        )}

        {/* Expandable starting point and file details */}
        <div className="pt-2 border-t border-[var(--border-muted)]">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            className="text-xs font-mono text-[var(--accent)] p-0 hover:bg-transparent"
          >
            {expanded ? '▲ Hide guide & files' : '▼ View starting guide & likely files'}
          </Button>

          {expanded && (
            <div className="mt-3 space-y-4 pt-3 border-t border-[var(--border-muted)]">
              {/* Starting point */}
              <div className="p-3 rounded-md bg-[var(--surface-muted)] text-xs space-y-2">
                <span className="font-semibold text-[var(--foreground)] uppercase tracking-wider block">
                  Starting Point:
                </span>
                <p className="text-[var(--foreground)]">{startingPoint.summary}</p>
                {startingPoint.steps.length > 0 && (
                  <ol className="list-decimal list-inside space-y-1 text-[var(--muted)]">
                    {startingPoint.steps.map((step, idx) => (
                      <li key={idx}>
                        <span className="text-[var(--foreground)]">{step}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              {/* Likely files */}
              {likelyFiles.length > 0 && (
                <div className="space-y-1.5 text-xs">
                  <span className="font-semibold text-[var(--muted-foreground)] block">
                    Likely Files:
                  </span>
                  <ul className="space-y-1">
                    {likelyFiles.map((file) => (
                      <li key={file.path} className="font-mono text-[var(--foreground)]">
                        <code className="text-[var(--accent)]">{file.path}</code> -{' '}
                        <span className="text-[var(--muted)] font-sans">{file.reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Concepts */}
              {conceptsToUnderstand.length > 0 && (
                <div className="space-y-1 text-xs">
                  <span className="font-semibold text-[var(--muted-foreground)] block">
                    Key Concepts:
                  </span>
                  <ul className="list-disc list-inside text-[var(--muted)] space-y-0.5">
                    {conceptsToUnderstand.map((c, i) => (
                      <li key={i}>
                        <span className="text-[var(--foreground)]">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Cautions */}
              {cautions.length > 0 && (
                <div className="space-y-1 text-xs">
                  <span className="font-semibold text-[var(--muted-foreground)] block">Caveats:</span>
                  <ul className="list-disc list-inside text-[var(--muted)] space-y-0.5">
                    {cautions.map((c, i) => (
                      <li key={i}>
                        <span className="text-[var(--foreground)]">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

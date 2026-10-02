import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ContributionRecommendation } from '@/features/contribution-recommendations';

export interface PrimaryRecommendationProps {
  recommendation: ContributionRecommendation;
}

export function PrimaryRecommendation({ recommendation }: PrimaryRecommendationProps) {
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
    <Card className="border-[var(--accent)]/50 bg-[var(--surface)] shadow-md relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--accent)]" aria-hidden="true" />
      <div className="pl-1 sm:pl-2">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="accent" size="sm">
                Primary Recommendation
              </Badge>
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
              className="text-xs font-mono font-medium text-[var(--accent)] hover:underline inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-muted)] hover:border-[var(--accent)] transition-colors"
            >
              <span>View issue on GitHub</span>
              <span aria-hidden="true">&nearr;</span>
            </a>
          </div>

          <CardTitle as="h2" className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)] break-words">
            {title}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 pt-2">
          {/* Why this fits you */}
          <div className="text-sm">
            <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider block mb-1.5">
              Why This Fits You
            </span>
            <p className="text-[var(--foreground)] leading-relaxed">{fit.summary}</p>
          </div>

          {/* Relevant Skills and Interests */}
          <div className="flex flex-wrap gap-4 pt-2 border-t border-[var(--border-muted)]">
            {fit.relevantSkills.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider block mb-1.5">
                  Relevant Skills
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {fit.relevantSkills.map((skill) => (
                    <Badge key={skill} variant="outline" size="sm">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {fit.matchedInterests.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider block mb-1.5">
                  Matched Interests
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {fit.matchedInterests.map((interest) => (
                    <Badge key={interest} variant="muted" size="sm">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider block mb-1.5">
                Scope Rationale
              </span>
              <p className="text-xs text-[var(--muted)] leading-relaxed max-w-xl">
                {scope.reasoning}
              </p>
            </div>
          </div>

          {/* Suggested Starting Point (High Visual Prominence) */}
          <div className="p-4 sm:p-5 rounded-lg bg-[var(--surface-muted)]/70 border border-[var(--accent)]/30 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-[var(--accent)] uppercase tracking-wider">
                Start Here
              </span>
            </div>
            <p className="text-sm font-medium text-[var(--foreground)] leading-relaxed">
              {startingPoint.summary}
            </p>
            {startingPoint.steps.length > 0 && (
              <ol className="space-y-2 list-decimal list-inside text-xs sm:text-sm text-[var(--muted-foreground)] pt-1">
                {startingPoint.steps.map((step, idx) => (
                  <li key={idx} className="leading-relaxed pl-1">
                    <span className="text-[var(--foreground)]">{step}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Likely Files Involved */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider block">
              Likely Files Involved
            </span>
            {likelyFiles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {likelyFiles.map((file) => (
                  <div
                    key={file.path}
                    className="p-3 rounded-md bg-[var(--surface-muted)] border border-[var(--border-muted)] text-xs font-mono"
                  >
                    <code className="text-[var(--accent)] font-semibold break-all block mb-1">
                      {file.path}
                    </code>
                    <p className="text-[var(--muted)] font-sans text-xs leading-relaxed">
                      {file.reason}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--muted)] italic">
                The available repository context was not sufficient to identify specific files confidently.
              </p>
            )}
          </div>

          {/* Concepts to Understand */}
          {conceptsToUnderstand.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider block mb-1.5">
                Concepts to Understand
              </span>
              <ul className="list-disc list-inside text-xs text-[var(--muted)] space-y-1">
                {conceptsToUnderstand.map((concept, idx) => (
                  <li key={idx}>
                    <span className="text-[var(--foreground)]">{concept}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cautions */}
          {cautions.length > 0 && (
            <div className="p-3.5 rounded-md bg-[var(--surface-muted)] border border-[var(--border)] space-y-1.5">
              <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider block">
                Caveats &amp; Considerations
              </span>
              <ul className="list-disc list-inside text-xs text-[var(--muted)] space-y-1">
                {cautions.map((caution, idx) => (
                  <li key={idx}>
                    <span className="text-[var(--foreground)]">{caution}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}

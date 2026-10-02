import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DemoRecommendedIssue } from '@/data/demo-repository';

export interface IssueCardProps {
  issue: DemoRecommendedIssue;
  isPrimary?: boolean;
}

export function IssueCard({ issue, isPrimary = false }: IssueCardProps) {
  const difficultyVariant =
    issue.difficulty === 'beginner'
      ? 'accent'
      : issue.difficulty === 'intermediate'
      ? 'default'
      : 'warning';

  return (
    <Card className={isPrimary ? 'border-[var(--accent)]/30' : undefined}>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[var(--muted-foreground)]">
              #{issue.number}
            </span>
            <Badge variant={difficultyVariant} size="sm">
              {issue.difficulty}
            </Badge>
            <Badge variant="outline" size="sm">
              {issue.estimatedScope}
            </Badge>
          </div>
          <a
            href={issue.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-[var(--accent)] hover:underline inline-flex items-center gap-0.5"
          >
            <span>GitHub Issue</span>
            <span aria-hidden="true">↗</span>
          </a>
        </div>

        <CardTitle as="h3" className="text-base sm:text-lg">
          {issue.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Why it fits you */}
        <div className="text-xs sm:text-sm">
          <span className="font-semibold text-[var(--foreground)] block mb-1">
            Why this fits your background:
          </span>
          <p className="text-[var(--muted)] leading-relaxed">{issue.fitReason}</p>
        </div>

        {/* Relevant skills */}
        <div>
          <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider block mb-1.5">
            Relevant Skills
          </span>
          <div className="flex flex-wrap gap-1.5">
            {issue.relevantSkills.map((skill) => (
              <Badge key={skill} variant="muted" size="sm">
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        {/* Likely files */}
        <div>
          <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider block mb-1.5">
            Likely Files Involved
          </span>
          <ul className="flex flex-wrap gap-2">
            {issue.likelyFiles.map((file) => (
              <li key={file}>
                <code className="text-xs font-mono px-2 py-0.5 rounded-sm bg-[var(--surface-muted)] text-[var(--foreground)] border border-[var(--border)]">
                  {file}
                </code>
              </li>
            ))}
          </ul>
        </div>

        {/* Concepts to understand */}
        {issue.conceptsToUnderstand.length > 0 && (
          <div>
            <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider block mb-1.5">
              Concepts to Understand
            </span>
            <ul className="list-disc list-inside text-xs text-[var(--muted)] space-y-0.5">
              {issue.conceptsToUnderstand.map((concept, idx) => (
                <li key={idx}>
                  <span className="text-[var(--foreground)]">{concept}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggested Starting Point */}
        <div className="pt-3 border-t border-[var(--border-muted)] bg-[var(--surface-muted)]/40 -mx-5 -mb-5 p-4 rounded-b-lg">
          <span className="text-xs font-semibold text-[var(--accent)] tracking-wide uppercase block mb-1">
            Suggested Starting Point
          </span>
          <p className="text-xs text-[var(--foreground)] leading-relaxed font-mono">
            {issue.suggestedStartingPoint}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

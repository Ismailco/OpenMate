import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { RepositoryTechnology } from '@/features/repository-analysis/types';

export interface TechnologyListProps {
  technologies: RepositoryTechnology[];
}

export function TechnologyList({ technologies }: TechnologyListProps) {
  if (technologies.length === 0) {
    return (
      <p className="text-xs text-[var(--muted)] italic">
        No specific technology signatures detected from repository manifests.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {technologies.map((tech) => (
        <Card
          key={`${tech.category}-${tech.name}`}
          variant="muted"
          className="p-3.5 space-y-2"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-sm text-[var(--foreground)] font-mono">
              {tech.name}
            </span>
            <Badge variant="outline" size="sm">
              {tech.category}
            </Badge>
          </div>
          {tech.evidence.length > 0 && (
            <div className="text-[11px] text-[var(--muted)] font-mono truncate">
              evidence: {tech.evidence.join(', ')}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

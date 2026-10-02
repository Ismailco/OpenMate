import React from 'react';
import { Card } from '@/components/ui/Card';
import type { RepositoryAnalysis } from '@/features/repository-analysis/types';

export interface GlossaryListProps {
  glossary: RepositoryAnalysis['glossary'];
}

export function GlossaryList({ glossary }: GlossaryListProps) {
  if (glossary.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {glossary.map((item) => (
        <Card key={item.term} variant="muted" className="p-4 space-y-1">
          <h4 className="text-sm font-semibold text-[var(--foreground)] font-mono">
            {item.term}
          </h4>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            {item.explanation}
          </p>
        </Card>
      ))}
    </div>
  );
}

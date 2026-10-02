import React from 'react';
import { Card } from '@/components/ui/Card';
import { DemoRepositoryAnalysis } from '@/data/demo-repository';

export interface GlossaryListProps {
  glossary: DemoRepositoryAnalysis['glossary'];
}

export function GlossaryList({ glossary }: GlossaryListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {glossary.map((item) => (
        <Card key={item.term} variant="muted" className="p-4">
          <h4 className="text-sm font-semibold text-[var(--foreground)] mb-1 font-mono">
            {item.term}
          </h4>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            {item.definition}
          </p>
        </Card>
      ))}
    </div>
  );
}

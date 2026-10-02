import React from 'react';
import { Card } from '@/components/ui/Card';
import { DemoRepositoryAnalysis } from '@/data/demo-repository';

export interface ArchitectureOverviewProps {
  architecture: DemoRepositoryAnalysis['architecture'];
}

export function ArchitectureOverview({ architecture }: ArchitectureOverviewProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--foreground)] leading-relaxed">
        {architecture.overview}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
        {architecture.keyModules.map((module) => (
          <Card key={module.name} variant="muted" className="p-4">
            <span className="text-xs font-mono text-[var(--accent)] block mb-1">
              {module.path}
            </span>
            <h4 className="text-sm font-semibold text-[var(--foreground)] mb-1">
              {module.name}
            </h4>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              {module.description}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}

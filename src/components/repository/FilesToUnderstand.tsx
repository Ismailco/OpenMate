import React from 'react';
import { Badge } from '@/components/ui/Badge';
import type { RepositoryAnalysis } from '@/features/repository-analysis/types';

export interface FilesToUnderstandProps {
  files: RepositoryAnalysis['filesToUnderstand'];
}

export function FilesToUnderstand({ files }: FilesToUnderstandProps) {
  if (files.length === 0) {
    return (
      <p className="text-xs text-[var(--muted)] italic">
        No specific core entrypoint files were prioritized for initial exploration.
      </p>
    );
  }

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--surface)]">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[var(--surface-muted)] border-b border-[var(--border)] text-[var(--muted-foreground)] uppercase tracking-wider font-mono">
            <tr>
              <th scope="col" className="px-4 py-2.5">
                File Path
              </th>
              <th scope="col" className="px-4 py-2.5">
                Role in Project
              </th>
              <th scope="col" className="px-4 py-2.5">
                Priority
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-muted)]">
            {files.map((file) => (
              <tr key={file.path} className="hover:bg-[var(--surface-muted)]/50 transition-colors">
                <td className="px-4 py-3 font-mono font-medium text-[var(--foreground)] break-all">
                  {file.path}
                </td>
                <td className="px-4 py-3 text-[var(--muted)] leading-relaxed">
                  {file.reason}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge
                    variant={file.priority === 'high' ? 'accent' : 'outline'}
                    size="sm"
                  >
                    {file.priority}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { DemoFileToUnderstand } from '@/data/demo-repository';

export interface FilesToUnderstandProps {
  files: DemoFileToUnderstand[];
}

export function FilesToUnderstand({ files }: FilesToUnderstandProps) {
  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--surface)]">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[var(--surface-muted)] border-b border-[var(--border)] text-[var(--muted-foreground)] uppercase tracking-wider font-mono">
            <tr>
              <th scope="col" className="px-4 py-2.5">File Path</th>
              <th scope="col" className="px-4 py-2.5">Role in Project</th>
              <th scope="col" className="px-4 py-2.5">Priority</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-muted)]">
            {files.map((file) => (
              <tr key={file.path} className="hover:bg-[var(--surface-muted)]/50 transition-colors">
                <td className="px-4 py-3 font-mono font-medium text-[var(--foreground)]">
                  {file.path}
                </td>
                <td className="px-4 py-3 text-[var(--muted)] leading-relaxed">
                  {file.role}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge
                    variant={file.importance === 'critical' ? 'accent' : 'outline'}
                    size="sm"
                  >
                    {file.importance}
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

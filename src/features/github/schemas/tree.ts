import { z } from 'zod';
import { RepositoryTreeEntry } from '../types';

export const GitHubTreeItemSchema = z.object({
  path: z.string(),
  mode: z.string(),
  type: z.enum(['blob', 'tree', 'commit']),
  size: z.number().optional(),
  sha: z.string().optional(),
});

export const GitHubTreeResponseSchema = z.object({
  sha: z.string().optional(),
  truncated: z.boolean().default(false),
  tree: z.array(GitHubTreeItemSchema).default([]),
});

export type GitHubTreeResponse = z.infer<typeof GitHubTreeResponseSchema>;

export function mapTreeEntries(
  raw: GitHubTreeResponse,
  maxEntries: number
): { entries: RepositoryTreeEntry[]; isTruncated: boolean } {
  const isTruncated = raw.truncated || raw.tree.length > maxEntries;
  const filtered = raw.tree
    .filter((item) => item.type === 'blob' || item.type === 'tree')
    .slice(0, maxEntries)
    .map((item): RepositoryTreeEntry => ({
      path: item.path,
      type: item.type === 'blob' ? 'blob' : 'tree',
      size: item.size,
    }));

  return {
    entries: filtered,
    isTruncated,
  };
}

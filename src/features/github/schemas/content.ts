import { z } from 'zod';
import { DocumentSource, RepositoryDocument } from '../types';

export const GitHubContentResponseSchema = z.object({
  name: z.string(),
  path: z.string(),
  size: z.number(),
  type: z.string(),
  encoding: z.string().optional(),
  content: z.string().optional(),
  download_url: z.string().nullable().optional(),
});

export type GitHubContentResponse = z.infer<typeof GitHubContentResponseSchema>;

/**
 * Decodes base64 GitHub content payload defensively.
 */
export function decodeGitHubContent(
  raw: GitHubContentResponse,
  source: DocumentSource
): RepositoryDocument {
  let content = '';

  if (raw.content) {
    if (raw.encoding === 'base64') {
      try {
        // Remove line breaks added by GitHub's base64 encoding
        const cleaned = raw.content.replace(/\r?\n/g, '');
        content = Buffer.from(cleaned, 'base64').toString('utf-8');
      } catch {
        content = '';
      }
    } else {
      content = raw.content;
    }
  }

  return {
    path: raw.path,
    content,
    size: raw.size,
    source,
  };
}

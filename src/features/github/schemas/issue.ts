import { z } from 'zod';
import { RepositoryIssue } from '../types';

export const GitHubLabelSchema = z.union([
  z.string(),
  z.object({
    id: z.number().optional(),
    name: z.string(),
    description: z.string().nullable().optional(),
    color: z.string().optional(),
  }),
]);

export const GitHubIssueItemSchema = z.object({
  number: z.number(),
  title: z.string(),
  body: z.string().nullable().optional(),
  html_url: z.string().url(),
  labels: z.array(GitHubLabelSchema).default([]),
  state: z.string().default('open'),
  created_at: z.string(),
  updated_at: z.string(),
  comments: z.number().default(0),
  // GitHub returns this key on issues that are actually pull requests
  pull_request: z.record(z.string(), z.unknown()).optional(),
});

export const GitHubIssuesResponseSchema = z.array(GitHubIssueItemSchema);

export type GitHubIssueItem = z.infer<typeof GitHubIssueItemSchema>;

export function mapRepositoryIssues(
  rawList: GitHubIssueItem[],
  maxIssues: number
): { issues: RepositoryIssue[]; isTruncated: boolean } {
  // Exclude pull requests
  const pureIssues = rawList.filter((item) => !item.pull_request);
  const isTruncated = pureIssues.length > maxIssues;

  const issues = pureIssues.slice(0, maxIssues).map((item): RepositoryIssue => {
    const labels = item.labels.map((l) => (typeof l === 'string' ? l : l.name));
    return {
      number: item.number,
      title: item.title,
      body: item.body ?? null,
      htmlUrl: item.html_url,
      labels,
      state: item.state,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      commentsCount: item.comments,
    };
  });

  return {
    issues,
    isTruncated,
  };
}

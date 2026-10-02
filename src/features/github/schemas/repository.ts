import { z } from 'zod';
import { RepositoryMetadata } from '../types';

export const GitHubRepositoryResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  description: z.string().nullable().optional(),
  default_branch: z.string().default('main'),
  language: z.string().nullable().optional(),
  topics: z.array(z.string()).default([]),
  stargazers_count: z.number().default(0),
  forks_count: z.number().default(0),
  open_issues_count: z.number().default(0),
  archived: z.boolean().default(false),
  fork: z.boolean().default(false),
  license: z
    .object({
      spdx_id: z.string().nullable().optional(),
      name: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  html_url: z.string().url(),
  owner: z.object({
    login: z.string(),
  }),
});

export type GitHubRepositoryResponse = z.infer<typeof GitHubRepositoryResponseSchema>;

export function mapRepositoryMetadata(
  raw: GitHubRepositoryResponse
): RepositoryMetadata {
  return {
    id: raw.id,
    owner: raw.owner.login,
    name: raw.name,
    fullName: raw.full_name,
    description: raw.description ?? null,
    defaultBranch: raw.default_branch,
    primaryLanguage: raw.language ?? null,
    topics: raw.topics,
    stars: raw.stargazers_count,
    forks: raw.forks_count,
    openIssuesCount: raw.open_issues_count,
    isArchived: raw.archived,
    isFork: raw.fork,
    license: raw.license?.spdx_id ?? raw.license?.name ?? null,
    htmlUrl: raw.html_url,
  };
}

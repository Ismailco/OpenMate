import { z } from 'zod';

export const ContextDocumentKindSchema = z.enum([
  'readme',
  'contributing',
  'manifest',
  'source',
]);

export const ContextDocumentSchema = z.object({
  path: z.string(),
  content: z.string(),
  originalBytes: z.number().int().nonnegative(),
  includedCharacters: z.number().int().nonnegative(),
  truncated: z.boolean(),
  kind: ContextDocumentKindSchema,
  trust: z.literal('untrusted-repository-content'),
});

export const ManifestSummarySchema = z.object({
  path: z.string(),
  kind: z.string(),
  packageName: z.string().optional(),
  scripts: z.array(z.string()).optional(),
  workspaces: z.array(z.string()).optional(),
  topDependencies: z.array(z.string()).optional(),
});

export const ContextFileSchema = ContextDocumentSchema.extend({
  manifestMeta: ManifestSummarySchema.optional(),
});

export const ContextIssueSchema = z.object({
  number: z.number().int().positive(),
  title: z.string(),
  body: z.string(),
  labels: z.array(z.string()),
  htmlUrl: z.string().url(),
  commentsCount: z.number().int().nonnegative(),
  truncated: z.boolean(),
  isGoodFirstIssue: z.boolean(),
  isHelpWanted: z.boolean(),
  trust: z.literal('untrusted-repository-content'),
});

export const ProjectStructureSchema = z.object({
  treeSummary: z.string(),
  topDirectories: z.array(z.string()),
  entrypointFiles: z.array(z.string()),
  totalFilesObserved: z.number().int().nonnegative(),
  truncated: z.boolean(),
});

export const RepositoryContextSchema = z.object({
  repository: z.object({
    owner: z.string(),
    name: z.string(),
    fullName: z.string(),
    description: z.string().nullable(),
    defaultBranch: z.string(),
    primaryLanguage: z.string().nullable(),
    topics: z.array(z.string()),
    license: z.string().nullable(),
    stars: z.number().int().nonnegative(),
    forks: z.number().int().nonnegative(),
  }),
  documentation: z.object({
    readme: ContextDocumentSchema.optional(),
    contributing: ContextDocumentSchema.optional(),
  }),
  projectStructure: ProjectStructureSchema,
  manifests: z.array(ContextFileSchema),
  sourceFiles: z.array(ContextFileSchema),
  issues: z.array(ContextIssueSchema),
  contextMetadata: z.object({
    generatedAt: z.string(),
    sourceFilesIncluded: z.number().int().nonnegative(),
    issuesIncluded: z.number().int().nonnegative(),
    truncatedDocuments: z.number().int().nonnegative(),
    truncatedFiles: z.number().int().nonnegative(),
    truncatedIssues: z.number().int().nonnegative(),
    approximateCharacters: z.number().int().nonnegative(),
  }),
  trust: z.literal('untrusted-repository-content'),
});

export type ValidatedRepositoryContext = z.infer<typeof RepositoryContextSchema>;

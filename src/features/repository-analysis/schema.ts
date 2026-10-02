import { z } from 'zod';

export const TechnologyCategorySchema = z.enum([
  'language',
  'framework',
  'library',
  'database',
  'tooling',
  'infrastructure',
  'other',
]);

export const FilePrioritySchema = z.enum(['high', 'medium', 'low']);

export const RepositoryMaturitySchema = z.enum([
  'early-stage',
  'established',
  'unknown',
]);

export const RepositoryTechnologySchema = z.object({
  name: z.string().min(1).max(100),
  category: TechnologyCategorySchema,
  evidence: z.array(z.string().min(1).max(300)).max(10).default([]),
});

export const ArchitectureComponentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  relevantPaths: z.array(z.string().min(1).max(300)).max(10).default([]),
});

export const FileToUnderstandSchema = z.object({
  path: z.string().min(1).max(300),
  reason: z.string().min(1).max(500),
  priority: FilePrioritySchema,
});

export const LocalSetupGuideSchema = z.object({
  prerequisites: z.array(z.string().min(1).max(300)).max(15).default([]),
  steps: z.array(z.string().min(1).max(300)).max(15).default([]),
  caveats: z.array(z.string().min(1).max(500)).max(10).default([]),
});

export const ProjectGlossaryTermSchema = z.object({
  term: z.string().min(1).max(100),
  explanation: z.string().min(1).max(500),
});

export const ContributionNotesSchema = z.object({
  contributionProcess: z.string().max(2000).nullable().default(null),
  testingExpectations: z.array(z.string().min(1).max(500)).max(10).default([]),
  styleExpectations: z.array(z.string().min(1).max(500)).max(10).default([]),
  importantWarnings: z.array(z.string().min(1).max(500)).max(10).default([]),
});

/**
 * Raw model output schema before metadata injection.
 */
export const RawRepositoryAnalysisSchema = z.object({
  repositorySummary: z.object({
    purpose: z.string().min(10).max(2000),
    audience: z.string().max(500).nullable().default(null),
    maturity: RepositoryMaturitySchema.nullable().default(null),
  }),
  technologies: z.array(RepositoryTechnologySchema).max(20).default([]),
  architecture: z.object({
    overview: z.string().min(10).max(3000),
    components: z.array(ArchitectureComponentSchema).max(12).default([]),
    dataFlow: z.string().max(2000).nullable().default(null),
  }),
  filesToUnderstand: z.array(FileToUnderstandSchema).max(12).default([]),
  localSetup: LocalSetupGuideSchema,
  glossary: z.array(ProjectGlossaryTermSchema).max(20).default([]),
  contributionNotes: ContributionNotesSchema,
});

export type RawRepositoryAnalysis = z.infer<typeof RawRepositoryAnalysisSchema>;

/**
 * Complete application-level RepositoryAnalysis schema with metadata.
 */
export const RepositoryAnalysisSchema = RawRepositoryAnalysisSchema.extend({
  analysisMetadata: z.object({
    modelProvider: z.string().min(1),
    modelName: z.string().min(1),
    analyzedAt: z.string().datetime(),
  }),
});

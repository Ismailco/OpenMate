import { RepositoryContext } from '../../repository-context/types';
import { RawRepositoryAnalysis } from '../schema';
import { FileToUnderstand } from '../types';

/**
 * Extracts a normalized set of all valid file and directory paths present in the repository context.
 */
export function extractKnownContextPaths(context: RepositoryContext): Set<string> {
  const paths = new Set<string>();

  const addPathAndAncestors = (p: string) => {
    const normalized = p.trim().replace(/^\/+|\/+$/g, '');
    if (!normalized) return;
    paths.add(normalized);

    // Also add ancestor directory paths so that e.g. "src" or "src/components" is recognized
    const segments = normalized.split('/');
    let current = '';
    for (let i = 0; i < segments.length - 1; i++) {
      current = current ? `${current}/${segments[i]}` : segments[i]!;
      paths.add(current);
    }
  };

  if (context.documentation.readme?.path) {
    addPathAndAncestors(context.documentation.readme.path);
  }
  if (context.documentation.contributing?.path) {
    addPathAndAncestors(context.documentation.contributing.path);
  }

  for (const manifest of context.manifests) {
    addPathAndAncestors(manifest.path);
  }

  for (const file of context.sourceFiles) {
    addPathAndAncestors(file.path);
  }

  for (const entrypoint of context.projectStructure.entrypointFiles) {
    addPathAndAncestors(entrypoint);
  }

  for (const dir of context.projectStructure.topDirectories) {
    addPathAndAncestors(dir);
  }

  // Parse lines from treeSummary
  const treeLines = context.projectStructure.treeSummary.split('\n');
  for (const line of treeLines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('...')) {
      const cleaned = trimmed.replace(/\/$/, '');
      if (cleaned) {
        addPathAndAncestors(cleaned);
      }
    }
  }

  return paths;
}

/**
 * Sanitizes and validates AI-generated repository analysis against real repository context paths.
 * Removes hallucinated paths and ensures filesToUnderstand has grounded recommendations.
 */
export function validateAnalysisPaths(
  rawAnalysis: RawRepositoryAnalysis,
  context: RepositoryContext
): RawRepositoryAnalysis {
  const knownPaths = extractKnownContextPaths(context);

  const isKnownPath = (candidate: string): boolean => {
    const clean = candidate.trim().replace(/^\/+|\/+$/g, '');
    return knownPaths.has(clean);
  };

  // 1. Sanitize technologies evidence (must be genuine repository paths)
  const sanitizedTechnologies = rawAnalysis.technologies.map((tech) => ({
    ...tech,
    evidence: tech.evidence.filter(isKnownPath),
  }));

  // 2. Sanitize architecture components relevantPaths
  const sanitizedComponents = rawAnalysis.architecture.components.map((comp) => ({
    ...comp,
    relevantPaths: comp.relevantPaths.filter(isKnownPath),
  }));

  // 3. Sanitize filesToUnderstand: remove fictional files and deduplicate
  const seenPaths = new Set<string>();
  const sanitizedFiles: FileToUnderstand[] = [];

  for (const file of rawAnalysis.filesToUnderstand) {
    const cleanPath = file.path.trim().replace(/^\/+|\/+$/g, '');
    if (isKnownPath(cleanPath) && !seenPaths.has(cleanPath)) {
      seenPaths.add(cleanPath);
      sanitizedFiles.push({
        path: cleanPath,
        reason: file.reason,
        priority: file.priority,
      });
    }
  }

  // If model returned only hallucinated paths or none at all, fallback to genuine context entrypoints
  if (sanitizedFiles.length === 0) {
    if (context.documentation.readme) {
      sanitizedFiles.push({
        path: context.documentation.readme.path,
        reason: 'Project entry point and general overview.',
        priority: 'high',
      });
      seenPaths.add(context.documentation.readme.path);
    }

    for (const sourceFile of context.sourceFiles.slice(0, 3)) {
      if (!seenPaths.has(sourceFile.path)) {
        sanitizedFiles.push({
          path: sourceFile.path,
          reason: 'Core representative source code file.',
          priority: 'high',
        });
        seenPaths.add(sourceFile.path);
      }
    }
  }

  return {
    ...rawAnalysis,
    technologies: sanitizedTechnologies,
    architecture: {
      ...rawAnalysis.architecture,
      components: sanitizedComponents,
    },
    filesToUnderstand: sanitizedFiles,
  };
}

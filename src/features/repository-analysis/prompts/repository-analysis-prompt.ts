import { RepositoryContext } from '../../repository-context/types';
import { serializeRepositoryContext } from '../../repository-context/serialize-context';

export function buildRepositoryAnalysisUserPrompt(
  context: RepositoryContext
): string {
  const serializedContext = serializeRepositoryContext(context);

  return `Please analyze the following repository context and produce the structured RepositoryAnalysis JSON object according to your system instructions.

Ground all technologies, architectural components, and filesToUnderstand entries in real paths from the repository context.

${serializedContext}`;
}

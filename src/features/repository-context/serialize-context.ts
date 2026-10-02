import { CONTEXT_BUDGETS } from './budgets';
import { RepositoryContext } from './types';

/**
 * Escapes XML-sensitive characters in untrusted repository content
 * to prevent delimiter injection or tag breakouts.
 */
export function escapeXmlContent(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Serializes a RepositoryContext into a structured, injection-safe, XML-like representation.
 * All untrusted content is strictly delimited and XML-escaped so that malicious prompts or
 * simulated tags (e.g. </repository_context>) inside repository files cannot break out of data blocks.
 *
 * Guarantees that the output length never exceeds CONTEXT_BUDGETS.TOTAL_CONTEXT_CHARACTERS.
 */
export function serializeRepositoryContext(context: RepositoryContext): string {
  const parts: string[] = [];

  parts.push('<repository_context trust="untrusted-repository-content">');

  // 1. Repository metadata
  parts.push('  <metadata>');
  parts.push(`    <full_name>${escapeXmlContent(context.repository.fullName)}</full_name>`);
  parts.push(`    <default_branch>${escapeXmlContent(context.repository.defaultBranch)}</default_branch>`);
  if (context.repository.primaryLanguage) {
    parts.push(`    <primary_language>${escapeXmlContent(context.repository.primaryLanguage)}</primary_language>`);
  }
  if (context.repository.description) {
    parts.push(`    <description>${escapeXmlContent(context.repository.description)}</description>`);
  }
  if (context.repository.license) {
    parts.push(`    <license>${escapeXmlContent(context.repository.license)}</license>`);
  }
  parts.push(`    <stars>${context.repository.stars}</stars>`);
  parts.push(`    <forks>${context.repository.forks}</forks>`);
  if (context.repository.topics.length > 0) {
    parts.push(`    <topics>${escapeXmlContent(context.repository.topics.join(', '))}</topics>`);
  }
  parts.push('  </metadata>');

  // 2. Project structure summary
  parts.push('  <project_structure>');
  parts.push(`    <tree_summary>\n${escapeXmlContent(context.projectStructure.treeSummary)}\n    </tree_summary>`);
  if (context.projectStructure.topDirectories.length > 0) {
    parts.push(`    <top_directories>${escapeXmlContent(context.projectStructure.topDirectories.join(', '))}</top_directories>`);
  }
  parts.push('  </project_structure>');

  // 3. Documentation
  if (context.documentation.readme || context.documentation.contributing) {
    parts.push('  <documentation>');
    if (context.documentation.readme) {
      parts.push(`    <document kind="readme" path="${escapeXmlContent(context.documentation.readme.path)}" truncated="${context.documentation.readme.truncated}">`);
      parts.push(escapeXmlContent(context.documentation.readme.content));
      parts.push('    </document>');
    }
    if (context.documentation.contributing) {
      parts.push(`    <document kind="contributing" path="${escapeXmlContent(context.documentation.contributing.path)}" truncated="${context.documentation.contributing.truncated}">`);
      parts.push(escapeXmlContent(context.documentation.contributing.content));
      parts.push('    </document>');
    }
    parts.push('  </documentation>');
  }

  // 4. Manifests
  if (context.manifests.length > 0) {
    parts.push('  <manifests>');
    for (const manifest of context.manifests) {
      parts.push(`    <manifest path="${escapeXmlContent(manifest.path)}" truncated="${manifest.truncated}">`);
      parts.push(escapeXmlContent(manifest.content));
      parts.push('    </manifest>');
    }
    parts.push('  </manifests>');
  }

  // 5. Representative source files
  if (context.sourceFiles.length > 0) {
    parts.push('  <source_files>');
    for (const source of context.sourceFiles) {
      parts.push(`    <source_file path="${escapeXmlContent(source.path)}" truncated="${source.truncated}">`);
      parts.push(escapeXmlContent(source.content));
      parts.push('    </source_file>');
    }
    parts.push('  </source_files>');
  }

  // 6. Open issues
  if (context.issues.length > 0) {
    parts.push('  <issues>');
    for (const issue of context.issues) {
      parts.push(`    <issue number="${issue.number}" good_first="${issue.isGoodFirstIssue}" help_wanted="${issue.isHelpWanted}">`);
      parts.push(`      <title>${escapeXmlContent(issue.title)}</title>`);
      if (issue.labels.length > 0) {
        parts.push(`      <labels>${escapeXmlContent(issue.labels.join(', '))}</labels>`);
      }
      if (issue.body) {
        parts.push(`      <body>${escapeXmlContent(issue.body)}</body>`);
      }
      parts.push('    </issue>');
    }
    parts.push('  </issues>');
  }

  parts.push('</repository_context>');

  let serialized = parts.join('\n');

  // Hard global budget guardrail
  if (serialized.length > CONTEXT_BUDGETS.TOTAL_CONTEXT_CHARACTERS) {
    const closingTag = '\n</repository_context>';
    const cutPoint = CONTEXT_BUDGETS.TOTAL_CONTEXT_CHARACTERS - closingTag.length - 60;
    serialized = serialized.slice(0, cutPoint) + '\n<!-- Global context budget ceiling reached -->' + closingTag;
  }

  return serialized;
}

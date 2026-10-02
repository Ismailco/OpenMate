import { RepositoryTreeEntry } from '../github/types';
import { isNoisePath } from '../github/ingestion/content-filter';
import { CONTEXT_BUDGETS } from './budgets';
import { ProjectStructure } from './types';

interface TreeNode {
  name: string;
  isDir: boolean;
  children: Map<string, TreeNode>;
}

export function summarizeRepositoryTree(
  treeEntries: RepositoryTreeEntry[]
): ProjectStructure {
  const filtered = treeEntries.filter((e) => !isNoisePath(e.path));
  const totalFilesObserved = filtered.filter((e) => e.type === 'blob').length;

  const topDirs = new Set<string>();
  const entrypoints: string[] = [];

  // Build tree data structure
  const root: TreeNode = { name: '/', isDir: true, children: new Map() };

  let totalEntriesCounted = 0;
  let isTruncated = false;

  // Sort paths alphabetically for determinism
  const sortedEntries = [...filtered].sort((a, b) => a.path.localeCompare(b.path));

  for (const entry of sortedEntries) {
    const parts = entry.path.split('/');
    if (parts.length > 0 && parts[0]) {
      if (parts.length > 1) {
        topDirs.add(parts[0]);
      } else if (entry.type === 'tree') {
        topDirs.add(parts[0]);
      }
    }

    if (
      parts.length <= 2 &&
      /^(index|main|app|page)\.[a-zA-Z0-9]+$/i.test(parts[parts.length - 1] ?? '')
    ) {
      entrypoints.push(entry.path);
    }

    // Skip paths deeper than TREE_MAX_DEPTH
    if (parts.length > CONTEXT_BUDGETS.TREE_MAX_DEPTH) {
      isTruncated = true;
      continue;
    }

    if (totalEntriesCounted >= CONTEXT_BUDGETS.TREE_MAX_ENTRIES) {
      isTruncated = true;
      continue;
    }

    totalEntriesCounted++;

    let curr = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;
      const isDir = i < parts.length - 1 || entry.type === 'tree';

      if (!curr.children.has(part)) {
        curr.children.set(part, {
          name: part,
          isDir,
          children: new Map(),
        });
      }
      curr = curr.children.get(part)!;
    }
  }

  // Format indented string representation
  const lines: string[] = ['/'];

  function renderNode(node: TreeNode, depth: number) {
    const indent = '  '.repeat(depth);
    const sortedKeys = Array.from(node.children.keys()).sort();

    for (const key of sortedKeys) {
      const child = node.children.get(key)!;
      if (child.isDir) {
        lines.push(`${indent}${child.name}/`);
        renderNode(child, depth + 1);
      } else {
        lines.push(`${indent}${child.name}`);
      }
    }
  }

  renderNode(root, 1);

  if (isTruncated) {
    lines.push('  [... structural tree entries truncated for brevity ...]');
  }

  let treeSummary = lines.join('\n');
  if (treeSummary.length > CONTEXT_BUDGETS.TREE_SUMMARY_MAX_CHARACTERS) {
    treeSummary = treeSummary.slice(0, CONTEXT_BUDGETS.TREE_SUMMARY_MAX_CHARACTERS) + '\n  [...]';
    isTruncated = true;
  }

  return {
    treeSummary,
    topDirectories: Array.from(topDirs).sort(),
    entrypointFiles: entrypoints.slice(0, 5),
    totalFilesObserved,
    truncated: isTruncated,
  };
}

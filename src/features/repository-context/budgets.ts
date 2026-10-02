export const CONTEXT_BUDGETS = {
  /** Global maximum characters for serialized repository context */
  TOTAL_CONTEXT_CHARACTERS: 60_000,

  /** Maximum characters allocated for the README document */
  README_MAX_CHARACTERS: 10_000,

  /** Maximum characters allocated for CONTRIBUTING guide */
  CONTRIBUTING_MAX_CHARACTERS: 6_000,

  /** Maximum cumulative characters across all project manifests */
  MANIFESTS_TOTAL_CHARACTERS: 6_000,

  /** Maximum characters for any individual manifest */
  INDIVIDUAL_MANIFEST_CHARACTERS: 3_000,

  /** Maximum characters allocated for the repository tree summary */
  TREE_SUMMARY_MAX_CHARACTERS: 3_000,

  /** Maximum depth of directories to include in tree summary */
  TREE_MAX_DEPTH: 3,

  /** Maximum entries to display in tree summary */
  TREE_MAX_ENTRIES: 80,

  /** Maximum cumulative characters across all representative source files */
  SOURCE_FILES_TOTAL_CHARACTERS: 16_000,

  /** Maximum characters for any individual source file */
  INDIVIDUAL_SOURCE_FILE_CHARACTERS: 4_000,

  /** Maximum cumulative characters across all normalized issues */
  ISSUES_TOTAL_CHARACTERS: 8_000,

  /** Maximum number of open issues to include in context */
  MAX_ISSUES_INCLUDED: 15,

  /** Maximum characters for an individual issue body */
  INDIVIDUAL_ISSUE_BODY_CHARACTERS: 600,

  /** Safety margin for serialization tags and structural overhead */
  SERIALIZATION_SAFETY_MARGIN: 2_000,
} as const;

export const TRUNCATION_MARKER = '\n\n[... content truncated by OpenMate ...]\n\n';

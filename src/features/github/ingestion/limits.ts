export const GITHUB_LIMITS = {
  /** Maximum number of tree entries to parse from git/trees */
  MAX_TREE_ENTRIES: 3_000,

  /** Maximum bytes for README content */
  MAX_README_BYTES: 256 * 1024, // 256 KB

  /** Maximum bytes for CONTRIBUTING content */
  MAX_CONTRIBUTING_BYTES: 128 * 1024, // 128 KB

  /** Maximum bytes for any individual source or manifest file */
  MAX_INDIVIDUAL_FILE_BYTES: 128 * 1024, // 128 KB

  /** Maximum number of representative source files to fetch */
  MAX_SOURCE_FILES: 8,

  /** Maximum cumulative bytes across all selected source files */
  MAX_CUMULATIVE_SOURCE_BYTES: 384 * 1024, // 384 KB

  /** Maximum number of open issues to ingest */
  MAX_ISSUES_FETCHED: 50,

  /** Default timeout in milliseconds for outbound GitHub API calls */
  REQUEST_TIMEOUT_MS: 10_000, // 10s

  /** Concurrency cap for parallel file content requests */
  CONCURRENCY_LIMIT: 4,
} as const;

import path from 'path';

export type ManifestKind =
  | 'node'
  | 'python'
  | 'rust'
  | 'go'
  | 'ruby'
  | 'php'
  | 'java'
  | 'docker'
  | 'other';

const ROOT_MANIFEST_KINDS: Record<string, ManifestKind> = {
  'package.json': 'node',
  'tsconfig.json': 'node',
  'Cargo.toml': 'rust',
  'go.mod': 'go',
  'pyproject.toml': 'python',
  'requirements.txt': 'python',
  'Gemfile': 'ruby',
  'composer.json': 'php',
  'pom.xml': 'java',
  'build.gradle': 'java',
  'build.gradle.kts': 'java',
  'Dockerfile': 'docker',
  'docker-compose.yml': 'docker',
  'docker-compose.yaml': 'docker',
};

const LOCKFILE_NAMES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'Cargo.lock',
  'composer.lock',
  'poetry.lock',
  'Pipfile.lock',
  'mix.lock',
]);

/**
 * Returns true if the file is a lockfile that should be detected but not downloaded.
 */
export function isLockfile(filePath: string): boolean {
  const baseName = path.basename(filePath);
  return LOCKFILE_NAMES.has(baseName);
}

/**
 * Returns the manifest kind if the file is a recognized configuration or manifest, or null.
 */
export function getManifestKind(filePath: string): ManifestKind | null {
  const baseName = path.basename(filePath);

  if (ROOT_MANIFEST_KINDS[baseName]) {
    return ROOT_MANIFEST_KINDS[baseName];
  }

  return null;
}

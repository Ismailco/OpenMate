import path from 'path';

// File extensions that are typically binary or media
const BINARY_EXTENSIONS = new Set([
  // Images
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.ico',
  '.bmp',
  '.tiff',
  '.avif',
  // Documents & Archives
  '.pdf',
  '.zip',
  '.tar',
  '.gz',
  '.tgz',
  '.7z',
  '.rar',
  '.bz2',
  // Fonts
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.otf',
  // Audio & Video
  '.mp3',
  '.mp4',
  '.mov',
  '.avi',
  '.wav',
  '.webm',
  '.ogg',
  // Binaries & Bytecode
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.bin',
  '.wasm',
  '.pyc',
  '.pyo',
  '.class',
  '.jar',
  '.o',
  '.obj',
  '.a',
  '.lib',
  '.iso',
  '.dmg',
]);

// Directory prefixes that are generated, vendored, or cache artifacts
const NOISE_DIRECTORIES = [
  'node_modules/',
  'vendor/',
  'dist/',
  'build/',
  '.next/',
  '.turbo/',
  'coverage/',
  'target/',
  'bin/',
  'obj/',
  '.cache/',
  '.git/',
  'out/',
  '.nuxt/',
  '.venv/',
  'env/',
  '__pycache__/',
  '.svelte-kit/',
  '.docusaurus/',
];

/**
 * Returns true if a file path belongs to a generated, vendored, or noise directory.
 */
export function isNoisePath(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  return NOISE_DIRECTORIES.some(
    (dir) => normalized === dir.slice(0, -1) || normalized.startsWith(dir) || normalized.includes(`/${dir}`)
  );
}

/**
 * Returns true if a file extension indicates a binary/media format.
 */
export function isBinaryExtension(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return BINARY_EXTENSIONS.has(ext);
}

/**
 * Returns true if a file appears to be a minified bundle or sourcemap.
 */
export function isMinifiedOrBundle(filePath: string): boolean {
  const lower = filePath.toLowerCase();
  return (
    lower.endsWith('.min.js') ||
    lower.endsWith('.min.css') ||
    lower.endsWith('.map') ||
    lower.endsWith('.bundle.js') ||
    lower.endsWith('.chunk.js')
  );
}

/**
 * Returns true if a file path is suitable for textual source inspection.
 */
export function isEligibleSourceFile(filePath: string): boolean {
  if (isNoisePath(filePath)) return false;
  if (isBinaryExtension(filePath)) return false;
  if (isMinifiedOrBundle(filePath)) return false;
  return true;
}

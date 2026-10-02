import { describe, it, expect } from 'vitest';
import {
  isBinaryExtension,
  isNoisePath,
  isMinifiedOrBundle,
  isEligibleSourceFile,
} from '../ingestion/content-filter';

describe('content-filter', () => {
  it('identifies binary media and compiled extensions', () => {
    expect(isBinaryExtension('image.png')).toBe(true);
    expect(isBinaryExtension('photo.JPG')).toBe(true);
    expect(isBinaryExtension('manual.pdf')).toBe(true);
    expect(isBinaryExtension('app.exe')).toBe(true);
    expect(isBinaryExtension('font.woff2')).toBe(true);
    expect(isBinaryExtension('archive.tar.gz')).toBe(true);
    expect(isBinaryExtension('lib.so')).toBe(true);
    expect(isBinaryExtension('bytecode.pyc')).toBe(true);

    // Textual extensions should return false
    expect(isBinaryExtension('index.ts')).toBe(false);
    expect(isBinaryExtension('main.py')).toBe(false);
    expect(isBinaryExtension('lib.rs')).toBe(false);
    expect(isBinaryExtension('README.md')).toBe(false);
  });

  it('identifies noise, vendored, and generated directories', () => {
    expect(isNoisePath('node_modules/react/index.js')).toBe(true);
    expect(isNoisePath('dist/bundle.js')).toBe(true);
    expect(isNoisePath('.next/server/pages.js')).toBe(true);
    expect(isNoisePath('coverage/lcov-report/index.html')).toBe(true);
    expect(isNoisePath('vendor/bundle/gems/rack.rb')).toBe(true);
    expect(isNoisePath('.git/HEAD')).toBe(true);
    expect(isNoisePath('target/debug/app')).toBe(true);
    expect(isNoisePath('packages/core/dist/index.js')).toBe(true);

    // Legitimate paths should return false
    expect(isNoisePath('src/components/Button.tsx')).toBe(false);
    expect(isNoisePath('lib/parser.ts')).toBe(false);
    expect(isNoisePath('app/page.tsx')).toBe(false);
  });

  it('identifies minified bundles and sourcemaps', () => {
    expect(isMinifiedOrBundle('bundle.min.js')).toBe(true);
    expect(isMinifiedOrBundle('styles.min.css')).toBe(true);
    expect(isMinifiedOrBundle('index.js.map')).toBe(true);
    expect(isMinifiedOrBundle('vendor.bundle.js')).toBe(true);

    expect(isMinifiedOrBundle('src/index.ts')).toBe(false);
    expect(isMinifiedOrBundle('src/utils.js')).toBe(false);
  });

  it('determines source file eligibility correctly', () => {
    expect(isEligibleSourceFile('src/index.ts')).toBe(true);
    expect(isEligibleSourceFile('app/layout.tsx')).toBe(true);
    expect(isEligibleSourceFile('lib/engine.rs')).toBe(true);

    // Should reject noise, binaries, and minified
    expect(isEligibleSourceFile('node_modules/pkg/index.js')).toBe(false);
    expect(isEligibleSourceFile('assets/logo.png')).toBe(false);
    expect(isEligibleSourceFile('public/app.min.js')).toBe(false);
  });
});

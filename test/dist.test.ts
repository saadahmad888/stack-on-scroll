import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import pkg from '../package.json' with { type: 'json' };

/** React components can be functions, classes, or forwardRef objects. */
function isComponent(value: unknown): boolean {
  return typeof value === 'function' || (typeof value === 'object' && value !== null);
}

/**
 * These assertions run against `dist/`, not `src/`. Every one of them exists
 * because the previous release shipped the mistake it now catches.
 *
 * Run `npm run build` first — `npm run verify` does that for you.
 */
const built = existsSync('dist/index.js');
const suite = built ? describe : describe.skip;

const esm = built ? readFileSync('dist/index.js', 'utf8') : '';
const cjs = built ? readFileSync('dist/index.cjs', 'utf8') : '';

suite('built bundles', () => {
  it('opens with the use client directive so RSC accepts the components', () => {
    expect(esm.startsWith('"use client";')).toBe(true);
    expect(cjs.startsWith('"use client";')).toBe(true);
  });

  it('leaves react external instead of inlining it', () => {
    expect(esm).toMatch(/from\s*["']react["']/);
    expect(cjs).toMatch(/require\(["']react["']\)/);
  });

  it('leaves the JSX runtime external too', () => {
    // v1 bundled the development JSX runtime, which is how `process.env` got in.
    expect(esm).toMatch(/from\s*["']react\/jsx-runtime["']/);
    expect(cjs).toMatch(/require\(["']react\/jsx-runtime["']\)/);
  });

  it('never references process.env, which is undefined in the browser', () => {
    expect(esm).not.toContain('process.env');
    expect(cjs).not.toContain('process.env');
  });

  it('carries no copy of React internals', () => {
    for (const marker of ['react-jsx-runtime.development', 'ReactCurrentOwner', 'ReactSharedInternals']) {
      expect(esm).not.toContain(marker);
      expect(cjs).not.toContain(marker);
    }
  });

  it('stays small', () => {
    expect(Buffer.byteLength(esm)).toBeLessThan(10_000);
  });

  it('ships type declarations for both module systems', () => {
    expect(existsSync('dist/index.d.ts')).toBe(true);
    expect(existsSync('dist/index.d.cts')).toBe(true);
  });

  it('loads through require and exposes the v1 aliases', () => {
    const require = createRequire(import.meta.url);
    const mod = require('../dist/index.cjs');

    // forwardRef components are exotic objects, not plain functions.
    expect(isComponent(mod.StackCard)).toBe(true);
    expect(isComponent(mod.StackContainer)).toBe(true);
    expect(typeof mod.useStackProgress).toBe('function');
    expect(mod.Card).toBe(mod.StackCard);
    expect(mod.Outer).toBe(mod.StackContainer);
  });

  it('actually renders when imported as ESM', async () => {
    // Resolved at runtime rather than written as a literal: `dist/` does not
    // exist on a fresh checkout, and a literal specifier would make
    // `tsc --noEmit` fail before the build has ever run.
    const entry = pathToFileURL(resolve('dist/index.js')).href;
    const mod = await import(/* @vite-ignore */ entry);

    expect(typeof mod.computeProgress).toBe('function');
    expect(typeof mod.refreshStack).toBe('function');

    const html = renderToStaticMarkup(
      createElement(
        mod.StackContainer,
        { offset: 30 },
        createElement(mod.StackCard, null, 'one'),
        createElement(mod.StackCard, null, 'two'),
      ),
    );

    expect(html).toContain('position:sticky');
    expect(html).toContain('top:30px');
    expect(html).toContain('one');
    expect(html).toContain('two');
  });
});

describe('package manifest', () => {
  it('keeps the build toolchain out of runtime dependencies', () => {
    // v1 shipped rollup and its postcss plugin as production dependencies,
    // so installing the package pulled in an entire bundler.
    const manifest = pkg as Record<string, unknown>;
    expect(manifest.dependencies ?? {}).toEqual({});
  });

  it('declares react as a peer, not a bundled dependency', () => {
    expect(pkg.peerDependencies).toHaveProperty('react');
  });

  it('agrees with itself about the license', () => {
    const readme = readFileSync('README.md', 'utf8');
    expect(pkg.license).toBe('MIT');
    expect(readme).toContain('MIT');
    expect(readFileSync('LICENSE', 'utf8')).toContain('MIT License');
  });

  it('has keywords, so the registry can surface it', () => {
    expect(pkg.keywords.length).toBeGreaterThanOrEqual(5);
  });

  it('points every export condition at a file that exists', () => {
    const root = pkg.exports['.'];
    for (const entry of [root.import, root.require]) {
      expect(existsSync(entry.types.replace('./', ''))).toBe(built);
      expect(existsSync(entry.default.replace('./', ''))).toBe(built);
    }
  });

  it('declares a supported Node range', () => {
    expect(pkg.engines.node).toBe('>=20.19');
  });
});

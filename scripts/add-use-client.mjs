/**
 * Put `"use client"` at the top of every built bundle.
 *
 * The components use hooks and touch the DOM, so React Server Components has
 * to treat them as client code. esbuild drops module-level directives when it
 * bundles, and tsup's `banner` option does not survive minification, so the
 * only dependable place to add it back is here, after the build.
 *
 * The directive has to be the very first statement in the file. `"use strict"`
 * may follow it — both belong to the same directive prologue.
 */
import { readFile, writeFile } from 'node:fs/promises';

const DIRECTIVE = '"use client";';
const targets = ['dist/index.js', 'dist/index.cjs'];

let changed = 0;

for (const file of targets) {
  const source = await readFile(file, 'utf8');

  if (source.startsWith(DIRECTIVE) || source.startsWith("'use client';")) {
    continue;
  }

  await writeFile(file, `${DIRECTIVE}\n${source}`, 'utf8');
  changed++;
}

console.log(`use client: added to ${changed} of ${targets.length} bundles`);

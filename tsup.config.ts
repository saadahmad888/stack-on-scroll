import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm', 'cjs'],
  outExtension: ({ format }) => ({ js: format === 'cjs' ? '.cjs' : '.js' }),
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: true,
  target: 'es2020',
  // React must never end up inside the bundle. `react/jsx-runtime` is the one
  // that v1 accidentally inlined, which is what dragged in `process.env`.
  external: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
  // Must be the first statement in the file for Next.js to see it.
  // `"use client"` is added by scripts/add-use-client.mjs after the build:
  // esbuild drops module-level directives and tsup's banner does not
  // survive minification.
});

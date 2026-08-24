# Changelog

## 2.0.1

### Fixed

- **`useStackProgress` now typechecks under `@types/react` 18.** It returned
  `RefObject<T | null>`, which React 19's types accept but React 18's do not:
  React 18 measures `RefObject` as covariant, so the value was rejected
  anywhere a `RefObject<HTMLElement>` was expected. Passing the hook's ref to a
  `StackCard` failed to compile for every TypeScript user on React 18, despite
  the peer range claiming `>=18`. The return type is now
  `MutableRefObject<T | null>`, which both majors accept. Runtime behaviour is
  unchanged.
- **Added `test/types/consumer.tsx`**, a compile-only fixture covering the ref
  pattern that broke, and CI now installs matching `@types/react` and runs
  `tsc` for each React major. The previous React 18 job only ran the tests,
  which do not typecheck against 18 — which is how this shipped.

### Changed

- **`engines.node` raised from `>=20.19` to `>=22`.** Node 20 reached end of
  life on 30 April 2026. CI builds on 22, 24, and 26.

## 2.0.0

### Fixed

- **Removed `rollup`, `rollup-plugin-postcss`, and `@types/react` from
  `dependencies`.** Installing v1 pulled an entire bundler into your
  `node_modules`. They are dev dependencies now, and the package ships with no
  runtime dependencies at all.
- **Stopped bundling React's JSX runtime.** `rollup-plugin-peer-deps-external`
  was configured but had no `peerDependencies` to read, so `react/jsx-runtime`
  was never marked external and the development build of it was inlined into
  `dist`.
- **Removed the `process.env` reference** that came with that inlined runtime.
  It threw `process is not defined` in plain browser ESM and in some Vite
  setups.
- **Added `"use client"`.** The components use hooks, so React Server
  Components rejected them. Next.js App Router now works without a wrapper.
- **License now says MIT everywhere.** `package.json` said ISC while the README
  and LICENSE said MIT.
- **Fixed the package description**, which had two typos in the one line the
  registry shows in search results.

### Added

- **Keywords**, so the package is findable on npm at all.
- **Automatic card numbering.** `index` is optional; the container counts its
  children, including through fragments.
- **`offset`, `height`, and `inset` props.** The 25px stagger and `100vh` height
  were hardcoded. Any CSS unit works.
- **`scaleStep`, `fadeStep`, and `rotateStep`** for shrink, fade, and tilt as a
  card is covered. Off by default, so the zero-JavaScript path is preserved.
- **`stackFrom="bottom"`** to pin to the bottom edge and stack upward.
- **`prefers-reduced-motion` support**, on by default, overridable with
  `respectReducedMotion={false}`.
- **`useStackProgress`**, a hook that reports coverage from `0` to `1` without
  re-rendering, for effects the built-in props do not cover.
- **The `--sos-p` and `--sos-fade-p` custom properties** on animated cards, for
  driving your own CSS.
- **`as` prop** on both components.
- **Ref forwarding, `className` merging, and full DOM prop spreading.** v1
  dropped all of them, so a card could not be styled or targeted.
- **`exports` map** with correct types for both ESM and CJS, `sideEffects:
  false`, and an `engines` range.
- **A test suite**: 58 tests covering layout, numbering, the coverage maths,
  reduced motion, server rendering, and the built artifacts.

### Changed

- **React 18 is the minimum.** v1 declared no peer dependency and shipped React
  19's JSX runtime inside itself, so its real support range was never what it
  appeared to be.
- **`Outer` renders a `<div>` instead of a `<main>`.** Pass `as="main"` for the
  old markup.
- **No stylesheet is injected at runtime.** v1 pushed a global `.cardContainer`
  rule into the document. Those styles are inline on the element now. The class
  name is still applied so existing stylesheets keep working.
- **Renamed to `StackContainer` and `StackCard`.** `Outer` and `Card` remain as
  aliases with no removal planned.
- **Build target raised from ES5 to ES2020.**

## 1.0.5

Initial published series.

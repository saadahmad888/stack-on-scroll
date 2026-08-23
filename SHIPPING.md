# Ship checklist

Everything below was run in this session and passed. Run it again on your own
machine before you push — a green local run is the point of the exercise.

---

## 1. Drop the files in

The `dist/` folder in your zip is stale output from v1. Delete it and the old
build config; they are regenerated now.

```bash
cd stack-on-scroll

rm -rf dist node_modules package-lock.json
rm -f rollup.config.js .npmignore     # replaced by tsup.config.ts and "files"
rm -rf src                            # replaced wholesale

# copy the new tree in, then:
npm install
```

`.npmignore` is gone on purpose. The `files` array in `package.json` is an
allowlist, which fails safe — `.npmignore` is a denylist, and anything you
forget to add gets published.

---

## 2. Run the checks

```bash
npm run verify
```

That is typecheck → build → test → package lint, in that order. Expected:

```
tsc --noEmit                     no output
tsup                             ESM 4.8 kB, CJS 4.9 kB, .d.ts + .d.cts
use client: added to 2 of 2 bundles
Test Files  4 passed (4)
     Tests  58 passed (58)
publint                          All good!
attw --pack .                    No problems found
```

While you work: `npm run test:watch`.

**What the 58 tests cover.** Sticky offsets and stacking order, custom units,
bottom-stacking, auto-numbering (including through fragments and conditional
children), prop precedence between card and container, ref forwarding,
className merging, the coverage maths at exact coordinates, reduced-motion
behaviour, server rendering with no DOM globals, and the built artifacts
themselves.

That last group is the one that matters most. `test/dist.test.ts` reads
`dist/` and asserts: the `"use client"` directive leads both bundles, React and
`react/jsx-runtime` stay external, there is no `process.env`, no React
internals are inlined, and the CJS and ESM entry points both actually render.
Every one of those assertions exists because v1 shipped that exact mistake.

---

## 3. Look at it in a browser

This is the part no unit test can do for you. `demo.html` loads the **built
bundle**, not the source, so what you see is what you would publish.

```bash
npm run build
npx serve .        # then open http://localhost:3000/demo.html
```

Serve it over HTTP — ES modules will not load from a `file://` URL.

The page has live sliders for `offset`, `scaleStep`, `fadeStep`, and
`rotateStep`, plus toggles for `stackFrom` and `respectReducedMotion`. The
percentage on each card is driven by `useStackProgress`, so if those numbers
climb from 0 to 100 as you scroll, the hook works.

Check, in this order:

1. Cards stack with a visible sliver of each covered card.
2. Drag `offset` to 0 — cards should cover each other completely.
3. Drag `scaleStep` and `fadeStep` to 0 — motion stops entirely. Open DevTools,
   Performance monitor: no scroll handler should be firing.
4. Switch `stackFrom` to `bottom` — the fan should open upward.
5. Turn on reduced motion in your OS, reload. Scale and rotation stop, fading
   continues.
6. Narrow the window to phone width. Tab through the control panel and confirm
   the focus ring is visible.

**Be sceptical of the scroll feel specifically.** I have no browser here, so
the coverage maths is verified against exact numbers but the *look* of it is
not. If the scale timing feels off, `scaleStep` and the `transformOrigin` in
`StackCard.tsx` are the two knobs.

---

## 4. Test it inside a real app

Better than the demo for catching bundler and framework issues:

```bash
npm pack                    # → stack-on-scroll-2.0.0.tgz

cd ../some-next-app
npm install ../stack-on-scroll/stack-on-scroll-2.0.0.tgz
```

Install the tarball, not `npm link` — link resolves through a symlink and hides
exactly the packaging bugs you are trying to catch.

Worth trying in a Next.js App Router project specifically, since that is what
v1 could not do. Import `StackContainer` straight into a server component; it
should work with no `'use client'` wrapper of your own.

I ran this here against React 19: ESM import, CJS require, both render, the v1
`Outer`/`Card` aliases still resolve. The install pulls **4 packages** total
(react, react-dom, scheduler, stack-on-scroll). Installing v1's dependency set
pulls **116**.

---

## 5. Push

```bash
git checkout -b v2
git add -A
git commit -m "feat!: v2 — fix packaging, add effects and auto-numbering

Move rollup and postcss out of dependencies, mark react/jsx-runtime
external, add \"use client\", and correct the license and metadata.
Add configurable offset/height/inset, opt-in scale/fade/rotate,
automatic card numbering, and useStackProgress.

BREAKING CHANGE: requires React >=18; Outer renders a div rather than
a main; the runtime stylesheet is no longer injected."

git push -u origin v2
```

Open the PR and let CI run. The workflow tests Node 22, 24, and 26, and
separately runs the suite against both React 18 and React 19 to prove the
`>=18` peer range is honest.

Merge once it is green.

---

## 6. Set up trusted publishing

Do this once, before your first publish. It replaces the token entirely, which
matters right now: npm is restricting tokens that bypass 2FA — account changes
landed in August 2026 and direct publishing follows in January 2027.

1. Go to npmjs.com → your `stack-on-scroll` package → **Settings** → **Trusted
   publisher**.
2. Fill in:

   | Field | Value |
   | --- | --- |
   | Publisher | GitHub Actions |
   | Organization | `saadahmad888` |
   | Repository | `stack-on-scroll` |
   | Workflow filename | `release.yml` |
   | Environment | leave blank |

3. Save. No `NPM_TOKEN` secret is needed anywhere.

The release workflow already requests `id-token: write`, which is the
permission OIDC needs. You get provenance attestation for free — npm will show
a badge linking the published tarball to the exact commit and workflow run that
built it.

---

## 7. Publish

```bash
git checkout main && git pull

npm version major        # 1.0.5 → 2.0.0, commits and tags
git push --follow-tags
```

The tag push triggers `release.yml`, which reruns `npm run verify`, checks the
tag matches `package.json`, and publishes.

Then confirm:

```bash
npm view stack-on-scroll version        # 2.0.0
npm view stack-on-scroll dependencies   # {} — this is the big one
npm view stack-on-scroll keywords       # the search fix
```

Open the package page. You should see a TypeScript badge, a provenance badge,
the repository link, and keywords — none of which v1 had.

---

## If you need to publish by hand

```bash
npm login
npm run verify
npm publish
```

You will be prompted for 2FA. This works, but you lose the provenance
attestation, and the token path is on its way out. Prefer the workflow.

---

## Notes on two decisions

**Source maps.** The tarball is 20.8 kB packed, 95.9 kB unpacked, and 59 kB of
that is source maps. The code itself is under 10 kB. I kept them because they
make debugging your library inside someone else's app possible. If you would
rather trim it, set `sourcemap: false` in `tsup.config.ts`.

**Version 2.0.0, not 1.1.0.** Raising the React floor to 18 is a breaking change
for consumers even though almost nobody will be affected. The `Outer` element
change and the removal of the injected stylesheet are documented in
`CHANGELOG.md`. Migration for most projects is: change nothing.

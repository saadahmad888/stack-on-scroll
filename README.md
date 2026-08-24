# stack-on-scroll

Sticky scroll-stacking cards for React. Each card pins itself a little lower
than the one before it, so scrolling deals them into a fanned pile with every
card's top edge still showing.

**[See it running →](https://stack-on-scroll.vercel.app/)** — a live demo with sliders for
every prop, so you can feel what each one does before installing anything.

[![npm](https://img.shields.io/npm/v/stack-on-scroll)](https://www.npmjs.com/package/stack-on-scroll)
[![license](https://img.shields.io/npm/l/stack-on-scroll)](./LICENSE)

- **No runtime dependencies.** React is a peer, nothing else is installed.
- **No JavaScript on the default path.** The stacking is `position: sticky`.
  Effects are opt-in and only then does a frame loop start.
- **No CSS to import.** Everything is inline styles, so there is no stylesheet
  to forget and no global class name to collide with yours.
- **Works with SSR and React Server Components.** Nothing touches `window`
  during render and the bundles carry a `"use client"` directive.
- **~4.7 KB** minified, before gzip.

---

## Install

```bash
npm install stack-on-scroll
```

React 18 or newer. Node 22 or newer to build from source.

## Use it

```tsx
import { StackContainer, StackCard } from 'stack-on-scroll';

export default function Chapters() {
  return (
    <StackContainer offset={32}>
      <StackCard>
        <h2>First</h2>
      </StackCard>
      <StackCard>
        <h2>Second</h2>
      </StackCard>
      <StackCard>
        <h2>Third</h2>
      </StackCard>
    </StackContainer>
  );
}
```

Cards are numbered for you, so generating them from data needs nothing extra:

```tsx
<StackContainer offset={32}>
  {chapters.map((chapter) => (
    <StackCard key={chapter.id}>{chapter.title}</StackCard>
  ))}
</StackContainer>
```

## Add movement

Set any of these and cards animate as the next one slides over them. Leave them
alone and no scroll listener is ever attached.

```tsx
<StackContainer offset={28} scaleStep={0.06} fadeStep={0.35} rotateStep={-1.5}>
  {/* … */}
</StackContainer>
```

Each value is the total change applied by the time a card is fully covered:
`scaleStep={0.06}` finishes at 94% size, `fadeStep={0.35}` at 65% opacity.

All animated cards share one scroll listener and one animation frame, so a
twenty-card stack costs the same per frame as a two-card one.

## Props

Both components take the same layout and effect props. Anything set on a card
overrides the container.

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `offset` | `number \| string` | `25` | Gap between pinned edges — the visible sliver of each covered card |
| `height` | `number \| string` | `'100vh'` | Height of each card |
| `inset` | `number \| string` | `0` | Where the first card pins, measured from the viewport edge |
| `stackFrom` | `'top' \| 'bottom'` | `'top'` | Pin to the top and stack down, or the bottom and stack up |
| `scaleStep` | `number` | `0` | How far a card shrinks once fully covered |
| `fadeStep` | `number` | `0` | How far a card fades once fully covered |
| `rotateStep` | `number` | `0` | How far a card tilts, in degrees, once fully covered |
| `respectReducedMotion` | `boolean` | `true` | Skip scale and rotation when the reader prefers reduced motion. Fading still applies |
| `as` | `ElementType` | `'div'` | Element to render |

Numbers mean pixels. Strings pass through untouched, so `offset="2rem"` and
`height="100svh"` both work.

`StackCard` also takes:

| Prop | Type | What it does |
| --- | --- | --- |
| `index` | `number` | Set the position by hand instead of letting the container count |
| `innerClassName` | `string` | Class for the inner element that carries the transform |
| `innerStyle` | `CSSProperties` | Styles for that inner element |

Every other prop — `className`, `style`, `id`, `onClick`, `aria-*`, `ref` — goes
straight to the outer element.

## Styling

Two elements per card, both stable:

```html
<div class="sos-card cardContainer" style="position:sticky; top:50px; height:100vh">
  <div class="sos-card-inner">your children</div>
</div>
```

The outer element does the pinning. The inner element centres your content and
carries any transform, which keeps the measured box unscaled — measuring a
scaled box would feed the scale back into the maths and drift.

Style either one:

```css
.sos-card-inner {
  border-radius: 18px;
  box-shadow: 0 -8px 40px rgb(0 0 0 / 0.12);
}
```

`cardContainer` is kept from v1 so stylesheets written against the old version
keep working.

## Build your own effects

Animated cards publish their coverage as a custom property on the outer
element, from `0` to `1`:

```css
.sos-card-inner {
  filter: blur(calc(var(--sos-p, 0) * 4px));
}
```

For anything CSS cannot express, `useStackProgress` gives you the same number in
JavaScript. It runs inside the shared animation frame and never re-renders, so
you can write to the DOM from it directly:

```tsx
import { useStackProgress } from 'stack-on-scroll';

function Counter() {
  const labelRef = useRef<HTMLSpanElement>(null);

  const ref = useStackProgress<HTMLDivElement>({
    offset: 32,
    onProgress: (p) => {
      if (labelRef.current) labelRef.current.textContent = `${Math.round(p * 100)}%`;
    },
  });

  return (
    <StackCard ref={ref}>
      covered <span ref={labelRef}>0%</span>
    </StackCard>
  );
}
```

`refreshStack()` forces a recalculation if you change layout in a way scroll and
resize events would not catch.

## Notes

**Cards must be direct children of the container.** Sticky positioning is scoped
to the parent element, and coverage is measured against the next sibling. A
fragment is fine — the container looks through it — but a wrapper `<div>` is
not.

**Give the last card room.** The last card in a stack is never covered, so it
has nothing after it to scroll against.

**Next.js App Router** works with no ceremony; the bundles are marked as client
code. The components can be imported directly into a server component.

## Browser support

`position: sticky` is the only requirement, so anything from the last decade.
The effects use `getBoundingClientRect` and `requestAnimationFrame`, both
equally old. Nothing here needs a polyfill.

## Upgrading from v1

The old names still work and the default layout is unchanged, so most projects
need no edits:

```tsx
import { Card, Outer } from 'stack-on-scroll';

<Outer>
  <Card index={0}>…</Card>
  <Card index={1}>…</Card>
</Outer>;
```

Three things did change:

1. **React 18 is now the minimum.** v1 accidentally bundled React 19's JSX
   runtime, so its real support range was never what it claimed.
2. **`Outer` renders a `<div>`, not a `<main>`.** A library should not decide
   your page has its `<main>` here. Pass `as="main"` to get the old markup.
3. **No stylesheet is injected any more.** v1 pushed a global `.cardContainer`
   rule into the document at runtime; those styles are now inline on the
   element. Visually identical, but a `.cardContainer` rule of your own no
   longer has to fight it.

`index` is now optional. Dropping it lets the container do the counting.

## Contributing

```bash
npm install
npm run verify   # typecheck, build, test, and lint the package manifest
```

`npm run test:watch` while you work. `demo.html` opens in a browser with no
build step and exercises every prop against the built bundle — serve it over
HTTP, since ES modules will not load from `file://`:

```bash
npm run build
npx serve .        # http://localhost:3000/demo.html
```

The hosted version at [stack-on-scroll.vercel.app](https://stack-on-scroll.vercel.app/)
lives in [its own repository](https://github.com/saadahmad888/stacks).

## License

MIT © [Saad Ahmad](https://isaadahmad.com)

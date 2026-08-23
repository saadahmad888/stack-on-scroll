import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';

/**
 * jsdom has no layout engine: every `getBoundingClientRect` returns zeroes and
 * `requestAnimationFrame` is not driven by a compositor. These helpers let a
 * test place elements at chosen coordinates and step frames by hand, so the
 * coverage math can be checked against exact numbers.
 */

const rects = new WeakMap<Element, Partial<DOMRect>>();

/** Position an element as if the browser had laid it out. */
export function setRect(element: Element, rect: Partial<DOMRect>): void {
  rects.set(element, rect);
}

Element.prototype.getBoundingClientRect = function getBoundingClientRect(this: Element): DOMRect {
  const stored = rects.get(this) ?? {};
  const top = stored.top ?? 0;
  const left = stored.left ?? 0;
  const height = stored.height ?? (stored.bottom ?? 0) - top;
  const width = stored.width ?? (stored.right ?? 0) - left;

  return {
    top,
    left,
    width,
    height,
    bottom: stored.bottom ?? top + height,
    right: stored.right ?? left + width,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
};

let frameCallbacks: FrameRequestCallback[] = [];
let nextFrameId = 1;

vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback): number => {
  frameCallbacks.push(callback);
  return nextFrameId++;
});

vi.stubGlobal('cancelAnimationFrame', (): void => {
  frameCallbacks = [];
});

/** Run every animation frame callback that is currently queued. */
export function flushFrame(): void {
  const queued = frameCallbacks;
  frameCallbacks = [];
  for (const callback of queued) callback(performance.now());
}

/** Fire a scroll event and then run the frame it schedules. */
export function scroll(): void {
  window.dispatchEvent(new Event('scroll'));
  flushFrame();
}

let reducedMotion = false;

/** Toggle what `prefers-reduced-motion` reports for the rest of the test. */
export function setReducedMotion(value: boolean): void {
  reducedMotion = value;
}

vi.stubGlobal('matchMedia', (query: string) => ({
  matches: query.includes('prefers-reduced-motion') ? reducedMotion : false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

afterEach(() => {
  frameCallbacks = [];
  reducedMotion = false;
});

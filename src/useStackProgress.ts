'use client';

import { useEffect, useRef } from 'react';
import { subscribe } from './scheduler';
import type { UseStackProgressOptions } from './types';

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);

/**
 * How far the next card has slid over this one, from `0` to `1`.
 *
 * Coverage starts the moment the next card's top edge reaches this card's
 * bottom edge, and completes when it settles `offset` pixels below this card's
 * pinned top edge. The last card in a stack is never covered, so it always
 * reports `0`.
 *
 * Measures the element's own border box, which must not be transformed — that
 * is why {@link StackCard} puts the transform on a child. Measuring a scaled
 * box would feed the scale back into the progress and drift.
 */
export function computeProgress(element: HTMLElement, offset: number): number {
  const next = element.nextElementSibling;
  if (!next) return 0;

  const rect = element.getBoundingClientRect();
  const coverageStart = rect.bottom;
  const coverageEnd = rect.top + offset;
  const span = coverageStart - coverageEnd;
  if (span <= 0) return 0;

  const nextTop = next.getBoundingClientRect().top;
  return clamp01((coverageStart - nextTop) / span);
}

/**
 * Track how far a sticky card has been covered by the card after it.
 *
 * Attach the returned ref to the element you want measured. The callback runs
 * inside a shared animation frame and does not re-render, so you can write
 * directly to the DOM from it.
 *
 * ```tsx
 * const ref = useStackProgress({
 *   onProgress: (p) => console.log(`${Math.round(p * 100)}% covered`),
 * });
 * return <div ref={ref}>…</div>;
 * ```
 */
export function useStackProgress<T extends HTMLElement = HTMLElement>(
  options: UseStackProgressOptions = {},
): React.RefObject<T | null> {
  const { onProgress, offset = 25, disabled = false } = options;

  const ref = useRef<T>(null);
  // Keep the newest callback without resubscribing on every render.
  const callbackRef = useRef(onProgress);
  callbackRef.current = onProgress;

  useEffect(() => {
    const element = ref.current;
    if (disabled || !element || !callbackRef.current) return;

    let last = -1;
    return subscribe(() => {
      const progress = computeProgress(element, offset);
      if (progress === last) return;
      last = progress;
      callbackRef.current?.(progress);
    });
  }, [offset, disabled]);

  return ref;
}

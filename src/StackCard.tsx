'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { CSSProperties } from 'react';
import { DEFAULT_OFFSET_PX, DEFAULTS, useStackContext } from './context';
import type { StackSettings } from './context';
import { subscribe } from './scheduler';
import { computeProgress } from './useStackProgress';
import type { Length, StackCardProps } from './types';

/** Numbers mean pixels. Everything else is a CSS value already. */
function toCss(value: Length): string {
  return typeof value === 'number' ? `${value}px` : value;
}

/** Stay in plain pixels when we can, so the DOM stays readable. */
function pinDistance(inset: Length, offset: Length, steps: number): string {
  if (typeof inset === 'number' && typeof offset === 'number') {
    return `${inset + offset * steps}px`;
  }
  return `calc(${toCss(inset)} + ${toCss(offset)} * ${steps})`;
}

/**
 * The pixel gap between this card's pinned edge and the next one's.
 *
 * Reading it back from the browser means any unit works — `rem`, `svh`, a
 * `calc()`, a custom property. Falls back to the declared offset when the
 * offset is already a number, or to the default when the DOM cannot answer.
 */
function measureOffset(element: HTMLElement, declared: Length, edge: 'top' | 'bottom'): number {
  if (typeof declared === 'number') return declared;

  const next = element.nextElementSibling;
  if (next && typeof getComputedStyle === 'function') {
    const here = parseFloat(getComputedStyle(element)[edge]);
    const there = parseFloat(getComputedStyle(next)[edge]);
    if (Number.isFinite(here) && Number.isFinite(there)) {
      const gap = Math.abs(there - here);
      if (gap > 0) return gap;
    }
  }

  const parsed = parseFloat(declared);
  return Number.isFinite(parsed) ? parsed : DEFAULT_OFFSET_PX;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * One card in a stack.
 *
 * Pins itself with `position: sticky` at an offset derived from its position,
 * so consecutive cards come to rest slightly below one another and each
 * covered card keeps a visible sliver. That layout is pure CSS and costs no
 * JavaScript at all.
 *
 * Set `scaleStep`, `fadeStep`, or `rotateStep` — here or on the container — to
 * additionally shrink, fade, or tilt a card as the next one slides over it.
 * Those run off a shared animation frame and write a single custom property
 * per card, so the browser can keep the work on the compositor.
 */
export const StackCard = forwardRef<HTMLElement, StackCardProps>(function StackCard(
  {
    index,
    offset,
    height,
    inset,
    stackFrom,
    scaleStep,
    fadeStep,
    rotateStep,
    respectReducedMotion,
    as: Component = 'div',
    className,
    style,
    innerClassName,
    innerStyle,
    children,
    ...rest
  },
  forwardedRef,
) {
  const context = useStackContext();

  // Own props win, then the container's, then the built-in defaults.
  const pick = <K extends keyof StackSettings>(
    own: StackSettings[K] | undefined,
    key: K,
  ): StackSettings[K] => own ?? (context ? context[key] : DEFAULTS[key]);

  const resolvedIndex = index ?? context?.index ?? 0;
  const resolvedCount = context?.count ?? resolvedIndex + 1;
  const resolvedOffset = pick(offset, 'offset');
  const resolvedHeight = pick(height, 'height');
  const resolvedInset = pick(inset, 'inset');
  const resolvedStackFrom = pick(stackFrom, 'stackFrom');
  const resolvedScale = pick(scaleStep, 'scaleStep');
  const resolvedFade = pick(fadeStep, 'fadeStep');
  const resolvedRotate = pick(rotateStep, 'rotateStep');
  const resolvedRespect = pick(respectReducedMotion, 'respectReducedMotion');

  const fromBottom = resolvedStackFrom === 'bottom';
  const steps = fromBottom ? Math.max(0, resolvedCount - 1 - resolvedIndex) : resolvedIndex;
  const edge: 'top' | 'bottom' = fromBottom ? 'bottom' : 'top';

  const wantsMotion = resolvedScale !== 0 || resolvedRotate !== 0;
  const wantsFade = resolvedFade !== 0;
  const wantsEffects = wantsMotion || wantsFade;

  const elementRef = useRef<HTMLElement>(null);
  useImperativeHandle(forwardedRef, () => elementRef.current as HTMLElement, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!wantsEffects || !element) return;

    let offsetPx = measureOffset(element, resolvedOffset, edge);
    let lastMotion = -1;
    let lastFade = -1;
    let framesSinceMeasure = 0;

    const inner = element.firstElementChild as HTMLElement | null;

    return subscribe(() => {
      // Re-measure occasionally rather than every frame: reading computed
      // style forces a style recalc, and the offset almost never changes.
      if (++framesSinceMeasure > 60) {
        framesSinceMeasure = 0;
        offsetPx = measureOffset(element, resolvedOffset, edge);
      }

      const progress = computeProgress(element, offsetPx);
      const fade = wantsFade ? progress : 0;
      const motion = wantsMotion && !(resolvedRespect && prefersReducedMotion()) ? progress : 0;

      if (motion !== lastMotion) {
        lastMotion = motion;
        // Published for anyone writing their own CSS against the stack.
        element.style.setProperty('--sos-p', String(motion));
        if (inner && wantsMotion) {
          if (motion === 0) {
            inner.style.transform = 'none';
          } else {
            const parts: string[] = [];
            if (resolvedScale !== 0) parts.push(`scale(${1 - resolvedScale * motion})`);
            if (resolvedRotate !== 0) parts.push(`rotate(${resolvedRotate * motion}deg)`);
            inner.style.transform = parts.join(' ');
          }
        }
      }

      if (fade !== lastFade) {
        lastFade = fade;
        element.style.setProperty('--sos-fade-p', String(fade));
        if (inner && wantsFade) inner.style.opacity = String(1 - resolvedFade * fade);
      }
    });
  }, [
    wantsEffects,
    wantsMotion,
    wantsFade,
    resolvedRespect,
    resolvedOffset,
    resolvedScale,
    resolvedRotate,
    resolvedFade,
    edge,
  ]);

  const outerStyle: CSSProperties = {
    position: 'sticky',
    [edge]: pinDistance(resolvedInset, resolvedOffset, steps),
    height: toCss(resolvedHeight),
    ...(wantsEffects ? ({ '--sos-p': 0, '--sos-fade-p': 0 } as CSSProperties) : null),
    ...style,
  };

  // Rendered at their identity values so the server and the first client paint
  // agree. The frame loop takes over from there.
  const composedInnerStyle: CSSProperties = {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...(wantsMotion
      ? { transform: 'none', transformOrigin: 'center top', willChange: 'transform' }
      : null),
    ...(wantsFade ? { opacity: 1 } : null),
    ...innerStyle,
  };

  return (
    <Component
      ref={elementRef}
      // `cardContainer` is kept from v1 so existing stylesheets keep working.
      className={['sos-card', 'cardContainer', className].filter(Boolean).join(' ')}
      style={outerStyle}
      data-sos-index={resolvedIndex}
      {...rest}
    >
      <div
        className={['sos-card-inner', innerClassName].filter(Boolean).join(' ')}
        style={composedInnerStyle}
      >
        {children}
      </div>
    </Component>
  );
});

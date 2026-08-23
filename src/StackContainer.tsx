'use client';

import { Children, Fragment, cloneElement, forwardRef, isValidElement, useMemo } from 'react';
import type { ReactNode } from 'react';
import { DEFAULTS, StackContext } from './context';
import type { StackContainerProps } from './types';

/**
 * Flatten one level of fragments so `<><Card/><Card/></>` numbers correctly.
 *
 * `Children.toArray` already flattens nested arrays and assigns keys, but it
 * treats a fragment as a single child, which would give both cards inside it
 * the same index.
 */
function flattenChildren(children: ReactNode, prefix = ''): ReactNode[] {
  const flat: ReactNode[] = [];

  Children.toArray(children).forEach((child, position) => {
    if (isValidElement(child) && child.type === Fragment) {
      const inner = (child.props as { children?: ReactNode }).children;
      // `Children.toArray` restarts its keys at each level, so without a
      // prefix the children of two fragments would collide.
      flat.push(...flattenChildren(inner, `${prefix}${position}:`));
    } else if (isValidElement(child) && prefix) {
      flat.push(cloneElement(child, { key: `${prefix}${child.key ?? position}` }));
    } else {
      flat.push(child);
    }
  });

  return flat;
}

/**
 * Wraps a set of {@link StackCard}s, numbers them, and holds the settings they
 * share.
 *
 * Numbering is automatic, so cards can be written or generated in any order
 * without threading an `index` prop through. A card that sets `index`
 * explicitly keeps that value.
 *
 * ```tsx
 * <StackContainer offset={32} scaleStep={0.08} fadeStep={0.3}>
 *   {chapters.map((c) => <StackCard key={c.id}>{c.title}</StackCard>)}
 * </StackContainer>
 * ```
 */
export const StackContainer = forwardRef<HTMLElement, StackContainerProps>(
  function StackContainer(
    {
      offset = DEFAULTS.offset,
      height = DEFAULTS.height,
      inset = DEFAULTS.inset,
      stackFrom = DEFAULTS.stackFrom,
      scaleStep = DEFAULTS.scaleStep,
      fadeStep = DEFAULTS.fadeStep,
      rotateStep = DEFAULTS.rotateStep,
      respectReducedMotion = DEFAULTS.respectReducedMotion,
      as: Component = 'div',
      className,
      children,
      ...rest
    },
    ref,
  ) {
    const items = useMemo(() => flattenChildren(children), [children]);

    const shared = useMemo(
      () => ({
        offset,
        height,
        inset,
        stackFrom,
        scaleStep,
        fadeStep,
        rotateStep,
        respectReducedMotion,
      }),
      [offset, height, inset, stackFrom, scaleStep, fadeStep, rotateStep, respectReducedMotion],
    );

    // Only elements take a slot in the stack. Stray text passes through.
    const cardCount = items.filter(isValidElement).length;

    let slot = 0;
    const numbered = items.map((child, position) => {
      if (!isValidElement(child)) return child;

      const index = slot++;
      const key = child.key ?? `sos-${position}`;

      return (
        <StackContext.Provider key={key} value={{ ...shared, index, count: cardCount }}>
          {child}
        </StackContext.Provider>
      );
    });

    return (
      <Component
        ref={ref}
        className={['sos-container', className].filter(Boolean).join(' ')}
        data-sos-count={cardCount}
        {...rest}
      >
        {numbered}
      </Component>
    );
  },
);

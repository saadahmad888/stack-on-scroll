import type { CSSProperties, ElementType, ReactNode } from 'react';

/**
 * A CSS length. Numbers are treated as pixels, strings are passed through
 * verbatim so you can use `rem`, `svh`, `calc()`, and so on.
 */
export type Length = number | string;

/** Which edge the cards pin themselves to as they stack. */
export type StackFrom = 'top' | 'bottom';

/**
 * Visual effects applied to a card as the following card slides over it.
 *
 * Each value is the *total* change applied by the time the card is fully
 * covered. They are all `0` by default, which keeps the component on a
 * zero-JavaScript path.
 */
export interface StackEffects {
  /**
   * How much a card shrinks as it gets covered. `0.1` means the card ends at
   * 90% of its original size.
   * @default 0
   */
  scaleStep?: number;
  /**
   * How much a card fades as it gets covered. `0.4` means the card ends at
   * 60% opacity.
   * @default 0
   */
  fadeStep?: number;
  /**
   * How far a card rotates, in degrees, as it gets covered.
   * @default 0
   */
  rotateStep?: number;
  /**
   * Skip `scaleStep` and `rotateStep` when the reader has asked for reduced
   * motion. `fadeStep` still applies, since a cross-fade is not motion.
   * @default true
   */
  respectReducedMotion?: boolean;
}

/** Layout options shared by the container and each individual card. */
export interface StackLayout {
  /**
   * Gap between the pinned edges of consecutive cards. This is the sliver of
   * each covered card that stays visible.
   * @default 25
   */
  offset?: Length;
  /**
   * Height of each card.
   * @default '100vh'
   */
  height?: Length;
  /**
   * Distance from the viewport edge at which the first card pins.
   * @default 0
   */
  inset?: Length;
  /**
   * Whether cards pin to the top of the viewport and stack downward, or to the
   * bottom and stack upward.
   * @default 'top'
   */
  stackFrom?: StackFrom;
}

/** Props accepted by {@link StackContainer}. */
export interface StackContainerProps
  extends StackLayout,
    StackEffects,
    Omit<React.ComponentPropsWithoutRef<'div'>, 'children'> {
  children?: ReactNode;
  /**
   * Element or component to render as the scroll region.
   * @default 'div'
   */
  as?: ElementType;
}

/** Props accepted by {@link StackCard}. */
export interface StackCardProps
  extends StackLayout,
    StackEffects,
    React.ComponentPropsWithoutRef<'div'> {
  /**
   * Position in the stack, counting from `0`. Leave this out and the
   * surrounding {@link StackContainer} will number the cards for you.
   */
  index?: number;
  /**
   * Element or component to render as the card.
   * @default 'div'
   */
  as?: ElementType;
  /** Applied to the inner element that carries the transform. */
  innerClassName?: string;
  /** Applied to the inner element that carries the transform. */
  innerStyle?: CSSProperties;
}

/** Options for {@link useStackProgress}. */
export interface UseStackProgressOptions {
  /**
   * Called whenever coverage changes, with a value from `0` (uncovered) to `1`
   * (fully covered). Runs inside an animation frame and never triggers a
   * re-render, so it is safe to call on every frame.
   */
  onProgress?: (progress: number) => void;
  /**
   * The stack offset in pixels. Must match the offset used for layout, or the
   * reported progress will reach `1` early or late.
   * @default 25
   */
  offset?: number;
  /**
   * Pause tracking without unmounting.
   * @default false
   */
  disabled?: boolean;
}

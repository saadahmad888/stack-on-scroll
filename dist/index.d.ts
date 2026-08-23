import * as react from 'react';
import { ElementType, CSSProperties, ReactNode } from 'react';

/**
 * A CSS length. Numbers are treated as pixels, strings are passed through
 * verbatim so you can use `rem`, `svh`, `calc()`, and so on.
 */
type Length = number | string;
/** Which edge the cards pin themselves to as they stack. */
type StackFrom = 'top' | 'bottom';
/**
 * Visual effects applied to a card as the following card slides over it.
 *
 * Each value is the *total* change applied by the time the card is fully
 * covered. They are all `0` by default, which keeps the component on a
 * zero-JavaScript path.
 */
interface StackEffects {
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
interface StackLayout {
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
interface StackContainerProps extends StackLayout, StackEffects, Omit<React.ComponentPropsWithoutRef<'div'>, 'children'> {
    children?: ReactNode;
    /**
     * Element or component to render as the scroll region.
     * @default 'div'
     */
    as?: ElementType;
}
/** Props accepted by {@link StackCard}. */
interface StackCardProps extends StackLayout, StackEffects, React.ComponentPropsWithoutRef<'div'> {
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
interface UseStackProgressOptions {
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
declare const StackContainer: react.ForwardRefExoticComponent<StackContainerProps & react.RefAttributes<HTMLElement>>;

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
declare const StackCard: react.ForwardRefExoticComponent<StackCardProps & react.RefAttributes<HTMLElement>>;

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
declare function computeProgress(element: HTMLElement, offset: number): number;
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
declare function useStackProgress<T extends HTMLElement = HTMLElement>(options?: UseStackProgressOptions): React.RefObject<T | null>;

/** Force every subscribed task to run on the next frame. */
declare function refresh(): void;

/**
 * @deprecated Renamed to `StackContainer` in v2. This alias still works and
 * has no removal date, but new code should use the full name.
 */
declare const Outer: react.ForwardRefExoticComponent<StackContainerProps & react.RefAttributes<HTMLElement>>;
/**
 * @deprecated Renamed to `StackCard` in v2. This alias still works and has no
 * removal date, but new code should use the full name.
 */
declare const Card: react.ForwardRefExoticComponent<StackCardProps & react.RefAttributes<HTMLElement>>;

export { Card, type Length, Outer, StackCard, type StackCardProps, StackContainer, type StackContainerProps, type StackEffects, type StackFrom, type StackLayout, type UseStackProgressOptions, computeProgress, refresh as refreshStack, useStackProgress };

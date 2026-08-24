/**
 * Compile-only fixture. Nothing here runs — it exists so `tsc` fails if the
 * public types stop working for a real consumer.
 *
 * The ref pattern below is the one that broke under @types/react 18: the hook
 * returned `RefObject<T | null>`, and React 18 measures `RefObject` as
 * covariant, so it would not accept it where `RefObject<HTMLElement>` was
 * expected. Tests alone never caught it, because tests do not typecheck
 * against React 18.
 */
import { StackCard, StackContainer, useStackProgress } from '../../src';

export function PassesHookRefToCard() {
  const ref = useStackProgress<HTMLElement>({
    offset: 32,
    onProgress: (progress) => progress.toFixed(2),
  });

  return (
    <StackContainer offset={32} scaleStep={0.08} fadeStep={0.3}>
      <StackCard ref={ref}>first</StackCard>
      <StackCard>second</StackCard>
    </StackContainer>
  );
}

export function ReadsCurrentOffTheRef() {
  const ref = useStackProgress<HTMLDivElement>();
  const height: number | undefined = ref.current?.offsetHeight;
  return height;
}

export function AcceptsEveryDocumentedProp() {
  return (
    <StackContainer
      as="main"
      offset="2rem"
      height="100svh"
      inset={16}
      stackFrom="bottom"
      scaleStep={0.1}
      fadeStep={0.4}
      rotateStep={-2}
      respectReducedMotion={false}
      className="deck"
      id="deck"
    >
      <StackCard index={0} className="card" innerClassName="inner" aria-label="one">
        one
      </StackCard>
    </StackContainer>
  );
}

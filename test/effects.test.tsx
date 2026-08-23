import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { computeProgress, StackCard, StackContainer, useStackProgress } from '../src';
import { __activeTaskCount } from '../src/scheduler';
import { flushFrame, scroll, setRect, setReducedMotion } from './setup';

/**
 * A two-card stack laid out at known coordinates. Card A is pinned at the top
 * of the viewport and is 500px tall; card B slides up over it. Moving `nextTop`
 * from 500 down to 25 walks card A from uncovered to fully covered.
 */
function layout(a: HTMLElement, b: HTMLElement, nextTop: number): void {
  setRect(a, { top: 0, bottom: 500, height: 500 });
  setRect(b, { top: nextTop, bottom: nextTop + 500, height: 500 });
}

describe('computeProgress', () => {
  it('reports nothing covered while the next card is still below', () => {
    const a = document.createElement('div');
    const b = document.createElement('div');
    document.body.append(a, b);

    layout(a, b, 800);
    expect(computeProgress(a, 25)).toBe(0);
  });

  it('reports zero the instant the next card touches the bottom edge', () => {
    const a = document.createElement('div');
    const b = document.createElement('div');
    document.body.append(a, b);

    layout(a, b, 500);
    expect(computeProgress(a, 25)).toBe(0);
  });

  it('reports half covered at the midpoint', () => {
    const a = document.createElement('div');
    const b = document.createElement('div');
    document.body.append(a, b);

    // Travel runs from 500 down to 25, so 475px total; halfway is 262.5.
    layout(a, b, 262.5);
    expect(computeProgress(a, 25)).toBeCloseTo(0.5, 5);
  });

  it('reports fully covered once the next card reaches its resting place', () => {
    const a = document.createElement('div');
    const b = document.createElement('div');
    document.body.append(a, b);

    layout(a, b, 25);
    expect(computeProgress(a, 25)).toBe(1);
  });

  it('clamps instead of overshooting past one', () => {
    const a = document.createElement('div');
    const b = document.createElement('div');
    document.body.append(a, b);

    layout(a, b, -200);
    expect(computeProgress(a, 25)).toBe(1);
  });

  it('reports zero for the last card, which nothing can cover', () => {
    const a = document.createElement('div');
    document.body.append(a);

    setRect(a, { top: 0, bottom: 500, height: 500 });
    expect(computeProgress(a, 25)).toBe(0);
  });

  it('reports zero rather than dividing by zero on a collapsed card', () => {
    const a = document.createElement('div');
    const b = document.createElement('div');
    document.body.append(a, b);

    setRect(a, { top: 0, bottom: 0, height: 0 });
    setRect(b, { top: 0, bottom: 0, height: 0 });
    expect(computeProgress(a, 25)).toBe(0);
  });
});

describe('StackCard effects', () => {
  it('starts at identity so the first paint matches the server', () => {
    render(
      <StackContainer scaleStep={0.2} fadeStep={0.6}>
        <StackCard data-testid="a">A</StackCard>
        <StackCard data-testid="b">B</StackCard>
      </StackContainer>,
    );

    const inner = screen.getByTestId('a').firstElementChild as HTMLElement;
    expect(inner.style.transform).toBe('none');
    expect(inner.style.opacity).toBe('1');
    expect(inner.style.transformOrigin).toBe('center top');
  });

  it('scales the inner element as the next card slides over', () => {
    render(
      <StackContainer scaleStep={0.2}>
        <StackCard data-testid="a">A</StackCard>
        <StackCard data-testid="b">B</StackCard>
      </StackContainer>,
    );

    const a = screen.getByTestId('a');
    const inner = a.firstElementChild as HTMLElement;

    layout(a, screen.getByTestId('b'), 262.5);
    scroll();
    expect(inner.style.transform).toBe('scale(0.9)');

    layout(a, screen.getByTestId('b'), 25);
    scroll();
    expect(inner.style.transform).toBe('scale(0.8)');
  });

  it('fades the inner element as the next card slides over', () => {
    render(
      <StackContainer fadeStep={0.6}>
        <StackCard data-testid="a">A</StackCard>
        <StackCard data-testid="b">B</StackCard>
      </StackContainer>,
    );

    const a = screen.getByTestId('a');
    const inner = a.firstElementChild as HTMLElement;

    layout(a, screen.getByTestId('b'), 25);
    scroll();
    expect(inner.style.opacity).toBe('0.4');
  });

  it('combines scale and rotation into one transform', () => {
    render(
      <StackContainer scaleStep={0.1} rotateStep={4}>
        <StackCard data-testid="a">A</StackCard>
        <StackCard data-testid="b">B</StackCard>
      </StackContainer>,
    );

    const a = screen.getByTestId('a');
    layout(a, screen.getByTestId('b'), 25);
    scroll();

    expect((a.firstElementChild as HTMLElement).style.transform).toBe('scale(0.9) rotate(4deg)');
  });

  it('updates the progress property as the next card slides over', () => {
    render(
      <StackContainer scaleStep={0.2} fadeStep={0.5}>
        <StackCard data-testid="a">A</StackCard>
        <StackCard data-testid="b">B</StackCard>
      </StackContainer>,
    );

    const a = screen.getByTestId('a');
    const b = screen.getByTestId('b');

    layout(a, b, 500);
    scroll();
    expect(a.style.getPropertyValue('--sos-p')).toBe('0');

    layout(a, b, 262.5);
    scroll();
    expect(Number(a.style.getPropertyValue('--sos-p'))).toBeCloseTo(0.5, 5);
    expect(Number(a.style.getPropertyValue('--sos-fade-p'))).toBeCloseTo(0.5, 5);

    layout(a, b, 25);
    scroll();
    expect(a.style.getPropertyValue('--sos-p')).toBe('1');
  });

  it('holds motion at zero but keeps fading under reduced motion', () => {
    setReducedMotion(true);

    render(
      <StackContainer scaleStep={0.2} fadeStep={0.5}>
        <StackCard data-testid="a">A</StackCard>
        <StackCard data-testid="b">B</StackCard>
      </StackContainer>,
    );

    const a = screen.getByTestId('a');
    const inner = a.firstElementChild as HTMLElement;
    layout(a, screen.getByTestId('b'), 25);
    scroll();

    expect(a.style.getPropertyValue('--sos-p')).toBe('0');
    expect(a.style.getPropertyValue('--sos-fade-p')).toBe('1');
    expect(inner.style.transform).toBe('none');
    expect(inner.style.opacity).toBe('0.5');
  });

  it('still animates under reduced motion when told to ignore it', () => {
    setReducedMotion(true);

    render(
      <StackContainer scaleStep={0.2} respectReducedMotion={false}>
        <StackCard data-testid="a">A</StackCard>
        <StackCard data-testid="b">B</StackCard>
      </StackContainer>,
    );

    const a = screen.getByTestId('a');
    layout(a, screen.getByTestId('b'), 25);
    scroll();

    expect(a.style.getPropertyValue('--sos-p')).toBe('1');
  });
});

describe('scheduler', () => {
  it('subscribes nothing when no effects are configured', () => {
    render(
      <StackContainer>
        <StackCard>A</StackCard>
        <StackCard>B</StackCard>
      </StackContainer>,
    );

    expect(__activeTaskCount()).toBe(0);
  });

  it('shares one subscription slot per animated card and releases them', () => {
    const view = render(
      <StackContainer scaleStep={0.1}>
        <StackCard>A</StackCard>
        <StackCard>B</StackCard>
        <StackCard>C</StackCard>
      </StackContainer>,
    );

    expect(__activeTaskCount()).toBe(3);

    view.unmount();
    expect(__activeTaskCount()).toBe(0);
  });
});

describe('useStackProgress', () => {
  it('reports coverage without re-rendering', () => {
    const onProgress = vi.fn();
    let renders = 0;

    function Probe() {
      renders++;
      const ref = useStackProgress<HTMLDivElement>({ onProgress, offset: 25 });
      return (
        <>
          <div ref={ref} data-testid="a">
            A
          </div>
          <div data-testid="b">B</div>
        </>
      );
    }

    render(<Probe />);
    const rendersAfterMount = renders;

    layout(screen.getByTestId('a'), screen.getByTestId('b'), 262.5);
    scroll();

    expect(onProgress).toHaveBeenCalled();
    expect(onProgress.mock.lastCall?.[0]).toBeCloseTo(0.5, 5);
    expect(renders).toBe(rendersAfterMount);
  });

  it('stays quiet when progress has not changed', () => {
    const onProgress = vi.fn();

    function Probe() {
      const ref = useStackProgress<HTMLDivElement>({ onProgress });
      return (
        <>
          <div ref={ref} data-testid="a">
            A
          </div>
          <div data-testid="b">B</div>
        </>
      );
    }

    render(<Probe />);
    layout(screen.getByTestId('a'), screen.getByTestId('b'), 300);

    scroll();
    const callsAfterFirstScroll = onProgress.mock.calls.length;

    scroll();
    scroll();
    expect(onProgress.mock.calls.length).toBe(callsAfterFirstScroll);
  });

  it('does not subscribe while disabled', () => {
    function Probe() {
      const ref = useStackProgress<HTMLDivElement>({ onProgress: vi.fn(), disabled: true });
      return <div ref={ref}>A</div>;
    }

    render(<Probe />);
    expect(__activeTaskCount()).toBe(0);
  });

  it('runs once on mount so a card that appears mid-scroll starts correct', () => {
    const onProgress = vi.fn();

    function Probe() {
      const ref = useStackProgress<HTMLDivElement>({ onProgress });
      return (
        <>
          <div ref={ref} data-testid="a">
            A
          </div>
          <div data-testid="b">B</div>
        </>
      );
    }

    render(<Probe />);
    layout(screen.getByTestId('a'), screen.getByTestId('b'), 25);

    flushFrame();
    expect(onProgress).toHaveBeenCalledWith(1);
  });
});

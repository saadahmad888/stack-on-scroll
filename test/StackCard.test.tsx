import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StackCard, StackContainer } from '../src';

describe('StackCard layout', () => {
  it('pins each card lower than the one before it', () => {
    render(
      <StackContainer data-testid="stack">
        <StackCard data-testid="a">A</StackCard>
        <StackCard data-testid="b">B</StackCard>
        <StackCard data-testid="c">C</StackCard>
      </StackContainer>,
    );

    expect(screen.getByTestId('a')).toHaveStyle({ position: 'sticky', top: '0px' });
    expect(screen.getByTestId('b')).toHaveStyle({ top: '25px' });
    expect(screen.getByTestId('c')).toHaveStyle({ top: '50px' });
  });

  it('defaults each card to a full viewport height', () => {
    render(
      <StackContainer>
        <StackCard data-testid="a">A</StackCard>
      </StackContainer>,
    );

    expect(screen.getByTestId('a')).toHaveStyle({ height: '100vh' });
  });

  it('honours a custom offset and inset from the container', () => {
    render(
      <StackContainer offset={40} inset={12}>
        <StackCard data-testid="a">A</StackCard>
        <StackCard data-testid="b">B</StackCard>
      </StackContainer>,
    );

    expect(screen.getByTestId('a')).toHaveStyle({ top: '12px' });
    expect(screen.getByTestId('b')).toHaveStyle({ top: '52px' });
  });

  it('lets a single card override the container', () => {
    render(
      <StackContainer offset={10} height="50vh">
        <StackCard data-testid="a">A</StackCard>
        <StackCard data-testid="b" offset={100} height="80vh">
          B
        </StackCard>
      </StackContainer>,
    );

    expect(screen.getByTestId('a')).toHaveStyle({ top: '0px', height: '50vh' });
    expect(screen.getByTestId('b')).toHaveStyle({ top: '100px', height: '80vh' });
  });

  it('accepts non-pixel units', () => {
    render(
      <StackContainer offset="2rem" inset="1rem">
        <StackCard data-testid="a">A</StackCard>
        <StackCard data-testid="b">B</StackCard>
      </StackContainer>,
    );

    // jsdom folds the arithmetic; a browser does the same at used-value time.
    expect(screen.getByTestId('a').getAttribute('style')).toContain('1rem');
    expect(screen.getByTestId('b').getAttribute('style')).toContain('3rem');
  });

  it('pins to the bottom edge and counts backwards when asked', () => {
    render(
      <StackContainer stackFrom="bottom" offset={20}>
        <StackCard data-testid="a">A</StackCard>
        <StackCard data-testid="b">B</StackCard>
        <StackCard data-testid="c">C</StackCard>
      </StackContainer>,
    );

    // First card sits highest, last card rests against the viewport edge.
    expect(screen.getByTestId('a')).toHaveStyle({ bottom: '40px' });
    expect(screen.getByTestId('b')).toHaveStyle({ bottom: '20px' });
    expect(screen.getByTestId('c')).toHaveStyle({ bottom: '0px' });
  });
});

describe('StackCard indexing', () => {
  it('numbers cards automatically', () => {
    render(
      <StackContainer>
        <StackCard data-testid="a">A</StackCard>
        <StackCard data-testid="b">B</StackCard>
      </StackContainer>,
    );

    expect(screen.getByTestId('a')).toHaveAttribute('data-sos-index', '0');
    expect(screen.getByTestId('b')).toHaveAttribute('data-sos-index', '1');
  });

  it('keeps an explicit index when one is given', () => {
    render(
      <StackContainer>
        <StackCard data-testid="a" index={5}>
          A
        </StackCard>
      </StackContainer>,
    );

    expect(screen.getByTestId('a')).toHaveAttribute('data-sos-index', '5');
    expect(screen.getByTestId('a')).toHaveStyle({ top: '125px' });
  });

  it('numbers cards generated from an array', () => {
    const chapters = ['one', 'two', 'three', 'four'];

    render(
      <StackContainer>
        {chapters.map((chapter) => (
          <StackCard key={chapter} data-testid={chapter}>
            {chapter}
          </StackCard>
        ))}
      </StackContainer>,
    );

    chapters.forEach((chapter, position) => {
      expect(screen.getByTestId(chapter)).toHaveAttribute('data-sos-index', String(position));
    });
  });

  it('looks through fragments when numbering', () => {
    render(
      <StackContainer>
        <StackCard data-testid="a">A</StackCard>
        <>
          <StackCard data-testid="b">B</StackCard>
          <StackCard data-testid="c">C</StackCard>
        </>
      </StackContainer>,
    );

    expect(screen.getByTestId('b')).toHaveAttribute('data-sos-index', '1');
    expect(screen.getByTestId('c')).toHaveAttribute('data-sos-index', '2');
  });

  it('skips children that render nothing', () => {
    const show = false;

    render(
      <StackContainer>
        <StackCard data-testid="a">A</StackCard>
        {show && <StackCard data-testid="hidden">hidden</StackCard>}
        {null}
        <StackCard data-testid="b">B</StackCard>
      </StackContainer>,
    );

    expect(screen.queryByTestId('hidden')).not.toBeInTheDocument();
    expect(screen.getByTestId('b')).toHaveAttribute('data-sos-index', '1');
  });

  it('renders on its own, outside any container', () => {
    render(<StackCard data-testid="lonely">alone</StackCard>);

    expect(screen.getByTestId('lonely')).toHaveStyle({ position: 'sticky', top: '0px' });
  });
});

describe('StackCard DOM contract', () => {
  it('keeps the v1 class name so existing stylesheets still apply', () => {
    render(<StackCard data-testid="a">A</StackCard>);

    const card = screen.getByTestId('a');
    expect(card).toHaveClass('sos-card');
    expect(card).toHaveClass('cardContainer');
  });

  it('merges a caller className instead of replacing ours', () => {
    render(
      <StackCard data-testid="a" className="mine">
        A
      </StackCard>,
    );

    expect(screen.getByTestId('a')).toHaveClass('sos-card', 'cardContainer', 'mine');
  });

  it('lets caller styles win over the defaults', () => {
    render(
      <StackCard data-testid="a" style={{ height: '42px', background: 'red' }}>
        A
      </StackCard>,
    );

    expect(screen.getByTestId('a')).toHaveStyle({ height: '42px', background: 'red' });
  });

  it('forwards arbitrary DOM props', () => {
    render(
      <StackCard data-testid="a" id="chapter-one" aria-label="Chapter one" role="region">
        A
      </StackCard>,
    );

    const card = screen.getByTestId('a');
    expect(card).toHaveAttribute('id', 'chapter-one');
    expect(card).toHaveAttribute('aria-label', 'Chapter one');
  });

  it('forwards a ref to the outer element', () => {
    const ref = createRef<HTMLElement>();
    render(<StackCard ref={ref}>A</StackCard>);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toHaveClass('sos-card');
  });

  it('renders as another element when asked', () => {
    render(
      <StackContainer as="main" data-testid="stack">
        <StackCard as="section" data-testid="a">
          A
        </StackCard>
      </StackContainer>,
    );

    expect(screen.getByTestId('stack').tagName).toBe('MAIN');
    expect(screen.getByTestId('a').tagName).toBe('SECTION');
  });

  it('centres content in an inner element that carries the transform', () => {
    render(<StackCard data-testid="a">A</StackCard>);

    const inner = screen.getByTestId('a').firstElementChild as HTMLElement;
    expect(inner).toHaveClass('sos-card-inner');
    expect(inner).toHaveStyle({ display: 'flex', alignItems: 'center', justifyContent: 'center' });
    expect(inner).toHaveTextContent('A');
  });

  it('adds no transform or opacity when no effects are configured', () => {
    render(<StackCard data-testid="a">A</StackCard>);

    const inner = screen.getByTestId('a').firstElementChild as HTMLElement;
    expect(inner.style.transform).toBe('');
    expect(inner.style.opacity).toBe('');
  });
});

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { StackCard, StackContainer } from '../src';

/**
 * Anything that touches `window` during render breaks Next.js, Remix, and
 * Astro. These render on the server path with no DOM globals in play.
 */
describe('server rendering', () => {
  it('renders a full stack to static markup', () => {
    const html = renderToStaticMarkup(
      <StackContainer offset={30}>
        <StackCard>First</StackCard>
        <StackCard>Second</StackCard>
      </StackContainer>,
    );

    expect(html).toContain('position:sticky');
    expect(html).toContain('top:0px');
    expect(html).toContain('top:30px');
    expect(html).toContain('First');
    expect(html).toContain('Second');
  });

  it('renders the same markup whether or not effects are on', () => {
    const withEffects = renderToStaticMarkup(
      <StackContainer scaleStep={0.1} fadeStep={0.4}>
        <StackCard>Only</StackCard>
      </StackContainer>,
    );

    // Effects render at their identity values, so the server markup and the
    // first client paint agree. The frame loop only takes over afterwards,
    // which is what keeps hydration quiet.
    expect(withEffects).toContain('--sos-p:0');
    expect(withEffects).toContain('--sos-fade-p:0');
    expect(withEffects).toContain('transform:none');
    expect(withEffects).toContain('opacity:1');
  });

  it('does not read prefers-reduced-motion during render', () => {
    const original = globalThis.matchMedia;
    // @ts-expect-error deliberately removing the global for this check
    delete globalThis.matchMedia;

    try {
      expect(() =>
        renderToStaticMarkup(
          <StackContainer scaleStep={0.2}>
            <StackCard>Only</StackCard>
          </StackContainer>,
        ),
      ).not.toThrow();
    } finally {
      globalThis.matchMedia = original;
    }
  });
});

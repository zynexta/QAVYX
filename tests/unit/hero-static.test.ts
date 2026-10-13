import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HeroStatic } from '@/components/hero/HeroStatic';
import { HERO_COPY, HOME_COPY } from '@/content/home';
import { PILLAR_CTA_LABEL, SERVICE_AREAS, SERVICES } from '@/content/services';
import { computeLockupGeometry, frameOpenFraction, WORDMARK_VIEWBOX } from '@/motion/geometry';

/**
 * `HeroStatic` is the served HTML that a `prefers-reduced-motion` visitor, a
 * JS-disabled visitor and a crawler all read. It is a server component with no
 * state, no viewport and no effects, so its entire contract is expressible as a
 * string — which means it can be locked here at millisecond cost instead of
 * only in Playwright.
 *
 * Two jobs, and the second is the one that will actually catch something:
 *
 *  1. The content is all there. Every pillar, every one of the twenty-four
 *     service areas, every CTA href, and §3.1's positioning line — the string
 *     that has no other home in the document, because `LaunchTitle` only ever
 *     shows it mid-pin.
 *  2. It carries NONE of the carousel's selection hooks. `expandTimeline` drives
 *     `.qx-panel`'s opacity and `phase7-carousel.spec.ts` counts `.qx-panel`,
 *     `.qx-panel-cta`, `.qx-panel li` and `.qx-panel svg` with unscoped
 *     locators that see hidden nodes too. This markup ships on EVERY response,
 *     `display: none` in motion mode, so one reused class name silently doubles
 *     all four counts and dims a list nobody can see. That failure would look
 *     like a carousel bug, three files away from its cause.
 */

const html = renderToStaticMarkup(createElement(HeroStatic));

/**
 * The content is asserted against the ESCAPED string, because that is what is
 * actually served. Six of the twenty-four service areas contain an ampersand
 * ("Planning & Execution", "Social & Content", …) and React writes them as
 * `&amp;` — so a naive `toContain(area)` fails on exactly the strings the client
 * cares most about, and does so in a way that reads like the content is missing.
 * Mirrors React's `escapeTextForBrowser`.
 */
const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

describe('HeroStatic — the served hero', () => {
  it('renders §3.1 positioning line, which nothing else in the document does', () => {
    expect(html).toContain(esc(HERO_COPY.eyebrow));
  });

  it('renders all five pillars', () => {
    for (const service of SERVICES) {
      expect(html).toContain(esc(service.title));
      expect(html).toContain(esc(service.description));
    }
  });

  it('renders all twenty-four service areas', () => {
    for (const area of SERVICE_AREAS) {
      expect(html).toContain(esc(area));
    }
  });

  it('renders five real CTA links, one per pillar', () => {
    for (const service of SERVICES) {
      expect(html).toContain(`href="${service.cta.href}"`);
      // The VALUE is escaped, not the attribute syntax around it.
      expect(html).toContain(`aria-label="${esc(`${PILLAR_CTA_LABEL} ${service.title}`)}"`);
    }
    expect(html.match(/qx-service-cta/g)).toHaveLength(SERVICES.length);
  });

  it('draws the Q open, not as a closed rectangle', () => {
    // The path `computeFramePath` emits is CLOSED; the Q's opening exists only
    // because a dash hides the last ~10.6% of it. A static mark that lost the
    // dash would render an anonymous rounded rectangle and look deliberate.
    const open = frameOpenFraction(computeLockupGeometry(WORDMARK_VIEWBOX.w).frame) * 100;
    const dash = html.match(/stroke-dasharray="([\d.]+)/);
    expect(dash).not.toBeNull();
    expect(Number(dash![1])).toBeCloseTo(open, 5);
    expect(Number(dash![1])).toBeLessThan(100);
  });

  it('carries none of the carousel selection hooks', () => {
    // Every one of these is load-bearing somewhere else. See the docblock.
    for (const hook of [
      'qx-panel', // expandTimeline opacity + four e2e counts
      'qx-track', // gatherRefs() getElementById — a duplicate id steals the ref
      'qx-track-viewport',
      'qx-indicator',
      'aria-roledescription', // "slide" is a lie in normal flow
    ]) {
      expect(html).not.toContain(hook);
    }
  });

  it('names the five pillars, and carries NO read-head total', () => {
    // The counter is an ordinal here, never `01 / 05`. "Which of five you are
    // looking at" is a read head, and it is a lie in a list where all five are
    // on the page at once — the carousel is the only presentation that has one.
    // Phase 10 briefly shipped the total here, hidden, for a `scroll-snap` rail
    // that was then reverted; this is what catches it coming back.
    expect(html).toContain(esc(HOME_COPY.indexHeading));
    expect(html.match(/qx-service-row/g)).toHaveLength(SERVICES.length);
    expect(html).not.toContain(`/ ${String(SERVICES.length).padStart(2, '0')}`);
  });

  it('is the one element the reduced-motion CSS rule addresses', () => {
    // app/globals.css hides `#qx-hero-static` under
    // `(prefers-reduced-motion: no-preference)`, and app/page.tsx's <noscript>
    // takes that back. Both select on this exact id; renaming it here without
    // renaming it there fails silently, in motion mode, as a duplicated hero.
    expect(html).toContain('id="qx-hero-static"');
  });
});

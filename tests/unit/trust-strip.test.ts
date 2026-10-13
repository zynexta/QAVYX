import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TrustStrip } from '@/components/home/TrustStrip';
import { TRUST_GLYPHS } from '@/components/icons';
import { TRUST, TRUST_STRIP } from '@/content/home';

/**
 * §4 Trust Strip, as served.
 *
 * `home-content.test.ts` locks the SENTENCE. This locks two things it cannot:
 * that a visitor can read it, and that the moving band is still made of the
 * sentence's own words.
 *
 * Both have already been failure modes here. The component spent eight phases
 * complete, correct and rendered by nothing — a `position: fixed` layer waiting
 * for a beat inside the pin that never came. And the band that replaced it is
 * exactly the kind of element that grows a seventh sector "to fill the row",
 * which §66 Rule 05 forbids and which no amount of good intent catches.
 */

const html = renderToStaticMarkup(createElement(TrustStrip));

/** Mirrors React's `escapeTextForBrowser`; §4's sector list is full of `&`. */
const esc = (s: string) => s.replace(/&/g, '&amp;');

describe('§4 is the client’s sentence and nothing else', () => {
  /**
   * The invariant the whole design rests on: the three parts the layout sets
   * recompose into the sentence, character for character. Reword the lead, add a
   * sector, drop the comma before the region — any of them breaks this.
   */
  it('recomposes into TRUST_STRIP exactly', () => {
    expect(`${TRUST.lead} ${TRUST.sectors.join(', ')}, ${TRUST.region}.`).toBe(TRUST_STRIP);
  });

  it('claims six sectors, which is what the sentence claims', () => {
    expect(TRUST.sectors).toHaveLength(6);
    for (const sector of TRUST.sectors) expect(TRUST_STRIP).toContain(sector);
  });

  /**
   * Both directions. A sector with no glyph is a gap in a moving band, which is
   * far harder to spot than a gap in a static grid; a glyph with no sector is a
   * drawing for a claim that is no longer made.
   */
  it('has one glyph per sector, and no orphans', () => {
    expect(Object.keys(TRUST_GLYPHS).sort()).toEqual([...TRUST.sectors].sort());
  });
});

describe('TrustStrip — the served markup', () => {
  /**
   * ONE accessible copy of the sentence, unbroken. The visual layer is
   * `aria-hidden`, so without this the section would announce the lead, twelve
   * sector fragments and the region as separate strings — the loop's second copy
   * is real DOM.
   */
  it('gives a screen reader the sentence, once', () => {
    expect(html).toContain(`<p class="sr-only">${esc(TRUST_STRIP)}</p>`);
    expect(html).toContain('aria-hidden="true"');
  });

  /**
   * Two halves, and the translate that loops the band is -50% — so the count is
   * not cosmetic. Six items would scroll off and leave the band empty; eighteen
   * would wrap a third of the way through.
   */
  it('renders the band as exactly two copies of the six', () => {
    const items = html.match(/class="qx-marquee__item"/g) ?? [];
    expect(items).toHaveLength(TRUST.sectors.length * 2);
    expect(html.match(/data-clone="true"/g) ?? []).toHaveLength(TRUST.sectors.length);
  });

  /**
   * The four classes that made this a full-viewport fixed overlay in its
   * previous life. Any one of them returning means the strip is either invisible
   * or covering the sections below it and eating their clicks — the failure
   * `phase8c-shell.spec.ts` already guards for `#qx-stage`, and one that
   * `toBeVisible()` and keyboard focus both pass straight through.
   */
  it('is in normal flow, not a fixed layer', () => {
    for (const cls of ['fixed', 'invisible', 'opacity-0', 'pointer-events-none']) {
      expect(html, `${cls} would put §4 back in the overlay it came from`).not.toContain(cls);
    }
  });

  /**
   * The reveal trigger wraps all three parts and each part is an item, so they
   * arrive as one staggered event. A part that loses `data-rv` arrives ahead of
   * the other two; the wrapper losing `data-reveal` means none of them ever
   * transition at all.
   */
  it('reveals as one event on three steps', () => {
    expect(html).toMatch(/data-reveal=""/);
    expect(html.match(/data-rv="true"/g) ?? []).toHaveLength(3);
  });
});

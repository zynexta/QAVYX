import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import {
  charRampProgress,
  TITLE_HOLD_END,
  TITLE_IN_END,
  TITLE_VH,
  titleCharProgress,
  titleOpacity,
} from '../../motion/timelines/titleTimeline';
import { PIN_A } from '../../motion/scrollBudget';
import { SplitText } from '../../components/text/SplitText';
import { LaunchTitle } from '../../components/launch/LaunchTitle';
import {
  SPLIT_CHAR_CLASS,
  TITLE_LINE_CLASS,
  TITLE_SHINE_CLASS,
} from '../../types/hero';
import { HERO_COPY } from '../../content/home';

/**
 * The title card: how long it is up, and how its line assembles.
 *
 * All of it is pure, so the whole segment is checked without a browser, a
 * scroll, or a frame of time — the same deal the launch's arithmetic has in
 * `launch-timeline.test.ts`.
 *
 * NOTHING HERE TYPES A SEGMENT-LOCAL DECIMAL. `TITLE_IN_END` and
 * `TITLE_HOLD_END` are exported for exactly this reason: the card's length is a
 * tuning knob and has already been turned once, and a test that hard-codes
 * `0.25` stops addressing the end of the ramp the moment it moves — while
 * continuing to pass. That is the failure this project has already had once,
 * with the carousel's typed progress values.
 */

/** How many characters the card actually renders, spaces excluded. */
const COUNT = HERO_COPY.eyebrow.replace(/ /g, '').length;

describe('the card owns as much scroll as the budget says', () => {
  /**
   * The one number worth typing, because it IS the knob: 120vh, up from the 60
   * it shipped at. At an 800px viewport 60vh was 480px of scroll for the
   * entrance, the hold and the clear together — about five wheel notches on the
   * one segment whose whole job is to be read.
   */
  it('is 120vh of the pin, and the two files agree on that', () => {
    expect(TITLE_VH).toBe(120);
    // The real guard. `titleTimeline` divides by its own `VH` to turn the
    // segment-local proxy into vh; if that is smaller than the row's, the card
    // finishes early and the rest of the segment holds an empty screen.
    expect(PIN_A.spans.find((s) => s.name === 'title')?.vh).toBe(TITLE_VH);
  });

  /** 40 in, 55 held, 25 out — and the clear is the shortest of the three. */
  it('spends the longest share on the entrance and the shortest on the clear', () => {
    const inVh = TITLE_IN_END * TITLE_VH;
    const holdVh = (TITLE_HOLD_END - TITLE_IN_END) * TITLE_VH;
    const outVh = (1 - TITLE_HOLD_END) * TITLE_VH;

    // `toBeCloseTo`, not `toBe`, and the difference from `scroll-budget.test.ts`
    // is real rather than a lapse. There the values ARE the boundaries and a
    // 1e-9 drift would move a snap point, so bit equality is the assertion.
    // Here the vh are reconstructed by multiplying a fraction back out —
    // `(1 - 95/120) * 120` is 25.000000000000004 — and demanding bit equality
    // of a round-trip through a repeating binary fraction would be asserting
    // something about IEEE-754 rather than about the card.
    expect(inVh).toBeCloseTo(40, 9);
    expect(holdVh).toBeCloseTo(55, 9);
    expect(outVh).toBeCloseTo(25, 9);
    expect(inVh + holdVh + outVh).toBeCloseTo(TITLE_VH, 9);
    // An exit that outlasts its own entrance reads as hesitation.
    expect(outVh).toBeLessThan(inVh);
  });
});

describe('titleOpacity', () => {
  it('fades in across the ramp, holds, and clears', () => {
    expect(titleOpacity(0)).toBe(0);
    expect(titleOpacity(TITLE_IN_END / 2)).toBeCloseTo(0.5, 5);
    expect(titleOpacity(TITLE_IN_END)).toBe(1);
    expect(titleOpacity((TITLE_IN_END + TITLE_HOLD_END) / 2)).toBe(1);
    expect(titleOpacity(TITLE_HOLD_END)).toBe(1);
    expect(titleOpacity(1)).toBeCloseTo(0, 5);
  });
});

describe('titleCharProgress', () => {
  it('is 0 for every character at the start and 1 for every one at the ramp’s end', () => {
    for (let i = 0; i < COUNT; i += 1) {
      expect(titleCharProgress(0, i, COUNT), `char ${i} at t=0`).toBe(0);
      expect(titleCharProgress(TITLE_IN_END, i, COUNT), `char ${i} at the ramp end`).toBe(1);
    }
  });

  /** The stagger: at any point inside the ramp, no character leads the one before it. */
  it('never lets a later character run ahead of an earlier one', () => {
    for (const f of [0.08, 0.2, 0.4, 0.6, 0.8, 0.96]) {
      const t = TITLE_IN_END * f;
      for (let i = 1; i < COUNT; i += 1) {
        expect(
          titleCharProgress(t, i, COUNT),
          `char ${i} overtook char ${i - 1} at ${f} of the ramp`,
        ).toBeLessThanOrEqual(titleCharProgress(t, i - 1, COUNT));
      }
    }
  });

  /** And it is a stagger rather than a fade: somewhere inside, they disagree. */
  it('has the first character resolved while the last has not started', () => {
    const mid = TITLE_IN_END * 0.45;
    expect(titleCharProgress(mid, 0, COUNT)).toBe(1);
    expect(titleCharProgress(mid, COUNT - 1, COUNT)).toBe(0);
  });

  it('is monotonic in t for a single character', () => {
    let previous = -1;
    for (let step = 0; step <= 40; step += 1) {
      const p = titleCharProgress((step / 40) * TITLE_IN_END, 7, COUNT);
      expect(p).toBeGreaterThanOrEqual(previous);
      previous = p;
    }
  });

  /** A one-character line has no gaps to stagger across and must not divide by zero. */
  it('degrades to the plain ramp for a single character', () => {
    expect(titleCharProgress(0, 0, 1)).toBe(0);
    expect(titleCharProgress(TITLE_IN_END / 2, 0, 1)).toBeCloseTo(0.5, 5);
    expect(titleCharProgress(TITLE_IN_END, 0, 1)).toBe(1);
  });
});

describe('charRampProgress', () => {
  /**
   * THE PERFORMANCE CLAIM, as a test. `filter: blur()` costs a layer and a
   * shader pass per element per frame, and it is affordable here only because it
   * is confined to the entrance — `addTitleSegment` resets every character the
   * moment this reaches 1 and writes nothing for the whole hold and clear. If
   * the ramp ever runs into the hold, the card starts blurring twenty-two nodes
   * for 55vh with nothing changing.
   */
  it('is finished at the end of the entrance, so the hold and the clear cost nothing', () => {
    expect(charRampProgress(0)).toBe(0);
    expect(charRampProgress(TITLE_IN_END)).toBe(1);
    expect(charRampProgress(TITLE_HOLD_END)).toBe(1);
    expect(charRampProgress(1)).toBe(1);
  });

  it('clamps outside the segment rather than extrapolating', () => {
    expect(charRampProgress(-3)).toBe(0);
    expect(charRampProgress(9)).toBe(1);
  });
});

describe('SplitText', () => {
  const html = renderToStaticMarkup(createElement(SplitText, { text: HERO_COPY.eyebrow }));

  /**
   * The accessible copy. `phase8e-title-card.spec.ts` asserts the card contains
   * §3.1's line, and after the split the only unbroken copy of it is this one —
   * so a screen reader and that test depend on the same node.
   */
  it('keeps one unsplit copy of the client’s line for a screen reader', () => {
    expect(html).toContain(`<span class="sr-only">${HERO_COPY.eyebrow}</span>`);
  });

  /** And hides the decorative half, or the line is announced twice. */
  it('hides the split layer from assistive tech', () => {
    expect(html).toContain('aria-hidden="true"');
  });

  it('emits one span per character, spaces excluded', () => {
    const spans = html.match(new RegExp(`class="${SPLIT_CHAR_CLASS}"`, 'g')) ?? [];
    expect(spans).toHaveLength(COUNT);
  });

  /**
   * The spaces are real text between the spans rather than inside them, so the
   * browser breaks the line exactly where it did before the split — and so the
   * plain text of the decorative layer is still the sentence.
   */
  it('leaves the word spacing as ordinary text', () => {
    // From the OPENING angle bracket, or the tag-stripping regex below has half
    // a tag to work with and leaves `aria-hidden="true">` in the result.
    const decorative = html.slice(html.indexOf('<span aria-hidden'));
    expect(decorative.replace(/<[^>]+>/g, '')).toBe(HERO_COPY.eyebrow);
    expect(html).not.toContain('&nbsp;');
  });
});

/**
 * The green sweep across the card, which is THREE files agreeing on two strings:
 * the component puts `TITLE_LINE_CLASS` on the line, `addTitleSegment` toggles
 * `TITLE_SHINE_CLASS` on the container at the top of the hold, and
 * `styles/title-shine.css` is the rule that needs both of them together.
 *
 * The stylesheet is the half no type-checker covers — a renamed constant leaves
 * a selector that matches nothing, the sweep silently stops happening, and the
 * card looks exactly like it did before the feature existed. So the CSS is read
 * as text and checked against the same constants the other two import.
 *
 * The TIMING is not asserted here. It lives in `addTitleSegment`, which needs
 * GSAP and a real timeline; what makes it safe is that the class goes on inside
 * `restCharacters` — the one place the loop stops writing per-character styles —
 * and `charRampProgress` above already pins where that is.
 */
describe('the green sweep', () => {
  const css = readFileSync(new URL('../../styles/title-shine.css', import.meta.url), 'utf8');

  it('puts the sweep’s hook on the line itself', () => {
    const html = renderToStaticMarkup(createElement(LaunchTitle));
    expect(html).toContain(TITLE_LINE_CLASS);
  });

  /**
   * The served line is white type and nothing else. The gradient needs
   * `color: transparent` to show through `background-clip: text`, so a rule that
   * reached the line without the state class would leave a visitor with no pin —
   * reduced motion, JS disabled, a crawler — reading an invisible headline.
   *
   * NO SELECTOR IS EXEMPT, AND THAT IS A SIMPLIFICATION RATHER THAN A LOOSENING.
   * One used to be: the outline treatment needed a second copy of the sentence
   * painted in `--qx-black` over the top to knock the fill out, and that copy sat
   * in the served markup, so `.qx-title-knockout { display: none }` had to reach
   * it ungated. The outline was dropped on the client's direction and the
   * knockout went with it, so there is nothing in this file that may paint before
   * the pin says so — which is the rule this test was always trying to state.
   */
  it('is unreachable until the pin adds the state class', () => {
    // Every selector in the file, at any indent, minus the at-rules and the
    // keyframe stops inside them. `toBeGreaterThan(0)` is not padding: the
    // regex is the whole test, and one that matched nothing would pass an empty
    // loop and report the file as safe.
    const bare = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const selectors = (bare.match(/^.*\{$/gm) ?? [])
      .map((line) => line.trim())
      .filter((line) => !/^(@|from\b|to\b|\d+%)/.test(line));
    expect(selectors.length).toBeGreaterThan(0);
    for (const selector of selectors) {
      // The GATE: nothing in this file may paint before the pin says so.
      expect(selector).toContain(TITLE_SHINE_CLASS);
      // The TARGET: and it may only reach the line the sweep is made of.
      expect(selector).toContain(TITLE_LINE_CLASS);
    }
  });

  /**
   * THE ONE THAT ALREADY BIT. `background-repeat: no-repeat` plus a percentage
   * position outside 0%–100% leaves part of the box with no background at all —
   * and a box with no background, clipped to transparent glyphs, is not a white
   * line but no line. The first version of this file ran 160% → -60% and the
   * card rendered as an empty black viewport.
   *
   * A percentage position is a fraction of (image width − box width), so the
   * whole safe range is exactly 0%–100% and the check is a literal one.
   */
  it('keeps every keyframe inside the range where the image still covers the box', () => {
    const stops = [...css.matchAll(/background-position:\s*(-?[\d.]+)%/g)].map((m) =>
      Number(m[1]),
    );
    expect(stops.length).toBeGreaterThan(1);
    for (const stop of stops) {
      expect(stop).toBeGreaterThanOrEqual(0);
      expect(stop).toBeLessThanOrEqual(100);
    }
  });

  it('clips the gradient to the glyphs, which is the whole effect', () => {
    expect(css).toContain('background-clip: text');
    expect(css).toContain('-webkit-background-clip: text');
    expect(css).toContain('color: transparent');
  });

  /** And it is the site's green that travels, not a colour invented here. */
  it('spends the project’s own green', () => {
    expect(css).toContain('var(--qx-green)');
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });
});

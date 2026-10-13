import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  computeFrameGeometry,
  computeFramePath,
  computeLogoGeometry,
  computeNavGeometry,
  FRAME_BAR_FRACTION,
  FRAME_RADIUS,
  FRAME_STUB_FRACTION,
  lerpBox,
  type Box,
} from '../../motion/geometry';
import {
  FRAME_FILL,
  FRAME_STROKE_ACTIVE,
  FRAME_STROKE_REST,
  setFrameBox,
  setFrameDraw,
  setFrameFill,
  setFrameStroke,
} from '../../motion/timelines/frameOps';

/**
 * Engine 2's frame, tested where it is cheapest: the path string and the four
 * attribute writes. The e2e (tests/e2e/phase6-frame.spec.ts) proves the same
 * things in a browser at real pin progress; these run on every keystroke.
 *
 * The property under test throughout is STRUCTURAL INVARIANCE. The expansion
 * interpolates one path into another 60 times a second; the instant the two
 * differ in command count or order, the frame stops being an interpolation and
 * starts being a substitution — which is visible as a snap.
 */

/** Pull every command letter out of a path, e.g. "M L A L A ... Z". */
const commands = (d: string) => d.match(/[MLACQZ]/g) ?? [];

/** Numbers, in order, from a path string. */
const numbers = (d: string) => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);

/** The 21 sample points of one full expansion, at a given viewport. */
function expansion(vw: number, vh: number): Box[] {
  const from = computeLogoGeometry(vw, vh).frame;
  const to = computeFrameGeometry(vw, vh);
  return Array.from({ length: 21 }, (_, i) => lerpBox(from, to, i / 20));
}

const VIEWPORTS = [
  [320, 568],
  [375, 667],
  [768, 1024],
  [1024, 768],
  [1440, 900],
  [1920, 1080],
  [3440, 1440],
] as const;

describe('frame path across the expansion', () => {
  it('keeps one command structure from the bowl to the frame to the navbar', () => {
    for (const [vw, vh] of VIEWPORTS) {
      const boxes = [...expansion(vw, vh), computeNavGeometry(vw)];
      const expected = commands(computeFramePath(boxes[0]!));
      // 8 segments + the close, at every size the frame is ever asked to be.
      expect(expected).toEqual(['M', 'L', 'A', 'L', 'A', 'L', 'A', 'L', 'L', 'A', 'Z']);
      for (const box of boxes) {
        expect(commands(computeFramePath(box))).toEqual(expected);
      }
    }
  });

  it('emits the same number of coordinates at every step', () => {
    // A dropped or added number would mean the same command letters describing a
    // different shape — the subtler half of a structure change.
    for (const [vw, vh] of VIEWPORTS) {
      const counts = new Set(expansion(vw, vh).map((b) => numbers(computeFramePath(b)).length));
      expect(counts.size).toBe(1);
    }
  });

  it('has no NaN anywhere in the expansion, at any viewport', () => {
    for (const [vw, vh] of VIEWPORTS) {
      for (const box of expansion(vw, vh)) {
        const d = computeFramePath(box);
        expect(d).not.toMatch(/NaN|Infinity|undefined/);
        expect(numbers(d).every(Number.isFinite)).toBe(true);
      }
    }
  });

  it('grows monotonically — the frame never dips mid-expansion', () => {
    // lerpBox is linear per component, so any non-monotonic step would mean the
    // endpoints were recomputed against a different viewport partway through.
    for (const [vw, vh] of VIEWPORTS) {
      const boxes = expansion(vw, vh);
      for (let i = 1; i < boxes.length; i++) {
        expect(boxes[i]!.w).toBeGreaterThan(boxes[i - 1]!.w);
        expect(boxes[i]!.h).toBeGreaterThan(boxes[i - 1]!.h);
      }
    }
  });

  it('converges on the viewport centre without overshooting it', () => {
    // The bowl is NOT centred — it is the leftmost part of a centred lockup, so
    // the frame drifts right and down as it grows. That drift must be monotonic:
    // an overshoot would read as the frame sliding into place after arriving.
    for (const [vw, vh] of VIEWPORTS) {
      const boxes = expansion(vw, vh);
      const offset = (b: Box) => Math.hypot(b.x + b.w / 2 - vw / 2, b.y + b.h / 2 - vh / 2);
      for (let i = 1; i < boxes.length; i++) {
        expect(offset(boxes[i]!)).toBeLessThan(offset(boxes[i - 1]!) + 1e-9);
      }
      expect(offset(boxes.at(-1)!)).toBeCloseTo(0, 6);
    }
  });

  it('clamps the corner radius so a box smaller than its radius cannot invert', () => {
    // The navbar handoff (Phase 8) shrinks the frame below 2r on the short axis.
    for (const box of [
      { x: 0, y: 0, w: 10, h: 10, r: 999 },
      { x: 0, y: 0, w: 40, h: 12, r: 20 },
      { x: 0, y: 0, w: 0, h: 0, r: 20 },
    ]) {
      const d = computeFramePath(box);
      expect(d).not.toMatch(/NaN/);
      expect(numbers(d).every(Number.isFinite)).toBe(true);
    }
    expect(computeFramePath({ x: 0, y: 0, w: 10, h: 10, r: 999 })).toMatch(/A5,5/);
    expect(computeFramePath({ x: 0, y: 0, w: 40, h: 12, r: 20 })).toMatch(/A6,6/);
  });
});

describe('the 70% design frame', () => {
  it('lands on exactly 70vw x 70vh at desktop', () => {
    for (const [vw, vh] of [
      [1440, 900],
      [1920, 1080],
      [3440, 1440],
    ] as const) {
      const f = computeFrameGeometry(vw, vh);
      expect(f.w).toBeCloseTo(vw * 0.7, 6);
      expect(f.h).toBeCloseTo(vh * 0.7, 6);
      expect(f.x).toBeCloseTo(vw * 0.15, 6);
      expect(f.y).toBeCloseTo(vh * 0.15, 6);
    }
  });

  it('widens below 1024, and below 768 grows on BOTH axes', () => {
    expect(computeFrameGeometry(900, 800).w).toBeCloseTo(756, 6); // 84vw
    expect(computeFrameGeometry(900, 800).h).toBeCloseTo(620, 6); // 70vh -> 560, floored to 620
    expect(computeFrameGeometry(375, 667).w).toBeCloseTo(345, 6); // 92vw
    // The phone frame is TALLER than desktop's, not shorter as it once was: one
    // panel's chips each wrap to two lines at phone width, and at the old 62vh
    // the list and CTA overflowed and ran under the indicator. Here 78vh (520)
    // is below the 620 floor, so the 88% ceiling decides: 587.
    expect(computeFrameGeometry(375, 667).h).toBeCloseTo(667 * 0.88, 6); // 586.96
    expect(computeFrameGeometry(375, 667).h).toBeGreaterThan(667 * 0.7);
    // 1024 itself is desktop — the breakpoint is exclusive.
    expect(computeFrameGeometry(1024, 800).w).toBeCloseTo(716.8, 6);
  });

  it('floors the frame height so short viewports do not clip the panel', () => {
    // A pure fraction assumes a tall viewport. At 1280x720 the canonical 70%
    // gives 504px against a panel needing ~536, so the CTA crossed the indicator
    // and clipped — reproduced against the pre-fix build, i.e. not a regression.
    expect(computeFrameGeometry(1280, 720).h).toBeCloseTo(620, 6); // not 504
    expect(computeFrameGeometry(1024, 768).h).toBeCloseTo(620, 6); // not 537.6

    // The floor NEVER touches the canonical desktop frame — it is inert wherever
    // 70vh already clears it. This is the guarantee that the design is unchanged.
    for (const [vw, vh] of [
      [1440, 900],
      [1920, 1080],
      [3440, 1440],
    ] as const) {
      expect(computeFrameGeometry(vw, vh).h).toBeCloseTo(vh * 0.7, 6);
    }

    // And the ceiling stops the floor swallowing a small screen whole.
    expect(computeFrameGeometry(320, 568).h).toBeCloseTo(568 * 0.88, 6);
    expect(computeFrameGeometry(320, 568).h).toBeLessThan(568);
  });

  it('ends on the absolute 20px radius, not a proportional one', () => {
    // The bowl's radius is a fraction of the logo width; the frame's is fixed.
    // A proportional radius at full-viewport size reads as a stadium.
    for (const [vw, vh] of VIEWPORTS) {
      const boxes = expansion(vw, vh);
      expect(boxes.at(-1)!.r).toBeCloseTo(FRAME_RADIUS, 6);
      expect(boxes[0]!.r).toBeLessThan(FRAME_RADIUS);
    }
  });

  it('reads as a scale rather than a stretch on common desktop aspects', () => {
    // At desktop the frame is 70% of BOTH axes, so its proportion is the
    // display's. The bowl it grows from is 1.452:1, so how much the shape
    // appears to stretch is a property of the monitor:
    //
    //   16:10 (1440x900)  frame 1.600  -> +10% proportion   reads as growth
    //   16:9  (1920x1080) frame 1.778  -> +22%              still reads as growth
    //   21:9  (3440x1440) frame 2.389  -> +65%              visibly wider
    //
    // 16:9 and 16:10 are the assertion because they are what nearly every
    // desktop visitor has. Ultrawide is accepted: "exactly 70vw x 70vh" is the
    // acceptance criterion, and capping the aspect there would break it. If
    // these fractions are ever changed, check the result against 1.452 first.
    const bowlRatio =
      computeLogoGeometry(1440, 900).frame.w / computeLogoGeometry(1440, 900).frame.h;
    expect(bowlRatio).toBeCloseTo(1.4521, 3);

    const ratioAt = (vw: number, vh: number) => {
      const f = computeFrameGeometry(vw, vh);
      return f.w / f.h;
    };
    expect(ratioAt(1440, 900)).toBeCloseTo(1.6, 3);
    expect(ratioAt(1920, 1080)).toBeCloseTo(16 / 9, 3);
    for (const [vw, vh] of [
      [1440, 900],
      [1680, 1050],
      [1920, 1080],
      [2560, 1440],
    ] as const) {
      expect(Math.abs(ratioAt(vw, vh) / bowlRatio - 1)).toBeLessThan(0.25);
    }
  });
});

/** Minimal stand-in for the one SVG path — unit tests run in node, not jsdom. */
function fakeFrame() {
  const attrs = new Map<string, string>();
  const el = {
    setAttribute: (k: string, v: string) => void attrs.set(k, v),
    removeAttribute: (k: string) => void attrs.delete(k),
    getAttribute: (k: string) => attrs.get(k) ?? null,
  };
  return { el: el as unknown as SVGPathElement, attrs };
}

describe('frame attribute writes', () => {
  it('writes the dash as a fraction of the normalised 100-unit path', () => {
    const { el, attrs } = fakeFrame();
    setFrameDraw(el, 89.4);
    const [dash, gap] = attrs.get('stroke-dasharray')!.split(' ').map(Number);
    expect(dash).toBe(89.4); // the open Q
    expect(gap).toBeCloseTo(10.601, 6);
    setFrameDraw(el, 100);
    // Never "100 0": a zero-length gap makes some engines drop the dash and, with
    // a round linecap, flash a pip at the path start.
    expect(attrs.get('stroke-dasharray')).toBe('100 0.001');
  });

  it('regenerates `d` and never touches transform or stroke-width', () => {
    const { el, attrs } = fakeFrame();
    setFrameBox(el, computeLogoGeometry(1440, 900).frame);
    const small = attrs.get('d')!;
    setFrameBox(el, computeFrameGeometry(1440, 900));
    expect(attrs.get('d')).not.toBe(small);
    expect([...attrs.keys()]).toEqual(['d']);
  });

  it('restores the token strings at both ends of the stroke ramp', () => {
    const { el, attrs } = fakeFrame();
    setFrameStroke(el, 0.5);
    expect(attrs.get('stroke')).toBe('#86b881');
    setFrameStroke(el, 1);
    expect(attrs.get('stroke')).toBe(FRAME_STROKE_ACTIVE);
    // Scrolling back up must leave the exact string QFrame renders, so a later
    // React re-render is a no-op and the frame stays themeable.
    setFrameStroke(el, 0);
    expect(attrs.get('stroke')).toBe(FRAME_STROKE_REST);
  });

  it('leaves the interior genuinely unfilled until the ramp starts', () => {
    const { el, attrs } = fakeFrame();
    setFrameFill(el, 0);
    // `fill: none` is not `fill-opacity: 0` — an unfilled path is materially
    // cheaper to repaint at full-viewport size, which is the point of the delay.
    expect(attrs.get('fill')).toBe('none');
    expect(attrs.has('fill-opacity')).toBe(false);

    setFrameFill(el, 0.5);
    expect(attrs.get('fill')).toBe(FRAME_FILL);
    expect(attrs.get('fill-opacity')).toBe('0.5');

    setFrameFill(el, 1);
    expect(attrs.get('fill-opacity')).toBe('1');

    setFrameFill(el, 0); // reversed
    expect(attrs.get('fill')).toBe('none');
    expect(attrs.has('fill-opacity')).toBe(false);
  });
});

describe('colour literals vs styles/tokens.css', () => {
  const css = readFileSync(resolve(__dirname, '../../styles/tokens.css'), 'utf8');
  const token = (name: string) =>
    css.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`))?.[1]?.toLowerCase();

  /**
   * `var()` cannot be interpolated, so frameOps holds resolved copies of the two
   * stroke colours for the in-between frames. This reads them back out through
   * the public API (a mix at t≈0 rounds to the rest colour) and fails if either
   * copy drifts from the token it mirrors.
   */
  it('mixes between the same colours the tokens define', () => {
    const { el, attrs } = fakeFrame();
    setFrameStroke(el, 0.0001);
    expect(attrs.get('stroke')).toBe(token('--qx-white'));
    setFrameStroke(el, 0.9999);
    expect(attrs.get('stroke')).toBe(token('--qx-green-dim'));
  });

  it('names tokens that exist', () => {
    for (const value of [FRAME_STROKE_REST, FRAME_STROKE_ACTIVE, FRAME_FILL]) {
      const name = value.match(/var\((--[a-z-]+)\)/)![1]!;
      expect(css).toContain(`${name}:`);
    }
  });
});

describe('the Q worn by a DOM container vs styles/tokens.css', () => {
  const css = readFileSync(resolve(__dirname, '../../styles/tokens.css'), 'utf8');
  const percent = (name: string) =>
    Number(css.match(new RegExp(`${name}:\\s*min\\(([\\d.]+)%`))?.[1]);

  /**
   * `.qx-open-frame` draws the mark around a DOM block whose size CSS knows and
   * JavaScript does not, so its opening is two percentages in `tokens.css`
   * rather than a call to `gapFor`. That is the one place in the project where a
   * measured ratio is restated outside `motion/geometry.ts` — which is exactly
   * the condition this file's other drift guard exists for.
   *
   * The tokens are the COMPLEMENTS of the bowl's two fractions: the mark's
   * bottom stroke stops at 80.2% of the width, so the opening is the remaining
   * 19.8%.
   */
  it('opens the corner by the mark\u2019s own measured fractions', () => {
    expect(percent('--qx-open-gap-w')).toBeCloseTo((1 - FRAME_BAR_FRACTION) * 100, 1);
    expect(percent('--qx-open-gap-h')).toBeCloseTo((1 - FRAME_STUB_FRACTION) * 100, 1);
  });

  /**
   * A gap wider than the corner radius, or the mask would bite into the arc from
   * both sides and leave a floating sliver of border below the opening.
   */
  it('opens wider than the corner it removes', () => {
    const box = { w: 1000, h: 600 };
    expect((percent('--qx-open-gap-w') / 100) * box.w).toBeGreaterThan(FRAME_RADIUS);
    expect((percent('--qx-open-gap-h') / 100) * box.h).toBeGreaterThan(FRAME_RADIUS);
  });
});

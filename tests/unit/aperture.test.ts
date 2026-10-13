import { describe, expect, it } from 'vitest';
import {
  apertureScale,
  APERTURE_SCALE_MAX,
  APERTURE_SCALE_MIN,
  computeApertureGeometry,
  computeFrameGeometry,
  computeFramePath,
  computeLogoGeometry,
  frameGapPoint,
  frameOpenFraction,
  FRAME_BAR_FRACTION,
  FRAME_OPEN_FRACTION,
  gapFor,
  GAP_BAR_STROKES,
  GAP_STUB_STROKES,
  LOGO_GAP,
  restGapProfile,
  lerpBox,
  type Box,
} from '../../motion/geometry';
import {
  apertureBox,
  apertureDollyT,
  apertureDraw,
  apertureFill,
  apertureStrokeOpacity,
  apertureInk,
  apertureRays,
  INK_HANDOFF_T,
  RAY_FADE_T,
} from '../../motion/timelines/apertureTimeline';

/**
 * The aperture's geometry. Everything here is pure arithmetic on boxes, so it is
 * checked without a browser, a scroll, or a frame of time.
 *
 * The two claims worth reading are the gap fixed point (the reason the dolly
 * reads as a camera move) and the coverage guarantee (the reason the ink handoff
 * cannot show a seam).
 */

const VIEWPORTS = [
  [320, 568],
  [390, 844],
  [768, 1024],
  [900, 800],
  [1024, 768],
  [1280, 800],
  [1440, 900],
  [1920, 1080],
  [3440, 1440],
] as const;

/** The bowl at source scale — the box FRAME_OPEN_FRACTION was measured on. */
const BOWL: Box = { x: 19.5, y: 19.5, w: 424, h: 292, r: 17 };

describe('frameOpenFraction', () => {
  it('reproduces the in-browser measurement at the bowl', () => {
    // FRAME_OPEN_FRACTION came from getTotalLength on the real path. If the
    // analytic walk of computeFramePath's eleven segments disagrees with it,
    // one of the two is wrong — and this is what says which.
    expect(frameOpenFraction(BOWL)).toBeCloseTo(FRAME_OPEN_FRACTION, 5);
  });

  it('is nowhere near the bowl constant once the notch stops scaling', () => {
    // The reason this takes a profile rather than reusing 0.894. On the design
    // frame the opening is ~28px against a perimeter of ~3240, so the dash is
    // ~98.6 — miles from the bowl's 89.4. Using the constant there would leave
    // ~290px of the bottom edge undrawn: not a subtle cap misalignment, a
    // visibly amputated frame.
    for (const [vw, vh] of VIEWPORTS) {
      const box = computeFrameGeometry(vw, vh);
      const rr = Math.min(box.r, box.w / 2, box.h / 2);
      const perimeter = 2 * box.w + 2 * box.h + rr * (2 * Math.PI - 8);
      const error = Math.abs(frameOpenFraction(box, restGapProfile(vw, vh)) - FRAME_OPEN_FRACTION);
      expect(error * perimeter).toBeGreaterThan(100);
    }
  });

  it('leaves the opening undrawn and nothing else, at every viewport', () => {
    // The dash sits in the mid-90s — the opening against a perimeter of
    // thousands. Never AT 100, which is the closed rectangle this whole design
    // exists to avoid, and never near the bowl's 89.4, which would mean the
    // notch had gone back to scaling with the box.
    for (const [vw, vh] of VIEWPORTS) {
      const open = frameOpenFraction(computeFrameGeometry(vw, vh), restGapProfile(vw, vh));
      expect(open).toBeGreaterThan(0.9);
      expect(open).toBeLessThan(0.999);
    }
  });
});

describe('gapFor — the notch is measured in stroke widths', () => {
  it('reproduces the mark exactly at the bowl', () => {
    // The taper must not perturb the logo itself. At the bowl the derived
    // profile IS the measured one, because the bowl's 84px opening is exactly
    // GAP_BAR_STROKES of the bowl's own 39px stroke and both scale together.
    for (const [vw, vh] of VIEWPORTS) {
      const logo = computeLogoGeometry(vw, vh);
      const g = gapFor(logo.frame, logo.strokeWidth);
      expect(g.bar).toBeCloseTo(LOGO_GAP.bar, 12);
      expect(g.stub).toBeCloseTo(LOGO_GAP.stub, 12);
    }
  });

  it('grows the opening strictly slower than the box it sits on', () => {
    // The whole point of the exponent, and the two ways of getting it wrong. At
    // GAP_GROWTH 1 the notch is a fixed fraction of the box and arrives at the
    // design frame as a ~200px missing corner; at 0 it is frozen in pixels and
    // reads as a nick on a 1008px edge. It has to land strictly between.
    for (const [vw, vh] of VIEWPORTS) {
      const logo = computeLogoGeometry(vw, vh);
      const rest = computeFrameGeometry(vw, vh);
      const bowlPx = logo.frame.w * (1 - gapFor(logo.frame, logo.strokeWidth).bar);
      const restPx = rest.w * (1 - gapFor(rest, logo.strokeWidth).bar);

      // It grows...
      expect(restPx).toBeGreaterThan(bowlPx);
      // ...but strictly slower than the box, which is what an exponent below 1
      // means and what stops it becoming a missing corner again.
      expect(restPx / bowlPx).toBeLessThan(rest.w / logo.frame.w);
      // Measured against the gap this replaced rather than an absolute pixel
      // count, so the assertion survives a change to the exponent: it is 51-65%
      // of proportional across the matrix at GAP_GROWTH 0.75.
      expect(restPx).toBeLessThan(rest.w * (1 - FRAME_BAR_FRACTION) * 0.8);
    }
  });

  it('keeps the mark’s own 84:72 proportion at workspace size', () => {
    // One growth factor, taken from the width, drives both axes — so the opening
    // scales rather than shearing with the frame's aspect. Only the corner-arc
    // floor may break this, and only by widening the shorter side.
    const rest = computeFrameGeometry(1440, 900);
    const g = gapFor(rest, computeLogoGeometry(1440, 900).strokeWidth);
    const bar = rest.w * (1 - g.bar);
    const stub = rest.h * (1 - g.stub);
    expect(bar / stub).toBeCloseTo(GAP_BAR_STROKES / GAP_STUB_STROKES, 6);
  });

  it('never puts a terminal inside the corner arc', () => {
    // The floor's reason for existing. Past the arc, computeFramePath doubles
    // back on itself and frameOpenFraction's perimeter walk stops being true.
    for (const [vw, vh] of VIEWPORTS) {
      const box = computeFrameGeometry(vw, vh);
      const g = gapFor(box, computeLogoGeometry(vw, vh).strokeWidth);
      const rr = Math.min(box.r, box.w / 2, box.h / 2);
      expect(box.w * (1 - g.bar)).toBeGreaterThan(rr);
      expect(box.h * (1 - g.stub)).toBeGreaterThan(rr);
    }
  });
});

describe('frameGapPoint', () => {
  it('sits at the midpoint of the two terminals that bound the opening', () => {
    const b = computeFrameGeometry(1440, 900);
    const profile = restGapProfile(1440, 900);
    const barTerminal = { x: b.x + b.w * profile.bar, y: b.y + b.h };
    const stubTerminal = { x: b.x + b.w, y: b.y + b.h * profile.stub };
    const g = frameGapPoint(b, profile);
    expect(g.x).toBeCloseTo((barTerminal.x + stubTerminal.x) / 2, 10);
    expect(g.y).toBeCloseTo((barTerminal.y + stubTerminal.y) / 2, 10);
  });

  it('lies inside the box, toward the bottom-right', () => {
    for (const [vw, vh] of VIEWPORTS) {
      const b = computeFrameGeometry(vw, vh);
      const g = frameGapPoint(b, restGapProfile(vw, vh));
      expect(g.x).toBeGreaterThan(b.x + b.w / 2);
      expect(g.y).toBeGreaterThan(b.y + b.h / 2);
      expect(g.x).toBeLessThan(b.x + b.w);
      expect(g.y).toBeLessThan(b.y + b.h);
    }
  });
});

describe('the dolly is a homothety about the gap', () => {
  it('holds the gap point EXACTLY fixed across the whole move', () => {
    // The claim the whole aperture rests on. If the gap drifts, the move reads
    // as a rectangle growing rather than a camera flying through an opening,
    // and the five accents aimed at it land somewhere else.
    for (const [vw, vh] of VIEWPORTS) {
      const rest = computeFrameGeometry(vw, vh);
      const target = computeApertureGeometry(vw, vh);
      // The FROZEN profile, which is what addApertureSegment passes. Re-deriving
      // it per box is exactly the mistake this asserts against: the notch would
      // hold its pixel size while the box grew 30x, the fraction would shrink
      // every frame, and the gap point would crawl into the corner.
      const profile = restGapProfile(vw, vh);
      const g0 = frameGapPoint(rest, profile);
      for (const t of [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1]) {
        const g = frameGapPoint(lerpBox(rest, target, t), profile);
        // toBeCloseTo(_, 9) rather than toBe: the algebra is exact but the
        // floating-point path through lerpBox is not associative.
        expect(g.x).toBeCloseTo(g0.x, 9);
        expect(g.y).toBeCloseTo(g0.y, 9);
      }
    }
  });

  it('grows every dimension monotonically', () => {
    const rest = computeFrameGeometry(1440, 900);
    const target = computeApertureGeometry(1440, 900);
    let prev = rest;
    for (const t of [0.2, 0.4, 0.6, 0.8, 1]) {
      const box = lerpBox(rest, target, t);
      expect(box.w).toBeGreaterThan(prev.w);
      expect(box.h).toBeGreaterThan(prev.h);
      expect(box.r).toBeGreaterThan(prev.r);
      prev = box;
    }
  });

  it('keeps the path structurally identical to every other frame state', () => {
    // Same guarantee the expansion relies on: one command sequence from bowl to
    // design frame to aperture, so nothing has to interpolate across a
    // structural change.
    const commands = (d: string) => d.match(/[MLAZ]/g)?.join('') ?? '';
    const expected = commands(computeFramePath(computeFrameGeometry(1440, 900)));
    for (const [vw, vh] of VIEWPORTS) {
      const rest = computeFrameGeometry(vw, vh);
      const target = computeApertureGeometry(vw, vh);
      const profile = restGapProfile(vw, vh);
      for (const t of [0, 0.5, 1]) {
        expect(commands(computeFramePath(lerpBox(rest, target, t), profile))).toBe(expected);
      }
    }
  });
});

describe('apertureScale', () => {
  it('is driven by the far edges, not the near ones', () => {
    // The gap sits toward the bottom-right, so the frame clears the top-left of
    // the viewport long before it clears the bottom-right. Taking the max over
    // all four edges is what stops a band of page showing in a corner.
    const rest = computeFrameGeometry(1440, 900);
    const profile = restGapProfile(1440, 900);
    const g = frameGapPoint(rest, profile);
    const nearest = Math.max(g.x / (g.x - rest.x), g.y / (g.y - rest.y));
    const farthest = Math.max(
      (1440 - g.x) / (rest.x + rest.w - g.x),
      (900 - g.y) / (rest.y + rest.h - g.y),
    );
    expect(farthest).toBeGreaterThan(nearest);
    expect(apertureScale(rest, 1440, 900, 1, profile)).toBeCloseTo(farthest, 9);
  });

  it('never actually hits its guard rails', () => {
    // The clamp is a guard against a degenerate box, not a tuning knob — so it
    // must not be load-bearing at any real viewport. It matters more since the
    // notch stopped scaling: the required scale went from ~3x to as much as 38x,
    // and a ceiling that bound would silently under-cover the viewport and show
    // a band of page in the corner at the ink handoff.
    for (const [vw, vh] of VIEWPORTS) {
      const k = apertureScale(
        computeFrameGeometry(vw, vh),
        vw,
        vh,
        undefined,
        restGapProfile(vw, vh),
      );
      expect(k).toBeGreaterThan(APERTURE_SCALE_MIN);
      expect(k).toBeLessThan(APERTURE_SCALE_MAX);
    }
  });
});

describe('the aperture segment outputs', () => {
  const box = computeFrameGeometry(1440, 900);
  const profile = restGapProfile(1440, 900);

  it('never closes the gap — the dash is the box’s open fraction throughout', () => {
    // The frame used to arrive here closed and get cut back open across a 35vh
    // sub-beat. It no longer does: the Q keeps its gap from `boot`, so there is
    // nothing to re-open and the dash has no ramp in it at all.
    const open = frameOpenFraction(box, profile) * 100;
    expect(apertureDraw(box, profile)).toBeCloseTo(open, 9);
    expect(apertureDraw(box, profile)).toBeLessThan(100); // never the closed rectangle
  });

  it('hands over from the expansion with a byte-identical dash', () => {
    // At t=0 this segment's box IS the rest frame, which is exactly the box the
    // expansion finished on — so both write the same string. If they did not,
    // the frame would visibly flick its gap at the boundary in both directions:
    // entering the aperture, and on every onRefresh, which re-emits this
    // segment at t=0 while the expansion's values are the ones that must stand.
    const rest = computeFrameGeometry(1440, 900);
    expect(apertureBox(0, 1440, 900)).toEqual(rest);
    const dash = (d: number) => `${d} ${100 - d + 0.001}`;
    expect(dash(apertureDraw(apertureBox(0, 1440, 900), profile))).toBe(
      dash(frameOpenFraction(rest, profile) * 100),
    );
  });

  it('keeps the gap the same width all the way through the dolly', () => {
    // The dash is a percentage of pathLength, so it is only scale-invariant
    // while the ASPECT holds. The dolly is a homothety about the gap point, so
    // it does — but that is a property of computeApertureGeometry, and this is
    // what would fail the day the dolly stopped being one. A drifting dash would
    // read as the opening slowly healing shut as the camera approached it.
    for (const [vw, vh] of VIEWPORTS) {
      const frozen = restGapProfile(vw, vh);
      const at0 = apertureDraw(apertureBox(0, vw, vh), frozen);
      for (const t of [0.25, 0.5, 0.75, 1]) {
        expect(apertureDraw(apertureBox(t, vw, vh), frozen)).toBeCloseTo(at0, 9);
      }
    }
  });

  it('holds the frame at rest size while the panels clear', () => {
    const rest = computeFrameGeometry(1440, 900);
    expect(apertureDollyT(0)).toBe(0);
    expect(apertureBox(0, 1440, 900)).toEqual(rest);
    // The panels take the first 20vh to clear. The camera does not start moving
    // under them — it waits out their exit and a beat of the empty frame, so the
    // opening is legible before anything accelerates.
    expect(apertureDollyT(20 / 120)).toBe(0);
    expect(apertureBox(20 / 120, 1440, 900)).toEqual(rest);
    // ...and then it does move.
    expect(apertureDollyT(30 / 120)).toBeGreaterThan(0);
  });

  it('keeps the frame filled until the handoff, then hands off exactly once', () => {
    expect(apertureFill(0)).toBe(1);
    // Just before and just after the handoff position inside the dolly, which
    // now runs 25vh -> 105vh.
    const tAt = (dollyT: number) => (25 + 80 * dollyT) / 120;
    expect(apertureFill(tAt(INK_HANDOFF_T - 0.01))).toBe(1);
    expect(apertureFill(tAt(INK_HANDOFF_T + 0.01))).toBe(0);
    expect(apertureInk(tAt(INK_HANDOFF_T - 0.01))).toBe(0);
    expect(apertureInk(tAt(INK_HANDOFF_T + 0.01))).toBe(1);
  });

  it('stops painting the frame stroke at the same handoff as the fill', () => {
    // THE FRAME DOES NOT LEAVE THE SCREEN, IT ONLY GETS BIG. The dolly is a
    // homothety about the gap point at the box's bottom-right, so that corner
    // barely moves: measured at the end of the dolly the bottom edge parks 14px
    // below the fold at 360x740 and 22px at 430x932. A phone's visible viewport
    // then grows 60-100px when the URL bar hides — and `motionViewport()`
    // filters that on purpose — so the parked edge comes back as a green line
    // across the bottom and, with nothing ever clearing it, stayed for the whole
    // rest of the document.
    //
    // The fill already stood down at the handoff; the stroke is the other half
    // of the same moment, so they are asserted against the same positions.
    const tAt = (dollyT: number) => (25 + 80 * dollyT) / 120;
    expect(apertureStrokeOpacity(0)).toBe(1);
    expect(apertureStrokeOpacity(tAt(INK_HANDOFF_T - 0.01))).toBe(1);
    expect(apertureStrokeOpacity(tAt(INK_HANDOFF_T + 0.01))).toBe(0);
    // Locked TO the fill rather than to a copy of its threshold: these two are
    // one handoff, and a change that moved one without the other would put the
    // stroke back on screen with nothing behind it, or take it away early.
    for (let t = 0; t <= 1; t += 0.005) {
      expect(apertureStrokeOpacity(t)).toBe(apertureFill(t));
    }
  });

  it('never leaves a gap between the two ink surfaces at the handoff', () => {
    // The frame's fill goes and the ink field arrives in the SAME onUpdate, so
    // up to the clear-out there is always at least one full --qx-ink layer
    // painting the viewport. A one-frame hole here would flash the page
    // through at the exact moment the user is looking straight at it.
    //
    // Bounded at the clear-out, not at 1: the final 15vh is *supposed* to
    // uncover the page as the pin releases.
    const CLEAR_START = 105 / 120;
    for (let t = 0; t <= CLEAR_START; t += 0.005) {
      expect(apertureFill(t) + apertureInk(t)).toBeGreaterThanOrEqual(1 - 1e-9);
    }
  });

  it('clears the ink over the final 15vh so the page below shows through', () => {
    expect(apertureInk(104 / 120)).toBe(1);
    expect(apertureInk(1)).toBe(0);
    // Monotonic down across the clear-out — no flash back to opaque, which is
    // what a separate "set at handoff" tween would produce on refresh.
    let prev = 1;
    for (const t of [106 / 120, 110 / 120, 115 / 120, 1]) {
      const v = apertureInk(t);
      expect(v).toBeLessThanOrEqual(prev);
      prev = v;
    }
  });
});

describe('apertureRays — the light leaves on the scroll, not on a timer', () => {
  it('is untouched before the aperture starts', () => {
    // Scrubbing back up re-renders this segment at t = 0, and the rays belong to
    // the carousel behind it — dimming them there would darken the panel the
    // visitor has just scrolled back to.
    expect(apertureRays(0)).toBe(1);
    expect(apertureRays(-0.2)).toBe(1);
  });

  it('falls monotonically to nothing across its window', () => {
    let previous = apertureRays(0);
    for (let t = 0.01; t <= RAY_FADE_T; t += 0.01) {
      const value = apertureRays(t);
      expect(value).toBeLessThanOrEqual(previous + 1e-9);
      previous = value;
    }
    expect(apertureRays(RAY_FADE_T)).toBeCloseTo(0, 9);
  });

  it('is half out at the middle of its window', () => {
    expect(apertureRays(RAY_FADE_T / 2)).toBeCloseTo(0.5, 9);
  });

  it('never goes negative once the window has passed', () => {
    // The layer unmounts at RAY_FADE_T, but a scrub can land past it in one
    // frame, and a negative multiplier would invert the layer rather than hide it.
    for (const t of [RAY_FADE_T + 0.01, 0.8, 1]) {
      expect(apertureRays(t)).toBe(0);
    }
  });

  it('finishes well before the ink handoff, so the contexts are gone by the fly-through', () => {
    // The whole reason the window is a fraction of the segment rather than all
    // of it: two WebGL contexts must not be alive for the most expensive frames
    // on the page.
    expect(RAY_FADE_T).toBeLessThan(1);
    expect(apertureRays(1)).toBe(0);
  });
});

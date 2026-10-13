import { describe, expect, it } from 'vitest';
import {
  computeFrameGeometry,
  computeLogoGeometry,
  computeRayLayout,
  gapFor,
  RAY_MIN_GUTTER,
} from '@/motion/geometry';

/**
 * The light outside the design frame (`components/hero/FrameRays.tsx`).
 *
 * Everything asserted here is a claim the LAYER cannot make for itself, because
 * the layer is two WebGL canvases and jsdom has no GPU. What can be proven is
 * the geometry they are handed, and every one of these is a way the effect was
 * wrong at some point on the way in:
 *
 *   - a canvas clipped level with the frame, ending on a seam of half-lit fog
 *   - a bank that spilled past the frame far enough to light the far gutter
 *   - a highlight sitting on the frame's centreline, i.e. under its own stroke
 *   - two lamps rendered into a 40px margin on a laptop, for nothing
 */

const VIEWPORTS = [
  { vw: 1024, vh: 768 },
  { vw: 1280, vh: 720 },
  { vw: 1440, vh: 900 },
  { vw: 1920, vh: 1080 },
  { vw: 3440, vh: 1440 },
] as const;

describe('computeRayLayout', () => {
  it('declines every viewport with no gutter to light', () => {
    // Below 1024 `FRAME_FRACTIONS` widens the frame to 84-92% for the panel
    // layout, which leaves 40-80px each side. Two shafts in that is a green edge
    // glow paid for by the devices least able to afford a WebGL context.
    for (const vw of [360, 390, 768, 900, 1023]) {
      expect(computeRayLayout(vw, 800), `${vw}px still built a light layer`).toBeNull();
    }
  });

  it('lights every viewport that has one, starting exactly where the frame narrows', () => {
    for (const { vw, vh } of VIEWPORTS) {
      expect(computeRayLayout(vw, vh), `${vw}x${vh} has a gutter but no light`).not.toBeNull();
    }
    // The switch is a distance, not a breakpoint — but it must coincide with the
    // 1024 step, or there is a band of widths with a gutter and no lamps in it.
    const frame = computeFrameGeometry(1024, 768);
    expect(frame.x).toBeGreaterThanOrEqual(RAY_MIN_GUTTER);
    expect(computeFrameGeometry(1023, 768).x).toBeLessThan(RAY_MIN_GUTTER);
  });

  describe.each(VIEWPORTS)('at $vw x $vh', ({ vw, vh }) => {
    const layout = computeRayLayout(vw, vh)!;
    const frame = computeFrameGeometry(vw, vh);
    const stroke = computeLogoGeometry(vw, vh).strokeWidth;
    const right = frame.x + frame.w;

    it('runs each bank from the viewport edge to PAST the frame', () => {
      // The overshoot is the whole trick: the canvas's own edge has to be
      // terminated by the frame's opaque interior, not by its own texture.
      expect(layout.left.x).toBe(0);
      expect(layout.left.w).toBeGreaterThan(frame.x + stroke);
      expect(layout.right.x).toBeLessThan(right - stroke);
      expect(layout.right.x + layout.right.w).toBe(vw);
    });

    it('never lets a bank reach the far side of the frame', () => {
      // A cheap guard that would catch an overlap expressed as a fraction of the
      // viewport rather than of the frame, on a very wide screen.
      expect(layout.left.w).toBeLessThan(frame.x + frame.w / 2);
      expect(layout.right.x).toBeGreaterThan(frame.x + frame.w / 2);
    });

    it('keeps both banks inside the viewport, overshooting the frame vertically', () => {
      for (const bank of [layout.left, layout.right]) {
        expect(bank.y).toBeGreaterThanOrEqual(0);
        expect(bank.y + bank.h).toBeLessThanOrEqual(vh);
        // Taller than the frame wherever the viewport allows it, so the layer's
        // mask has something to fade rather than a hard horizontal end.
        if (frame.y > 0) expect(bank.y).toBeLessThan(frame.y);
      }
    });

    it('hangs each highlight off the OUTER face of its stroke, never across it', () => {
      // The stroke straddles the frame's centreline. A highlight centred there
      // is half-hidden under a rule that is painted on top of it, which is how
      // it ends up reading as a bar beside the frame instead of a glow off it.
      expect(layout.glintLeft.x + layout.glintLeft.w).toBeCloseTo(frame.x - stroke / 2, 6);
      expect(layout.glintRight.x).toBeCloseTo(right + stroke / 2, 6);
      expect(layout.glintLeft.w).toBe(layout.glintRight.w);
    });

    it('makes each highlight a CONTACT band, not a rule-length bar', () => {
      // It used to run the full height of the stroke, which is what made it read
      // as a bar drawn beside the frame rather than as the place the light lands.
      // The rake arrives on the bank's mid-height and nowhere else, so the bloom
      // is a band centred there and comfortably shorter than the frame.
      expect(layout.glintLeft.h).toBeLessThan(frame.h * 0.6);
      expect(layout.glintLeft.h).toBeGreaterThan(frame.h * 0.2);
      expect(layout.glintLeft.y).toBeGreaterThan(frame.y);
      expect(layout.glintLeft.y + layout.glintLeft.h).toBeLessThan(frame.y + frame.h);
      expect(layout.glintLeft.hot).toBeCloseTo(0.5, 6);
    });

    it('never lets the right highlight reach past where the Q stops', () => {
      // The mark's opening is the one place on the frame with no stroke. A
      // highlight running past the stub terminal is green paint in the gap the
      // whole brand is built on — and the camera later flies through it.
      const gap = gapFor(frame, stroke);
      const stubY = frame.y + frame.h * gap.stub + stroke / 2;
      expect(layout.glintRight.y + layout.glintRight.h).toBeLessThanOrEqual(stubY + 1e-6);
      expect(layout.glintRight.h).toBeGreaterThan(0);
      expect(layout.glintRight.h).toBeLessThan(frame.h);
    });

    it('keeps both hotspots at the height the light is actually arriving from', () => {
      // The banks are centred on the frame, so the source is at its mid-height
      // for both sides. THIS is the invariant that survives every retune of the
      // bloom's length: wherever the band starts and stops, the hot point on it
      // is the height the light actually comes in at.
      for (const glint of [layout.glintLeft, layout.glintRight]) {
        expect(glint.y + glint.h * glint.hot).toBeCloseTo(frame.y + frame.h / 2, 6);
      }
      // 0.5 when the band sits clear of the stub, above it when the stub clamps
      // the bottom off — never below, which would put the arrival above centre.
      expect(layout.glintRight.hot).toBeGreaterThanOrEqual(0.5 - 1e-9);
      expect(layout.glintRight.hot).toBeLessThanOrEqual(1);
    });

    it('scales the bloom with the stroke rather than pinning it in pixels', () => {
      // A fixed halo is a glow at one viewport and a smudge at another — the
      // same argument `GAP_GROWTH` makes about the mark's notch.
      expect(layout.glintLeft.w).toBeGreaterThanOrEqual(stroke * 2);
    });
  });

  it('widens the bloom as the mark grows', () => {
    const narrow = computeRayLayout(1024, 768)!;
    const wide = computeRayLayout(3440, 1440)!;
    expect(wide.glintLeft.w).toBeGreaterThan(narrow.glintLeft.w);
  });

  it('is symmetric, because the frame is centred', () => {
    const { vw, vh } = { vw: 1440, vh: 900 };
    const layout = computeRayLayout(vw, vh)!;
    expect(layout.left.w).toBeCloseTo(layout.right.w, 6);
    expect(layout.left.y).toBe(layout.right.y);
    expect(layout.left.h).toBe(layout.right.h);
    expect(vw - (layout.glintRight.x + layout.glintRight.w)).toBeCloseTo(layout.glintLeft.x, 6);
  });
});

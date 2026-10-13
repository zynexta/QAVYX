import { describe, expect, it } from 'vitest';
import { computeRayLayout, rakeConeFor } from '../../motion/geometry';

/**
 * The ray rake's shape constants, and the two properties that make them correct
 * at every viewport rather than at the one they were judged on.
 *
 * `RakeRays` quantises the ANGLE off its source axis, so the rays themselves are
 * aspect-independent — a slot is a slot at any canvas shape. Two things are not:
 *
 *   uReach  is a multiple of the canvas WIDTH, but the distance it is compared
 *           against runs from a source outside the bank to a fragment anywhere
 *           in it, which scales with the DIAGONAL.
 *   uSpread is the cone half-angle, and the cone has to cover the bank's own
 *           corners or the rake terminates in mid-air on a straight diagonal.
 *
 * Both are the same class of bug the previous shader's own cone derivation was
 * written for, and the same one that produced the ultrawide regression:
 * constants tuned against a 272 x 832 bank, applied to a 572 x 1331 one whose
 * aspect is 31% wider. That shader and its derivation are deleted; this file is
 * where the lesson now lives.
 *
 * These pin the READINGS — the cone clears the corner, the rays reach it — not
 * the numbers, so a better derivation is free to move them.
 */

const OUTSIDE = 0.6;

const bankAt = (vw: number, vh: number) => {
  const layout = computeRayLayout(vw, vh);
  if (!layout) throw new Error(`no ray layout at ${vw}x${vh}`);
  return layout.left;
};

const VIEWPORTS = [
  [1024, 768],
  [1280, 720],
  [1440, 900],
  [1920, 1080],
  [2560, 1440],
  [3440, 1440],
] as const;

/** Half-angle from the axis to the bank's far corner, from the real source. */
const cornerAngle = (w: number, h: number, outside: number) =>
  Math.atan(h / 2 / (w * (1 + outside)));

/** Source-to-corner distance. */
const cornerReach = (w: number, h: number, outside: number) =>
  Math.hypot(w * (1 + outside), h / 2);

describe('rakeConeFor', () => {
  it('always opens the cone wider than the bank’s own corner', () => {
    // If the cone closes inside the corner, the rake stops on a straight
    // diagonal line — a hard-edged wedge, which is exactly what the ultrawide
    // regression looked like and what the whole re-derivation exists to prevent.
    for (const [vw, vh] of VIEWPORTS) {
      const bank = bankAt(vw, vh);
      const { spread } = rakeConeFor(bank, OUTSIDE);
      expect(spread).toBeGreaterThan(cornerAngle(bank.w, bank.h, OUTSIDE));
    }
  });

  it('always reaches past the bank’s far corner', () => {
    // `uReach` is multiplied by the canvas width inside the shader, so the
    // comparison here is the same one the shader makes.
    for (const [vw, vh] of VIEWPORTS) {
      const bank = bankAt(vw, vh);
      const { reach } = rakeConeFor(bank, OUTSIDE);
      expect(bank.w * reach).toBeGreaterThan(cornerReach(bank.w, bank.h, OUTSIDE));
    }
  });

  it('holds the cone as a fixed margin over the corner, not as a constant', () => {
    // The margin is the reading. Holding the ANGLE constant instead is what
    // breaks on an ultrawide, whose bank is relatively much wider.
    const margins = VIEWPORTS.map(([vw, vh]) => {
      const bank = bankAt(vw, vh);
      const { spread } = rakeConeFor(bank, OUTSIDE);
      return spread / cornerAngle(bank.w, bank.h, OUTSIDE);
    });
    for (const m of margins) expect(m).toBeCloseTo(margins[0]!, 6);
  });

  it('tightens the cone as the source is pushed further out', () => {
    // Further out is a narrower fan, which is the dial between a burst and a
    // rake. It must move monotonically or the knob is not a knob.
    const bank = bankAt(1440, 900);
    const near = rakeConeFor(bank, 0.2).spread;
    const far = rakeConeFor(bank, 3).spread;
    expect(far).toBeLessThan(near);
  });

  it('clamps the cone rather than opening it to a disc', () => {
    // A very short, very wide bank would otherwise ask for a half-angle near
    // pi/2, which is not a rake any more — it is a point light.
    const squat = rakeConeFor({ x: 0, y: 0, w: 100, h: 4000 }, 0);
    expect(squat.spread).toBeLessThanOrEqual(1.15);
    expect(squat.spread).toBeGreaterThanOrEqual(0.35);
  });

  it('survives a degenerate box without producing NaN', () => {
    const cone = rakeConeFor({ x: 0, y: 0, w: 0, h: 0 }, OUTSIDE);
    expect(Number.isFinite(cone.reach)).toBe(true);
    expect(Number.isFinite(cone.spread)).toBe(true);
    expect(cone.reach).toBeGreaterThan(0);
    expect(cone.spread).toBeGreaterThan(0);
  });

  it('gives the two banks the same cone, by construction', () => {
    // Tolerance is float noise only: at 1440x900 the frame's x lands on
    // 216.00000000000006, putting the bank widths 5.7e-14px apart.
    for (const [vw, vh] of VIEWPORTS) {
      const layout = computeRayLayout(vw, vh)!;
      const left = rakeConeFor(layout.left, OUTSIDE);
      const right = rakeConeFor(layout.right, OUTSIDE);
      expect(left.spread).toBeCloseTo(right.spread, 12);
      expect(left.reach).toBeCloseTo(right.reach, 12);
    }
  });
});

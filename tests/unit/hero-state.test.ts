import { describe, expect, it } from 'vitest';
import { beatForProgress, P, trackTravel } from '../../motion/timelines/expandTimeline';
import { STEPS } from '../../motion/timelines/carouselTimeline';
import { computeFrameGeometry, frameInnerWidth, lerpBox } from '../../motion/geometry';
import { useHeroStore, setHeroBeat } from '../../state/heroStore';

/**
 * Phase 4 pure logic. The timelines themselves are validated end-to-end by the
 * Playwright slice spec (they need real SVG geometry GSAP can measure); what is
 * unit-testable here is the maths that decides beats, distances and boxes, plus
 * the store's render-avoidance guarantee.
 */

describe('beatForProgress', () => {

  it('maps each pin segment to its beat', () => {
    // Mid-segment probes, derived — a decimal that happens to sit in the right
    // segment today sits in the next one after any change to the vh table.
    const mid = (a: number, b: number) => (a + b) / 2;
    expect(beatForProgress(0)).toBe('ready'); // at rest, before any scroll
    expect(beatForProgress(mid(0.001, P.scaleEnd))).toBe('frame-scale');
    expect(beatForProgress(mid(P.scaleEnd, P.expandEnd))).toBe('frame-expand');
    expect(beatForProgress(mid(P.expandEnd, P.servicesEnd))).toBe('services');
    expect(beatForProgress(mid(P.servicesEnd, P.apertureEnd))).toBe('aperture');
    // §3.1's card, then the climb — the two segments Phase 8E's reorder added
    // and moved. `title` must end before `launch` begins: the card names the
    // story the rocket tells, and they are never on screen together.
    expect(beatForProgress(mid(P.apertureEnd, P.titleEnd))).toBe('title');
    expect(beatForProgress(mid(P.titleEnd, 1))).toBe('launch');
    expect(beatForProgress(1)).toBe('done');
  });

  it('holds "ready" through the float noise ScrollTrigger reports at rest', () => {
    // Guards the handoff: a fresh pinned trigger reports progress ~2e-7 at
    // scrollY 0, which must NOT overwrite `ready` with `frame-scale`.
    expect(beatForProgress(0)).toBe('ready');
    expect(beatForProgress(-0.001)).toBe('ready');
    expect(beatForProgress(2.2e-7)).toBe('ready'); // the measured noise value
    expect(beatForProgress(0.005)).toBe('frame-scale'); // a real scroll
  });

  it('treats the segment boundaries as half-open [start, end)', () => {
    // Written against P, not against 0.06/0.16/0.88. Hard-coded literals here
    // kept passing after the segment map moved — they landed interior to the
    // next segment and so asserted nothing about the boundary they were named
    // for. Derived, this test cannot go quiet: it always probes the real edge.
    expect(beatForProgress(P.scaleEnd)).toBe('frame-expand');
    expect(beatForProgress(P.expandEnd)).toBe('services');
    expect(beatForProgress(P.servicesEnd)).toBe('aperture');
    expect(beatForProgress(P.apertureEnd)).toBe('title');
    expect(beatForProgress(P.titleEnd)).toBe('launch');

    // ...and the other side of each edge.
    const ulp = 1e-9;
    expect(beatForProgress(P.scaleEnd - ulp)).toBe('frame-scale');
    expect(beatForProgress(P.expandEnd - ulp)).toBe('frame-expand');
    expect(beatForProgress(P.servicesEnd - ulp)).toBe('services');
    expect(beatForProgress(P.apertureEnd - ulp)).toBe('aperture');
    expect(beatForProgress(P.titleEnd - ulp)).toBe('title');

    expect(beatForProgress(1.5)).toBe('done'); // overscroll clamps to done
  });
});



describe('trackTravel', () => {
  // Phase 7 narrowed the step from the frame's width to its INNER width: real
  // panels are inset by the stroke on both sides so their edges never sit under
  // the frame's rule. Travelling by the outer width while laying panels out at
  // the inner one drifts by two stroke widths per step — visible by the last
  // panel. The per-panel arithmetic is covered in tests/unit/scroll-index.test.ts.
  //
  // `STEPS`, not a literal 4. These read `* 4` until the Launchpad panel made it
  // five, and a typed step count here does not fail when a panel is added — it
  // asserts that the track stops one panel short, which is the exact bug the
  // travel function exists to prevent.
  it('translates one panel-width per step', () => {
    expect(trackTravel(1440, 900)).toBeCloseTo(frameInnerWidth(1440, 900) * STEPS, 6);
    expect(trackTravel(1440, 900)).toBeLessThan(computeFrameGeometry(1440, 900).w * STEPS);
  });

  it('scales with the frame at every viewport', () => {
    for (const [vw, vh] of [
      [1280, 800],
      [1920, 1080],
    ] as const) {
      expect(trackTravel(vw, vh)).toBeCloseTo(frameInnerWidth(vw, vh) * STEPS, 6);
    }
  });
});

describe('lerpBox', () => {
  const a = { x: 0, y: 0, w: 100, h: 100, r: 10 };
  const b = { x: 200, y: 100, w: 300, h: 400, r: 20 };

  it('returns the endpoints at t=0 and t=1', () => {
    expect(lerpBox(a, b, 0)).toEqual(a);
    expect(lerpBox(a, b, 1)).toEqual(b);
  });

  it('interpolates every component at the midpoint', () => {
    expect(lerpBox(a, b, 0.5)).toEqual({ x: 100, y: 50, w: 200, h: 250, r: 15 });
  });
});

describe('heroStore', () => {
  it('starts at boot and advances through setHeroBeat', () => {
    useHeroStore.setState({ beat: 'boot' });
    setHeroBeat('ready');
    expect(useHeroStore.getState().beat).toBe('ready');
  });

  it('does not notify subscribers when the beat is unchanged', () => {
    // The scroll onUpdate calls setBeat every frame; a no-op write must not
    // re-render, or the indicator would repaint 60x/second instead of ~4x.
    useHeroStore.setState({ beat: 'services' });
    let notifications = 0;
    const unsub = useHeroStore.subscribe(() => {
      notifications += 1;
    });
    setHeroBeat('services'); // same value
    setHeroBeat('services');
    expect(notifications).toBe(0);
    setHeroBeat('aperture'); // genuine change
    expect(notifications).toBe(1);
    unsub();
  });
});

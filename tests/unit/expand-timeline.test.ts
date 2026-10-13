// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { gsap } from '@/motion/gsap';
import { beatForProgress, buildExpandTimeline, P } from '@/motion/timelines/expandTimeline';
import { computeFrameGeometry, frameOpenFraction, restGapProfile } from '@/motion/geometry';
import { PIN_A, PIN_TOUCH_COVERAGE } from '@/motion/scrollBudget';
import { mountStage, unmountStage } from './helpers/stage';

/**
 * The timeline's total duration is the contract every position in
 * `expandTimeline` is written against: because it is normalised to 1, a tween
 * placed at 0.06 is pin progress 0.06.
 *
 * That normalisation used to be emergent — GSAP sets a timeline's duration to
 * the end time of its furthest child, and the last tween happened to land on
 * exactly 1.0. Nothing asserted it. A segment ending at 0.995 would rescale
 * every position in the file by 1/0.995 and move the snap points, with no
 * failing test and nothing wrong-looking to read.
 */

afterEach(() => {
  unmountStage();
});

describe('buildExpandTimeline', () => {
  it('is normalised to a total duration of exactly 1', () => {
    const tl = buildExpandTimeline(mountStage());
    // toBe, not toBeCloseTo: 0.999 would rescale every position in the file.
    expect(tl.duration()).toBe(1);
  });

  it('holds the normalisation when the last segment ends short of 1', () => {
    // The assertion above cannot fail today: the final tween happens to end at
    // exactly 1.0, so the duration is 1 with or without the anchor. That is
    // precisely the hazard — it is emergent, and the day a segment ends at 0.995
    // every position in expandTimeline silently rescales by 1/0.995.
    //
    // So test the mechanism on a timeline that *does* end short, proving the
    // anchor is what holds the contract rather than luck.
    const withoutAnchor = gsap.timeline({ paused: true });
    withoutAnchor.to({ a: 0 }, { a: 1, duration: 0.5 }, 0.2);
    expect(withoutAnchor.duration()).toBe(0.7); // inferred from the furthest child

    const withAnchor = gsap.timeline({ paused: true });
    withAnchor.to({ a: 0 }, { a: 1, duration: 0.5 }, 0.2);
    withAnchor.set({}, {}, 1);
    expect(withAnchor.duration()).toBe(1);

    // And the consequence the anchor exists to prevent: the same child sits at a
    // different progress depending on whether the timeline was anchored.
    withoutAnchor.progress(1);
    withAnchor.progress(1);
    expect(withoutAnchor.time()).toBe(0.7);
    expect(withAnchor.time()).toBe(1);
  });

  it('builds paused, so constructing it animates nothing', () => {
    const tl = buildExpandTimeline(mountStage());
    expect(tl.paused()).toBe(true);
    expect(tl.progress()).toBe(0);
  });

  /**
   * The gap is the brand, and the one thing that could quietly take it away is a
   * dash write that reaches 100 — from any segment, at any progress. Seeking the
   * real timeline is the only check that covers all of them at once: it catches
   * the expansion re-closing, the aperture over-writing, and a future segment
   * touching a property it does not own.
   *
   * jsdom reports 1024x768, so the boxes below are that viewport's.
   */
  it('never closes the Q’s gap, at any progress on the pin', () => {
    const refs = mountStage();
    const tl = buildExpandTimeline(refs);
    const drawn = () => Number(refs.frame.getAttribute('stroke-dasharray')!.split(' ')[0]);

    // Every beat boundary, plus the middle of each segment, plus the ends.
    const marks = PIN_A.spans.flatMap((s: { start: number; end: number }) => [s.start, (s.start + s.end) / 2, s.end]);
    for (const p of [0, ...marks, 1]) {
      tl.progress(p);
      // Nothing has written the dash yet at p=0 — the intro owns that, and it is
      // a different timeline. Once something has, it must never be the rectangle.
      if (refs.frame.getAttribute('stroke-dasharray') === null) continue;
      expect(drawn(), `closed the gap at pin progress ${p}`).toBeLessThan(99.9);
    }

    // And it lands on the caps, not merely somewhere short of closed. The
    // expected value is the DESIGN FRAME's tapered profile — ~98.5, not the
    // bowl's 89.4: the notch stops growing with the box, so by the workspace it
    // is a couple of stroke widths on a perimeter of thousands.
    //
    // PRECISION 4, NOT 6, AND THE MISSING TWO DECIMALS ARE GSAP'S CLOCK.
    //
    // GSAP quantises a timeline's time to 7 decimal places, so a segment
    // boundary is only ever hit as exactly as that rounding allows. Whether the
    // boundary rounds up (the tween clamps at ratio 1) or down (it lands a hair
    // short) depends entirely on the pin's total vh:
    //
    //     940vh   P.expandEnd 0.0851063829787234 -> 0.0851064, ratio 1.00000032
    //     1015vh  P.expandEnd 0.0788177339901478 -> 0.0788177, ratio 0.99999931
    //
    // 6 passed for years because 940 happened to round up. When the Launchpad
    // panel took the pin to 1015 it began rounding down, the expand proxy landed
    // 6.9e-7 short of 1, and the dash came out 2.8e-6 low — about 5e-4 of a pixel
    // on a 717px box, which no eye and no rasteriser can see.
    //
    // What this assertion is FOR is separating the workspace's ~94.2 from the
    // bowl's ~89.4, five whole units apart. 4 is still four orders of magnitude
    // tighter than that distinction needs, and it no longer depends on the pin's
    // length dividing nicely.
    const workspaceOpen =
      frameOpenFraction(computeFrameGeometry(1024, 768), restGapProfile(1024, 768)) * 100;
    tl.progress(P.expandEnd);
    expect(drawn()).toBeCloseTo(workspaceOpen, 4);

    // Still open at the far end of the carousel, where the frame is at its
    // largest and a lost gap would be most visible.
    tl.progress(P.servicesEnd);
    expect(drawn()).toBeCloseTo(workspaceOpen, 4);
  });
});

/**
 * THE PIN WITHOUT ITS LAST BEAT — `{ launch: false }`, which touch builds.
 *
 * The anchor moving with the segment is the load-bearing half. Leaving it at 1
 * while the launch content is gone would stretch a timeline whose real content
 * ends at 0.685 across the whole trigger — the exact silent rescale the docblock
 * at the top of this file exists to prevent, at 1.46x, on every position in
 * `expandTimeline`.
 */
describe('buildExpandTimeline without the launch beat', () => {
  it('anchors its duration at the cut, not at 1', () => {
    const tl = buildExpandTimeline(mountStage(), { launch: false });

    // NOT `toBe`, AND THE REASON IS GSAP RATHER THAN A LOOSE ASSERTION. Every
    // other duration in this file is checked with `toBe` because the value is
    // exactly 1 and survives any rounding. 695/1015 does not: GSAP rounds a
    // timeline's duration to 7 decimal places, so it reports 0.6847291 for an
    // anchor set at 0.6847290640394089.
    //
    // MEASURE THE CONSEQUENCE RATHER THAN WAVING AT IT, because the docblock at
    // the top of this file is about exactly this class of bug. The rescale
    // factor is 1.000000052 — against the 1/0.995 that note warns about, which
    // is 100,000x larger. On a 695vh pin at a 844px viewport it moves a beat by
    // 0.0003px. The 7-digit tolerance below is tighter than anything that could
    // ever move a snap point, and it is the precision GSAP actually offers.
    expect(tl.duration()).toBeCloseTo(PIN_TOUCH_COVERAGE, 7);
  });

  it('keeps every earlier beat at the position the full pin gives it', () => {
    // Positions are absolute on both timelines — nothing before the cut moves —
    // so the scaling happens between the timeline's duration and the trigger's
    // length, never inside the file.
    const full = buildExpandTimeline(mountStage());
    const fullEnd = full.duration();
    unmountStage();
    const cut = buildExpandTimeline(mountStage(), { launch: false });

    expect(fullEnd).toBe(1);
    expect(cut.duration()).toBeCloseTo(PIN_TOUCH_COVERAGE, 7); // GSAP rounding — see above
    // The same fraction of each timeline is the same fraction of each PIN, and
    // both pins are short by the same factor — so the beat lands on the same vh.
    // 3 digits = 0.0005vh = ~0.004px at a phone viewport, comfortably inside
    // GSAP's own 7-decimal duration rounding (see the note above) and orders of
    // magnitude tighter than anything that could move a beat visibly.
    for (const p of [P.scaleEnd, P.expandEnd, P.servicesEnd, P.apertureEnd]) {
      expect((p / cut.duration()) * 695).toBeCloseTo((p / fullEnd) * 1015, 3);
    }
  });

  it('defaults to building the launch beat, so no existing caller changes', () => {
    expect(buildExpandTimeline(mountStage()).duration()).toBe(1);
  });
});

/**
 * `beatForProgress`'s `end` argument, which is where THIS pin stops.
 *
 * On touch the pin's final position IS `P.titleEnd`. Without the `end` check the
 * ladder falls through to 'launch' there — a beat that device does not have —
 * and reports it for the whole of the rest of the page.
 */
describe('beatForProgress at a shortened pin', () => {
  it('still reports every kept beat', () => {
    expect(beatForProgress(P.scaleEnd - 1e-6, PIN_TOUCH_COVERAGE)).toBe('frame-scale');
    expect(beatForProgress(P.servicesEnd - 1e-6, PIN_TOUCH_COVERAGE)).toBe('services');
    expect(beatForProgress(P.titleEnd - 1e-6, PIN_TOUCH_COVERAGE)).toBe('title');
  });

  it('is done at the cut, and never launch', () => {
    expect(beatForProgress(PIN_TOUCH_COVERAGE, PIN_TOUCH_COVERAGE)).toBe('done');
    expect(beatForProgress(1, PIN_TOUCH_COVERAGE)).toBe('done');
  });

  it('defaults to the full pin, so the desktop ladder is untouched', () => {
    expect(beatForProgress(P.titleEnd)).toBe('launch');
    expect(beatForProgress(0.99)).toBe('launch');
    expect(beatForProgress(1)).toBe('done');
  });
});

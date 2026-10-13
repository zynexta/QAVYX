import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  BILLOW_COUNT,
  DEBRIS_FILL_REST,
  DEBRIS_STROKE_REST,
  setDebrisBurn,
  launchBillow,
  launchColumn,
  launchDebris,
  launchExhaust,
  launchFlameScale,
  launchPathT,
  launchLayerOpacity,
  launchRocketOpacity,
  launchSmoke,
  SMOKE_COUNT,
  tableauScaleFor,
  ROCKET_SCALE,
  launchPropLabel,
} from '../../motion/timelines/launchTimeline';
import { FAILURE_MODES } from '../../content/launch';
import { TRAJECTORY_DEBRIS, trajectoryBox } from '../../motion/geometry';

/**
 * The launch's arithmetic. All pure, so the whole segment is checked without a
 * browser, a scroll, or a frame of time.
 *
 * The two claims worth reading are that the vehicle accelerates without an ease
 * (speed is path-per-scroll, which is the only way a scrubbed tween may do it)
 * and that the drawn route never runs ahead of the vehicle drawing it.
 */

const samples = (n = 400) => Array.from({ length: n + 1 }, (_, i) => i / n);

describe('launchPathT', () => {
  it('runs the whole route, once, forwards', () => {
    expect(launchPathT(0)).toBe(0);
    expect(launchPathT(1)).toBe(1);
    let prev = -1;
    for (const t of samples()) {
      const p = launchPathT(t);
      expect(p).toBeGreaterThanOrEqual(prev);
      prev = p;
    }
  });

  it('accelerates without an ease', () => {
    // Every scrubbed tween in this project is `ease: 'none'` — an ease inside a
    // scrubbed tween lags the scroll pointer and reads as unresponsive. So the
    // acceleration has to come from covering more PATH per unit of scroll, and
    // this is the test that says it actually does.
    const speed = (a: number, b: number) => (launchPathT(b) - launchPathT(a)) / (b - a);
    const ignition = speed(0.02, 0.08);
    const legA = speed(0.15, 0.28);
    const legB = speed(0.36, 0.5);
    const brk = speed(0.55, 0.64);
    const legC = speed(0.7, 0.85);

    expect(ignition).toBeLessThan(legA); // barely moves off the pad
    expect(legA).toBeLessThan(legB); // building
    expect(brk).toBeLessThan(legA); // nearly stalled
    expect(legC).toBeGreaterThan(legB); // and away
    // Four genuinely distinct speeds, not four labels on one rate.
    expect(new Set([ignition, legA, legB, brk, legC].map((v) => v.toFixed(3))).size).toBe(5);
  });

  it('clamps outside the segment', () => {
    expect(launchPathT(-1)).toBe(0);
    expect(launchPathT(2)).toBe(1);
  });
});

/**
 * THE ROUTE IS NOT DRAWN, and this is the test that used to prove it was.
 *
 * `launchDraw` and `launchTrail` were tested here — the line never running
 * ahead of the vehicle, the tail pinned to its tip, the break holding while the
 * vehicle climbed away. Both functions are deleted on the client's direction
 * ("i dont want the line in rocket launching it look bad"), so their tests go
 * with them rather than being kept green against nothing.
 *
 * What replaces them is the assertion the instruction actually makes. It reads
 * the component's source because that is where the decision lives: the element
 * still exists — `MotionPathPlugin` measures the vehicle against its `d` — and
 * the whole change is that it carries no ink. A future `stroke="var(--qx-...)"`
 * or a `stroke-dasharray` on it would restore the line silently and look, in a
 * diff, exactly like a styling tidy-up.
 */
describe('the route', () => {
  const layer = readFileSync(new URL('../../components/hero/LaunchLayer.tsx', import.meta.url), 'utf8');
  const traj = /<path\s+id="qx-traj"([\s\S]*?)\/>/.exec(layer)?.[1] ?? '';

  it('is in the DOM at all — the vehicle is measured against it', () => {
    expect(traj).not.toBe('');
    expect(traj).toMatch(/d=\{computeTrajectoryPath/);
    // Arc-length parameterisation: every spawn table in this file is written
    // in fractions of 100.
    expect(traj).toMatch(/pathLength=\{100\}/);
  });

  it('paints nothing — no stroke, no dash, no width', () => {
    expect(traj).toMatch(/stroke="none"/);
    expect(traj).not.toMatch(/stroke="var\(/);
    expect(traj).not.toMatch(/strokeWidth/);
    expect(traj).not.toMatch(/strokeDasharray|strokeDashoffset|strokeLinecap/);
  });

  it('is not written to by the timeline either', () => {
    const tl = readFileSync(new URL('../../motion/timelines/launchTimeline.ts', import.meta.url), 'utf8');
    // `traj` is still read (for `d`, and for the parent's translate) — what
    // must never come back is a per-frame write that paints it.
    expect(tl).not.toMatch(/traj\.setAttribute/);
  });
});

describe('the vehicle', () => {
  it('arrives on ignition and stays', () => {
    expect(launchRocketOpacity(0)).toBe(0);
    expect(launchRocketOpacity(1)).toBe(1);
    expect(launchRocketOpacity(0.5)).toBe(1);
  });

  it('loses its exhaust exactly through the stall', () => {
    // The one place green appears on the vehicle, and it goes dark when the
    // climb does. The beat does the work instead of a label.
    expect(launchExhaust(120 / 320)).toBe(1); // under power
    expect(launchExhaust(195 / 320)).toBeCloseTo(0, 6); // stalled
    expect(launchExhaust(1)).toBe(1); // relit
  });
});

describe('the debris', () => {
  it('rides the vehicle until its detach point, then stops advancing', () => {
    for (let i = 0; i < TRAJECTORY_DEBRIS.length; i++) {
      const at = TRAJECTORY_DEBRIS[i]!.at;
      // Before: it is exactly where the vehicle is.
      const early = samples(2000).find((t) => launchPathT(t) >= at * 0.5)!;
      expect(launchDebris(i, early).rideT).toBeCloseTo(launchPathT(early), 9);
      // After: it is left behind at the point it detached.
      expect(launchDebris(i, 1).rideT).toBeCloseTo(at, 9);
    }
  });

  it('is carried unseen, appears as it leaves, and is gone', () => {
    const i = 0;
    const at = TRAJECTORY_DEBRIS[i]!.at;
    const before = samples(2000).find((t) => launchPathT(t) >= at * 0.5)!;
    expect(launchDebris(i, before).opacity).toBe(0);
    expect(launchDebris(i, 1).opacity).toBeCloseTo(0, 6);
    // Somewhere between, it is visible.
    expect(Math.max(...samples(400).map((t) => launchDebris(i, t).opacity))).toBeGreaterThan(0.8);
  });

  it('burns as it goes, and is consumed', () => {
    // The client's note for this section is that the failed props BURN while
    // the rocket launches — so a prop does not merely drop out of frame. It
    // ignites at separation, cools as it falls, and shrinks the whole way.
    for (let i = 0; i < TRAJECTORY_DEBRIS.length; i++) {
      const at = TRAJECTORY_DEBRIS[i]!.at;
      const before = samples(2000).find((t) => launchPathT(t) >= at * 0.5)!;
      // Carried, unlit, whole.
      expect(launchDebris(i, before).burn).toBe(0);
      expect(launchDebris(i, before).scale).toBe(1);
      // It catches somewhere after it detaches...
      expect(Math.max(...samples(800).map((t) => launchDebris(i, t).burn))).toBeGreaterThan(0.8);
      // ...and is cold and smaller by the end.
      expect(launchDebris(i, 1).burn).toBe(0);
      expect(launchDebris(i, 1).scale).toBeLessThan(0.6);
    }
  });

  it('is never lit while it is still attached', () => {
    // An ember on a prop still riding the vehicle would read as the ROCKET
    // being on fire, which is the opposite of the beat.
    for (let i = 0; i < TRAJECTORY_DEBRIS.length; i++) {
      for (const t of samples(400)) {
        if (launchPathT(t) < TRAJECTORY_DEBRIS[i]!.at) {
          expect(launchDebris(i, t).burn).toBe(0);
        }
      }
    }
  });

  it('rests on the TOKENS, and only interpolates in between', () => {
    // The same discipline as the frame's stroke: `var()` cannot be
    // interpolated, so the in-between frames use resolved hex — but both
    // ENDPOINTS write the token strings back, or a prop at rest stops
    // re-theming and a React re-render becomes a visible flip.
    const frag = { attrs: {} as Record<string, string> };
    const el = {
      setAttribute: (k: string, v: string) => void (frag.attrs[k] = v),
    } as unknown as SVGPathElement;

    setDebrisBurn(el, 0);
    expect(frag.attrs.fill).toBe(DEBRIS_FILL_REST);
    expect(frag.attrs.stroke).toBe(DEBRIS_STROKE_REST);
    expect(DEBRIS_FILL_REST).toBe('var(--qx-ink)');

    setDebrisBurn(el, 0.5);
    expect(frag.attrs.fill).toMatch(/^#[0-9a-f]{6}$/);

    // ...and the literals must not drift from styles/tokens.css.
    const css = readFileSync(new URL('../../styles/tokens.css', import.meta.url), 'utf8');
    const token = (name: string) =>
      new RegExp(`--qx-${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css)?.[1]?.toLowerCase();
    setDebrisBurn(el, 1);
    expect(frag.attrs.fill).toBe(token('green'));
    expect(frag.attrs.stroke).toBe(token('green'));
  });

  it('throws in local coordinates, so a resize cannot strand it', () => {
    // The offsets are relative to wherever the outer group has ridden to. No
    // absolute position is ever baked, which is what makes this survive a
    // resize and reverse on scroll-up.
    const at = TRAJECTORY_DEBRIS[0]!.at;
    const before = samples(2000).find((t) => launchPathT(t) >= at * 0.5)!;
    const f0 = launchDebris(0, before);
    // toBeCloseTo, not toBe: a negative offset scaled by zero is -0, which
    // Object.is separates from +0. SVG renders `translate(-0 0)` identically.
    expect(f0.dx).toBeCloseTo(0, 10);
    expect(f0.dy).toBeCloseTo(0, 10);
    expect(f0.rotation).toBeCloseTo(0, 10);

    const f1 = launchDebris(0, 1);
    expect(Math.abs(f1.dx) + Math.abs(f1.dy)).toBeGreaterThan(50);
  });
});

describe('the props burning away', () => {
  /**
   * The client's note is this section's whole reason to exist: "some of the
   * props look like failure, losses, unprofessional — like props BURN while
   * launching the rocket; it's identify the Growth if you work with Qavyx."
   * These are the tests that keep the four objects reading as burning debris
   * rather than as four copies of one slide-off.
   */
  it('throws each prop on a ballistic arc, not a straight diagonal', () => {
    // Drag sideways, gravity downward. The test of an arc is that the path
    // is not a line: at the halfway point of the throw the piece is further
    // ACROSS than half its final crossing (it decelerates) and less far DOWN
    // than half its final drop (it accelerates).
    for (let i = 0; i < TRAJECTORY_DEBRIS.length; i++) {
      const at = TRAJECTORY_DEBRIS[i]!.at;
      const half = samples(4000).find((t) => launchPathT(t) >= at + 0.08)!;
      const end = samples(4000).find((t) => launchPathT(t) >= at + 0.16)!;
      const h = launchDebris(i, half);
      const e = launchDebris(i, end);
      expect(Math.abs(h.dx) / Math.abs(e.dx)).toBeGreaterThan(0.55);
      expect(Math.abs(h.dy) / Math.abs(e.dy)).toBeLessThan(0.5);
    }
  });

  it('tumbles every prop a different way, and none of them evenly', () => {
    // Four props turning at one rate in one direction is the tell that they
    // are one animation drawn four times. Direction comes from the side each
    // was thrown; the rate differs per prop; and the spin accelerates.
    const spins = TRAJECTORY_DEBRIS.map((_, i) => launchDebris(i, 1).rotation);
    expect(new Set(spins.map((s) => s.toFixed(2))).size).toBe(spins.length);
    expect(spins.some((s) => s > 0)).toBe(true);
    expect(spins.some((s) => s < 0)).toBe(true);

    // Accelerating: the second half of the throw turns further than the first.
    const at = TRAJECTORY_DEBRIS[0]!.at;
    const half = samples(4000).find((t) => launchPathT(t) >= at + 0.08)!;
    const first = Math.abs(launchDebris(0, half).rotation);
    const total = Math.abs(launchDebris(0, 1).rotation);
    expect(first).toBeLessThan(total / 2);
  });

  it('ignites, HOLDS at full heat, then chars — a fire, not a spark', () => {
    // The hold is the part that makes it read as burning. Something that
    // peaks and immediately decays is a flash; a flame has a life.
    for (let i = 0; i < TRAJECTORY_DEBRIS.length; i++) {
      const at = TRAJECTORY_DEBRIS[i]!.at;
      const at$ = (frac: number) =>
        launchDebris(i, samples(4000).find((t) => launchPathT(t) >= at + 0.16 * frac)!).burn;

      expect(launchDebris(i, 0).burn).toBe(0); // carried, unlit
      expect(at$(0.08)).toBeGreaterThan(0.9); // caught
      expect(at$(0.25)).toBeGreaterThan(0.9); // still at full heat
      expect(at$(0.7)).toBeLessThan(0.6); // cooling
      // Burnt out to charred ink, and it never re-lights.
      expect(launchDebris(i, 1).burn).toBeCloseTo(0, 6);
    }
  });

  it('never leaves the burn outside 0..1 — it is a colour mix', () => {
    for (let i = 0; i < TRAJECTORY_DEBRIS.length; i++) {
      for (const t of samples(400)) {
        const b = launchDebris(i, t).burn;
        expect(b).toBeGreaterThanOrEqual(0);
        expect(b).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('the smoke trail', () => {
  it('has a parcel for every table entry, and the component count to match', () => {
    expect(SMOKE_COUNT).toBe(6);
  });

  /**
   * THE STATIONS ARE EMITTED ON A CONSTANT SCROLL INTERVAL, NOT A CONSTANT ARC
   * ONE, and the table's `spawn` values are `launchPathT(born / VH)` evaluated
   * at author time. Re-derive them rather than trusting the typed copy: the
   * whole point of the design is that the arc spacing is NON-uniform (bunched
   * at the pad where the vehicle is slow, stretched through leg B where it is
   * fast), which makes a hand-typed value impossible to eyeball as wrong.
   */
  /**
   * SPAWNS ARE EVEN IN ARC, WITH THE STALL THE ONE GAP.
   *
   * They used to be even in vh (constant mass flow per unit time), which was
   * right for a long column and wrong for the short plume the client asked for:
   * with lifetimes this brief an emission gap that stretches opens a hole
   * between the vehicle and its own smoke, and one that closes stacks parcels
   * back into a tail. Even ARC spacing is what keeps exactly one plume under
   * the nozzle at every point in the climb.
   */
  it('spaces its parcels evenly along the route, with the stall the one gap', () => {
    const seats = Array.from({ length: SMOKE_COUNT }, (_, i) => launchSmoke(i, 0).rideT);
    const gaps = seats.slice(1).map((v, i) => v - seats[i]!);
    // Five gaps: four even ones and the stall.
    const even = gaps.filter((g) => Math.abs(g - 0.14) < 0.015);
    expect(even).toHaveLength(4);
    const stall = gaps.filter((g) => g > 0.2);
    expect(stall).toHaveLength(1);
    // ...and the big one is the stall, not a hole somewhere else.
    const i = gaps.findIndex((g) => g > 0.2);
    expect(seats[i]).toBeLessThan(launchPathT(170 / 320));
    expect(seats[i + 1]).toBeGreaterThan(launchPathT(215 / 320));
  });

  /**
   * THE PLUME IS SHORT — the client's direction, against a frame of the rocket
   * trailing ~550px of smoke down the screen ("i mean this not needed").
   *
   * Asserted as a fraction of the ROUTE rather than in pixels, so it holds at
   * every viewport: the whole live plume, from the newest parcel's leading edge
   * to the oldest one's trailing edge, must span less than a quarter of the
   * climb. Before the retune it reached 0.81 of it.
   */
  it('stays SHORT — the plume never becomes a column again', () => {
    for (const t of samples(400)) {
      const arc = launchPathT(t);
      const live = Array.from({ length: SMOKE_COUNT }, (_, i) => launchSmoke(i, t)).filter(
        (s) => s.opacity > 0.02,
      );
      if (live.length === 0) continue;
      // Distance below the vehicle, in arc, of the furthest live parcel's tail.
      // `ry` is in stage pixels and the route is ~0.94 of the box height, so a
      // pixel bound would be viewport-dependent; the SEATS are the part that
      // scales with the route, and they are what made it a column.
      const oldest = live[0]!;
      expect(arc - oldest.rideT).toBeLessThan(0.25);
      // And never more than two parcels carrying real density at once.
      expect(live.filter((s) => s.opacity > 0.1).length).toBeLessThanOrEqual(2);
    }
  });

  it('is nothing before its spawn, visible in life, and seated at the nozzle', () => {
    for (let i = 0; i < SMOKE_COUNT; i++) {
      // Before the vehicle reaches the spawn point: invisible, undrifted.
      // toBeCloseTo, not toBe: a negative drift scaled by zero is -0, which
      // Object.is separates from +0 — the same trap the debris test names.
      expect(launchSmoke(i, 0).opacity).toBe(0);
      expect(launchSmoke(i, 0).dx).toBeCloseTo(0, 10);
      // `dy` AT BIRTH IS NOT ZERO, and it is not the nozzle either. A parcel
      // used to be centred on the vehicle's ROTATION ORIGIN, two thirds up the
      // hull, where `#qx-rocket` painted over it; then on the NOZZLE, 51px
      // down, where the flame painted over it — the same bug twice by two
      // routes. It is seated at `44 * ROCKET_SCALE`, the flame's last quarter,
      // so the plume straddles the fire's tip and is visible from birth.
      expect(launchSmoke(i, 0).dy).toBeCloseTo(132, 10);
      // Somewhere in its life it is genuinely seen.
      const peak = Math.max(...samples(800).map((t) => launchSmoke(i, t).opacity));
      expect(peak).toBeGreaterThan(0.3);
      // Exhaust, not an object: it never reads as solid. The bound is on the
      // ATTRIBUTE, and what that attribute MEANS changed with the paint server
      // — `#qx-smoke-fill`'s first stop is at 38%, so this now describes a flat
      // core rather than a single peak pixel, and the area-mean is 0.508 of it
      // rather than 0.333. The ceiling moved 0.72 -> 0.80 with that change; it
      // is not a licence to keep raising it.
      expect(peak).toBeLessThanOrEqual(0.8);
    }
  });

  /**
   * THE TOP OF THE COLUMN IS STILL ALIVE AT THE ARRIVAL, DELIBERATELY.
   *
   * Every parcel used to be at exactly 0 by t=1, which emptied the frame `LEGS`
   * holds for 40vh precisely so it is legible — the vehicle sat alone on black
   * at the end of a launch. The three top stations now survive it, and the
   * three bottom ones do not, so the column extinguishes from the ground up.
   *
   * Both halves are asserted. A per-element death is a local invariant and the
   * layer's own fade is a global curtain; keeping only the curtain would let a
   * parcel that never dies hide behind `launchLayerOpacity` and reappear the
   * moment that number is touched.
   */
  /**
   * THE ARRIVAL IS ONE PARCEL, NOT A COLUMN.
   *
   * This assertion has been rewritten twice by the same client, and the history
   * is the point. It first required every parcel to be 0 at t=1, which emptied
   * the frame `LEGS` holds for 40vh so it is legible. It was then relaxed to
   * "the two top stations survive", which welded the column to the vehicle —
   * and that column is what they pointed at next: "i mean this not needed".
   * What is left is a single short plume under the flame.
   */
  it('arrives as ONE short plume under the flame, not a column', () => {
    const atArrival = Array.from({ length: SMOKE_COUNT }, (_, i) => launchSmoke(i, 1).opacity);
    expect(atArrival.filter((o) => o > 0)).toHaveLength(1);
    // ...and it is the NEWEST parcel, i.e. the one at the nozzle. Anything else
    // alive here is smoke that has been left behind, which is the whole bug.
    expect(atArrival.at(-1)!).toBeGreaterThan(0);
    // The pin still releases onto a clean page.
    expect(launchLayerOpacity(1)).toBe(0);
  });

  /**
   * THE PLUME IS CONTINUOUS EXCEPT FOR EXACTLY ONE HOLE, AND THE HOLE IS THE
   * STALL.
   *
   * This replaces `never leaves its column behind`, which asserted that live
   * smoke always exists while excluding a hard-coded window. With a short plume
   * "always exists" is the wrong claim — the client asked for less smoke and
   * the stall must be genuinely empty — and a hard-coded exclusion cannot tell
   * a deliberate gap from a hole somewhere else. So this FINDS the empty
   * stretches instead and checks there is exactly one, in the right place: it
   * opens no earlier than the flame starts dying, so there is never a lit
   * engine with nothing under it, and it has closed by the time the engine is
   * back. A hole opening anywhere else — a spawn moved, a window shortened —
   * fails here by name.
   */
  it('has exactly one hole in it, and the hole is the stall', () => {
    const OUT_START = launchPathT(170 / 320); // the flame begins to die
    const RELIT = launchPathT(215 / 320); // the flame is back at full
    const holes: Array<[number, number]> = [];
    let open: number | null = null;
    for (const t of samples(1000)) {
      const arc = launchPathT(t);
      if (arc < 0.2) continue;
      const anyLive = Array.from({ length: SMOKE_COUNT }, (_, i) => launchSmoke(i, t)).some(
        (s) => s.opacity > 0.01,
      );
      if (!anyLive) open = open ?? arc;
      else if (open !== null) {
        holes.push([open, arc]);
        open = null;
      }
    }
    if (open !== null) holes.push([open, 1]);

    expect(holes).toHaveLength(1);
    const [from, to] = holes[0]!;
    expect(from).toBeGreaterThanOrEqual(OUT_START - 1e-9);
    expect(to).toBeGreaterThan(RELIT);
  });

  it('is anchored to the route, not to a baked position', () => {
    // `rideT` is a fixed arc fraction resolved against the LIVE path — the same
    // resize-and-reverse property the debris has. A parcel must never advance
    // along the route; only its local drift moves it. It is also what lets
    // `addLaunchSegment` resolve every seat inside its path cache.
    for (let i = 0; i < SMOKE_COUNT; i++) {
      const spawn = launchSmoke(i, 0).rideT;
      for (const t of [0.2, 0.5, 0.8, 1]) {
        expect(launchSmoke(i, t).rideT).toBe(spawn);
      }
    }
  });

  it('grows and drifts monotonically while it lives, so scroll-up collapses it back', () => {
    for (let i = 0; i < SMOKE_COUNT; i++) {
      let lastRx = 0;
      let lastArea = 0;
      let lastDrift = -1;
      for (const t of samples()) {
        const s = launchSmoke(i, t);
        // Both radii, and their PRODUCT. `rx` alone would let a future aspect
        // change shrink the parcel along its other axis unnoticed.
        expect(s.rx).toBeGreaterThanOrEqual(lastRx);
        expect(s.rx * s.ry).toBeGreaterThanOrEqual(lastArea);
        const drift = Math.abs(s.dx) + Math.abs(s.dy);
        expect(drift).toBeGreaterThanOrEqual(lastDrift);
        lastRx = s.rx;
        lastArea = s.rx * s.ry;
        lastDrift = drift;
      }
    }
  });

  /**
   * THE COLUMN IS WIDEST AND FAINTEST AT THE BOTTOM — the one property that
   * makes it read as an exhaust plume rather than as a row of puffs. It falls
   * out of the ordering (spawns are fixed and the vehicle is monotonic, so the
   * stations are always sorted by age) plus `gx` falling and `window` rising up
   * the table, and none of that is obvious from any single number in it.
   */
  it('is widest and faintest at the pad end, at every point in the climb', () => {
    for (const t of [0.35, 0.5, 0.65, 0.8]) {
      const live = Array.from({ length: SMOKE_COUNT }, (_, i) => launchSmoke(i, t)).filter(
        (s) => s.opacity > 0,
      );
      for (let i = 1; i < live.length; i++) {
        expect(live[i]!.rx).toBeLessThanOrEqual(live[i - 1]!.rx);
        expect(live[i]!.opacity).toBeGreaterThanOrEqual(live[i - 1]!.opacity);
      }
    }
  });

  /**
   * A parcel's lateral wander is a FRACTION of its own width, never a pixel
   * constant, so it re-scales on resize for free and is bounded by the body it
   * belongs to. |sway| <= 0.41 < 0.5 means the centreline can never leave the
   * column — which is what keeps this turbulence rather than the S-curve the
   * client rejected twice.
   */
  it('never wanders outside its own body', () => {
    for (let i = 0; i < SMOKE_COUNT; i++) {
      for (const t of samples(400)) {
        const s = launchSmoke(i, t);
        expect(Math.abs(s.dx)).toBeLessThan(s.rx);
      }
    }
  });

  /**
   * NO FIRE, NO SMOKE — the client's rule, and the one this file used to argue
   * against in a comment.
   *
   * Before the gate, at vh 195 (the single frame where `launchExhaust` is
   * exactly 0 and the engine is visibly dead) the column was still painting
   * 0.49 / 0.27 / 0.12 under a rocket with no flame on it. Physically right —
   * smoke in the air outlives the engine — and the wrong picture, because the
   * stall exists to SHOW the engine going out.
   *
   * Asserted two ways. The pointwise one is what the client asked for; the
   * bound is what stops a future term sneaking in above the gate.
   */
  it('is gone whenever the flame is out, and never brighter than the flame', () => {
    let sawDark = false;
    for (const t of samples(600)) {
      const flame = launchExhaust(t);
      if (flame === 0) sawDark = true;
      for (let i = 0; i < SMOKE_COUNT; i++) {
        const { opacity } = launchSmoke(i, t);
        if (flame === 0) expect(opacity).toBe(0);
        expect(opacity).toBeLessThanOrEqual(0.8 * flame + 1e-12);
      }
    }
    // The engine really does go fully out somewhere, or the assertion above is
    // vacuous — the Phase 9 lesson, in its launch costume.
    expect(sawDark).toBe(true);
  });

  it('spawns nothing IN the stall — an engine that is out does not smoke', () => {
    // `launchExhaust` falls from vh 170 (arc 0.500) and is back at full by
    // vh 215 (arc 0.591). THAT WINDOW is the bar, and it is not a ceiling: two
    // stations spawn above it, under a relit engine at full power, and they are
    // what keeps the column attached to the vehicle through the escape.
    const OUT = [launchPathT(170 / 320), launchPathT(215 / 320)] as const;
    expect(OUT[0]).toBeCloseTo(0.5, 4);
    expect(OUT[1]).toBeCloseTo(0.5914, 3);
    for (let i = 0; i < SMOKE_COUNT; i++) {
      const seat = launchSmoke(i, 0).rideT;
      expect(seat < OUT[0] || seat > OUT[1]).toBe(true);
    }
    // And the bar is doing work: some stations really are on each side of it.
    const seats = Array.from({ length: SMOKE_COUNT }, (_, i) => launchSmoke(i, 0).rideT);
    expect(seats.filter((s) => s < OUT[0]).length).toBeGreaterThan(0);
    expect(seats.filter((s) => s > OUT[1]).length).toBeGreaterThan(0);
  });

  /**
   * AND NOTHING BRIGHTENS WHILE THE ENGINE IS GOING DARK. The stall bar above
   * is the letter of that rule; this is its purpose. A parcel reaches full
   * density `SMOKE_RISE` (0.03 of arc) after its spawn, so that whole ramp has
   * to happen under power — a station seated just below 0.500 would clear the
   * bar and still light up out of a dying engine.
   */
  it('reaches full density with the engine lit, on both sides of the stall', () => {
    const vhOf = (arc: number) => {
      // Invert launchPathT by search — the legs are monotone, so this is exact
      // enough at 0.1vh and avoids duplicating the table here.
      let lo = 0;
      let hi = 320;
      for (let k = 0; k < 40; k++) {
        const mid = (lo + hi) / 2;
        if (launchPathT(mid / 320) < arc) lo = mid;
        else hi = mid;
      }
      return hi;
    };
    for (let i = 0; i < SMOKE_COUNT; i++) {
      const full = launchSmoke(i, 0).rideT + 0.03;
      expect(launchExhaust(vhOf(full) / 320)).toBeGreaterThan(0.99);
    }
  });
});

describe('the tableau fits its viewport', () => {
  /**
   * THE BUG THIS EXISTS FOR, MEASURED IN A BROWSER BEFORE IT WAS WRITTEN.
   *
   * Every absolute pixel constant in this segment was authored on a 1440x900
   * screen; the ROUTE shrinks with the viewport and the vehicle hanging off it
   * did not. At 844x390 that put 67px of rocket below the screen at the pad and
   * — mid-climb, with the vehicle obviously flying — 21px of flame and 98px of
   * plume off the bottom.
   *
   * TWO CLEARANCES, because the two moments are different. At the pad only the
   * HULL has to clear: the flame is pointing into the ground on purpose, under
   * the billow. Once airborne the whole flame is in open air.
   *
   * This test is also what caught the FIRST fix being wrong. `min(1, vh / 900)`
   * cleared the landscape phone and left a 390x844 portrait phone over by a
   * single pixel — a viewport nobody would have thought to screenshot.
   */
  const HULL_BOTTOM = 21.6;
  const FLAME_TIP = 48;
  const START_Y = 0.97;
  const SPAN = 0.94;
  const AIRBORNE = 0.25;

  const viewports: ReadonlyArray<readonly [number, number, string]> = [
    [1440, 900, 'desktop'],
    [1920, 1080, 'wide desktop'],
    [1280, 720, 'laptop'],
    [1024, 700, 'small laptop'],
    [768, 640, 'tablet'],
    [390, 844, 'phone portrait'],
    [414, 896, 'phone portrait, large'],
    [844, 390, 'phone LANDSCAPE — the one that failed'],
    [740, 360, 'phone landscape, small'],
  ];

  it('keeps the hull on screen at the pad, and the whole flame once airborne', () => {
    for (const [vw, vh, name] of viewports) {
      const box = trajectoryBox(vw, vh);
      const k = tableauScaleFor(vw, vh);
      const padY = box.pad + box.h * START_Y;
      const airborneY = box.pad + box.h * (START_Y - SPAN * AIRBORNE);
      expect(padY + HULL_BOTTOM * ROCKET_SCALE * k, `hull at the pad — ${name}`).toBeLessThanOrEqual(
        vh + 1e-9,
      );
      expect(
        airborneY + FLAME_TIP * ROCKET_SCALE * k,
        `flame once airborne — ${name}`,
      ).toBeLessThanOrEqual(vh + 1e-9);
    }
  });

  it('is exactly full size wherever there is room — the desktop poster is untouched', () => {
    for (const [vw, vh] of [
      [1440, 900],
      [1920, 1080],
      [1280, 720],
      [1024, 700],
      [768, 640],
    ] as const) {
      expect(tableauScaleFor(vw, vh), `${vw}x${vh}`).toBe(1);
    }
  });

  it('binds only where it has to, and never inverts or vanishes', () => {
    // The two viewports that actually shrink, and by how much — so a change to
    // either clearance shows up as a number moving rather than as a silent
    // resize of the whole sequence.
    expect(tableauScaleFor(844, 390)).toBeCloseTo(0.747, 2);
    expect(tableauScaleFor(390, 844)).toBeCloseTo(0.957, 2);
    for (let vh = 320; vh <= 1200; vh += 10) {
      const k = tableauScaleFor(Math.max(320, vh), vh);
      expect(k).toBeGreaterThan(0.5);
      expect(k).toBeLessThanOrEqual(1);
    }
  });
});

describe('the ignition column and billow', () => {
  it('has a mound for every table entry, and the component count to match', () => {
    expect(BILLOW_COUNT).toBe(4);
  });

  it('the column grows with thrust and is gone once the vehicle is away', () => {
    expect(launchColumn(0).opacity).toBe(0); // nothing there yet
    // Mid-ignition: seated, dense, still short.
    const mid = launchColumn(24 / 320);
    expect(mid.opacity).toBeGreaterThan(0.5);
    // By mid-climb it does not exist; by the stall it must be long gone.
    expect(launchColumn(0.4).opacity).toBe(0);
    expect(launchColumn(1).opacity).toBe(0);
    // The scale never collapses — a zero-scaled path can render as a seam.
    for (const t of samples(200)) {
      expect(launchColumn(t).sy).toBeGreaterThanOrEqual(0.25);
      expect(launchColumn(t).sy).toBeLessThanOrEqual(1);
    }
  });

  it('the billow swells with ignition and dissolves as the vehicle climbs', () => {
    for (let i = 0; i < BILLOW_COUNT; i++) {
      expect(launchBillow(i, 0).opacity).toBe(0);
      // Mid-ignition: the pad is smoking.
      expect(launchBillow(i, 24 / 320).opacity).toBeGreaterThan(0.5);
      // The cloud hangs on the ground through the whole climb (BILLOW_CLEAR),
      // but the pad must be clean before the stall, and stay clean.
      expect(launchBillow(i, 195 / 320).opacity).toBe(0); // mid-stall
      expect(launchBillow(i, 0.7).opacity).toBe(0);
      expect(launchBillow(i, 1).opacity).toBe(0);
    }
  });

  it('the billow rolls outward from the pad, and only outward', () => {
    // dx/dy are offsets from the route's live start point — no absolute
    // position is ever baked, so a resize re-seats the whole tableau. They
    // grow with t (the cloud spreads sideways) but never change sign, and the
    // ground line dy never moves: real pad smoke rolls out, it does not fly.
    for (let i = 0; i < BILLOW_COUNT; i++) {
      const a = launchBillow(i, 0.02);
      const b = launchBillow(i, 0.6);
      expect(Math.sign(b.dx)).toBe(Math.sign(a.dx));
      expect(Math.abs(b.dx)).toBeGreaterThan(Math.abs(a.dx));
      expect(b.dy).toBe(a.dy);
      expect(b.r).toBeGreaterThan(a.r);
    }
  });
});

describe('the prop labels', () => {
  /**
   * The names are what make the burn mean something: without them the pin
   * spends three screens showing four anonymous panels fall off a rocket, and
   * the strings that say what they are sit a screen below, read after the
   * animation is over.
   */
  it('names every failure mode the content carries, and no more', () => {
    // The coupling that matters. A fifth failure mode in the content with no
    // prop to ride would be dropped silently; a fifth prop with no content
    // would be an unlabelled object making an unstated claim.
    expect(TRAJECTORY_DEBRIS).toHaveLength(FAILURE_MODES.length);
  });

  it('is dark while the prop is carried, and lights as it tears away', () => {
    for (let i = 0; i < TRAJECTORY_DEBRIS.length; i++) {
      const at = TRAJECTORY_DEBRIS[i]!.at;
      expect(launchPropLabel(i, 0)).toBe(0);
      const carried = samples(4000).find((t) => launchPathT(t) >= at * 0.5)!;
      expect(launchPropLabel(i, carried)).toBe(0);
    }
  });

  it('holds at FULL strength long enough to be read', () => {
    // The reason this is not simply the prop's own opacity, which spends most
    // of its life fading: a shape reads at any alpha, a word does not.
    for (let i = 0; i < TRAJECTORY_DEBRIS.length; i++) {
      const at = TRAJECTORY_DEBRIS[i]!.at;
      const at$ = (frac: number) =>
        launchPropLabel(i, samples(4000).find((t) => launchPathT(t) >= at + 0.16 * frac)!);
      expect(at$(0.1)).toBeGreaterThan(0.9);
      expect(at$(0.4)).toBe(1);
      expect(at$(0.55)).toBeGreaterThan(0.9);
    }
  });

  it('is gone before the charred prop is, and never comes back', () => {
    // The last thing on screen should be the failure disappearing, not a
    // caption outliving the thing it captions.
    for (let i = 0; i < TRAJECTORY_DEBRIS.length; i++) {
      const at = TRAJECTORY_DEBRIS[i]!.at;
      const gone = samples(4000).find((t) => launchPathT(t) >= at + 0.16 * 0.9)!;
      expect(launchPropLabel(i, gone)).toBe(0);
      expect(launchPropLabel(i, 1)).toBe(0);
      // ...and the prop is still there to be seen going.
      expect(launchDebris(i, gone).opacity).toBeGreaterThan(0);
    }
  });

  it('never leaves 0..1, at any scroll position', () => {
    for (let i = 0; i < TRAJECTORY_DEBRIS.length; i++) {
      for (const t of samples(400)) {
        const v = launchPropLabel(i, t);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('the flame', () => {
  it('is thrust: full under power, shrunk at the stall, back for the escape', () => {
    const under = launchFlameScale(120 / 320);
    const stalled = launchFlameScale(195 / 320);
    const relit = launchFlameScale(1);
    expect(under.sy).toBe(1);
    expect(stalled.sy).toBeLessThan(0.5);
    expect(relit.sy).toBe(1);
  });

  it('shortens in exact step with going dark — one beat, not two', () => {
    // Same driving curve as launchExhaust, so the plume cannot linger past its
    // own light or vice versa.
    for (const t of samples(100)) {
      const ex = launchExhaust(t);
      expect(launchFlameScale(t).sy).toBeCloseTo(0.45 + 0.55 * ex, 9);
    }
  });

  it('never collapses to nothing — a scaled group must stay renderable', () => {
    for (const t of samples(200)) {
      const { sx, sy } = launchFlameScale(t);
      expect(sx).toBeGreaterThan(0);
      expect(sy).toBeGreaterThan(0);
      expect(sx).toBeLessThanOrEqual(1);
      expect(sy).toBeLessThanOrEqual(1);
    }
  });
});

describe('handing the screen back to the page', () => {
  /**
   * The stage is fixed and full-viewport for the WHOLE document, so whatever the
   * launch leaves painted sits on top of every section below the pin. It used to
   * leave the finished trajectory there, and the site index — the homepage's
   * navigation — was rendered with a green curve running through it.
   */
  it('is fully opaque for the whole climb and the start of the arrival', () => {
    for (const t of [0.01, 0.25, 0.5, 0.875, 0.9375]) {
      expect(launchLayerOpacity(t)).toBe(1);
    }
  });

  it('is gone by the time the pin releases', () => {
    expect(launchLayerOpacity(1)).toBe(0);
  });

  /**
   * The arrival exists so the last frame can be READ. Fading from the moment the
   * vehicle stops would delete the beat it was built for, so the hold has to
   * survive: 20 of the arrival's 40vh at full opacity, then 20 fading.
   */
  it('holds half the arrival before it starts to go', () => {
    // 280vh of 320 is where the climb ends; 300 is where the fade starts.
    expect(launchLayerOpacity(280 / 320)).toBe(1);
    expect(launchLayerOpacity(300 / 320)).toBe(1);
    expect(launchLayerOpacity(310 / 320)).toBeCloseTo(0.5, 6);
  });

  it('never leaves the 0..1 range, and only ever decreases', () => {
    let last = Infinity;
    for (let i = 0; i <= 100; i++) {
      const v = launchLayerOpacity(i / 100);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(last);
      last = v;
    }
  });
});

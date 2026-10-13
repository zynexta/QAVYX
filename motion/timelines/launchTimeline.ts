import { MotionPathPlugin } from '@/motion/gsap';
import { TRAJECTORY_DEBRIS, TRAJECTORY_START, trajectoryBox } from '@/motion/geometry';
import { PIN_A } from '@/motion/scrollBudget';
import { motionViewport } from '@/motion/viewport';
import type { gsap } from '@/motion/gsap';

import type { StageRefs } from '@/types/hero';

/**
 * The launch: growth is not a straight line.
 *
 * The vehicle climbs a route that nearly stalls, relights and then leaves,
 * shedding the client's four failure modes on the way up. Intent (Global Gate
 * 6): the ascent is NAVIGATION and the debris is DISCOVERY. The third — three
 * waypoint dots lighting in order as CONFIRMATION — was removed on the client's
 * direction along with the drawn route; both notes are above their old sites.
 *
 * Same discipline as the aperture — one proxy, every output a pure function of
 * its position — for the same reason: `onRefresh` re-emits every segment, so two
 * tweens writing one property race there.
 *
 * Two things worth knowing before editing:
 *
 * 1. **The acceleration is not an ease.** Every scrubbed tween in this project
 *    is `ease: 'none'`, because an ease inside a scrubbed tween lags the scroll
 *    pointer and reads as unresponsive. Speed comes from how much PATH is
 *    covered per unit of scroll, which is what `LEGS` below encodes.
 * 2. **Nothing here uses DrawSVG, and now nothing strokes the route at all.**
 *    `#qx-traj` is `pathLength={100}` and exists only as the path
 *    `MotionPathPlugin` measures against — the vehicle, the pad tableau and
 *    every smoke spawn are seated on it by arc fraction. See `LaunchLayer`.
 */

/**
 * `getPositionOnPath(raw, t, true)` returns the angle too, but its declared type
 * is a union that TypeScript cannot narrow on a boolean argument. Asserting the
 * shape once here beats casting at every call site.
 */
interface PathPoint {
  x: number;
  y: number;
  angle: number;
}

/** The launch segment's length, and its sub-beats, in vh. */
const VH = 320;

/**
 * Path fraction reached at each point in the climb.
 *
 * The four legs cover different fractions of the route over different lengths of
 * scroll, so their speeds differ by design: 0.29, 0.40, 0.15 and 0.63 of the
 * path per 100vh. Slow out of the gate, building, almost stalled through the
 * break, then away. Monotonic throughout — the vehicle never reverses, only the
 * ROUTE dips.
 */
const LEGS: readonly (readonly [vh: number, pathT: number])[] = [
  [0, 0],
  [30, 0.02], // ignition — barely moves
  [100, 0.22], // leg A: climb out
  [170, 0.5], // leg B: building
  [210, 0.56], // the break: nearly stalled
  [280, 1], // leg C: escape
  [VH, 1], // arrival: held, so the last frame is legible
] as const;

/** Where the drawn route holds while the vehicle keeps going, and rejoins. */
const BREAK_START = 170;
const BREAK_HOLD_END = 195;
const BREAK_REJOIN_END = 215;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Piecewise-linear lookup over `[vh, value]` stops. */
function piecewise(vh: number, stops: readonly (readonly [number, number])[]): number {
  if (vh <= stops[0]![0]) return stops[0]![1];
  for (let i = 1; i < stops.length; i++) {
    const [x1, y1] = stops[i]!;
    const [x0, y0] = stops[i - 1]!;
    if (vh <= x1) return y0 + ((y1 - y0) * (vh - x0)) / (x1 - x0);
  }
  return stops[stops.length - 1]![1];
}

/** How far along the route the vehicle is, at launch position `t` (0..1). */
export function launchPathT(t: number): number {
  return clamp01(piecewise(clamp01(t) * VH, LEGS));
}

/* ---------------------------------------------------------------------------
   THE DRAWN ROUTE IS GONE, and this is where it was.
   ---------------------------------------------------------------------------
   `launchDraw` and `launchTrail` lived here: how much of the route was inked,
   and the sliding window that painted only its last 38 units. Both are deleted
   on the client's direction — "i dont want the line in rocket launching it look
   bad" — along with the three `setAttribute` calls a frame they drove and their
   tests. `components/hero/LaunchLayer.tsx` carries the full reasoning at the
   `#qx-traj` element, which stays as the path the vehicle is measured against.

   THE ONE THING THAT WENT WITH THEM, so nobody re-derives it by accident:
   `launchDraw`'s break/hold/rejoin was the drawn line stopping while the
   vehicle climbed away and then catching up — one of four tellings of "growth
   is not a straight line". `BREAK_START` / `BREAK_HOLD_END` /
   `BREAK_REJOIN_END` are NOT orphaned by this: `launchExhaust` reads all three,
   so the engine still dies and relights on exactly the old timing. The beat
   lost its line, not its shape.                                              */

/** The vehicle's opacity: in on ignition, held for the rest. */
export function launchRocketOpacity(t: number): number {
  return clamp01((clamp01(t) * VH) / 24);
}

/** Where the whole layer starts handing the screen back to the page, in vh. */
const HANDOFF_START = 300;

/**
 * The layer's own opacity — held through the arrival, then out.
 *
 * WHY THIS EXISTS. `#qx-stage` is `position: fixed` and covers the viewport for
 * the whole document, not just the pin. The arrival deliberately HOLDS the
 * finished trajectory so the last frame is legible (see `LEGS`) — but nothing
 * then cleared it, so the held line stayed painted, at `--qx-z-stage`, over
 * every section below the pin. With only `LaunchStatic` down there it went
 * unnoticed; the homepage's navigation now sits under it too, and a green curve
 * was running straight through the site index.
 *
 * The arrival keeps 20 of its 40vh fully held, so the beat it was built for is
 * unchanged; the last 20vh fade the layer out, and the pin releases onto a clean
 * page. Being a scrubbed value it reverses on the way back up like everything
 * else here — a one-way `.set()` at the end of the timeline would not.
 *
 * This fades the LAYER, not the trajectory's dash. Redrawing the line backwards
 * would read as the route being retracted, which is the opposite of the beat.
 */
export function launchLayerOpacity(t: number): number {
  const vh = clamp01(t) * VH;
  return 1 - clamp01((vh - HANDOFF_START) / (VH - HANDOFF_START));
}

/**
 * Exhaust opacity — present once under power, out through the break.
 *
 * The one place the green appears on the vehicle, and it goes dark exactly when
 * the climb stalls. That is the beat doing the work rather than a label.
 */
export function launchExhaust(t: number): number {
  const vh = clamp01(t) * VH;
  if (vh < 24) return clamp01((vh - 12) / 12);
  if (vh < BREAK_START) return 1;
  if (vh < BREAK_HOLD_END) return clamp01(1 - (vh - BREAK_START) / (BREAK_HOLD_END - BREAK_START));
  if (vh < BREAK_REJOIN_END) return clamp01((vh - BREAK_HOLD_END) / (BREAK_REJOIN_END - BREAK_HOLD_END));
  return 1;
}

/* `launchWaypointOpacity` was here: the three dots lighting in order as the
   vehicle passed §7's stages. Deleted with the dots on the client's direction —
   see `components/hero/LaunchLayer.tsx` for the full reasoning and for why
   `TRAJECTORY_WAYPOINTS` itself survives in `motion/geometry.ts`.            */

/**
 * The vehicle's static scale. The artwork is traced at 40 units tall; this
 * makes it the protagonist (§3.1 asks for the rocket, not a rocket). The
 * ignition tableau — pad, column, billow — is authored in ARTWORK units and
 * multiplied by this, so vehicle and ground effects resize as one thing.
 *
 * DECLARED BEFORE THE SMOKE, and it has to be: `PLUME_SEAT` below is a
 * top-level `const` derived from it, so a declaration after this point is a
 * temporal-dead-zone throw at module evaluation rather than a lint warning.
 */
export const ROCKET_SCALE = 3;

/* ---------------------------------------------------------------------------
   THE TABLEAU HAS TO FIT THE SCREEN, and it did not.
   ---------------------------------------------------------------------------
   Every absolute pixel constant in this segment — `ROCKET_SCALE`, `PLUME_SEAT`,
   the smoke radii, the billow offsets — is a stage pixel chosen on a 1440x900
   screen. The ROUTE is not: `trajectoryBox` insets by 10% of `min(vw, vh)` and
   the climb spans 0.94 of what is left, so the route shrinks with the viewport
   while the vehicle hanging off it did not.

   MEASURED, NOT SUSPECTED. At 844x390 — the landscape phone `motion/geometry.ts`
   already records as the one viewport this geometry does not fit — 67px of the
   rocket sat BELOW the screen at the pad, and mid-climb (arc 0.25, long clear
   of the ground) 21px of flame and 98px of plume were off the bottom.        */

/** The vehicle's fins, in artwork units below its origin. */
const HULL_BOTTOM_UNITS = 21.6;
/** The flame's tip, in artwork units below the same origin (`FLAME_PLUME`). */
const FLAME_TIP_UNITS = 48;
/**
 * Where the vehicle counts as airborne.
 *
 * The two clearances are different because the two moments are. AT THE PAD the
 * flame points INTO the ground on purpose, under the billow, so only the HULL
 * has to clear — sizing the flame against the pad would shrink the vehicle for
 * a gap it is supposed to close. Once airborne the flame is in open air and all
 * of it has to be on screen. 0.25 is where the measured clipping was still
 * happening with the vehicle obviously flying.
 */
const AIRBORNE_ARC = 0.25;
/** The climb's own span in normalised y: 0.97 at the pad down to 0.03. */
const ROUTE_SPAN = 0.94;

/**
 * How much of its authored size the launch tableau takes at a given viewport.
 *
 * DERIVED FROM THE TWO CLEARANCES ABOVE, not from a reference height. The first
 * attempt was `min(1, vh / 900)`, which fixed the landscape phone and left a
 * 390x844 PORTRAIT phone over by one pixel — caught by the test below rather
 * than by looking, which is the whole reason it is written as arithmetic.
 *
 * It is exactly 1 at every viewport with room to spare, so the desktop poster
 * and both common phone orientations are untouched: only 844x390 (0.75) and a
 * portrait phone (0.96) bind at all.
 *
 * THE PLUME IS DELIBERATELY NOT ONE OF THE CLEARANCES, and the number is
 * recorded so it is a decision rather than an oversight: at 844x390 about 50px
 * of the plume's tail still runs off the bottom mid-climb (it was 98 before
 * this). Adding it as a third bound gives k = 0.565 — a 34px rocket on a 390px
 * screen — to protect smoke from an edge it is entirely normal for smoke to
 * leave. A cropped plume reads as a photograph; a cropped VEHICLE reads as
 * broken, and that is the one this function exists to stop.
 *
 * A FRACTION, NOT A SCALE, and everything downstream multiplies by it — the
 * vehicle's own `scale()` in `LaunchLayer`, and every offset
 * `addLaunchSegment` writes for the plume, the billow, the column and the
 * props. That is what keeps `launchSmoke`, `launchBillow` and `launchDebris`
 * PURE FUNCTIONS OF ONE PROXY: they return reference pixels, the writer maps
 * them onto the stage, and no viewport ever reaches the tables.
 */
export function tableauScaleFor(vw: number, vh: number): number {
  const box = trajectoryBox(vw, vh);
  const padY = box.pad + box.h * TRAJECTORY_START[1];
  const airborneY = box.pad + box.h * (TRAJECTORY_START[1] - ROUTE_SPAN * AIRBORNE_ARC);
  return Math.min(
    1,
    (vh - padY) / (HULL_BOTTOM_UNITS * ROCKET_SCALE),
    (vh - airborneY) / (FLAME_TIP_UNITS * ROCKET_SCALE),
  );
}

/* ---------------------------------------------------------------------------
   THE EXHAUST COLUMN.
   ---------------------------------------------------------------------------
   Rebuilt on the client's note — "MAKE THE SMOCK EVEN BETTER LIKE REAL ROCKET
   LAUNCH" — and the diagnosis is arithmetic rather than taste.

   `#qx-smoke-fill` used to ramp its alpha 0% -> 100%. A linear-alpha radial has
   an AREA-MEAN of exactly one third of the element's opacity, with its peak at
   a single point. So at the old ceiling of 0.72 the brightest pixel a puff
   could ever paint was 0.72 x 0.95 x 145 = 99/255 and its mean was ~33/255 —
   on pure black, beside a 95%-white wordmark, below the level at which the eye
   segments a thing as an object. Correctly sized, correctly faded, invisible.

   Worse, two such cones do not join: sampled midway between neighbours 61px
   apart the union alpha was 0.147 against peaks of 0.38 and 0.23 — a 60%
   saddle, which is beading, which is what "a few grey smudges" describes.

   The fix is in the paint server (see `LaunchLayer`) and it costs no nodes.
   What follows is the column that fix made worth authoring.                  */

/**
 * Half-width of the exhaust WHERE IT LEAVES THE NOZZLE, in stage pixels.
 *
 * `FLAME_PLUME` is ~15 artwork units across at its widest — 45px on screen at
 * `ROCKET_SCALE` — so the column has to be about that thick where the two meet
 * or it reads as a separate object parked under the vehicle rather than as the
 * thing the engine is making. The old `r0` of 12-16 was a third of the flame's
 * width, which is why the trail never looked attached to the rocket.
 */
const SMOKE_RX0 = 20;

/**
 * Half-LENGTH of a parcel at birth, in stage pixels.
 *
 * 40, down from 54, and the whole plume came down with it — see the note on
 * `SMOKE`. Against `PLUME_SEAT` (132) it puts a newborn parcel's top edge at
 * 92px, inside the flame, and its tail at 172px — 28px past the fire's tip. The
 * plume is therefore visible from its first frame and welded to the flame at
 * every one after it.
 */
const SMOKE_RY0 = 40;

/**
 * How much ARC a parcel takes to reach full density.
 *
 * Arc, and not a fraction of its own window, so six rows with six different
 * windows ignite at the same RATE. The old `age * 7` on a normalised age had a
 * long-window row fading in over 0.089 of arc and a short-window row over
 * 0.066 — a thrust that stutters for no reason.
 *
 * 0.03 is ~7vh mid-climb: fast enough to read as ejection, slow enough not to
 * pop. It is also what keeps the LAST station legal. Spawn 0.46 reaches full
 * strength at arc 0.49 — vh 167.5, entirely under power — before
 * `launchExhaust` begins dying at vh 170. NOTHING IN THIS DESIGN EVER
 * BRIGHTENS WHILE THE ENGINE IS GOING DARK, which is the letter of the
 * spawn cap and also its purpose.
 */
const SMOKE_RISE = 0.03;

/**
 * Where the plume is SEATED, in stage pixels below the point the path returns.
 *
 * THE SMOKE STARTS WHERE THE FIRE ENDS, NOT AT THE NOZZLE — and getting that
 * wrong made the short plume invisible for a build. This was `17 *
 * ROCKET_SCALE` = 51px, the nozzle itself, which was right while the trail was
 * a long column: the column's own length carried it well past the flame. Once
 * the client asked for a short plume, a parcel born 51px down with a half-length
 * of 40-60 lived ENTIRELY INSIDE the flame, which reaches 144px below the same
 * origin (`FLAME_PLUME` ends at 48 artwork units). Correct opacity, correct
 * size, nothing on screen — the SECOND time this rebuild produced that exact
 * failure, the first being a parcel seated inside the hull.
 *
 * 44 artwork units is the flame's last quarter, so a newborn parcel STRADDLES
 * the tip: its top edge tucks under the fire and its body is the first thing
 * past it. Derived from `ROCKET_SCALE` rather than typed as 132, for the reason
 * the nozzle version was — the vehicle and everything hanging off it resize as
 * one thing.
 */
const PLUME_SEAT = 44 * ROCKET_SCALE; // 132

/**
 * A parcel's peak ATTRIBUTE opacity, raised from 0.72.
 *
 * The flat core changed what this number MEANS. It used to describe the value
 * at one pixel of a cone whose mean was a third of it; it now describes a DISC.
 * 0.80 x 0.82 = 0.656 of `--qx-white` over `--qx-ink` = #9ba39d across the
 * core. The painted density is still well under the attribute everywhere but
 * that core, because the server still fades every element to fully transparent
 * at its own edge — which is what lets neighbours merge instead of stacking
 * visible rims.
 */
const SMOKE_MAX_OPACITY = 0.8;

/**
 * The exhaust plume, as data — six SHORT-LIVED parcels, not a column.
 *
 * ## THE LONG TAIL IS GONE ON THE CLIENT'S DIRECTION
 *
 * "i mean this not needed", against a frame of the rocket near the top of the
 * climb trailing ~550px of smoke down the screen. What they kept is what is
 * here: a compact plume welded under the flame, so the vehicle still reads as
 * powered, and nothing behind it. The PAD CLOUD is untouched — that is the part
 * that reads as a real launch, and it was never what they pointed at.
 *
 * The rebuild is a retune of this one table, not a deletion: same six elements,
 * same functions, same gate on the flame. Three numbers do the work — the
 * windows are roughly a third of what they were, `gx`/`gy` about half, and the
 * spawns are redistributed so exactly one or two parcels are ever alive at
 * once. Measured plume length, nozzle to fade: **116px at arc 0.36, 136px at
 * 0.70, 144px at the arrival**, against 550 before, on a 677px route.
 *
 * ## SPAWNS ARE EVEN IN ARC NOW, AND THAT IS A REVERSAL WORTH THE PARAGRAPH
 *
 * They used to be even in vh — an engine emits at constant mass flow per unit
 * TIME — which correctly bunched the emission where the vehicle was slow and
 * stretched it where it was fast. That was the right model for a COLUMN, where
 * uneven spacing is the picture. It is the wrong one for a short plume: with
 * lifetimes this brief, an emission gap that stretches to 0.116 of arc opens a
 * hole between the vehicle and its own smoke, and one that closes to 0.010
 * stacks four parcels into the tail again. Even ARC spacing is what keeps
 * exactly one plume under the nozzle at every point in the climb.
 *
 * The physics has not gone anywhere; it moved into `window`, which is a
 * lifetime rather than a spacing and is what actually decides how long a parcel
 * persists behind a vehicle travelling at a given speed.
 *
 * ## THE STALL IS STILL THE ONE GAP
 *
 * 0.05, 0.19, 0.33 — then nothing until 0.62. Row 2's window runs to arc 0.53,
 * PAST the 0.500 where `launchExhaust` starts going out, and deliberately: the
 * gate is what ends the plume there, so the fire and its smoke die on the same
 * curve rather than on two that have to be kept in step by hand. A window that
 * stopped at 0.500 exactly left 0.007 of arc — a 5px sliver of scroll — with a
 * lit engine and nothing under it. Emission resumes at 0.62, past the 0.591
 * relight; nothing spawns inside [0.500, 0.591] and nothing survives across it.
 *
 * `gx` still grows DOWN the plume and `gy` UP it — a parcel near the nozzle is
 * in the fast part of the jet and shears along the flight axis; an older one has
 * decelerated and mushrooms. It is the same inversion the column had, over a
 * much shorter life, which is what keeps the little plume from reading as a
 * lozenge that simply scales.
 *
 * `sway` IS DIMENSIONLESS — a fraction of the parcel's OWN rx — so it is
 * resize-proof and bounded: |sway| <= 0.34 < 0.5 means the plume's centreline
 * can never leave its own body, which keeps this turbulence rather than the
 * S-curve the client rejected twice. `sag` is halved with everything else; over
 * a life this short its old 20-30px was most of the plume's length.
 */
const SMOKE = [
  //  spawn  window  gx  gy  sway   sag     dies at
  { spawn: 0.05, window: 0.18, gx: 50, gy: 34, sway: -0.28, sag: 14 }, // 0.23
  { spawn: 0.19, window: 0.18, gx: 48, gy: 36, sway: 0.34, sag: 13 }, // 0.37
  { spawn: 0.33, window: 0.2, gx: 46, gy: 38, sway: 0.19, sag: 12 }, // 0.53 — under the gate
  // --- the stall: no emission at all, arc 0.330 -> 0.620 ------------------
  { spawn: 0.62, window: 0.18, gx: 46, gy: 40, sway: -0.3, sag: 12 }, // 0.80
  { spawn: 0.75, window: 0.18, gx: 44, gy: 42, sway: -0.16, sag: 11 }, // 0.93
  { spawn: 0.88, window: 0.2, gx: 42, gy: 44, sway: 0.24, sag: 10 }, // 1.08 — held
] as const;

/** How many trail parcels the layer renders; `LaunchLayer` draws this many. */
export const SMOKE_COUNT = SMOKE.length;

/**
 * Every station's fixed arc seat, in order.
 *
 * A parcel's `rideT` is CONSTANT for its whole life, so `getPositionOnPath` at
 * that fraction can only change when the path does. `addLaunchSegment` resolves
 * all six inside the `rawPath()` cache block — the same place `cachedVw` is
 * refreshed — so the frame LOSES six path queries rather than gaining one, and
 * the resize property is preserved exactly: `d` changing IS the resize.
 *
 * ONLY VALID FOR FIXED SEATS. Anything added here whose `rideT` tracks the
 * vehicle must be resolved in the frame or it will freeze at the last resize.
 */
export const SMOKE_SPAWNS: readonly number[] = SMOKE.map((s) => s.spawn);

/**
 * A trail parcel's state at launch position `t`.
 *
 * TWO RADII NOW, NOT ONE. The route is a plumb line, so an ellipse elongated on
 * y IS a segment of column — and the aspect ratio is the physics: a parcel
 * leaves the nozzle as a stretched slug of jet and relaxes into a mushroom
 * wider than it is tall as it decelerates. Both radii ride the SAME transform
 * string the timeline already writes, so the change costs zero nodes and zero
 * extra `setAttribute` calls; see the note at the write loop.
 *
 * Everything is a pure function of `launchPathT(t)`, which is a pure function
 * of the one proxy: no time, no rAF, no state, no `Math.random`, no viewport.
 *
 * AGEING IS IN ARC, NOT IN vh, AND THAT IS A DECISION. A scroll clock is the
 * better physics — the vehicle covers arc 0.50-0.56 across 40vh, so arc-aged
 * smoke barely evolves through the stall — but `LEGS` freezes arc at 1.0 from
 * vh 280 precisely so the arrival frame is legible, and a scroll clock would
 * keep the whole plume boiling through 40vh of a hold that exists to be still.
 * The stall is drawn by the exhaust dying and by the vehicle outrunning its own
 * column, which is what a stalled engine actually looks like.
 */
export function launchSmoke(
  index: number,
  t: number,
): { rideT: number; dx: number; dy: number; rx: number; ry: number; opacity: number } {
  const s = SMOKE[index]!;
  const arcAge = launchPathT(t) - s.spawn;
  const age = clamp01(arcAge / s.window);
  // Birth measured in ARC, so every station ignites at one rate — see SMOKE_RISE.
  const born = clamp01(arcAge / SMOKE_RISE);
  // Drag. A parcel is thrown clear of the nozzle fast and coasts to a stop in
  // still air, so both its lateral and its axial drift DECELERATE. Front-loaded
  // on purpose: 51% of the throw is done by age 0.3, while the parcel is still
  // dense enough for the offset to be visible at all.
  const drift = 1 - (1 - age) ** 2;

  // CROSS-STREAM. `age ** 0.8`, not the old `** 0.6`, because 0.6 tripled the
  // width by age 0.15 — a jet does not do that. A real plume holds a narrow
  // potential core for the first part of its life and only then lets
  // entrainment take over.
  const rx = SMOKE_RX0 + s.gx * age ** 0.8;
  // ALONG-STREAM. A much flatter exponent, so the parcel is long from birth and
  // grows mostly SIDEWAYS thereafter. That falling aspect ratio is the illusion:
  // row 0 runs 3.3:1 tall at birth to 0.66:1 wide at death — lozenge, then
  // round, then mushroom cap.
  const ry = SMOKE_RY0 + s.gy * age ** 0.45;

  return {
    rideT: s.spawn,
    // Turbulent wander, as a fraction of the parcel's own width. Zero at birth:
    // the exhaust leaves the nozzle on the centreline.
    dx: s.sway * rx * drift,
    // `PLUME_SEAT` is a fixed SEAT, not a drift — it is where the FIRE ends.
    // `sag` on top of it is the parcel's own downward momentum bleeding off.
    // The parcel then recedes because its seat is fixed on the route and the
    // vehicle is not; this offset only decides where it is BORN.
    dy: PLUME_SEAT + s.sag * drift,
    rx,
    ry,
    /**
     * DENSITY FALLS FAR FASTER THAN SIZE GROWS. A fixed mass of smoke spread
     * over a silhouette growing ~10x must lose ~10x of its optical depth;
     * `(1 - age) ** 1.4` gives a 13:1 drop from birth to age 0.85, which
     * brackets it. The old `** 1.7` against a `** 0.6` radius put a parcel at
     * 5% opacity while it was still growing, so the biggest thing on screen was
     * also the most invisible — the exact inversion of what smoke does.
     *
     * An exponent > 1 matters as much as the value: it reaches exactly 0 at age
     * 1 AND with zero slope, so a parcel dies without a terminal snap. At or
     * below 1 the derivative blows up at death.
     *
     * ## AND THE WHOLE THING IS GATED ON THE FLAME — NO FIRE, NO SMOKE
     *
     * The client's rule, and it overrules the physics this function used to
     * argue: "i dont want smock after fire close and burn". Measured before the
     * gate, at vh 195 — the one frame where `launchExhaust` is EXACTLY 0, the
     * engine visibly dead — the column was still painting 0.49 / 0.27 / 0.12
     * under a rocket with no flame on it. Correct as physics (smoke already in
     * the air outlives the engine that made it) and wrong as a picture: the one
     * beat the stall exists to show is the engine going out, and a bright plume
     * hanging under a dark nozzle is the opposite of that.
     *
     * So the trail is multiplied by `launchExhaust(t)` — the SAME curve that
     * drives the flame's own opacity and its length (`launchFlameScale`). The
     * plume now dies with the fire and relights with it, one beat instead of
     * two, and there is no frame anywhere in the segment with smoke on it and
     * no fire above it.
     *
     * It costs nothing and breaks nothing: `launchExhaust` is a pure function
     * of `t`, so this reverses on scroll-up exactly like everything else, and
     * being a single multiplier it cannot change the ORDER of the column —
     * widest-and-faintest at the pad end survives untouched.
     *
     * The ladder up the column at arc 0.45, under full flame, is 0.13 / 0.23 /
     * 0.38 / 0.52 / 0.68, monotone from the ground to the nozzle.
     */
    opacity: age >= 1 ? 0 : SMOKE_MAX_OPACITY * born * (1 - age) ** 1.4 * launchExhaust(t),
  };
}

/**
 * The pad cloud, as data. Offsets in ARTWORK units x `ROCKET_SCALE`, as before.
 *
 * WHAT WAS WRONG. Four mounds at dy 13-17 and r 19-24 are four near-identical
 * blobs in a horizontal row: a flat bar, not a cloud. And the only thing that
 * evolved after arc 0.025 was a linear 1.5x roll — so for 0.44 of the arc,
 * roughly 140vh of scroll, the viewer was looking at a static logo under the
 * rocket while the vehicle moved.
 *
 * THE FIX IS DIFFERENTIATION, NOT MORE MOUNDS — still four, still zero nodes.
 * Two WINGS and two BODY mounds, behaving like different parts of one cloud:
 *
 *   wings — low, and they ROLL OUT (1.70 / 1.80, travelling from +/-38px to
 *           +/-153px) while FLATTENING (sy 0.88 -> 0.44). This is "rolls OUT
 *           rather than up", and it is the single behaviour that separates a
 *           launch from a puff.
 *
 *           THE ROLL WAS 2.10 / 2.25 AND THE RADII 15 / 14, AND THAT SHIPPED
 *           BADLY FOR ONE FRAME. At +/-189px with an 83px radius the wing's
 *           flat gradient core cleared the body's glow entirely and read as a
 *           hard-edged grey disc parked in the cloud — the "four coins" failure
 *           this table has been fighting since it had six mounds, reintroduced
 *           by rolling them too far. Wider (105px) and travelling less (153px)
 *           keeps 133px of the wing inside the body at full spread, so the
 *           cloud stays one silhouette. The gradient's core came in from 38% to
 *           30% in the same pass; see `LaunchLayer`. Neither alone was enough.
 *   body  — big, banked around the nozzle, barely travels (1.30 / 1.25) and
 *           stays taller than the wings (sy 1.12 -> 0.72). It is the base of
 *           the column, which is why it keeps height while the wings go flat.
 *
 * The asymmetry (-30/+30 against -11/+12, roll 2.10 against 2.25) is BAKED, not
 * random — runtime randomness would break the scrub. A mirror-symmetric cloud
 * is the tell that it is a logo.
 *
 * Every mound fills with `#qx-smoke-fill`, which fades it to nothing at its own
 * edge, so overlapping mounds blend instead of stacking visible rims — and once
 * they blend, a few big soft ones read as one body of smoke where many small
 * ones read as a row of bubbles. FOUR, not the six this began with; the two
 * nodes went to the gradient.
 */
const BILLOW = [
  { dx: -30, dy: 14, r: 19, roll: 1.7, sy0: 0.88, sy1: 0.44 }, // left wing
  { dx: 30, dy: 13, r: 18, roll: 1.8, sy0: 0.84, sy1: 0.41 }, // right wing
  { dx: -11, dy: 17, r: 25, roll: 1.3, sy0: 1.12, sy1: 0.72 }, // left body
  { dx: 12, dy: 16, r: 24, roll: 1.25, sy0: 1.06, sy1: 0.68 }, // right body
] as const;

/** How many billow mounds the layer renders; `LaunchLayer` draws this many. */
export const BILLOW_COUNT = BILLOW.length;

/** How far along the route the vehicle is before the pad smoke has dissolved.
 *  A real pad cloud outlives the liftoff by a long way — it hangs on the
 *  ground through the whole climb and is gone before the stall, so the
 *  engine-out is clean. */
const BILLOW_CLEAR = 0.46;

/**
 * The GROUP's peak opacity, down from 0.8 — and NOT a dimming.
 *
 * The flat core raised painted density by 1.53x, and the four mounds composite
 * among THEMSELVES inside the group before this multiplies them, so the
 * overlapped body reaches 1 - (1 - 0.82)^2 = 0.968 before this term. 0.60 x
 * 0.968 = 0.58 of `--qx-white` over ink = #91968f: a clearly lit ground cloud,
 * brighter and far more solid than before, without going to a slab.
 */
const BILLOW_PEAK = 0.6;

/**
 * A billow mound's state at launch position `t`: swelling with the ignition,
 * rolling out through liftoff, dissolving once the vehicle is properly away.
 * All offsets are relative to the path's start point, resolved live — the same
 * resize-and-reverse property everything else here has.
 */
export function launchBillow(
  index: number,
  t: number,
): { dx: number; dy: number; r: number; sy: number; opacity: number } {
  const b = BILLOW[index]!;
  const p = launchPathT(t);
  const swell = clamp01(p / 0.025);
  /**
   * How far through the roll-out. `** 0.7` rather than linear because a ground
   * cloud is thrown outward by the blast and then coasts: 39% of the travel is
   * done by arc 0.12, which is while the cloud is at full opacity and anyone is
   * looking at it. Linear put most of the movement in the stretch where it was
   * already fading — which is why the ignition read as a static logo.
   */
  const rollT = clamp01(p / BILLOW_CLEAR) ** 0.7;
  /**
   * The cloud is BORN AT THE NOZZLE and spreads from there. Holding the full
   * spread from the first frame put four small circles down at their final
   * offsets — too far apart to overlap while they were still small, so the
   * ignition read as four separate blobs and only became a cloud once they had
   * grown into each other. Unchanged.
   */
  const spread = 0.3 + 0.7 * swell;
  return {
    // Per-mound roll: the wings travel to 2.1-2.25x, the body barely moves.
    // Four mounds sharing one translate factor is a picture being SCALED, which
    // is what the old shared 1.5x did.
    dx: b.dx * ROCKET_SCALE * (1 + (b.roll - 1) * rollT) * spread,
    // Held flat on purpose: the cloud spreads and swells, but its ground line
    // never lifts. Pad smoke rolls out; it does not fly. Deliberately NOT
    // compensated for the squash either — a `dy` that moves to keep a bottom
    // edge pinned is a second, invisible owner of the ground line, and the
    // mounds grow faster than they flatten anyway.
    dy: b.dy * ROCKET_SCALE,
    // HORIZONTAL radius. The mound nearly doubles across its life on top of
    // whatever `roll` moves its centre — spreading and travelling are two
    // different things and a ground cloud does both.
    r: b.r * ROCKET_SCALE * (0.45 + 0.55 * swell) * (1 + 0.85 * rollT),
    // Vertical squash. Every mound ends flatter than it started; the wings end
    // half their own height. This is what "rolls out rather than up" looks
    // like, and it costs nothing — it rides the transform string already
    // written every frame.
    sy: b.sy0 + (b.sy1 - b.sy0) * rollT,
    // Unchanged in SHAPE — swell in, hold, gone by BILLOW_CLEAR so the
    // engine-out is clean — with the peak retuned for the flat core.
    opacity:
      launchRocketOpacity(t) *
      Math.min(1, swell * 3) *
      (1 - clamp01((p - 0.12) / (BILLOW_CLEAR - 0.12))) ** 1.4 *
      BILLOW_PEAK,
  };
}

/**
 * The ignition column — the exhaust wake between nozzle and pad while the
 * vehicle sits on it. It grows with thrust and is gone by arc 0.09, by which
 * point the vehicle has visibly left the ground.
 */
export function launchColumn(t: number): { sy: number; opacity: number } {
  const p = launchPathT(t);
  return {
    sy: 0.25 + 0.75 * clamp01(p / 0.02),
    opacity: launchRocketOpacity(t) * (1 - clamp01((p - 0.035) / 0.055)),
  };
}

/**
 * The flame's scale about the nozzle: length is thrust. Driven by the SAME
 * curve as its opacity (`launchExhaust`), so the plume shortens into the stall
 * and stretches out of it in step with going dark and relighting — one beat,
 * not two.
 */
export function launchFlameScale(t: number): { sx: number; sy: number } {
  const ex = launchExhaust(t);
  return { sx: 0.7 + 0.3 * ex, sy: 0.45 + 0.55 * ex };
}

/**
 * A fragment's local throw at launch position `t`: it rides the vehicle until
 * its detach point, then is thrown off in LOCAL coordinates.
 *
 * Local is the point. An absolute detach position baked at build time via
 * `getPositionOnPath` does not survive a resize and does not reverse; a local
 * offset from wherever the outer group happens to be does both for free.
 */
export function launchDebris(
  index: number,
  t: number,
): {
  rideT: number;
  dx: number;
  dy: number;
  rotation: number;
  opacity: number;
  burn: number;
  scale: number;
} {
  const d = TRAJECTORY_DEBRIS[index]!;
  const p = launchPathT(t);
  const thrown = clamp01((p - d.at) / 0.16);
  /**
   * Every prop tumbles differently, and none of them tumbles evenly.
   *
   * A uniform `thrown * 110` on all four is the tell that they are one
   * animation drawn four times: they turn in lockstep, at one rate, in one
   * direction. Real debris takes its spin from how it tore off — so the
   * direction comes from the side it was thrown (`Math.sign(d.dx)`) and the
   * rate varies per prop, both read off the table rather than typed twice.
   * The `thrown²` term makes the tumble ACCELERATE as the piece loses the
   * vehicle's support, which is the difference between turning and falling.
   */
  const spin = Math.sign(d.dx) * (150 + index * 55);
  return {
    rideT: Math.min(p, d.at),
    /**
     * A thrown arc, not a straight line. Scaled to a readable distance in
     * stage pixels rather than to the normalised trajectory box: the prop
     * leaves the frame of the story, and must clear a vehicle that is now
     * 120px wide before it does.
     *
     * Sideways it DECELERATES (air drag: fast out of the side of the stack,
     * then coasting); downward it ACCELERATES (gravity, the `thrown²` term).
     * Those two together are what bend the path into a real ballistic arc.
     * Linear on both axes gave a straight diagonal, which reads as a sprite
     * being slid off screen.
     *
     * The lateral throw is the LARGER of the two on purpose. A prop that
     * mostly falls leaves down the bottom of the viewport within a few dozen
     * vh of tearing off — which is where the first two went, and the beat the
     * client cares about most was over before it could be read. Peeling wide
     * and sinking gently keeps each one burning in frame for its whole life.
     *
     * The leading `46` is CLEARANCE, not drift. Both drift terms start at
     * zero rate, so for the first moments of the throw a prop sat inside the
     * hull — which is 66px wide — and read as part of the vehicle rather than
     * as something coming off it. This snaps it clear of the silhouette over
     * the first ninth of the throw, and is still exactly 0 while the prop is
     * being carried, so a prop at rest is where the vehicle is and a resize
     * cannot strand it.
     */
    dx:
      Math.sign(d.dx) * 46 * Math.min(1, thrown * 9) +
      d.dx * 900 * (1 - (1 - thrown) ** 2),
    dy: d.dy * 520 * thrown + 240 * thrown ** 2,
    rotation: spin * (thrown * 0.45 + thrown ** 2 * 0.55),
    // Visible only around the moment it leaves — carried before, gone after.
    opacity: p < d.at ? 0 : Math.min(1, thrown * 5) * (1 - clamp01((thrown - 0.55) / 0.45)),
    /**
     * THE BURN. The client's note for this section is the whole point of
     * these four objects: "some of the props look like failure, losses,
     * unprofessional — like props BURN while launching the rocket; it's
     * identify the Growth if you work with Qavyx." So a prop does not merely
     * drop out of frame. It catches, burns at full heat while it is torn
     * away, and is consumed.
     *
     * Three phases, and the middle one is what makes it read as fire rather
     * than as a flash: it IGNITES over the first 6% of the throw, HOLDS at
     * full heat to 30% — a flame has a life, and something that peaks and
     * immediately decays reads as a spark — then cools over the remaining
     * 55%, ending at 0. Zero is `--qx-ink`, so a burnt-out prop is charred
     * dark rather than restored to what it was, and that is the last thing
     * seen of it before the opacity takes it.
     */
    burn:
      p < d.at
        ? 0
        : Math.min(1, thrown / 0.06) * (1 - clamp01((thrown - 0.3) / 0.55) ** 1.5),
    // And it is consumed: what burns gets smaller. Nothing survives to land.
    scale: 1 - 0.45 * thrown,
  };
}

/**
 * A prop's LABEL opacity — the name of the failure the prop stands for.
 *
 * Deliberately not the prop's own opacity, which is what this started as.
 * A shape reads at any alpha; a word does not, and the prop's curve spends
 * most of its life fading. So the label snaps in as the prop tears away, holds
 * at full strength through the burn — long enough to be READ, which is the
 * whole reason it exists — and is gone before the charred panel is, so the
 * last thing on screen is the failure disappearing rather than a caption
 * outliving it.
 */
export function launchPropLabel(index: number, t: number): number {
  const d = TRAJECTORY_DEBRIS[index]!;
  const thrown = clamp01((launchPathT(t) - d.at) / 0.16);
  if (thrown <= 0) return 0;
  return Math.min(1, thrown / 0.07) * (1 - clamp01((thrown - 0.58) / 0.27));
}

/**
 * A prop's rest colours, and the same colours resolved.
 *
 * `var()` cannot be interpolated, so the in-between frames use the literals
 * and both ENDPOINTS are written back as the token strings — exactly the
 * discipline `frameOps.ts` uses for the frame stroke, and for the same reason:
 * a prop at rest must still re-theme with the token, and a React re-render
 * must be a no-op rather than a visible flip.
 * `tests/unit/launch-timeline.test.ts` reads `styles/tokens.css` and fails if
 * these literals drift from it.
 */
export const DEBRIS_FILL_REST = 'var(--qx-ink)';
export const DEBRIS_STROKE_REST = 'var(--qx-grey)';
const DEBRIS_FILL_HEX = '#0a0c0b'; // --qx-ink
const DEBRIS_STROKE_HEX = '#919a94'; // --qx-grey
const BURN_HEX = '#2abd00'; // --qx-green

/**
 * THE BURN, as paint. The client's note is that the failed props "burn while
 * launching the rocket", so a prop heats from ink to brand green as it tears
 * away and cools back as it falls out of frame — one node, no ember overlay,
 * which is what keeps the stage inside its 60-node budget.
 */
export function setDebrisBurn(frag: SVGPathElement | SVGGElement, burn: number): void {
  if (burn <= 0) {
    frag.setAttribute('fill', DEBRIS_FILL_REST);
    frag.setAttribute('stroke', DEBRIS_STROKE_REST);
    return;
  }
  frag.setAttribute('fill', mixHex(DEBRIS_FILL_HEX, BURN_HEX, burn));
  frag.setAttribute('stroke', mixHex(DEBRIS_STROKE_HEX, BURN_HEX, burn));
}

/** Component-wise sRGB mix of two `#rrggbb` strings. */
function mixHex(a: string, b: string, t: number): string {
  const ca = parseInt(a.slice(1), 16);
  const cb = parseInt(b.slice(1), 16);
  const mix = (shift: number) => {
    const u = (ca >> shift) & 0xff;
    const v = (cb >> shift) & 0xff;
    return Math.round(u + (v - u) * t);
  };
  const hex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${hex(mix(16))}${hex(mix(8))}${hex(mix(0))}`;
}

export interface LaunchTargets {
  launchLayer: StageRefs['launchLayer'];
  launchBeats: StageRefs['launchBeats'];
}

/**
 * Append the launch to pin 2's timeline at its absolute pin position.
 *
 * It does NOT own the ink field, though it briefly did. The launch used to run
 * immediately after the aperture, inheriting a screen the dolly had already
 * turned to `--qx-ink`; on its own pin nothing hands it anything, so the ink has
 * to be raised — but by the PIN, not by this segment. The title card that
 * precedes it needs the same ground, and a property written by two segments is
 * the exact race `onRefresh` turns into a bug. `launchPinInk` spans the whole
 * pin instead, and this segment stays a pure function of its own position.
 */
export function addLaunchSegment(tl: gsap.core.Timeline, refs: LaunchTargets): void {
  const layer = refs.launchLayer;
  const beats = refs.launchBeats;
  const propLabels = Array.from(beats.querySelectorAll<HTMLElement>('.qx-beat-prop'));
  const start = PIN_A.startOf('launch');
  const proxy = { t: 0 };

  const traj = layer.querySelector<SVGPathElement>('#qx-traj')!;
  const column = layer.querySelector<SVGPathElement>('#qx-launch-column')!;
  const rocket = layer.querySelector<SVGGElement>('#qx-rocket')!;
  const exhaust = layer.querySelector<SVGGElement>('#qx-rocket-exhaust')!;
  const smoke = Array.from(layer.querySelectorAll<SVGCircleElement>('.qx-launch-smoke'));
  const billowGroup = layer.querySelector<SVGGElement>('#qx-billow')!;
  const billow = Array.from(layer.querySelectorAll<SVGCircleElement>('.qx-launch-billow'));
  const debris = Array.from(layer.querySelectorAll<SVGPathElement>('.qx-launch-debris'));

  /** The nozzle's y in the vehicle's local frame — the flame scales about it. */
  const NOZZLE_Y = 17;

  // The raw path is re-measured only when the `d` React wrote actually changes,
  // so a resize is picked up without paying for the measurement every frame.
  //
  // The viewport width rides the same signal. The prop labels clamp against it
  // so a word is never cut in half leaving the screen, and `d` changing IS the
  // resize — React rewrites the route from the new viewport — so caching it
  // here keeps a measurement out of a per-frame path that runs at 60fps.
  let cachedD = '';
  let cachedVw = 0;
  let cachedVh = 0;
  let raw: ReturnType<typeof MotionPathPlugin.getRawPath> | null = null;
  /**
   * EVERY FIXED SEAT ON THE ROUTE, resolved once per PATH rather than once per
   * frame.
   *
   * The pad's arc fraction is 0 and a smoke station's is a table constant, so
   * `getPositionOnPath` at those fractions can only change when `d` changes —
   * and `d` changing IS the resize, because React rewrites the route from the
   * new viewport. So this preserves the re-seat-for-free property exactly while
   * taking seven path queries out of a 60fps loop, which is what paid for the
   * sixth smoke station.
   *
   * ONLY FIXED SEATS BELONG HERE. Anything whose `rideT` tracks the vehicle —
   * the vehicle itself, the props before they detach — must be resolved in the
   * frame or it will freeze at the last resize.
   */
  let k = 1;
  let padSeat: PathPoint = { x: 0, y: 0, angle: 0 };
  let smokeSeats: PathPoint[] = [];
  const rawPath = () => {
    const d = traj.getAttribute('d') ?? '';
    if (d !== cachedD || !raw) {
      cachedD = d;
      // The FILTERED viewport — see motion/viewport.ts. `d` changing IS the
      // viewport changing, and `d` is written from the same filtered value.
      ({ vw: cachedVw, vh: cachedVh } = motionViewport());
      raw = MotionPathPlugin.getRawPath(d);
      MotionPathPlugin.cacheRawPathMeasurements(raw);
      // The tableau's own scale rides the SAME cache: it is a function of the
      // viewport, and `d` changing IS the viewport changing. See
      // `tableauScaleFor`.
      k = tableauScaleFor(cachedVw, cachedVh);
      padSeat = MotionPathPlugin.getPositionOnPath(raw, 0) as PathPoint;
      smokeSeats = SMOKE_SPAWNS.map(
        (spawn) => MotionPathPlugin.getPositionOnPath(raw!, spawn) as PathPoint,
      );
    }
    return raw;
  };

  tl.fromTo(
    proxy,
    { t: 0 },
    {
      t: 1,
      duration: PIN_A.endOf('launch') - start,
      onUpdate: () => {
        const t = proxy.t;
        layer.style.visibility = t > 0 ? 'visible' : 'hidden';
        // The labels are a SECOND fixed full-viewport layer, so they get the
        // same treatment in the same frame: hidden when the segment is not
        // running, and handed back to the page on the identical curve. A layer
        // that faded on its own schedule would be left painted over §5.
        beats.style.visibility = t > 0 ? 'visible' : 'hidden';
        if (t <= 0) return;

        // Handed back to the page across the last 20vh — see launchLayerOpacity.
        layer.style.opacity = String(launchLayerOpacity(t));
        beats.style.opacity = String(launchLayerOpacity(t));

        const path = rawPath();
        const offset = traj.parentElement?.getAttribute('transform') ?? '';
        const [ox, oy] = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(offset)?.slice(1).map(Number) ?? [
          0, 0,
        ];

        // NOTHING IS WRITTEN TO `traj` ANY MORE. The route is not drawn — see
        // `LaunchLayer` for the client's direction and for why the element has
        // to stay as the path `getRawPath` is measured from. Three
        // `setAttribute` calls a frame went with the line.

        // The vehicle. `getPositionOnPath` is arc-length parameterised, and so
        // are the smoke and prop spawn tables, so all of them are welded to the
        // same measurement with no offset to tune at any aspect ratio.
        const pos = MotionPathPlugin.getPositionOnPath(path, launchPathT(t), true) as PathPoint;
        rocket.setAttribute(
          'transform',
          `translate(${(ox ?? 0) + pos.x} ${(oy ?? 0) + pos.y}) rotate(${pos.angle + 90})`,
        );
        rocket.setAttribute('opacity', String(launchRocketOpacity(t)));
        exhaust.setAttribute('opacity', String(launchExhaust(t)));
        const flame = launchFlameScale(t);
        exhaust.setAttribute(
          'transform',
          `translate(0 ${NOZZLE_Y}) scale(${flame.sx} ${flame.sy}) translate(0 ${-NOZZLE_Y})`,
        );

        // The pad-anchored pieces all seat against the route's live start
        // point, so a resize re-seats the whole ignition tableau for free.
        // Everything here is authored in artwork units and scaled up with the
        // vehicle, so the tableau stays one thing at any ROCKET_SCALE.
        // `padSeat` is resolved in `rawPath()` — see the note there.
        const col = launchColumn(t);
        column.setAttribute(
          'transform',
          `translate(${padSeat.x} ${padSeat.y + 20 * ROCKET_SCALE * k})` +
            ` scale(${ROCKET_SCALE * k} ${col.sy * ROCKET_SCALE * k})`,
        );
        column.setAttribute('opacity', String(col.opacity));

        // The billow lives OUTSIDE the padded group (it paints over the
        // vehicle's tail), so the group's offset is added back by hand. Its
        // opacity is written ONCE, on the group: that is what flattens the
        // overlapping mounds into a single splash silhouette.
        billowGroup.setAttribute('opacity', String(launchBillow(0, t).opacity));
        for (let i = 0; i < billow.length; i++) {
          const mound = launchBillow(i, t);
          const el = billow[i]!;
          // The squash rides the transform the loop already writes: a circle
          // has cx = cy = 0, so this scales about its own centre, and the
          // objectBoundingBox gradient stretches with it rather than staying
          // round inside an oval. No extra attribute, no extra node.
          el.setAttribute(
            'transform',
            `translate(${(ox ?? 0) + padSeat.x + mound.dx * k} ${(oy ?? 0) + padSeat.y + mound.dy * k})` +
              ` scale(1 ${mound.sy})`,
          );
          el.setAttribute('r', String(mound.r * k));
        }

        for (let i = 0; i < smoke.length; i++) {
          const puff = launchSmoke(i, t);
          // Cached: `puff.rideT` is a table constant, so its seat can only move
          // when the path does. See `rawPath`.
          const seat = smokeSeats[i]!;
          const el = smoke[i]!;
          // `r` carries the CROSS-STREAM radius and the scale stretches it
          // along the flight axis: a circle of r = rx under `scale(1, ry/rx)`
          // is an ellipse rx x ry about the same centre. Same three
          // `setAttribute` calls per parcel as before, and no <ellipse> swap —
          // which is what keeps this at zero nodes and leaves the
          // `SVGCircleElement` queries above untouched.
          el.setAttribute(
            'transform',
            `translate(${seat.x + puff.dx * k} ${seat.y + puff.dy * k})` +
              ` scale(1 ${puff.ry / puff.rx})`,
          );
          el.setAttribute('r', String(puff.rx * k));
          el.setAttribute('opacity', String(puff.opacity));
        }

        // The failure props. Ride position and local throw are still two ideas
        // (see launchDebris — that is what survives a resize and reverses) but
        // they COMPOSE into one transform on one node.
        for (let i = 0; i < debris.length; i++) {
          const f = launchDebris(i, t);
          const ride = MotionPathPlugin.getPositionOnPath(path, f.rideT) as PathPoint;
          const frag = debris[i]!;
          frag.setAttribute(
            'transform',
            `translate(${ride.x + f.dx * k} ${ride.y + f.dy * k}) rotate(${f.rotation})` +
              ` scale(${f.scale * k})`,
          );
          frag.setAttribute('opacity', String(f.opacity));
          setDebrisBurn(frag, f.burn);

          /**
           * The failure's NAME, riding the prop that stands for it.
           *
           * Written from the same `launchDebris` call in the same frame, so
           * the word and the object it names can never disagree about where
           * they are. `translate` is in the stage's coordinate system, which
           * is 1 unit = 1 CSS px against a fixed full-viewport layer — the
           * same space the SVG is in, so no conversion is involved.
           *
           * Clamped to the viewport on BOTH axes, because a prop is thrown
           * outward and downward and keeps going: the panel may leave the
           * screen (it is meant to) but the word must not be cut in half on
           * its way out. The bottom clamp is the one that actually fires —
           * gravity takes the first props off the bottom edge while their
           * labels are still at full strength, and a caption sliced in half by
           * the fold reads as a rendering bug rather than as an exit. The
           * `-50%` is the label's own width, which only CSS knows.
           */
          const label = propLabels[i];
          if (label) {
            const lx = Math.max(96, Math.min(cachedVw - 96, (ox ?? 0) + ride.x + f.dx));
            const ly = Math.min(cachedVh - 28, (oy ?? 0) + ride.y + f.dy + 44);
            label.style.transform = `translate(calc(${lx}px - 50%), ${ly}px)`;
            label.style.opacity = String(launchPropLabel(i, t));
          }
        }
      },
    },
    start,
  );
}

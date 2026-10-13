import {
  computeApertureGeometry,
  computeFrameGeometry,
  frameOpenFraction,
  lerpBox,
  restGapProfile,
  type Box,
  type GapProfile,
} from '@/motion/geometry';
import { PIN_A } from '@/motion/scrollBudget';
import { motionViewport } from '@/motion/viewport';
import { setFrameBox, setFrameDraw, setFrameFill, setFrameStrokeOpacity } from './frameOps';
import type { gsap } from '@/motion/gsap';
import type { StageRefs } from '@/types/hero';

/**
 * The aperture: the camera flies out through the gap that was always there.
 *
 * The Q's bottom-right gap — the one the mouse glyph fills through the whole
 * intro — is open from `boot` to here. It does NOT close across the expansion
 * and reopen at this segment, which is how this was first built: the frame is
 * the mark at every size, so the opening never has to be re-cut. After the last
 * service the panels clear and the camera flies out through it. The frame is the
 * same single path it has been since `boot`; nothing new is introduced and
 * nothing is thrown away.
 *
 * The five service motifs used to converge on the gap between the panels
 * clearing and the dolly. They are gone. The beat was staged as marks flying
 * into an opening AS it opened, and it read as decoration once nothing opened —
 * five thin glyphs drifting across an empty frame, which is Global Gate 6's own
 * test for what to cut.
 *
 * Intent (Global Gate 6): the dolly is a TRANSITION. It is the only thing in
 * this segment, and it is not decoration.
 *
 * ONE proxy drives the whole segment, and every output below is a pure function
 * of its position. That is not tidiness — it is the only arrangement that
 * survives `onRefresh`, which re-emits every segment's onUpdate at the current
 * progress after a resize. Two tweens writing the same property from different
 * segments would race there, and the winner would depend on timeline order
 * rather than on intent. It also makes the whole segment reversible by
 * construction and testable without a browser.
 */

/**
 * Sub-beats as fractions of the aperture's 120vh.
 *
 * The dolly stops at 105vh rather than running to the end: the last 15vh clears
 * the ink so the page below shows through as the pin releases. The launch
 * sequence replaces that clear-out — it is what lives in the ink.
 */
const VH = 120;
const A = {
  // The panels clear over the first 20vh, then the empty frame holds for a beat
  // before the camera moves. The dolly used to start at 50vh because the five
  // service motifs spent 20-50vh converging on the gap; that beat is gone (it
  // was staged as marks flying into an opening AS it opened, and nothing opens
  // any more), so the 30vh it occupied would otherwise be dead scroll with a
  // motionless frame in it. The dolly takes it instead and runs longer.
  dollyStart: 25 / VH,
  dollyEnd: 105 / VH,
  clearStart: 105 / VH,
} as const;

/**
 * Where the fill hands off to the ink field, as a position inside the dolly.
 *
 * Must be past full viewport coverage at every viewport or the swap shows a band
 * of page in a corner for one frame. `tests/unit/aperture.test.ts` asserts
 * `apertureCoverage(vw, vh, INK_HANDOFF_T) >= 1` across the viewport matrix;
 * coverage is reached around t 0.55–0.79 depending on aspect ratio, so 0.9 has
 * real headroom rather than sitting on the boundary.
 */
export const INK_HANDOFF_T = 0.9;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Position inside a sub-beat, clamped at both ends. */
function local(t: number, start: number, end: number): number {
  return clamp01((t - start) / (end - start));
}

/** How far through the dolly we are, at aperture position `t`. */
export function apertureDollyT(t: number): number {
  return local(t, A.dollyStart, A.dollyEnd);
}

/**
 * The frame's dash: the box's own open fraction, at every position in the
 * segment. There is no ramp — the gap is not re-cut here, it has been open
 * since `boot` and the expansion handed it over exactly as it is.
 *
 * Written anyway, every frame, rather than left to whatever the expansion last
 * set. The dash is a percentage of `pathLength`, so it is only scale-invariant
 * while the ASPECT holds; the dolly is a homothety and does hold it, but that is
 * a property of `computeApertureGeometry` rather than of this function, and a
 * segment that reads its own box and writes its own dash cannot be broken by a
 * change to the other. It is also the house rule that survives `onRefresh`: one
 * proxy per segment, every output a pure function of the box it computed.
 *
 * Note `frameOpenFraction(box)`, not the 0.894 constant — that was measured on
 * the 1.452:1 bowl, and here the gap is HELD on screen rather than swept
 * through, so it has to land on the two round caps at whatever aspect ratio the
 * frame currently has.
 */
export function apertureDraw(box: Box, gap: GapProfile): number {
  return frameOpenFraction(box, gap) * 100;
}

/**
 * The frame's fill opacity. Full until the handoff, then absent — the ink field
 * behind it is already painting the identical colour, so this is invisible.
 */
export function apertureFill(t: number): number {
  return apertureDollyT(t) >= INK_HANDOFF_T ? 0 : 1;
}

/**
 * Whether the frame's stroke is still painted.
 *
 * The exact mirror of `apertureFill`, and it has to be: the two are one
 * handoff. Past `INK_HANDOFF_T` the ink field is covering the viewport in the
 * identical colour and the frame is behind the camera, so the fill was already
 * being dropped there — the stroke simply never was, and it parks 14-22px below
 * the fold on a phone where a hidden URL bar brings it straight back into view.
 * See `setFrameStrokeOpacity` for the measurements.
 *
 * `apertureDollyT` and not the raw `t`, again matching the fill: the dolly has
 * its own ramp inside the segment and the handoff is a point on THAT, not on
 * the segment's progress.
 */
export function apertureStrokeOpacity(t: number): number {
  return apertureDollyT(t) >= INK_HANDOFF_T ? 0 : 1;
}

/**
 * The ink field's opacity: on at the handoff, then cleared over the final 15vh
 * so the page below shows through as the pin releases.
 *
 * Both transitions live in this one function on purpose. Expressed as two tweens
 * — one setting it at the handoff, one fading it at the end — `onRefresh` would
 * re-emit the setter after the fade had started and flash the field back to
 * opaque.
 */
/**
 * How far into the aperture the ray layer has finished fading.
 *
 * The light used to go out on a 320ms wall-clock timer fired by the beat change,
 * and everything else at that moment is SCRUBBED — the ink, the frame, the dolly
 * all move with the scroll. So on any scroll slower than a flick the rays were
 * gone while the panel behind them was still on screen, which reads as the light
 * being switched off rather than as the camera taking it with it.
 *
 * Fading over the first 45% of the aperture's 120vh puts it on the same clock as
 * the content it belongs to, and finishes it well before the fly-through, so the
 * two WebGL contexts are not alive for the most expensive frames on the page.
 */
export const RAY_FADE_T = 0.45;

/** The ray layer's opacity multiplier at a point in the aperture. */
export function apertureRays(t: number): number {
  if (t <= 0) return 1;
  return Math.max(0, 1 - t / RAY_FADE_T);
}

export function apertureInk(t: number): number {
  if (t >= A.clearStart) return 1 - local(t, A.clearStart, 1);
  return apertureDollyT(t) >= INK_HANDOFF_T ? 1 : 0;
}

/**
 * The frame's box: a homothety about the gap point, so the gap holds exactly
 * still while everything around it accelerates outward past the camera.
 *
 * Re-reads the live viewport every frame rather than caching pixels, so
 * `invalidateOnRefresh` recovers a mid-dolly resize the same way the expansion
 * does.
 */
export function apertureBox(t: number, vw: number, vh: number): Box {
  return lerpBox(computeFrameGeometry(vw, vh), computeApertureGeometry(vw, vh), apertureDollyT(t));
}

export interface ApertureTargets {
  frame: StageRefs['frame'];
  inkField: StageRefs['inkField'];
}

/**
 * Append the aperture to the master timeline at its absolute pin position.
 *
 * A segment of the one pinned timeline, never a trigger of its own — a second
 * pinned trigger on this section is the classic pin-jump bug (TDD §9).
 */
export function addApertureSegment(tl: gsap.core.Timeline, refs: ApertureTargets): void {
  const { frame, inkField } = refs;
  const start = PIN_A.startOf('aperture');
  const proxy = { t: 0 };

  tl.fromTo(
    proxy,
    { t: 0 },
    {
      t: 1,
      duration: PIN_A.endOf('aperture') - start,
      onUpdate: () => {
        // The FILTERED viewport — see motion/viewport.ts.
        const { vw, vh } = motionViewport();

        // NOTHING IS WRITTEN AT t=0 — not even the ink, which this segment used
        // to write unconditionally on the grounds that it "belongs to this
        // segment alone". Phase 8E made that false twice over. The launch now
        // raises the ink 500vh earlier, in pin 1, so the field is shared; and a
        // resize while the visitor is watching the rocket re-emits THIS segment
        // at its own t=0, which would have written the ink back to 0 underneath
        // the climb.
        //
        // The frame's box, dash and fill are SHARED with the expansion segment,
        // and must not be touched before this segment has actually started.
        //
        // `onRefresh` nudges the master timeline with `.progress(0).progress(p)`
        // to force completed segments to re-emit after a resize, and a seek
        // backwards past a tween renders it at its START state — firing this
        // onUpdate with t=0. Being later in timeline order, those writes would
        // then win over the expansion's, pinning the frame at its rest box for
        // the whole of Engine 2: a bowl that never grows, on every refresh.
        //
        // Returning early leaves the earlier segment's values standing, which is
        // exactly right — at t=0 this segment's outputs equal the expansion's
        // end state anyway, so there is nothing to restore.
        // Published for the ray layer, which is rendered by React outside this
        // timeline's refs and so cannot be handed one. Written on the root as a
        // custom property, exactly the way the ink field's value is written on
        // its own element: GSAP owns the number, CSS consumes it, and there is
        // still only ONE writer of the layer's opacity.
        //
        // Set BEFORE the early return below. Scrubbing back up past this
        // segment's start re-renders it at t=0, and leaving the property at its
        // last value there would strand the rays dark for the whole carousel on
        // the way back up.
        document.documentElement.style.setProperty(
          '--qx-aperture-t',
          String(proxy.t),
        );

        // BEFORE THE EARLY RETURN, for the same reason `--qx-aperture-t` is.
        // Nothing else on the timeline writes this attribute — the expansion
        // segment has no stroke-opacity of its own to re-assert — so leaving it
        // at its last value on a seek back past this segment's start would
        // strand the frame INVISIBLE for the whole of the expansion on the way
        // up. At t=0 this returns 1, which restores it.
        setFrameStrokeOpacity(frame, apertureStrokeOpacity(proxy.t));

        if (proxy.t <= 0) return;

        // Both of the ink's transitions still live in ONE function — set at the
        // handoff, cleared over the final 15vh. Split into two tweens,
        // `onRefresh` would re-emit the setter after the fade had begun and
        // flash the field back to opaque.
        inkField.style.opacity = String(apertureInk(proxy.t));

        // FROZEN at the rest frame's profile for the whole move, never
        // re-derived from the growing box — see `restGapProfile`. Re-deriving
        // would hold the notch at ~28px while the box went 30x, which is a gap
        // FRACTION shrinking every frame, which walks the gap point into the
        // corner and destroys the fixed point the dolly is built on.
        const gap = restGapProfile(vw, vh);
        const box = apertureBox(proxy.t, vw, vh);
        setFrameBox(frame, box, gap);
        setFrameDraw(frame, apertureDraw(box, gap));
        setFrameFill(frame, apertureFill(proxy.t));
      },
    },
    start,
  );
}

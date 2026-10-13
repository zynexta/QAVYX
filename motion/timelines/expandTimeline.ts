import { gsap } from '@/motion/gsap';
import {
  computeFrameGeometry,
  computeLogoGeometry,
  frameInnerWidth,
  frameOpenFraction,
  gapFor,
  lerpBox,
} from '@/motion/geometry';
import { PIN_A, PIN_TOUCH_COVERAGE } from '@/motion/scrollBudget';
import { motionViewport } from '@/motion/viewport';
import { addApertureSegment } from './apertureTimeline';
import { addTitleSegment } from './titleTimeline';
// COMMENTED OUT WITH ITS CALL BELOW — the SVG rocket is no longer the launch.
// The module itself stays: `launchTimeline.ts` is still the home of the pure
// functions `tests/unit/launch-timeline.test.ts` covers, and re-enabling the
// hand-drawn launch is uncommenting two lines.
// import { addLaunchSegment } from './launchTimeline';
import { addRocketFramesSegment } from './rocketFramesTimeline';
import { setFrameBox, setFrameDraw, setFrameFill, setFrameStroke } from './frameOps';
import { panelOpacity, scrollIndex } from './carouselTimeline';
import { PANEL_COUNT } from '@/content/carousel';
import { setActiveService } from '@/state/heroStore';
import { MOUSE_FACE_SELECTOR, type Beat, type StageRefs } from '@/types/hero';

/**
 * Engines 2-3 as ONE scrubbed timeline, driven by the single pinned
 * ScrollTrigger. The beat boundaries are progress values on this timeline, not
 * separate triggers — two pinned triggers on one section is the classic way to
 * produce pin-jump bugs (TDD s9).
 *
 * Its total duration is normalised to 1, so a segment at [0.06, 0.16] is exactly
 * pin progress 0.06 -> 0.16. Every tween is `ease: 'none'`: easing a scrubbed
 * tween makes it lag the scroll and read as unresponsive. Smoothing lives in
 * `scrub: 1` and Lenis's lerp, never in the tween.
 *
 * Six segments: the mark clears, the Q's bowl becomes the design frame without
 * ever closing its gap, the services translate through it, the camera flies out
 * through that gap, a title card names what comes next, and the growth story
 * plays out beyond it.
 */

/**
 * Segment map, from TDD s7 (scroll axis), derived from the vh budget rather than
 * typed as decimals. Segment ends come from the budget's own boundaries;
 * sub-beats inside a segment are given as an absolute distance into the pin,
 * which is how the TDD describes them ("the interior fills once the frame is
 * ~60% of the way out") and is the form that survives a change to the table.
 */
export const P = {
  cursorOut: PIN_A.mark(20), // row 15 — gone before the frame can overlap it
  strokeStart: PIN_A.mark(10), // row 16 — stroke ramp, strokeStart -> scaleEnd
  scaleEnd: PIN_A.endOf('frameScale'),
  fillStart: PIN_A.mark(50), // row 18 — interior fill
  fillEnd: PIN_A.mark(70),
  expandEnd: PIN_A.endOf('frameExpand'),
  servicesEnd: PIN_A.endOf('services'),
  apertureEnd: PIN_A.endOf('aperture'),
  titleEnd: PIN_A.endOf('title'),
} as const;

/**
 * At-rest tolerance. ScrollTrigger reports a progress of ~2e-7 (float noise, not
 * a real scroll) the instant a pinned trigger is created at scrollY 0, which
 * would otherwise flip the beat straight from `ready` to `frame-scale`. 0.001 is
 * ~4.5px of the 500vh pin — sub-pixel visually, orders of magnitude above the
 * noise. It gates only the beat LABEL; the scrubbed animation still reads the
 * raw progress, so nothing about the motion starts late.
 */
const REST_EPSILON = 0.001;

/** The beat that a given pin progress (0..1) corresponds to. */
export function beatForProgress(p: number, end = 1): Beat {
  if (p < REST_EPSILON) return 'ready';
  // `end` is where THIS pin stops in budget progress: 1 with the launch beat,
  // `PIN_TOUCH_COVERAGE` without it. Checked before the segments rather than
  // after, because on touch the pin's last position IS `P.titleEnd` — falling
  // through the ladder there would report 'launch', a beat that device does not
  // have, for the whole of the rest of the page.
  if (p >= end) return 'done';
  if (p < P.scaleEnd) return 'frame-scale';
  if (p < P.expandEnd) return 'frame-expand';
  if (p < P.servicesEnd) return 'services';
  if (p < P.apertureEnd) return 'aperture';
  if (p < P.titleEnd) return 'title';
  return 'launch';
}

/**
 * How far the track translates: one frame-inner-width per step, `PANEL_COUNT - 1`
 * steps. Read from geometry (not cached) so a refresh after resize gives the
 * correct distance — `trackWidth` measured once at mount is wrong on every
 * viewport but the first.
 */
export function trackTravel(vw: number, vh: number): number {
  return frameInnerWidth(vw, vh) * (PANEL_COUNT - 1);
}

export interface ExpandOptions {
  /**
   * Whether the panels cross-fade as the track travels. BUILD-PLAN Phase 10:
   * "Low tier loses the glow, the grain, and the panel cross-fade — but keeps
   * every beat."
   *
   * The BEAT is the translation and the read head, and both survive: the track
   * still travels one panel per step and `setActiveService` still drives the
   * indicator. What goes is one inline `style.opacity` write per panel per frame
   * across the longest segment on the pin, on the class of device that has the
   * least frame budget to spend on a dim.
   */
  crossFade?: boolean;

  /**
   * Whether the pin carries its last beat, the launch film.
   *
   * TRUE ON BOTH DEVICES AGAIN since the phone got its own frame sequence. It
   * was false on touch between 2026-08-31 and 2026-09-02, and the machinery that
   * made that cheap is still here and still documented — `PIN_TOUCH_COVERAGE`
   * explains why cutting the END of the timeline moves nothing before it — but
   * nothing passes false today.
   *
   * Not a "hide it" flag either way: the segment is never added, so the film's
   * 320vh is not on the timeline at all and the trigger's end has to match.
   *
   * Defaulted TRUE so that every existing caller and every unit test builds the
   * full pin unchanged — this option can only ever subtract, and only when asked.
   */
  launch?: boolean;

}

export function buildExpandTimeline(
  refs: StageRefs,
  { crossFade = true, launch = true }: ExpandOptions = {},
): gsap.core.Timeline {
  const { frame, wordmark, cursor, copy, track, trackViewport } = refs;
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });

  // frame-scale (0.00 -> 0.06): the mark and its copy clear before the bowl grows.
  // Opacity ONLY — no `y`. Animating a transform here made GSAP seize the
  // wordmark's whole matrix, caching the build-time position+scale and
  // re-asserting it at scrub progress 0 on every tick and every refresh() — which
  // overrode the resize relayout and stranded the letters at their old-viewport
  // spot on a window drag. The exit is a clean fade; the frame growing over it
  // carries the motion the small lift used to add.
  //
  // These four are `.to()`s rather than the proxies the rest of the project
  // prefers, and here that is safe for a reason worth stating: GSAP captures a
  // `.to()`'s start value at build time, and the pin is built at `ready` with the
  // assembled logo on screen — which IS progress 0. A captured "visible" is the
  // truth. Every segment that runs LATER on this timeline uses a proxy instead,
  // because for those a build-time capture is a snapshot of a screen the visitor
  // has long since left.
  tl.to(wordmark, { autoAlpha: 0, duration: P.scaleEnd }, 0);
  tl.to(copy, { autoAlpha: 0, duration: P.scaleEnd }, 0);
  // The cursor must be GONE by 0.04, while the bowl is still bowl-sized: the
  // frame grows over it from 0.06, and a cursor still fading under an expanding
  // frame edge reads as a bug rather than as a fade.
  tl.to(cursor, { autoAlpha: 0, duration: P.cursorOut }, 0);
  tl.to(MOUSE_FACE_SELECTOR, { autoAlpha: 0, duration: P.cursorOut }, 0);

  // The mark's white de-emphasises into the dim green of a guide (row 16) — the
  // moment the shape stops being a logo and starts being a container. Written as
  // a presentation attribute via a proxy, like the box and the draw, so a
  // reverse restores the exact token string with no residual inline style.
  const stroke = { t: 0 };
  tl.fromTo(
    stroke,
    { t: 0 },
    {
      t: 1,
      duration: P.scaleEnd - P.strokeStart,
      onUpdate: () => setFrameStroke(frame, stroke.t),
    },
    P.strokeStart,
  );

  // frame-expand (0.06 -> 0.16): Q bowl -> 70% frame, GAP AND ALL.
  //
  // The frame does not close. It used to draw the Q's bottom-right gap shut
  // across this segment (89.4 -> 100), which turned the mark into an anonymous
  // rounded rectangle at exactly the moment it got big enough to be read as
  // one. The gap is the brand: the workspace is a Q the whole way out, and the
  // aperture later flies through an opening that has been there since `boot`
  // rather than one that has to be re-cut.
  //
  // AND THE NOTCH DOES NOT GROW WITH IT. `gapFor` sizes the opening in stroke
  // widths rather than as a fraction of the box, so `box.w * (1 - bar)` is the
  // same number of pixels at the bowl and at full workspace size. The frame
  // expands around a notch that holds still — which is what keeps it reading as
  // the mark's deliberate break rather than as a corner falling off a rectangle
  // as it gets bigger.
  //
  // Derived per frame from the LERPED box, not lerped between the two ends: the
  // gap FRACTIONS are not linear in the box, so interpolating them would bulge
  // the notch to ~2.3x mid-expansion and settle it back, which is a wobble in
  // the one element the eye is locked to.
  //
  // The dash follows from the same profile for the same reason it always did —
  // both round caps have to land on the terminals at every box in between.
  //
  // A single 0..1 proxy drives all three; they re-read the live viewport each
  // frame so invalidateOnRefresh recovers a resize with no cached pixels and no
  // stroke-width change (only `d` moves, never scale).
  const expand = { p: 0 };
  tl.fromTo(
    expand,
    { p: 0 },
    {
      p: 1,
      duration: P.expandEnd - P.scaleEnd,
      onUpdate: () => {
        // The FILTERED viewport — never the window. A URL-bar move must not
        // re-lay-out the frame under a React tree that did not re-render.
        const { vw, vh } = motionViewport();
        const logo = computeLogoGeometry(vw, vh);
        const to = computeFrameGeometry(vw, vh);
        const box = lerpBox(logo.frame, to, expand.p);
        const gap = gapFor(box, logo.strokeWidth);
        setFrameBox(frame, box, gap);
        setFrameDraw(frame, frameOpenFraction(box, gap) * 100);
      },
    },
    P.scaleEnd,
  );

  // The interior fills once the frame is ~60% of the way out (row 18). Late on
  // purpose: a filled full-viewport path is materially more expensive to repaint
  // than a stroked one, and this segment has the tightest frame budget in the
  // project (§12, 8ms). Below t=0 the fill is absent, not transparent.
  const fill = { t: 0 };
  tl.fromTo(
    fill,
    { t: 0 },
    {
      t: 1,
      duration: P.fillEnd - P.fillStart,
      onUpdate: () => setFrameFill(frame, fill.t),
    },
    P.fillStart,
  );

  // The carousel appears just as the frame settles.
  tl.to(trackViewport, { autoAlpha: 1, duration: PIN_A.span(10) }, PIN_A.mark(70));

  // services (0.16 -> 0.88): the track translates one panel per step, linear.
  // The end value is a FUNCTION so invalidateOnRefresh re-reads it after a
  // resize; caching the distance at build time strands the last panel offscreen
  // on any viewport but the one the pin was created at.
  tl.fromTo(
    track,
    { x: 0 },
    {
      x: () => {
        const { vw, vh } = motionViewport();
        return -trackTravel(vw, vh);
      },
      duration: P.servicesEnd - P.expandEnd,
    },
    P.expandEnd,
  );

  // Panel cross-fade + the active index, off ONE proxy across the same segment.
  // Opacity is the only per-panel animation there is (TDD §7 row 21): the
  // translation already communicates navigation, so a title/description/CTA
  // stagger would be motion that says nothing new during the segment with the
  // least frame budget to spare.
  // SCOPED TO THE TRACK, not `.qx-panel` document-wide. Since Phase 9 the same
  // `ServicePanel` also renders as `HeroStatic`'s vertical list, which is in the
  // HTML on every response and merely `display: none` here. An unscoped selector
  // would collect eleven panels, and `panelOpacity` dims every index past the
  // last step — so the static list would be driven to 0.25 opacity by a timeline
  // that has nothing to do with it, and would show it the moment a visitor
  // toggled reduced motion on. The stacked variant carries a different class for
  // the same reason; this is the second lock on the same door.
  const panels = gsap.utils.toArray<HTMLElement>('#qx-track .qx-panel');
  const carousel = { p: 0 };
  tl.fromTo(
    carousel,
    { p: 0 },
    {
      p: 1,
      duration: P.servicesEnd - P.expandEnd,
      onUpdate: () => {
        // The guard is inside the loop's owner rather than around the whole
        // tween, because the tween is not only the cross-fade: `setActiveService`
        // below is the read head and it runs on both tiers. Skipping the writes
        // leaves every panel at the opacity CSS gives it, which is 1 — neither
        // `ServicePanel` nor `LaunchpadPanel` sets one — so a low-tier carousel
        // is six panels at full strength travelling through the frame, not six
        // dimmed ones.
        if (crossFade) {
          for (let i = 0; i < panels.length; i++) {
            panels[i]!.style.opacity = String(panelOpacity(i, carousel.p));
          }
        }
        // Driven off the SCRUBBED value, not the trigger's raw progress: with
        // scrub:1 the two differ by up to a second after a fast flick, and an
        // indicator reading from the raw progress would show a panel number
        // that has not arrived on screen yet. Runs every frame; the store drops
        // it unless the value changed, so the indicator renders 4 times across
        // the segment rather than ~240.
        setActiveService(scrollIndex(carousel.p));
      },
    },
    P.expandEnd,
  );

  // aperture: the panels clear, the five service marks converge on the Q's gap,
  // and the camera flies through it. The stage is NOT faded — the frame stays
  // the subject right through, which is the whole point of the pivot.
  tl.to(trackViewport, { autoAlpha: 0, duration: PIN_A.span(20) }, P.servicesEnd);
  addApertureSegment(tl, refs);

  // title: §3.1's positioning line, naming the story the rocket then tells.
  addTitleSegment(tl, refs);

  // launch: the growth story, beyond the gap the camera flew through.
  //
  // THE SVG ROCKET IS COMMENTED OUT, NOT DELETED, on the client's direction:
  // the launch beat is now their own rendered film, scrubbed by this same pin
  // over this same 320vh. `addRocketVideoSegment` takes the segment over whole —
  // same `PIN_A.startOf('launch')`, same end, same handoff at 300vh — so nothing
  // above it moves and `beatForProgress` still calls this stretch `launch`.
  //
  // What the commented-out call leaves behind is inert, and that is the point of
  // commenting rather than deleting. `#qx-launch-layer` is `visibility: hidden`
  // from `LaunchLayer`'s own markup and `#qx-launch-beats` carries `invisible`
  // from `LaunchBeats`; with nothing on this timeline addressing either, both
  // stay hidden for the whole pin and `cross-paint.test.ts` still holds them to
  // it. The nodes are the cost of a one-line revert, and the film is the beat.
  //
  // addLaunchSegment(tl, refs);
  //
  // ON TOUCH THE BEAT IS NOT ADDED AT ALL — see `PIN_TOUCH_COVERAGE`. The film
  // was too heavy on a phone in both of the ways a video can be, and the client's
  // answer once the download and the seek loop had both been fixed and measured
  // was to take the beat off phones rather than keep tuning it. §5 is real,
  // server-rendered text directly below the pin either way.
  if (launch) addRocketFramesSegment(tl, refs.rocketFilmLayer, refs.rocketFrames);

  // Anchor the total duration explicitly.
  //
  // The normalisation this file depends on was emergent, not enforced: a
  // timeline's duration is the end time of its furthest child, and the last
  // tween above happened to end at exactly 1.0. Any future segment ending at
  // 0.995 would silently rescale EVERY position in this file by 1/0.995 — ~28px
  // of drift on a 5600px pin, enough to move a snap point, and invisible to
  // anyone reading the code. An explicit zero-duration child pins it.
  //
  // WITHOUT THE LAUNCH BEAT THE ANCHOR MOVES WITH IT, and it has to: leaving it
  // at 1 would stretch a timeline whose real content ends at 0.685 across the
  // whole trigger, which is the exact silent rescale the paragraph above exists
  // to prevent — every position in this file 1.46x too late. Anchored here
  // instead, the timeline and the trigger are both short by the same factor and
  // every beat lands at the same absolute vh it does on a desktop.
  tl.set({}, {}, launch ? 1 : PIN_TOUCH_COVERAGE);

  return tl;
}

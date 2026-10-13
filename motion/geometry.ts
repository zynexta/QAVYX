/**
 * Logo geometry engine.
 *
 * Every pixel constant in this project lives here. Nothing else may hard-code a
 * dimension — that is what makes resize, breakpoints and the frame expansion a
 * single recompute rather than a hunt through timelines.
 *
 * All ratios below were MEASURED from assets/Qavyx Logo Black-PNG.png
 * (logo bounding box 2255 x 357 source px) by connected-component analysis, not
 * estimated. See BUILD-PLAN "Corrections to the TDD from the real brand assets".
 *
 * Anatomy of the mark, which is not what the TDD assumed:
 *
 *      ┌───────────────────┐
 *      │                   │        A V Y X          <- separate letterforms,
 *      │   the Q's bowl    ╵                            OUTSIDE the bowl
 *      └──────────────╴ 🖱  ╴        the bowl IS the letter Q
 *                      ^
 *                      the rounded rect is OPEN at the bottom-right and the
 *                      mouse glyph sits in that gap. The cursor does not park
 *                      beside the logo — it COMPLETES it.
 */

/** Logo bbox aspect: width / height, measured 2255 / 357. */
export const LOGO_ASPECT = 2255 / 357; // 6.3165

/** The authoring space the wordmark paths are drawn in (source pixels). */
export const WORDMARK_VIEWBOX = { w: 2255, h: 357 } as const;

/**
 * Ratios of the logo's WIDTH. Using one denominator for both axes keeps the
 * aspect correct without a second scale factor to get wrong.
 */
const R = {
  /** Q bowl centreline box (stroke centre, not outer edge). */
  frameX: 19.5 / 2255,
  frameY: 19.5 / 2255,
  frameW: 424 / 2255,
  frameH: 292 / 2255,
  // Centreline corner radius 17px (outer ~36, measured where the straight top
  // and left edges begin to curve). The real Q has nearly-square corners: the
  // outer radius is about one stroke-width, so the INNER corner is almost sharp.
  // An earlier value of 52.9 (from a 45-degree-diagonal estimate) made every
  // corner visibly too round — caught by a per-pixel diff against the source.
  frameR: 17 / 2255,
  stroke: 39 / 2255,
  /**
   * Mouse glyph: the centroid of its BODY (not of the green tip, as the
   * placeholder had it), and the glyph's overall length along its axis. Both
   * re-measured from the favicon — see MOUSE below.
   */
  mouseX: 442.04 / 2255,
  mouseY: 309.19 / 2255,
  mouseSize: 117.6 / 2255,
} as const;

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
}

/**
 * Linear interpolation between two boxes, component by component. The frame
 * expansion tweens a single 0..1 proxy and lerps the logo box to the 70% box
 * every frame, so the expansion reads its start/end from geometry rather than
 * caching pixels — which is what lets a resize mid-expansion recover cleanly.
 */
export function lerpBox(a: Box, b: Box, t: number): Box {
  const mix = (u: number, v: number) => u + (v - u) * t;
  return {
    x: mix(a.x, b.x),
    y: mix(a.y, b.y),
    w: mix(a.w, b.w),
    h: mix(a.h, b.h),
    r: mix(a.r, b.r),
  };
}

export interface LogoGeometry {
  /** Logo bounding box in stage pixels. */
  logo: { x: number; y: number; w: number; h: number };
  /** The Q bowl's centreline box — this element becomes the design frame. */
  frame: Box;
  strokeWidth: number;
  /** Transform for the wordmark group, which is authored in WORDMARK_VIEWBOX. */
  wordmark: { x: number; y: number; scale: number };
  /** Where the mouse glyph sits: the gap in the Q's bottom-right. */
  mouseAnchor: { x: number; y: number; size: number };
}

const clamp = (lo: number, v: number, hi: number) => Math.max(lo, Math.min(v, hi));

/**
 * The most of the viewport the mark may occupy on a phone.
 *
 * THE 360px FLOOR BELOW IS A DESKTOP NUMBER, and left on its own it swallowed
 * small screens whole: 52% of 414px is 215, the floor overrode it, and the mark
 * shipped at 360 — 87% of the screen, edge to edge behind a 27px gutter. It was
 * not clipped and no test caught it, because every bound was doing exactly what
 * it said; the poster was simply a different design on a phone than the 52% one
 * signed off on desktop.
 *
 * 0.72 is the fraction at which the lockup still reads as placed on the screen
 * rather than pressed against it — ~58px of air each side at 414px, which is
 * the gutter the rest of the mobile layout uses (`px-4`, doubled). It is a
 * ceiling on the FLOOR, not a new width: anywhere 52% already exceeds it (above
 * ~692px) this term is inert and the desktop poster is untouched to the pixel.
 */
const PHONE_MAX_FRACTION = 0.72;

/**
 * Logo display width. Clamped so the mark never gets so small that the mouse
 * glyph stops reading, nor so wide it loses the poster quality of the hero.
 *
 * The `fit` cap keeps a gutter on both sides at EVERY width. Below ~470px the
 * ideal (52%-of-vw, min 360) width is wider than the screen, so without this
 * the mark clipped off both edges on phones. There the cap takes over and the
 * logo shrinks with the viewport instead of overflowing. Above that width `fit`
 * exceeds the other bounds and this behaves exactly as it did before.
 *
 * `PHONE_MAX_FRACTION` is the second half of that story and the reason the mark
 * is no longer poster-sized on a phone — see above. The two small-screen bounds
 * are not redundant: `fit` stops the mark CLIPPING, the fraction stops it
 * DOMINATING, and below ~500px the fraction is the stricter of the two.
 */
export function logoWidthFor(vw: number): number {
  const gutter = vw < 480 ? 20 : 64;
  const fit = vw - gutter * 2;
  const floor = Math.min(360, fit, vw * PHONE_MAX_FRACTION);
  return clamp(floor, vw * 0.52, Math.min(900, fit));
}

/**
 * The lockup at an arbitrary width and origin — every part of the mark placed
 * from the one set of measured ratios.
 *
 * Split out of `computeLogoGeometry` because the hero is no longer the only
 * thing that draws the logo. The navbar (Phase 8C) renders a STATIC lockup, in
 * its own SVG, at a size CSS decides — so it has no viewport to centre against
 * and cannot go through `logoWidthFor`'s clamps, which exist to size the hero
 * poster. Passing `WORDMARK_VIEWBOX.w` gives the mark in its authoring space,
 * which is then a plain `viewBox` and scales with the element.
 *
 * The hero calls this too, so there is still exactly one place where a ratio in
 * `R` becomes a pixel. A nav logo built from its own copy of the numbers is how
 * the two drift apart.
 */
export function computeLockupGeometry(w: number, x = 0, y = 0): LogoGeometry {
  const h = w / LOGO_ASPECT;

  return {
    logo: { x, y, w, h },
    frame: {
      x: x + R.frameX * w,
      y: y + R.frameY * w,
      w: R.frameW * w,
      h: R.frameH * w,
      r: R.frameR * w,
    },
    strokeWidth: R.stroke * w,
    wordmark: { x, y, scale: w / WORDMARK_VIEWBOX.w },
    mouseAnchor: { x: x + R.mouseX * w, y: y + R.mouseY * w, size: R.mouseSize * w },
  };
}

export function computeLogoGeometry(vw: number, vh: number): LogoGeometry {
  const w = logoWidthFor(vw);
  const h = w / LOGO_ASPECT;
  return computeLockupGeometry(w, (vw - w) / 2, (vh - h) / 2);
}

/**
 * Corner radius of the expanded design frame, in stage pixels. Mirrors
 * `--qx-radius-lg` in styles/tokens.css, which the DOM chrome inside the frame
 * uses — the two must match or the panels' corners fight the frame's.
 *
 * Unlike the bowl's radius this one is ABSOLUTE, not a fraction of the box: a
 * proportional radius at full-viewport size would read as a stadium, and the
 * frame is meant to read as a workspace.
 */
export const FRAME_RADIUS = 20;

/**
 * Viewport fractions of the design frame at rest. Desktop is the canonical 70%
 * of both axes. Below 1024 the two-column panel layout cramps, so the frame
 * widens rather than staying square. See BUILD-PLAN Phase 14.
 *
 * Below 768 it is TALLER, not shorter. It used to be 0.62, on the reasoning that
 * the indicator needed room "under it" — but the indicator lives INSIDE the
 * frame, and at 0.62 a phone-width panel (whose service chips wrap to two lines
 * each) needed ~503px of the ~448px it was given, so the list and CTA spilled
 * through the indicator and off the bottom edge. 0.78 is what makes the tallest
 * panel fit at 360x740, the narrowest viewport this supports.
 *
 * THAT ROW IS LOAD-BEARING AND PHASE 10 CONFIRMED IT. That phase briefly
 * suppressed the pin below 768 (BUILD-PLAN's own instruction), which would have
 * made this row unreachable; it was reverted on the client's direction — a
 * phone gets the same scrolling experience as a desktop. So 0.92/0.78 is the
 * frame a real visitor sees, not a defensive branch, and the tuning note above
 * is a live measurement rather than history.
 */
const FRAME_FRACTIONS = [
  { maxVw: 768, w: 0.92, h: 0.78 },
  { maxVw: 1024, w: 0.84, h: 0.7 },
  { maxVw: Infinity, w: 0.7, h: 0.7 },
] as const;

/**
 * Absolute floor and ceiling on the frame's HEIGHT.
 *
 * A pure fraction of the viewport assumes the viewport is tall. On a short one
 * it is not: at 1280x720 the canonical 70% gives 504px, and the tallest panel's
 * two-column content needs ~536 — so its CTA crossed the indicator and clipped.
 * (That predates the mobile work; it was reproduced against the pre-fix build.)
 * `MIN` is the panel's real requirement in pixels, `MAX_FRACTION` stops the floor
 * from swallowing a small screen whole.
 *
 * Both are inert wherever the fraction already clears them, so the canonical
 * desktop frame (1440x900 and up) is untouched to the pixel.
 */
const FRAME_H_MIN = 620;
const FRAME_H_MAX_FRACTION = 0.88;

/* ---------------------------------------------------------------------------
   THE ONE VIEWPORT THIS GEOMETRY DOES NOT FIT, recorded rather than guarded.
   ---------------------------------------------------------------------------
   A PHONE IN LANDSCAPE. At 844 x 390 the fraction table gives a frame 343px
   tall (0.88 of the viewport, the MAX clamp binding long before `FRAME_H_MIN`
   can), and the tallest service panel needs about 536. The list and the CTA run
   through the indicator and off the bottom edge, exactly as they did at the old
   0.62 phone fraction that `FRAME_FRACTIONS`' note describes.

   It is written here and not fixed here because there is no fix in this file:
   the frame cannot be taller than the viewport, so a short viewport needs the
   PANEL to change (fewer chips, a scrolling card) or the pin to be refused. The
   second was built in Phase 10 as `PIN_MIN_VH` and reverted with the rest of the
   small-viewport branch on the client's direction; the first is a design change
   nobody has asked for. It predates both and is not a regression from either —
   `computeFrameGeometry` has always returned this box at this viewport.

   The client has seen it and accepted it as-is. Do not "fix" it by widening
   `FRAME_H_MAX_FRACTION`: at 0.95 the frame clears the panel by nothing and the
   hero has no margin left at all.                                             */

/**
 * The design frame at rest: 70% of the viewport, centred.
 *
 * This is the END of the Engine-2 expansion, and the expansion lerps to it every
 * frame rather than caching pixels — which is what makes a resize mid-expansion
 * recover. The bowl it grows FROM is 1.452:1 and this is 1.600:1 at desktop, a
 * 10% change of proportion across the whole segment: small enough that the move
 * reads as a scale rather than a stretch. If the fractions here are ever
 * changed, check the resulting ratio against 1.452 first.
 */
export function computeFrameGeometry(vw: number, vh: number): Box {
  const f = FRAME_FRACTIONS.find((entry) => vw < entry.maxVw) ?? FRAME_FRACTIONS.at(-1)!;
  const w = vw * f.w;
  const h = Math.min(vh * FRAME_H_MAX_FRACTION, Math.max(vh * f.h, FRAME_H_MIN));
  return { x: (vw - w) / 2, y: (vh - h) / 2, w, h, r: FRAME_RADIUS };
}

/**
 * The width one service panel occupies: the design frame minus its stroke on
 * both sides, so a panel's edge never sits under the frame's rule.
 *
 * This is the carousel's step size AND the divisor for its travel, so it must
 * come from one function — a panel laid out at `frame.w` while the track
 * travels by the inner width (or the reverse) drifts by two stroke widths per
 * step, which is a visible misalignment by the fifth panel.
 */
export function frameInnerWidth(vw: number, vh: number): number {
  return computeFrameGeometry(vw, vh).w - computeLogoGeometry(vw, vh).strokeWidth * 2;
}

/* ---------------------------------------------------------------------------
   The light outside the frame.
   ---------------------------------------------------------------------------
   The design frame is a lit object, and until now it had no room to be lit in:
   the gutter either side of it was bare page. Two banks of raking light sit out
   there — one per side, aimed inward — and where each one reaches the frame the
   vertical rule takes a specular highlight. See `components/hero/FrameRays.tsx`
   for the layer itself; the numbers live here because that is the rule for every
   pixel constant in this project.

   FOUR BOXES, ALL DERIVED FROM THE FRAME, and each one is answering a specific
   way the effect goes wrong if it is placed by hand.

   `left`/`right` are the canvases. They run from the viewport edge to PAST the
   frame's edge, by `RAY_OVERLAP`, and that overshoot is the whole trick: a
   canvas clipped exactly at `frame.x` ends on a vertical seam of half-bright
   light, because the shader's falloff is nowhere near zero there. Running it
   under the frame's opaque interior means the light is terminated by the frame
   rather than by the edge of its own texture — which is also the only way it
   reads as light LANDING on something.

   `glintLeft`/`glintRight` are the highlight: a narrow bloom hugging the OUTER
   face of each vertical stroke, brightest where the bank's centreline hits it.
   Sized in stroke widths, not pixels, for the same reason the notch is
   (`GAP_GROWTH`) — a fixed 40px halo is a glow at phone scale and a smudge at
   3440.

   The band overshoots the frame vertically by `RAY_BLEED` so the light spills
   over the top and bottom corners instead of stopping level with them. The
   layer masks both ends off; without the overshoot there would be nothing there
   to mask.                                                                   */

/**
 * The narrowest gutter worth lighting. Below it the frame is nearly the whole
 * viewport and there is no outside left to put a lamp in — `computeRayLayout`
 * returns null rather than squeezing.
 *
 * It is a distance, not a breakpoint, and it lands where `FRAME_FRACTIONS`
 * steps: 1024 and up gives 15% of the viewport each side (154px at exactly
 * 1024), and 1023 gives 8% (82px), so the layer switches off precisely where
 * the frame widens to make room for a cramped panel layout.
 */
export const RAY_MIN_GUTTER = 140;

/** How far the band overshoots the frame vertically, as a fraction of its height. */
const RAY_BLEED = 0.16;

/**
 * How far a canvas continues past the frame's edge, under its interior. Capped
 * as a fraction of the frame so it can never reach the far side on a narrow one.
 */
const RAY_OVERLAP_PX = 56;
const RAY_OVERLAP_FRACTION = 0.06;

/** Width of the specular bloom, in stroke widths, with an absolute floor. */
const RAY_BLOOM_STROKES = 6;
const RAY_BLOOM_MIN = 44;

/**
 * How much of the frame's height the contact bloom covers, centred on where the
 * rake arrives. A full-height bloom reads as a bar beside the frame; this reads
 * as the place the light lands.
 */
const RAY_GLINT_SPAN = 0.42;

/** A box in viewport pixels — the layer positions everything `fixed`. */
export interface RayBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * A bloom, plus where along its own height the light that causes it is coming
 * from.
 *
 * The hotspot is carried rather than assumed to be the middle because THE TWO
 * SIDES ARE NOT THE SAME LENGTH. The Q's right stroke stops at its stub terminal
 * — that is the mark's opening, the thing the whole brand is built on and the
 * thing the camera later flies through — so below that point there is no surface
 * for the light to land on. A highlight that ran the full height there would be
 * painting the gap back in, in the one colour that is supposed to be missing
 * from it. The left rule is unbroken and gets the full height.
 *
 * So the right bloom is shorter, but its LIGHT still arrives at the frame's
 * mid-height, and its falloff has to be built around that rather than around its
 * own centre. Below the hotspot it fades faster, and it runs out exactly where
 * the stroke does.
 */
export interface RayGlint extends RayBox {
  /** Where the bank's source sits, as a fraction of THIS box's height. */
  hot: number;
}

export interface RayLayout {
  /** The two canvases, viewport edge to just inside the frame. */
  left: RayBox;
  right: RayBox;
  /** The bloom on each vertical rule — see `RayGlint` for why they differ. */
  glintLeft: RayGlint;
  glintRight: RayGlint;
}

/**
 * The whole light layer for a viewport, or null where there is no gutter to
 * light.
 *
 * Takes the viewport rather than a frame box so it cannot be handed one that
 * disagrees with the frame actually on screen — the same reason
 * `frameInnerWidth` re-derives instead of accepting a width.
 */
/* ---------------------------------------------------------------------------
   THE SAME PROBLEM ONCE MORE, FOR THE RAY RAKE.
   ---------------------------------------------------------------------------
   `RakeRays` builds its field by quantising the ANGLE off the source axis, so
   the rays themselves are aspect-independent — an angular slot is an angular
   slot at any canvas shape. Two things are not, and both are the same class of
   bug the ORIGINAL shaft shader's own cone derivation was written for — that
   shader and its `rayConeFor` are gone, the failure they taught is not.

   `uReach` is a multiple of the canvas WIDTH, but the distance it is compared
   against runs from a source outside the bank to a fragment anywhere in it —
   which scales with the bank's DIAGONAL. The banks here are tall and narrow
   (272 x 832 at 1440x900), so a reach tuned as a width multiple extinguishes
   the rays a third of the way up the bank and leaves the top and bottom dark.

   `uSpread` is the cone half-angle, and the cone has to cover the bank's own
   corners or the rake stops in mid-air at a straight diagonal edge — the exact
   hard-edged wedge the ultrawide regression produced last time. The corner sits
   at `atan((h/2) / (w + outside*w))` from a source `outside` bank-widths out.

   So both are re-derived from the bank actually on screen, holding the READING:
   the cone reaches the corners with a margin, and the rays reach the far side.  */

/** How much cone is left beyond the corner, so the falloff is never the edge. */
const RAKE_CORNER_MARGIN = 1.25;

/** Reach as a multiple of the source-to-corner distance. */
const RAKE_REACH_RATIO = 1.15;

/** Cone half-angle, hard-limited so a very short bank cannot open to a disc. */
const RAKE_SPREAD_MAX = 1.15;
const RAKE_SPREAD_MIN = 0.35;

/** The two shader inputs that have to move with the bank's shape. */
export interface RakeCone {
  reach: number;
  spread: number;
}

/**
 * `RakeRays`' shape constants, re-derived for a bank of this aspect.
 *
 * `outside` must match the value handed to the component, because the source
 * position is what both quantities are measured from — passing one and tuning
 * the other is how the two silently disagree.
 */
export function rakeConeFor(box: RayBox, outside: number): RakeCone {
  const w = box.w > 0 ? box.w : 1;
  const h = box.h > 0 ? box.h : 1;

  // Source sits `outside * w` beyond the near edge, on the mid-height, so the
  // far corner is this far away and at this angle.
  const run = w * (1 + outside);
  const rise = h / 2;

  const corner = Math.atan(rise / run);
  const distance = Math.hypot(run, rise);

  return {
    spread: Math.min(RAKE_SPREAD_MAX, Math.max(RAKE_SPREAD_MIN, corner * RAKE_CORNER_MARGIN)),
    reach: (RAKE_REACH_RATIO * distance) / w,
  };
}

export function computeRayLayout(vw: number, vh: number): RayLayout | null {
  const frame = computeFrameGeometry(vw, vh);
  const right = frame.x + frame.w;
  if (Math.min(frame.x, vw - right) < RAY_MIN_GUTTER) return null;

  const bleed = frame.h * RAY_BLEED;
  const top = Math.max(0, frame.y - bleed);
  const bottom = Math.min(vh, frame.y + frame.h + bleed);
  const h = bottom - top;

  const overlap = Math.min(RAY_OVERLAP_PX, frame.w * RAY_OVERLAP_FRACTION);
  const stroke = computeLogoGeometry(vw, vh).strokeWidth;
  const bloom = Math.max(RAY_BLOOM_MIN, stroke * RAY_BLOOM_STROKES);
  // The stroke straddles the centreline, so its outer face is half a width out.
  const half = stroke / 2;

  // Where the right rule actually ends: the stub terminal, plus the round cap
  // that sits on it. From `gapFor`, so the highlight tracks the same notch the
  // frame is drawn with at this size rather than a second guess at it.
  const stub = Math.min(frame.h, frame.h * gapFor(frame, stroke).stub + half);

  /* THE REFLECTION IS A CONTACT, NOT A RULE.

     It used to run the FULL height of each vertical stroke, which made it a bar
     drawn beside the frame rather than the place light lands on it — and on the
     right it ran downward to the stub terminal, so what a reader saw was a
     highlight sliding away BELOW the point the light actually arrives. The rake
     comes in on the bank's mid-height and nowhere else, so the bloom belongs
     there: a band centred on the source's own height, `RAY_GLINT_SPAN` of the
     frame tall, fading out at both ends.

     The right one is still clamped at the stub, and that clamp is the mark, not
     a tidy-up. Past it there is no stroke to light, and a highlight there would
     be filling in the Q's opening — the one thing on this page that has to stay
     empty — in the one colour that is supposed to be missing from it. */
  const centre = frame.y + frame.h / 2;
  const span = Math.min(frame.h, frame.h * RAY_GLINT_SPAN);
  const glintTop = centre - span / 2;

  const stubY = frame.y + stub;
  const rightBottom = Math.min(glintTop + span, stubY);
  const rightTop = Math.min(glintTop, rightBottom);
  const rightSpan = Math.max(0, rightBottom - rightTop);

  return {
    left: { x: 0, y: top, w: frame.x + overlap, h },
    right: { x: right - overlap, y: top, w: vw - right + overlap, h },
    glintLeft: { x: frame.x - half - bloom, y: glintTop, w: bloom, h: span, hot: 0.5 },
    glintRight: {
      x: right + half,
      y: rightTop,
      w: bloom,
      h: rightSpan,
      // Still measured from where the LIGHT is, not from the box's own middle:
      // when the stub clamps the bottom off, the arrival sits below centre.
      hot: rightSpan > 0 ? (centre - rightTop) / rightSpan : 0.5,
    },
  };
}

/**
 * The navbar logo box the frame collapses into at the end of Engine 3.
 * The real navbar logo derives its CSS from this same function — if the two
 * boxes disagree by even a pixel it shows as a jump at exactly the moment the
 * user is watching the handoff.
 */
export function computeNavGeometry(vw: number): Box {
  const w = vw < 768 ? 104 : 132;
  return { x: 24, y: 14, w, h: w * (50 / 132), r: 12 };
}

/**
 * Rounded-rect centreline path.
 *
 * Starts at the Q's stub terminal (75% down the right edge) and runs
 * ANTICLOCKWISE, so that the last ~10% of the path length is exactly the gap
 * where the mouse sits. One dash value expresses the mark at any size:
 *
 *   drawSVG "0% 89.4%" -> the open Q, which is the shape at EVERY beat
 *   drawSVG "0% 100%"  -> the closed rectangle, which nothing renders any more
 *
 * The frame used to draw itself shut across the expansion and reopen at the
 * aperture. It no longer does — the mark keeps its gap from `boot` to the fly
 * through — so the second state survives only as the degenerate end of the
 * range. The intro still draws the stroke on from 0, which is what the ordering
 * is really for.
 *
 * The Z is retained even though the last ~10% is never stroked: the FILL is the
 * workspace interior and needs the closed shape, and `fill` ignores the dash.
 *
 * Same element, same 8 segments, no structural change between sizes — which is
 * what makes the expansion interpolate cleanly.
 */
export function computeFramePath(box: Box, gap: GapProfile = LOGO_GAP): string {
  const { x, y, w, h, r } = box;
  const rr = Math.min(r, w / 2, h / 2);
  const right = x + w;
  const bottom = y + h;
  const stubY = y + h * gap.stub;
  const barX = x + w * gap.bar;

  return [
    `M${round(right)},${round(stubY)}`,
    `L${round(right)},${round(y + rr)}`,
    `A${round(rr)},${round(rr)} 0 0 0 ${round(right - rr)},${round(y)}`,
    `L${round(x + rr)},${round(y)}`,
    `A${round(rr)},${round(rr)} 0 0 0 ${round(x)},${round(y + rr)}`,
    `L${round(x)},${round(bottom - rr)}`,
    `A${round(rr)},${round(rr)} 0 0 0 ${round(x + rr)},${round(bottom)}`,
    `L${round(barX)},${round(bottom)}`,
    `L${round(right - rr)},${round(bottom)}`,
    `A${round(rr)},${round(rr)} 0 0 0 ${round(right)},${round(bottom - rr)}`,
    'Z',
  ].join(' ');
}

/** Where the right stub stops, as a fraction of the bowl's height: 220/292. */
export const FRAME_STUB_FRACTION = (239.5 - 19.5) / 292;
/** Where the bottom bar stops, as a fraction of the bowl's width: 340/424. */
export const FRAME_BAR_FRACTION = (359.5 - 19.5) / 424;

/**
 * Where the two terminals sit on a given box. Everything that has to know where
 * the Q's opening is takes one of these rather than the two constants above,
 * because the constants are the BOWL's and the bowl is not the only box the
 * frame is ever drawn at.
 */
export interface GapProfile {
  /** Bottom bar terminal, as a fraction of the box's width. */
  bar: number;
  /** Right stub terminal, as a fraction of the box's height. */
  stub: number;
}

/** The mark's own proportions — correct for the bowl, and the default. */
export const LOGO_GAP: GapProfile = { bar: FRAME_BAR_FRACTION, stub: FRAME_STUB_FRACTION };

/**
 * THE NOTCH IS MEASURED IN STROKE WIDTHS, NOT IN FRACTIONS OF THE BOX.
 *
 * On the bowl the opening is 84 x 72 source px against a 39px stroke — a bit
 * over two stroke widths each way, which is what makes it read as a deliberate
 * break in a line rather than as a missing corner. Held as a FRACTION of the box
 * (which is what the two constants above are, and what the frame used to do at
 * every size) that same notch becomes ~200px along the bottom of the 70% design
 * frame, against a stroke that is still 13px. Proportionally it is the logo; on
 * screen it is a rectangle with its corner cut off.
 *
 * So the fractions are derived per box from these two ratios instead.
 */
export const GAP_BAR_STROKES = (424 - 340) / 39; // 2.154 — along the bottom
export const GAP_STUB_STROKES = (292 - 220) / 39; // 1.846 — up the right edge

/**
 * The bowl's own width, in stroke widths. Both scale with the logo, so this is a
 * constant — which is what lets `gapFor` recognise "how far past bowl size is
 * this box" from the stroke alone, without being handed the logo geometry.
 */
const BOWL_W_STROKES = 424 / 39; // 10.87

/**
 * HOW FAST THE NOTCH GROWS WITH THE BOX. This is the tuning knob, and the two
 * ends of its range are the two ways of getting this wrong:
 *
 *   0    the notch is frozen in pixels — the same ~28px opening at the bowl and
 *        at the 70% workspace. Honest to the stroke, but by the time the frame
 *        is 1008px wide the break reads as a nick rather than as the mark's gap.
 *   1    the notch is a fixed fraction of the box — the original. ~200px along
 *        the bottom of the design frame: not a gap, a missing corner.
 *
 * 0.75 gives ~122px at 1440x900: an opening that reads as the mark's at
 * workspace size, against ~200px proportional and the frozen ~28px. Settled by
 * eye against the logo over five passes, rendered at 1:1 — 0.25, 0.35 and 0.6
 * were each legible as a break but still read tight at full width, which is the
 * failure mode this exponent exists to fix. Raise toward 1 for more (and it IS
 * the proportional gap at 1), drop toward 0.1 for less; nothing else changes.
 *
 * It is applied to a ratio that is 1 AT THE BOWL by construction, so the mark
 * itself is untouched at any exponent — the mouse glyph still fits its gap, and
 * the intro is still the brand mark to the pixel.
 */
const GAP_GROWTH = 0.75;

/**
 * How much the notch is scaled up for a box this far past bowl size.
 *
 * Uses the WIDTH for both axes, so the opening keeps the mark's own 84:72
 * proportion at every size rather than shearing with the frame's aspect.
 */
function gapGrowth(box: Box, strokeWidth: number): number {
  return Math.pow(box.w / (BOWL_W_STROKES * strokeWidth), GAP_GROWTH);
}

/**
 * The gap profile for `box` at a given stroke width.
 *
 * At the bowl this reproduces `LOGO_GAP` to the last bit, by construction rather
 * than by coincidence: the bowl's 84px gap IS `GAP_BAR_STROKES` of its own 39px
 * stroke, both scale with the logo width, and `gapGrowth` is exactly 1 there.
 * `tests/unit/aperture.test.ts` asserts the identity at every viewport.
 *
 * THE FLOOR IS GEOMETRY, NOT TASTE. `computeFramePath` puts a corner arc of
 * radius `rr` at the bottom-right, and both terminals must land on the straight
 * runs BEFORE it — otherwise the path doubles back on itself, the fill folds
 * into a sliver, and `frameOpenFraction`'s perimeter walk (which assumes the
 * terminals are on the straight parts) silently returns a dash that misses the
 * caps. Half a stroke past `rr` keeps the round cap itself clear of the arc too.
 * The floor binds at phone widths, where the frame keeps its absolute 20px
 * radius while the stroke drops to ~6px.
 */
export function gapFor(box: Box, strokeWidth: number): GapProfile {
  const rr = Math.min(box.r, box.w / 2, box.h / 2);
  const floor = rr + strokeWidth / 2;
  const grow = gapGrowth(box, strokeWidth);
  return {
    bar: 1 - Math.max(floor, GAP_BAR_STROKES * strokeWidth * grow) / box.w,
    stub: 1 - Math.max(floor, GAP_STUB_STROKES * strokeWidth * grow) / box.h,
  };
}

/**
 * The design frame's gap profile at a viewport — the one the aperture FREEZES.
 *
 * The dolly is a homothety, so it scales the box but must not re-derive the
 * profile as it goes: a notch that stayed the same absolute size while the box
 * grew 30x would be a fraction that shrank every frame, which would walk the gap
 * point toward the corner and destroy the fixed point the whole segment rests
 * on. The aperture computes this once from the REST frame and uses it for every
 * box in the move.
 */
export function restGapProfile(vw: number, vh: number): GapProfile {
  return gapFor(computeFrameGeometry(vw, vh), computeLogoGeometry(vw, vh).strokeWidth);
}

/**
 * Fraction of the path drawn for the OPEN Q; the remaining 10.6% is the gap the
 * mouse occupies. Measured in-browser via getTotalLength on the exact path
 * (full 1402.83 units, open terminal at 1254.12) rather than estimated.
 * With pathLength normalised to 100, the open Q is stroke-dasharray "89.4 10.6".
 */
export const FRAME_OPEN_FRACTION = 0.894;

/**
 * The open fraction for an ARBITRARY box, derived from the path rather than
 * measured.
 *
 * `FRAME_OPEN_FRACTION` was measured on the bowl, which is 1.452:1. The design
 * frame is 1.600:1 at desktop and further off at other viewports, so 89.4 does
 * not land on the two round caps there. That would not have mattered when the
 * gap was a transient the expansion swept shut in 50vh — but the gap is now held
 * open at every beat, across an expansion that stretches the aspect the whole
 * way, so the caps have to be where the gap says they are at every box in
 * between, not only at the two ends.
 *
 * Both quantities fall out of `computeFramePath`'s eleven segments. Walking it:
 * two full widths, two full heights, eight radius-shortenings at the corners,
 * and four quarter-arcs.
 *
 *   perimeter = 2w + 2h + rr(2pi - 8)
 *
 * The gap is the last three segments — the bottom run past the bar terminal, the
 * bottom-right arc, and the closing edge up to the stub terminal:
 *
 *   gap = w(1 - BAR) + h(1 - STUB) + rr(pi/2 - 2)
 *
 * Checked against the browser: at the bowl this gives a perimeter of 1402.814
 * against the 1402.83 measured by `getTotalLength`, and an open fraction of
 * 0.89400 against the measured 0.894. The formula is the measurement.
 */
export function frameOpenFraction(box: Box, gap: GapProfile = LOGO_GAP): number {
  const { w, h, r } = box;
  const rr = Math.min(r, w / 2, h / 2); // the same clamp computeFramePath applies
  const perimeter = 2 * w + 2 * h + rr * (2 * Math.PI - 8);
  const opening = w * (1 - gap.bar) + h * (1 - gap.stub) + rr * (Math.PI / 2 - 2);
  return 1 - opening / perimeter;
}

/**
 * The centre of the Q's opening: the midpoint of the two round caps that bound
 * it — the bar terminal on the bottom edge and the stub terminal on the right.
 *
 * This is the point the camera flies through, so it is also the centre of the
 * aperture homothety (see `computeApertureGeometry`).
 */
export function frameGapPoint(box: Box, gap: GapProfile = LOGO_GAP): { x: number; y: number } {
  return {
    x: box.x + (box.w * (1 + gap.bar)) / 2,
    y: box.y + (box.h * (1 + gap.stub)) / 2,
  };
}

/**
 * How much past the viewport the aperture opens, and the bounds on it.
 *
 * The margin buys headroom past bare coverage so the stroke is clearly outside
 * the frame rather than sitting on its edge at the moment the ink takes over.
 * The clamp is a guard, not a tuning knob: the computed scale is ~3.2 at
 * desktop and ~1.6 at phone widths, and a scale below 2 would not read as
 * passing THROUGH anything.
 */
const APERTURE_MARGIN = 1.18;
export const APERTURE_SCALE_MIN = 2;
/**
 * Raised from 8 when the notch became stroke-relative, and it is not a tuning
 * change — it is the arithmetic moving.
 *
 * The dolly is a homothety about the gap point, so the scale needed to push the
 * frame's far edge out to the viewport is set by how close the gap point starts
 * to the NEAR edge. With a notch proportional to the box, the gap point sat ~100
 * px inside the right edge at 1440 and 3.2x covered the screen. With a ~28px
 * notch it sits ~14px inside, and the same coverage costs 19x. At 3440x1440 —
 * widest frame, and a notch that has stopped growing with it — it costs 37.5x.
 *
 * So the ceiling has to clear the real requirement at every viewport or the
 * clamp silently under-covers and the ink handoff shows a band of page in the
 * corner. 64 is a guard against a degenerate box, not a knob:
 * `tests/unit/aperture.test.ts` asserts the clamp never actually binds.
 */
export const APERTURE_SCALE_MAX = 64;

/**
 * The scale at which the frame's interior first covers the whole viewport,
 * measured about the gap point, times the margin.
 *
 * All four edges are checked independently because the gap is nowhere near the
 * box's centre — it sits at the bottom-right — so the frame reaches the top-left
 * of the viewport in a fraction of the scale it needs to clear the bottom-right.
 * Taking the max is what guarantees no edge is left uncovered.
 */
function apertureCoverScale(box: Box, vw: number, vh: number, gap: GapProfile): number {
  const g = frameGapPoint(box, gap);
  return Math.max(
    g.x / (g.x - box.x), // left edge reaches 0
    g.y / (g.y - box.y), // top edge reaches 0
    (vw - g.x) / (box.x + box.w - g.x), // right edge reaches vw
    (vh - g.y) / (box.y + box.h - g.y), // bottom edge reaches vh
  );
}

export function apertureScale(
  box: Box,
  vw: number,
  vh: number,
  margin = APERTURE_MARGIN,
  gap: GapProfile = LOGO_GAP,
): number {
  const k = apertureCoverScale(box, vw, vh, gap) * margin;
  return Math.min(APERTURE_SCALE_MAX, Math.max(APERTURE_SCALE_MIN, k));
}

/**
 * The oversized box the dolly lerps TOWARDS — a homothety of the design frame
 * about its gap point.
 *
 * The choice of centre is the whole trick, and it is why this is not simply
 * "the same box, scaled up about its middle". Because every component is a
 * homothety about `g`, `lerpBox(rest, aperture, t)` is ALSO a homothety about
 * `g` at every t:
 *
 *   x(t) = g.x - k(t)(g.x - rest.x)      w(t) = rest.w * k(t)
 *   where k(t) = 1 + t(K - 1)
 *
 * so `frameGapPoint(lerpBox(rest, aperture, t))` is the same point for every t,
 * to the last floating-point bit (asserted in tests/unit/aperture.test.ts).
 *
 * That fixed point is what makes the move read as a camera flying through an
 * opening rather than a rectangle growing: the thing you are aiming at does not
 * drift by a pixel while you approach it. Scaling about the box centre instead
 * would slide the gap across the screen throughout the dolly, and no amount of
 * easing recovers that.
 *
 * `r` scales with the box, unlike the rest frame's absolute `FRAME_RADIUS` — a
 * corner that stays 20px while the box triples would visibly sharpen as it
 * passes the camera, and it would break the homothety.
 */
export function computeApertureGeometry(vw: number, vh: number): Box {
  const rest = computeFrameGeometry(vw, vh);
  const gap = restGapProfile(vw, vh);
  const g = frameGapPoint(rest, gap);
  const k = apertureScale(rest, vw, vh, APERTURE_MARGIN, gap);
  return {
    x: g.x - k * (g.x - rest.x),
    y: g.y - k * (g.y - rest.y),
    w: rest.w * k,
    h: rest.h * k,
    r: rest.r * k,
  };
}

/**
 * How covered the viewport is at position `t` through the dolly: 1.0 is the
 * instant the frame's interior first fills it completely, above 1 is past that.
 *
 * Exists so the ink handoff can be proven safe rather than eyeballed — swapping
 * the frame's fill for the ink field one frame before full coverage would show a
 * band of page through the corner.
 */
/**
 * The growth trajectory, in a normalised 0..1 box (SVG convention: y grows
 * downward, so the climb runs from y≈1 to y≈0).
 *
 * Authored once, here, because two things read it: the scrubbed launch timeline
 * and the unit-test stage mount (`tests/unit/helpers/stage.ts`), which builds
 * the real timeline against it. The static path no longer draws a miniature of
 * this figure — see the note in `components/launch/LaunchStatic.tsx`.
 *
 * The shape is a real launch, exactly as the client directed: the pad at
 * BOTTOM CENTRE and a DEAD STRAIGHT vertical ascent out the top of the frame.
 * No arc, no sway — the route is a plumb line. The "growth is not a straight
 * line" beat lives entirely in TIME and LIGHT now, not in geometry: the
 * vehicle slows to a near-stall (`LEGS`), the exhaust dies and relights
 * (`launchExhaust`), the drawn route stops and catches up (`launchDraw`), and
 * the failure props burn away (`launchDebris`). The client's note — "some of
 * the props look like failure, losses... it's identify the Growth if you work
 * with Qavyx" — is carried by the props, not by bending the flight path.
 *
 * Two coupled tables follow the route. On a straight line the arc-length
 * fraction IS the y fraction: at = (0.97 − y) / 0.94. The vehicle's stall
 * (from `LEGS`) spans arc 0.50 to 0.56 in path terms.
 */
const TRAJECTORY = [
  'M0.50,0.97',
  'C0.50,0.89 0.50,0.81 0.50,0.73', // liftoff
  'C0.50,0.65 0.50,0.57 0.50,0.49', // climb
  'C0.50,0.41 0.50,0.37 0.50,0.33', // the stall stretch — slow, dark, held
  'C0.50,0.29 0.50,0.25 0.50,0.17', // recovery
  'C0.50,0.12 0.50,0.075 0.50,0.03', // escape — out the top
].join(' ');

/**
 * Where the route begins, normalised: bottom centre, the pad.
 *
 * Parsed from `TRAJECTORY`'s own move-to rather than typed, because two things
 * need it — the path and the pad the vehicle stands on — and a typed second
 * copy is how the pad ended up drawn in the bottom-left corner when the route
 * moved to centre.
 */
export const TRAJECTORY_START: readonly [x: number, y: number] = (() => {
  const m = /^M([\d.]+),([\d.]+)/.exec(TRAJECTORY);
  return [Number(m![1]), Number(m![2])] as const;
})();

/**
 * Normalised positions of the three waypoints, at the joins between legs — so
 * a marker sits exactly ON the route. Strategy caps the liftoff, Execution
 * caps the climb, Automation caps the recovery.
 *
 * NOTHING RENDERS THESE ANY MORE. The three dots that lit in order as the
 * vehicle passed them were removed on the client's direction ("THE CIRCLE NOT
 * NEED I MEEN THE DOT"), in the same session as the drawn route — and the two
 * were one device: three green rings hanging in black with no line through them
 * are not waypoints. `components/hero/LaunchLayer.tsx` carries the full note at
 * their old site, and `launchWaypointOpacity` is gone from the timeline.
 *
 * THE TABLE STAYS, and deliberately, for two reasons. It is the ROUTE's own
 * record of where §7's three growth stages fall on it — a content relationship
 * `tests/unit/launch-content.test.ts` still asserts (three waypoints for three
 * `GROWTH_STAGES`, in order up the climb) and one only the client can retire.
 * And this project's client has reversed a launch decision twice; these are
 * arc-length fractions recomputed numerically when the route became a plumb
 * line, and eyeballing them back would silently put a marker off its own leg.
 *
 * It is imported by tests only. If you are adding something that reads it,
 * you are probably putting the dots back — check that is what was asked.
 */
export const TRAJECTORY_WAYPOINTS = [
  { x: 0.5, y: 0.73, at: 0.255 },
  { x: 0.5, y: 0.49, at: 0.511 },
  { x: 0.5, y: 0.17, at: 0.851 },
] as const;

/**
 * Normalised positions where the four failure props leave the vehicle, and the
 * direction each is thrown — off both sides of the vertical climb. All four
 * detach before the stall (arc 0.50) — they are what the climb sheds, not
 * what the stall causes. `x`/`y` are the on-route points at each `at`, kept
 * for reference; the runtime rides the path itself.
 */
export const TRAJECTORY_DEBRIS = [
  { at: 0.18, x: 0.5, y: 0.801, dx: -0.15, dy: 0.07 },
  { at: 0.27, x: 0.5, y: 0.716, dx: 0.15, dy: 0.06 },
  { at: 0.36, x: 0.5, y: 0.632, dx: -0.13, dy: 0.08 },
  { at: 0.45, x: 0.5, y: 0.547, dx: 0.14, dy: 0.07 },
] as const;

/** The trajectory scaled into a `w` x `h` box. */
export function computeTrajectoryPath(w: number, h: number): string {
  return TRAJECTORY.replace(
    /(\d*\.?\d+),(\d*\.?\d+)/g,
    (_m, x: string, y: string) => `${round(Number(x) * w)},${round(Number(y) * h)}`,
  );
}

/**
 * The box the trajectory is drawn into: the viewport, inset by a margin, so the
 * climb reads across the whole field rather than in a box in the middle of it.
 *
 * Authored here because TWO layers have to agree on it — `LaunchLayer` draws
 * the route inside it, and `LaunchBeats` positions the growth-stage labels
 * against the same waypoints. When each computed its own inset the labels sat
 * a few pixels off the dots they name, and only at some viewport sizes.
 */
export function trajectoryBox(vw: number, vh: number): { pad: number; w: number; h: number } {
  const pad = Math.min(vw, vh) * 0.1;
  return { pad, w: vw - pad * 2, h: vh - pad * 2 };
}

export function apertureCoverage(vw: number, vh: number, t: number): number {
  const rest = computeFrameGeometry(vw, vh);
  const gap = restGapProfile(vw, vh);
  const k = 1 + t * (apertureScale(rest, vw, vh, APERTURE_MARGIN, gap) - 1);
  // Measured against the BARE requirement, not the clamped-and-margined scale:
  // the clamp is a guard on how far we travel, not on how far we must travel,
  // and dividing by it would report coverage the geometry has not reached.
  return k / apertureCoverScale(rest, vw, vh, gap);
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Rounded-rect / capsule path used for BOTH ends of the dot -> mouse morph.
 *
 * MorphSVG interpolates path data segment by segment. If the two shapes differ
 * in segment count or winding direction the interpolation goes through a
 * crumpled intermediate — the single highest-risk failure in this project. The
 * defence is to generate both shapes from this one function, so they are
 * structurally identical by construction and cannot drift:
 *
 *   dot   = capsulePath(cx, cy, 12, 12, 6,  0)   w == h == 2r, a circle
 *   mouse = capsulePath(cx, cy, 52, 78, 26, 46)  a rotated capsule
 *
 * Both emit M + (L,A)x4 + Z. For the circle the straight segments are
 * zero-length, which is exactly what keeps the counts matched.
 *
 * Rotation is BAKED INTO THE COORDINATES rather than applied as a transform
 * attribute: MorphSVG ignores transforms, so a transformed target snaps to its
 * untransformed position on the first frame. Corner arcs stay circular
 * (rx == ry), so only their endpoints need rotating.
 *
 * AXIS CONVENTION: local +x maps to (cos, sin) — the ROTATION DIRECTION. So `w`
 * is the extent ALONG `rotationDeg` and `h` the extent across it. At rotation 0
 * they are the ordinary width and height; at 46° they are not, and swapping
 * them silently builds the shape square-on to its intended axis.
 */
export function capsulePath(
  cx: number,
  cy: number,
  w: number,
  h: number,
  r: number,
  rotationDeg = 0,
): string {
  const rr = Math.min(r, w / 2, h / 2);
  const hw = w / 2;
  const hh = h / 2;
  const t = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(t);
  const sin = Math.sin(t);
  const p = (dx: number, dy: number): [number, number] => [
    round(cx + dx * cos - dy * sin),
    round(cy + dx * sin + dy * cos),
  ];

  const a = p(-hw + rr, -hh);
  const b = p(hw - rr, -hh);
  const c = p(hw, -hh + rr);
  const d = p(hw, hh - rr);
  const e = p(hw - rr, hh);
  const f = p(-hw + rr, hh);
  const g = p(-hw, hh - rr);
  const i = p(-hw, -hh + rr);

  return [
    `M${a[0]},${a[1]}`,
    `L${b[0]},${b[1]}`,
    `A${round(rr)},${round(rr)} 0 0 1 ${c[0]},${c[1]}`,
    `L${d[0]},${d[1]}`,
    `A${round(rr)},${round(rr)} 0 0 1 ${e[0]},${e[1]}`,
    `L${f[0]},${f[1]}`,
    `A${round(rr)},${round(rr)} 0 0 1 ${g[0]},${g[1]}`,
    `L${i[0]},${i[1]}`,
    `A${round(rr)},${round(rr)} 0 0 1 ${a[0]},${a[1]}`,
    'Z',
  ].join(' ');
}

/** Radius of the resting dot, in stage pixels. */
export const DOT_RADIUS = 6;

/**
 * The mouse glyph, measured from `assets/Fav-Icon-White-PNG.png` (4167², the
 * largest source we have of it) by connected-component analysis — the same
 * method as the Q bowl. It replaces the Phase-5 placeholder, which rendered two
 * green blobs and a stray button.
 *
 * WHAT THE GLYPH ACTUALLY IS — a mouse seen at the mark's 40.5° angle:
 *
 *        ╭╮                cord: a round-capped stroke, 44px wide, 116 long,
 *       ╱ ╱                running up-left out of the body's back
 *      ╱ ╱
 *     ╭─╯──────╮           body: 179 × 309, ink WHITE (it is the mark's ink,
 *     │        ╰─╮               not the accent) — the dot's green migrates
 *     │  ▁▁▁▁▁▁╮ │               to the tip when the dot becomes the mouse
 *     ╰─╯▓▓▓▓▓▓│ │
 *        ╰▓▓▓▓▓╯╯          tip: the GREEN crescent past the body's far end,
 *                               cut by a circle of r 107.3 centred all but
 *                               dead-on the body's centre. Not a dot: the
 *                               curved white/green seam is the glyph's tell.
 *
 * Fractions below are of `mouseAnchor.size` = the glyph's overall length along
 * its axis (426 source px). Favicon px → logo px is ×0.27593, from the bowl's
 * outer width (1678 favicon px ↔ 463 logo px), so these sit in the same
 * measured basis as every other constant in this file.
 */
export const MOUSE = {
  /**
   * Body: a stadium (bodyR === bodyAcross/2). Named for the AXIS each one lies
   * on, not w/h, because capsulePath's `w` is its extent ALONG the rotation
   * direction and `h` the extent ACROSS it — passing them the intuitive way
   * round builds the body turned 90° from its own long axis, which reads as a
   * stubby blob and puts the tip's seam somewhere it was never measured.
   */
  bodyAlong: 85.26 / 117.6,
  bodyAcross: 49.39 / 117.6,
  bodyR: 24.7 / 117.6,
  /**
   * The circle that cuts the green tip off the body's far end, as an offset
   * from the body centre ALONG (t) and ACROSS (a) the axis, plus its radius.
   * It is larger than the body's half-width, so it crosses the body's sides —
   * which is what makes the seam a crescent rather than a straight cut.
   */
  tipCutT: -10.21 / 117.6,
  tipCutA: 0.69 / 117.6,
  tipCutR: 29.61 / 117.6,
  /** Cord centreline, as offsets from the body centre, and its stroke width. */
  cordFrom: { x: -51.89 / 117.6, y: -45.04 / 117.6 },
  cordTo: { x: -32.18 / 117.6, y: -28.18 / 117.6 },
  cordW: 12.14 / 117.6,
  /** Measured long-axis angle of the glyph in the source mark. */
  angleDeg: 40.5,
  /**
   * The LEFT BUTTON, as a rectangle in the glyph's own axis frame: `T` along the
   * axis (negative is the cord end, where a real mouse's buttons are), `A`
   * across it (positive is the glyph's left, taking the cord end as its front).
   *
   * Unlike everything else in MOUSE these are DERIVED, not measured. The source
   * mark is a bare capsule — it has no buttons — so the click affordance the TDD
   * asks for (§3.5) has to be constructed on top of it. It is a CLIP on the
   * body's own path rather than a shape of its own: that way the button's outer
   * edge IS the body's rounded outline, at every viewport size, instead of a
   * rounded rect with its own radii that drifts off the silhouette.
   *
   * `fromT` and `toA` overshoot the body deliberately, so the body's own end cap
   * and side are what trim the button. `fromA` does not start at 0: the strip of
   * white body it leaves is the seam between the two buttons, and it is what
   * makes the shape read as the LEFT button rather than as half a mouse. It has
   * to survive at the glyph's SMALLEST — 0.05 is ~1px on a phone, ~2px on a wide
   * desktop; at the 0.02 it started at the seam disappeared and the button read
   * as a green wedge painted onto the body.
   * `toT` runs the button back to just short of the body's centre, making it
   * ~45% of the body's length — the proportion a mouse button actually has.
   * Stopping much shorter (the -0.08 it started at) left a shape the rounded end
   * cap ate most of, and what survived read as a wedge painted on the flank.
   *
   * What caps it is the green tip, and the number that binds is the seam's reach
   * on the FLANK, not on the axis: the tip's cut circle bows back toward the cord
   * at the body's edges, so on the +across side the green already starts at
   * ~0.05 — a third of the ~0.165 it reaches on the centreline. Sizing the button
   * against the axis figure closes the gap to about a pixel and the two greens
   * read as one blob interrupted by a white stripe.
   */
  button: { fromT: -0.44, toT: -0.04, fromA: 0.05, toA: 0.32 },
  /**
   * The click ripple's radii, concentric with the body. `from` is inside the
   * body's half-width, so a ring is hidden under the glyph when it starts and
   * appears to come out from under it; `to` clears the body's whole length, so
   * it reads as leaving rather than as a halo. `toFast` is the further, faster
   * ring the real click fires.
   *
   * These are radii the ripple ANIMATES BETWEEN, not a scale factor, and that is
   * deliberate: a scaled circle is at the mercy of whatever origin GSAP resolves
   * for it (on an SVG element transformOrigin is measured against the BOUNDING
   * BOX, which for a growing ring changes every frame — the rings visibly
   * crawled away from the mouse). A circle animating its own `r` grows about its
   * centre by definition.
   */
  ringFrom: 0.12,
  ringTo: 0.78,
  ringToFast: 0.95,
} as const;

/**
 * The glyph's own axis frame. +along runs toward the green tip (down-right on
 * screen), +across is 90° from it, toward the glyph's left.
 *
 * Every mouse-glyph measurement above is expressed in this frame, so anything
 * placing one on the stage has to rotate through here — and getting that wrong
 * by a degree puts the feature visibly off the body (see mouseTipCut).
 */
export function glyphAxes(): {
  along: { x: number; y: number };
  across: { x: number; y: number };
} {
  const t = (MOUSE.angleDeg * Math.PI) / 180;
  return {
    along: { x: Math.cos(t), y: Math.sin(t) },
    across: { x: -Math.sin(t), y: Math.cos(t) },
  };
}

/**
 * The left button's clip rectangle as a path, for a glyph centred at `centre`.
 * Clip the BODY with this and what is left is the button — see MOUSE.button.
 */
export function mouseButtonClip(centre: { x: number; y: number; size: number }): string {
  const { along, across } = glyphAxes();
  const s = centre.size;
  const b = MOUSE.button;
  const at = (t: number, a: number) =>
    `${round(centre.x + (t * along.x + a * across.x) * s)},${round(
      centre.y + (t * along.y + a * across.y) * s,
    )}`;
  return [
    `M${at(b.fromT, b.fromA)}`,
    `L${at(b.toT, b.fromA)}`,
    `L${at(b.toT, b.toA)}`,
    `L${at(b.fromT, b.toA)}`,
    'Z',
  ].join(' ');
}

/**
 * The tip's cut circle in stage pixels, given the glyph's anchor. Lives here
 * rather than in the component because the offsets are measured along the
 * glyph's axis, so turning them into stage coordinates needs the same rotation
 * the body path uses — and getting that wrong by a degree puts the seam in the
 * wrong place at every viewport size.
 */
export function mouseTipCut(anchor: { x: number; y: number; size: number }): {
  cx: number;
  cy: number;
  r: number;
} {
  const s = anchor.size;
  // +t is along the axis (down-right), +a is across it (down-left).
  const { along, across } = glyphAxes();
  return {
    cx: anchor.x + MOUSE.tipCutT * s * along.x + MOUSE.tipCutA * s * across.x,
    cy: anchor.y + MOUSE.tipCutT * s * along.y + MOUSE.tipCutA * s * across.y,
    r: MOUSE.tipCutR * s,
  };
}

/**
 * The clip that cuts the GREEN TIP off the mouse body's far end, as a path.
 *
 * The seam is a circle centred all but dead-on the body's centre and wider than
 * the body, so the arc it cuts spans the full width and bows back toward the
 * cord. The green is the body BEYOND that arc — the FAR side only. Subtracting
 * the whole disc instead would leave the body's back end green too, i.e. a ring.
 *
 * So the clip is the half-plane past the seam with a semicircular bite out of
 * its near edge: out to `-box` across, in to the arc, around it, back out.
 * Everything is built in the glyph's own axis frame, because the seam is
 * measured along that axis and a degree of error puts it visibly off-centre.
 *
 * IT LIVES HERE, not in the component, for the reason `mouseTipCut` does — and
 * as of the static mark there are two callers. `CursorNode` draws the animated
 * glyph, `NavLogo` draws the landed one in the footer and the static hero; a
 * copy of this in each is how the brand mark's tip drifts between the animation
 * and the logo, which is precisely the difference nobody would notice until a
 * client did.
 */
export function mouseSeamPath(centre: { x: number; y: number; size: number }): string {
  const { along, across } = glyphAxes();
  const cut = mouseTipCut(centre);
  // Far enough past the glyph in every direction that the clip's straight edges
  // never trim the body — only the arc is meant to.
  const box = 4 * centre.size;
  const at = (t: number, a: number) =>
    `${round(cut.cx + t * along.x + a * across.x)},${round(
      cut.cy + t * along.y + a * across.y,
    )}`;
  const r = round(cut.r);
  return [
    `M${at(0, -box)}`,
    `L${at(0, -cut.r)}`,
    // Two quarter-turns rather than one 180° arc: a half-circle leaves the
    // large-arc flag ambiguous, and the wrong pick mirrors the seam.
    `A${r},${r} 0 0 1 ${at(cut.r, 0)}`,
    `A${r},${r} 0 0 1 ${at(0, cut.r)}`,
    `L${at(0, box)}`,
    `L${at(box, box)}`,
    `L${at(box, -box)}`,
    'Z',
  ].join(' ');
}

/**
 * The mouse's cord centreline, as a two-point path, for a glyph centred at
 * `centre`. Same reason as the seam: two callers, one set of measured offsets.
 */
export function mouseCordPath(centre: { x: number; y: number; size: number }): string {
  const s = centre.size;
  return (
    `M${round(centre.x + MOUSE.cordFrom.x * s)},${round(centre.y + MOUSE.cordFrom.y * s)} ` +
    `L${round(centre.x + MOUSE.cordTo.x * s)},${round(centre.y + MOUSE.cordTo.y * s)}`
  );
}

/**
 * The mouse BODY as a path, for a glyph centred at `centre`.
 *
 * A stadium on the glyph's measured 40.5° axis. `bodyAlong` is its extent ALONG
 * that axis and `bodyAcross` the extent across it — passing them to capsulePath
 * the intuitive way round builds the body turned 90° from its own long axis,
 * which reads as a stubby blob and puts the seam somewhere it was never
 * measured. Wrapping the call here is what stops that argument order being
 * got right in one file and wrong in the other.
 */
export function mouseBodyPath(centre: { x: number; y: number; size: number }): string {
  const s = centre.size;
  return capsulePath(
    centre.x,
    centre.y,
    MOUSE.bodyAlong * s,
    MOUSE.bodyAcross * s,
    MOUSE.bodyR * s,
    MOUSE.angleDeg,
  );
}

/**
 * MotionPath for the cursor's flight from wherever the pointer is to the gap in
 * the Q. A single quadratic whose control point is lifted above the chord, so
 * the icon arcs in rather than sliding — the arc reads as "placed", the straight
 * line reads as "snapped".
 */
export function computeTravelPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
): string {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const lift = Math.min(180, Math.hypot(to.x - from.x, to.y - from.y) * 0.28);
  return `M${round(from.x)},${round(from.y)} Q${round(midX)},${round(midY - lift)} ${round(to.x)},${round(to.y)}`;
}

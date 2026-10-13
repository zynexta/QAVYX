import { computeFramePath, type Box, type GapProfile } from '@/motion/geometry';

/**
 * The four imperative writes that drive #qx-frame, shared by the intro draw and
 * the scroll expansion so they can never disagree about how the element is
 * addressed.
 *
 * All of them are plain attribute writes rather than gsap tweens because they
 * are the OUTPUT of a tween's onUpdate (a proxy value being turned into an SVG
 * attribute). Keeping them here means neither the open-Q draw nor the expansion
 * re-implements the dash formula, the path regeneration, or the colour ramps.
 *
 * They write PRESENTATION ATTRIBUTES, never inline styles. That matters for the
 * reversal: at proxy value 0 each one restores exactly the string React rendered
 * (`fill="none"`, `stroke="var(--qx-white)"`), so scrolling back up leaves no
 * residue and a later React re-render is a no-op rather than a visible flip.
 */

/**
 * Show the first `draw`% of the frame path. `#qx-frame` sets pathLength={100},
 * so the dash values are viewport-independent: "89.4 10.6" is the open Q at any
 * box size, "100 ~0" is the closed frame. The tiny second dash avoids a
 * zero-length gap when draw === 100.
 */
export function setFrameDraw(frame: SVGPathElement, draw: number): void {
  frame.setAttribute('stroke-dasharray', `${draw} ${100 - draw + 0.001}`);
}

/**
 * Rewrite the frame's geometry by regenerating its `d`. NEVER scale — a scale
 * transform multiplies the stroke width (~6x across this expansion) and distorts
 * the corner radius. Regenerating `d` keeps the stroke width constant at every
 * size, which is the whole reason the frame is an SVG path.
 */
export function setFrameBox(frame: SVGPathElement, box: Box, gap?: GapProfile): void {
  frame.setAttribute('d', computeFramePath(box, gap));
}

/**
 * Frame stroke at rest and once it is the workspace frame.
 *
 * TDD §7 row 16 ramps `--qx-line` → `--qx-green-dim`, but `--qx-line` assumed a
 * frame that is invisible until scroll. It is not: the same path IS the Q of the
 * logo through the whole of Engine 1, so at rest it must be the wordmark's white
 * (see BUILD-PLAN "Corrections to the TDD from the real brand assets"). The
 * INTENT of the row survives unchanged — the mark's white de-emphasises into the
 * dim green of a guide as the frame stops being a logo and becomes a container.
 *
 * `QFrame` renders REST, so React and the timeline cannot drift.
 */
export const FRAME_STROKE_REST = 'var(--qx-white)';
export const FRAME_STROKE_ACTIVE = 'var(--qx-green-dim)';
/** Frame interior, filled only from p 0.10 (TDD §7 row 18). */
export const FRAME_FILL = 'var(--qx-ink)';

/**
 * The same two colours resolved, because `var()` cannot be interpolated. Only
 * the in-between frames use these; both endpoints are written back as the token
 * strings above, so the resting and final frames still re-theme with the token.
 * `tests/unit/frame-path.test.ts` reads styles/tokens.css and fails if these
 * literals drift from it.
 */
const REST_HEX = '#f2f5f3'; // --qx-white
const ACTIVE_HEX = '#1a7a0e'; // --qx-green-dim

/**
 * Stroke colour across `frame-scale`, driven by a 0..1 proxy (TDD §7 row 16,
 * p 0.02 → 0.06).
 */
export function setFrameStroke(frame: SVGPathElement, t: number): void {
  if (t <= 0) return void frame.setAttribute('stroke', FRAME_STROKE_REST);
  if (t >= 1) return void frame.setAttribute('stroke', FRAME_STROKE_ACTIVE);
  frame.setAttribute('stroke', mixHex(REST_HEX, ACTIVE_HEX, t));
}

/**
 * Interior fill across `frame-expand`, driven by a 0..1 proxy (TDD §7 row 18,
 * p 0.10 → 0.14).
 *
 * The fill is genuinely ABSENT below t=0, not merely transparent: this is the
 * most expensive moment in the experience (§12 budget 8ms/frame) and a filled
 * full-viewport path costs materially more to repaint than a stroked one, so the
 * first 60% of the expansion must not pay for it.
 */
export function setFrameFill(frame: SVGPathElement, t: number): void {
  if (t <= 0) {
    frame.setAttribute('fill', 'none');
    frame.removeAttribute('fill-opacity');
    return;
  }
  frame.setAttribute('fill', FRAME_FILL);
  frame.setAttribute('fill-opacity', String(t >= 1 ? 1 : Math.round(t * 1000) / 1000));
}

/**
 * Whether the frame's STROKE is painted at all.
 *
 * THE FRAME DOES NOT LEAVE THE SCREEN, IT ONLY GETS BIG — and that is why this
 * exists. The aperture is a homothety about the gap point, which sits near the
 * box's bottom-right, so the top and left edges fly off at speed while the
 * bottom-right corner barely moves. Measured at the end of the dolly, the
 * bottom edge parks just below the fold: 14px clear at 360x740, 20px at 390x844,
 * 22px at 430x932. On a phone the VISIBLE viewport then grows by 60-100px the
 * moment the URL bar hides — and `motionViewport()` deliberately filters that
 * change, so the geometry stays computed against the small viewport while the
 * screen gets taller. The parked edge lands back inside it as a green line
 * across the bottom, and because nothing ever cleared it, it stayed there for
 * the whole rest of the document. Reported as the frame's bottom line being
 * "stuck, not going fully".
 *
 * Raising `APERTURE_MARGIN` would only move the number the URL bar has to beat.
 * The honest fix is that the frame has a LAST MOMENT: once the camera is through
 * it and `#qx-ink-field` owns the surface, there is nothing left for the stroke
 * to say. `setFrameFill` already stands down at exactly that point; this is its
 * missing other half.
 *
 * Written as a presentation attribute and REMOVED at 1 rather than set to "1",
 * so the resting element is byte-identical to what React rendered — the same
 * no-residue contract the rest of this file keeps.
 */
export function setFrameStrokeOpacity(frame: SVGPathElement, o: number): void {
  if (o >= 1) return void frame.removeAttribute('stroke-opacity');
  frame.setAttribute('stroke-opacity', String(o <= 0 ? 0 : Math.round(o * 1000) / 1000));
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

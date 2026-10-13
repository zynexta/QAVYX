import { useRef } from 'react';
import { computeFramePath, type Box } from '@/motion/geometry';
import { FRAME_STROKE_REST } from '@/motion/timelines/frameOps';

/**
 * The Q's bowl — and later the design frame, and later the navbar logo.
 *
 * ONE element for all three states. It is a <path>, not a <rect>, for two
 * reasons: DrawSVG cannot draw a <rect>, and the expansion animates the `d`
 * attribute rather than applying a scale transform. Scaling would multiply the
 * stroke width by ~6x during the expansion and distort the corner radius; an
 * attribute tween keeps a constant stroke at every size, which is the whole
 * reason the frame lives in SVG rather than being a div with a border.
 *
 * THE Q IS OPEN AT THE BOTTOM-RIGHT, AT EVERY SIZE AND EVERY BEAT. The real
 * mark (see assets/Fav Icon) has no corner there: the right stroke ends in a
 * round cap ~75% down, the bottom stroke ends in a round cap ~80% across, and
 * the mouse sits in the gap between them. The path is generated so the LAST
 * ~10.5% of its length is exactly that gap, and `pathLength={100}` + a dash
 * renders only the first `draw`%:
 *
 *   draw = 89.4  -> open Q (the brand mark, at any box size)
 *   draw = 100   -> closed rectangle — NOT USED; see below
 *
 * Engine 2 used to animate `draw` 89.4 -> 100 as the mouse left, closing the gap
 * into a clean rectangle for the carousel, and the aperture cut it back open at
 * the end. It does not any more: the expanded workspace is still the Q, so the
 * frame carries the brand at its largest instead of losing it there, and the
 * camera flies out through an opening that never went away.
 *
 * The dash is therefore not a constant 89.4 either. Because the expansion
 * stretches the box from the bowl's 1.452:1 to the design frame's 1.600:1, the
 * caller recomputes the open fraction from the CURRENT box every frame
 * (`frameOpenFraction`) so both round caps stay on their terminals throughout.
 */

interface QFrameProps {
  box: Box;
  strokeWidth: number;
  /**
   * Percent of the path to show, 0-100. Pass a number for a STATIC render (the
   * lab, reduced-motion): React owns the dash. Omit it when a timeline drives
   * the draw (Engine 1/2): GSAP owns `stroke-dasharray` and React must not set
   * it, or a re-render (e.g. on resize) would clobber the animated value.
   */
  draw?: number;
  /**
   * True only while the pinned timeline is ACTIVELY LERPING the frame (the
   * frame-scale / frame-expand beats). React then freezes `d` so a resize
   * re-render can't fight the in-flight tween — the same reason `draw` is omitted
   * so GSAP owns the dash. In every other beat `d` is a pure function of the
   * viewport (bowl at rest/intro, the expanded design frame through services),
   * so React owns it and re-fits it on a live resize; the caller passes the box
   * that matches the beat.
   */
  frozen?: boolean;
}

export function QFrame({ box, strokeWidth, draw, frozen }: QFrameProps) {
  // Hold the last React-owned path. While `frozen`, keep rendering it unchanged
  // so React writes no new `d` and GSAP's expanded value stands.
  const dRef = useRef<string>('');
  if (!frozen) dRef.current = computeFramePath(box);
  const d = dRef.current || computeFramePath(box);

  return (
    <path
      id="qx-frame"
      d={d}
      pathLength={100}
      // Both of these are the exact strings frameOps writes back at proxy value
      // 0, so a reversed expansion and a React re-render agree byte for byte.
      // The interior stays unfilled until p 0.10 of the pin — see setFrameFill.
      fill="none"
      stroke={FRAME_STROKE_REST}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      // Show the first `draw` units of the 100-unit path; hide the rest (the
      // gap). +0.001 avoids a zero-length second dash when draw === 100. Left
      // undefined when a timeline owns the dash.
      strokeDasharray={draw === undefined ? undefined : `${draw} ${100 - draw + 0.001}`}
    />
  );
}

import { WORDMARK_VIEWBOX } from '@/motion/geometry';

/**
 * A V Y X — the letterforms that sit to the right of the Q bowl.
 *
 * These are NOT text and NOT a typeface. They are the brand's custom
 * letterforms, traced as exact polygons from the source mark by
 * connected-component boundary tracing (all four are entirely straight-edged,
 * so a polygon is lossless rather than an approximation).
 *
 * Consequences worth knowing:
 *   - the logo has NO font dependency, so nothing needs to wait on
 *     document.fonts.ready before the construction beat can run
 *   - SplitText is not involved; the reveal is a per-glyph clip
 *   - accessibility comes from a visually-hidden <h1>Qavyx</h1>, not from here
 *
 * Coordinates are in source-pixel space (2255 x 357) so they can be re-verified
 * against assets/ directly. The geometry engine places the group.
 *
 * Vertex counts: A 8+3 (with counter), V 7, Y 9, X 12 — 39 total.
 */

export const GLYPHS = [
  {
    id: 'qx-glyph-a',
    d: 'M732,11 L782,13 L991,323 L940,323 L884,240 L627,240 L572,323 L521,323 Z M756,47 L865,212 L647,212 Z',
  },
  { id: 'qx-glyph-v', d: 'M888,11 L942,13 L1117,282 L1293,13 L1344,12 L1141,322 L1092,323 Z' },
  {
    id: 'qx-glyph-y',
    d: 'M1370,11 L1423,11 L1580,185 L1739,11 L1787,12 L1603,215 L1603,323 L1555,323 L1554,214 Z',
  },
  {
    id: 'qx-glyph-x',
    d: 'M1855,11 L1911,11 L2050,138 L2188,11 L2241,11 L2079,162 L2254,323 L2197,323 L2048,186 L1900,323 L1844,323 L2019,163 Z',
  },
] as const;

interface WordmarkProps {
  /** Placement from computeLogoGeometry().wordmark */
  x: number;
  y: number;
  scale: number;
}

export function Wordmark({ x, y, scale }: WordmarkProps) {
  return (
    <g
      id="qx-wordmark"
      transform={`translate(${x} ${y}) scale(${scale})`}
      fill="var(--qx-white)"
      // The A's counter must be a hole, not a filled triangle.
      fillRule="evenodd"
      data-viewbox={`${WORDMARK_VIEWBOX.w}x${WORDMARK_VIEWBOX.h}`}
    >
      {GLYPHS.map((g) => (
        <path key={g.id} id={g.id} className="qx-glyph" d={g.d} />
      ))}
    </g>
  );
}

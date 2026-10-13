import { GLYPHS } from '@/components/hero/Wordmark';
import {
  computeFramePath,
  computeLockupGeometry,
  frameOpenFraction,
  MOUSE,
  mouseBodyPath,
  mouseCordPath,
  mouseSeamPath,
  WORDMARK_VIEWBOX,
} from '@/motion/geometry';

/**
 * The QAVYX lockup as a static mark, for the navbar and the footer.
 *
 * A SERVER component, and separate from `QFrame`/`Wordmark` for a reason that is
 * easy to get wrong: `QFrame` holds a `useRef` so it can freeze `d` against the
 * pinned timeline, which makes it a client component and would pull the whole
 * hero's client boundary into the global shell — onto every route, in the
 * initial bundle, to draw a logo that never moves. This renders the same path
 * from the same geometry with no React state at all.
 *
 * The mark is authored in the wordmark's own 2255 x 357 source space, so the
 * `viewBox` IS the measurement and the element scales purely by CSS. Nothing
 * here knows a viewport.
 *
 * THE Q IS OPEN, here as everywhere. `frameOpenFraction` derives the dash from
 * this exact box rather than reusing the 89.4 constant — the two agree at the
 * bowl (that is what the constant was measured on), and deriving it means a
 * change to the bowl's ratios cannot leave the nav logo drawing a closed
 * rectangle while the hero draws a Q.
 *
 * ## THE MOUSE GLYPH IS PART OF THE MARK, and this used to leave it out
 *
 * The gap was rendered EMPTY, on the argument that "the hero's mouse glyph
 * completes the mark during the intro because the visitor's own pointer is the
 * thing that lands there; a decorative copy of it in the navbar would claim the
 * same meaning for a cursor that is somewhere else on the page."
 *
 * That argument is about the INTRO, and it does not survive contact with the
 * client's own artwork. `assets/Fav Icon Black- PNG.png` is two connected
 * components, not one: the bowl, and a mouse. So is the full lockup. The bowl on
 * its own is not a reduced version of the mark — it is a rounded rectangle with
 * a corner missing, which is what a visitor sees and reads as a rendering fault.
 * The mark is the bowl PLUS the mouse in its opening, at every size the client
 * has ever drawn it.
 *
 * The geometry was here the whole time and unused: `computeLockupGeometry`
 * already returns `mouseAnchor`, and `R.mouseX/mouseY/mouseSize` were measured
 * off that same favicon. Overlaying `computeFramePath`'s output on the asset
 * shows the bowl matching to the pixel at both round-cap terminals — the only
 * part of the artwork left uncovered was the mouse.
 *
 * WHITE BODY, GREEN TIP — not green all over. That is the hero's landed state
 * (`tlCursorMorph` fades the body to `--qx-white` as the green arrives at the
 * tip) and it is the client's own colouring. The body follows `currentColor`, so
 * the footer's `text-qx-white` and any future placement re-tint together; only
 * the tip is pinned to the brand green.
 *
 * NO CLICK AFFORDANCE, no ripple rings, no press. Those belong to the `click`
 * beat and are an instruction to a visitor, not part of the mark.
 */

interface NavLogoProps {
  /** Sets the rendered width; height follows from the 6.32:1 aspect. */
  className?: string;
  /**
   * Unique per instance ON A PAGE, because the green tip is a `clipPath` and a
   * clip is addressed by id. The homepage renders this twice — `HeroStatic` and
   * the footer — and two `<clipPath id="qx-mouse-tip">` in one document is
   * invalid, with the second silently resolving to the first. They happen to be
   * geometrically identical today, which is exactly what would make the bug
   * survive until someone drew the mark at a second size.
   */
  instance: string;
}

const G = computeLockupGeometry(WORDMARK_VIEWBOX.w);
const OPEN = frameOpenFraction(G.frame) * 100;
const MOUSE_ANCHOR = G.mouseAnchor;

/**
 * Always `aria-hidden`. The mark is never the accessible name: the element that
 * wraps it is a link or a heading and carries the name itself, so a screen
 * reader announces "QAVYX, home, link" once rather than twice.
 */
export function NavLogo({ className, instance }: NavLogoProps) {
  const tipClipId = `qx-logo-tip-${instance}`;

  return (
    <svg
      viewBox={`0 0 ${WORDMARK_VIEWBOX.w} ${WORDMARK_VIEWBOX.h}`}
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        <clipPath id={tipClipId} clipPathUnits="userSpaceOnUse">
          <path d={mouseSeamPath(MOUSE_ANCHOR)} />
        </clipPath>
      </defs>

      <path
        d={computeFramePath(G.frame)}
        pathLength={100}
        stroke="currentColor"
        strokeWidth={G.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        // First `OPEN` units drawn, the rest is the Q's opening. The +0.001 guard
        // QFrame carries is unnecessary here: OPEN is ~89.4 and never 100.
        strokeDasharray={`${OPEN} ${100 - OPEN}`}
      />

      {/* The mouse, in the opening. Drawn in the same order as the hero's landed
          glyph — cord behind the body so its end tucks under rather than butting
          against it, tip above so the green reads as part of the glyph. */}
      <path
        d={mouseCordPath(MOUSE_ANCHOR)}
        stroke="currentColor"
        strokeWidth={MOUSE.cordW * MOUSE_ANCHOR.size}
        strokeLinecap="round"
      />
      <path d={mouseBodyPath(MOUSE_ANCHOR)} fill="currentColor" />
      <path
        d={mouseBodyPath(MOUSE_ANCHOR)}
        clipPath={`url(#${tipClipId})`}
        fill="var(--qx-green)"
      />

      <g
        transform={`translate(${G.wordmark.x} ${G.wordmark.y}) scale(${G.wordmark.scale})`}
        fill="currentColor"
        // The A's counter must be a hole, not a filled triangle.
        fillRule="evenodd"
      >
        {GLYPHS.map((g) => (
          <path key={g.id} d={g.d} />
        ))}
      </g>
    </svg>
  );
}

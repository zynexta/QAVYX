import {
  capsulePath,
  DOT_RADIUS,
  MOUSE,
  mouseBodyPath,
  mouseButtonClip,
  mouseCordPath,
  mouseSeamPath,
} from '@/motion/geometry';

/**
 * The single node that is the dot, then the cursor, then the mouse that
 * completes the Q.
 *
 * THE SINGLE-NODE PRINCIPLE: #qx-cursor is the same DOM element for the whole
 * of Engine 1. It is never unmounted, never keyed, never conditionally
 * rendered. That is what makes the sequence read as one object being
 * discovered and then used, rather than four effects in a row — and it is why
 * MorphSVG has something continuous to morph.
 *
 * POSITION vs PRESS vs SHAPE — three nested groups, one job each.
 * `#qx-cursor-node` carries the glyph's POSITION (the pointer follow, the travel
 * arc); `#qx-cursor-press` inside it carries the PRESS (the click invite's lift,
 * the press on the real click); `#qx-cursor` inside that carries its SHAPE (the
 * morph), fill, and the dot's own scale. Splitting them is what lets the tip,
 * cord and button travel and press WITH the body: they are all authored at the
 * groups' shared origin, so one transform moves the whole mouse, another presses
 * all of it at once, and the body still morphs on its own.
 *
 * THE CLICK AFFORDANCE (`.qx-click-hint`) is the green left button plus two
 * ripple rings, and it exists only for the `click` beat. It is an instruction to
 * the visitor, not part of the mark, so there is no anchored counterpart the way
 * there is for the tip and cord — logo-build clears it as the glyph leaves.
 *
 * THE GLYPH IS WHITE WITH A GREEN TIP, not green. #qx-cursor is green only as
 * the DOT; `tlCursorMorph` fades its fill to `--qx-white` as it takes the
 * body's shape, and the green arrives as the tip on the same beat. The accent
 * moves rather than multiplies — the earlier placeholder left both the body and
 * a tip circle green, which read as two unrelated green blobs.
 *
 * #qx-mouse-body is a hidden morph TARGET, not a rendered shape. Both it and
 * the visible dot come out of capsulePath(), so their segment counts and
 * winding match by construction (see motion/geometry.ts).
 *
 * TWO SETS OF TIP+CORD, and they are not redundant:
 *   - `#qx-cursor-live-*` are authored at the ORIGIN and ride the node group, so
 *     the complete mouse follows the pointer from the morph onward.
 *   - `.qx-mouse-face` are authored at the Q's ANCHOR in stage coordinates, and
 *     are what the frame expansion fades out as the mark becomes a container.
 * They are the same shapes in the same place at the moment of the handoff, so
 * swapping one for the other on landing is invisible.
 */

interface CursorNodeProps {
  /** Where the glyph's BODY CENTRE lands in the Q's gap, from computeLogoGeometry(). */
  anchor: { x: number; y: number; size: number };
}

export function CursorNode({ anchor }: CursorNodeProps) {
  const s = anchor.size;
  const bodyAtRest = mouseBodyPath(anchor);
  // The same body authored at the ORIGIN — what the live tip is clipped from,
  // and the shape the node group carries under the pointer.
  const bodyAtOrigin = mouseBodyPath({ x: 0, y: 0, size: s });

  // The seam, the cord and the body all come out of `motion/geometry.ts` now,
  // because `NavLogo` draws the LANDED glyph in the footer and the static hero
  // and the two must be the same shape. They were local helpers here while this
  // was the only file that drew a mouse.

  // The click affordance, authored at the ORIGIN so it rides the node with the
  // rest of the live glyph. The ripple's radii are fractions of the glyph, not
  // fixed pixel counts: they have to stay proportional to the mouse they come
  // out of, and it is ~15px on a narrow phone and ~47px on a wide desktop.
  // Authored at the start radius; the invite animates `r` from here.
  const ringRadius = MOUSE.ringFrom * s;

  return (
    <g id="qx-cursor-group" className="qx-cursor-group">
      <defs>
        <clipPath id="qx-mouse-tip-clip" clipPathUnits="userSpaceOnUse">
          <path d={mouseSeamPath(anchor)} />
        </clipPath>
        <clipPath id="qx-mouse-tip-clip-live" clipPathUnits="userSpaceOnUse">
          <path d={mouseSeamPath({ x: 0, y: 0, size: s })} />
        </clipPath>
        <clipPath id="qx-mouse-btn-clip-live" clipPathUnits="userSpaceOnUse">
          <path d={mouseButtonClip({ x: 0, y: 0, size: s })} />
        </clipPath>
      </defs>

      {/* Morph target. display:none would remove it from layout entirely and
          MorphSVG could not measure it, so it is hidden by opacity instead. */}
      <path id="qx-mouse-body" d={bodyAtRest} opacity="0" pointerEvents="none" />

      {/* The cord, running up-left out of the body's back. Drawn behind the
          body so its end tucks under rather than butting against it. Revealed
          with the tip once the glyph has landed. */}
      <path
        id="qx-mouse-cord"
        className="qx-mouse-face"
        d={mouseCordPath(anchor)}
        fill="none"
        stroke="var(--qx-white)"
        strokeWidth={MOUSE.cordW * s}
        strokeLinecap="round"
        opacity="0"
        pointerEvents="none"
      />

      {/* POSITION. One transform for the whole glyph: the pointer follow and the
          travel arc write x/y here, so the body, its tip and its cord move as one
          object. Everything inside is authored at this group's origin. */}
      <g id="qx-cursor-node">
        {/* PRESS. The invite's lift and the click's press scale this group about
            its own origin, so body, tip, cord, button and rings move together.
            Scaling #qx-cursor instead only ever moved the body. */}
        <g id="qx-cursor-press">
          {/* The ripple rings, BEHIND the body: they start smaller than the
              glyph, so drawn on top they would be two green rings scribbled
              across the white body. Behind it they emerge from under the mouse
              and open outward, which is the whole read.

              Centred on the ORIGIN — the body centre — rather than on the button
              that triggers them. Rings that open concentrically around the mouse
              read as the mouse being clicked; the same rings hung off the button
              read as lopsided, because at ~40px the offset is a third of the
              glyph. It also means their scale is about their own centre whatever
              origin GSAP resolves, which is what stops them drifting. */}
          {[1, 2].map((n) => (
            <circle
              key={n}
              id={`qx-click-ring-${n}`}
              className="qx-click-hint qx-click-ring"
              cx={0}
              cy={0}
              r={ringRadius}
              fill="none"
              stroke="var(--qx-green)"
              strokeWidth={n === 1 ? 2 : 1.25}
              opacity="0"
              pointerEvents="none"
            />
          ))}

          {/* Behind the body, so the cord's end tucks under it. */}
          <path
            id="qx-cursor-live-cord"
            className="qx-cursor-live"
            d={mouseCordPath({ x: 0, y: 0, size: s })}
            fill="none"
            stroke="var(--qx-white)"
            strokeWidth={MOUSE.cordW * s}
            strokeLinecap="round"
            opacity="0"
            pointerEvents="none"
          />

          {/* The one node that survives the whole intro: dot -> mouse body. */}
          <path
            id="qx-cursor"
            d={capsulePath(0, 0, DOT_RADIUS * 2, DOT_RADIUS * 2, DOT_RADIUS, 0)}
            fill="var(--qx-green)"
          />

          {/* Above the body, so the green reads as part of the glyph. */}
          <path
            id="qx-cursor-live-tip"
            className="qx-cursor-live"
            d={bodyAtOrigin}
            clipPath="url(#qx-mouse-tip-clip-live)"
            fill="var(--qx-green)"
            opacity="0"
            pointerEvents="none"
          />

          {/* The left button: the body's own path, clipped to the cord-end left
              quarter — so its outer edge is the body's outline exactly. Above
              the body because it sits ON it; there is no anchored counterpart,
              because the affordance belongs to the beat and not to the mark. */}
          <path
            id="qx-click-btn"
            className="qx-click-hint"
            d={bodyAtOrigin}
            clipPath="url(#qx-mouse-btn-clip-live)"
            fill="var(--qx-green)"
            opacity="0"
            pointerEvents="none"
          />
        </g>
      </g>

      {/* The green tip: the body's own shape, clipped to the far side of the
          cut circle. Authored at the anchor — this is the LANDED glyph's tip,
          and what the frame expansion fades. */}
      <path
        id="qx-mouse-tip"
        className="qx-mouse-face"
        d={bodyAtRest}
        clipPath="url(#qx-mouse-tip-clip)"
        fill="var(--qx-green)"
        opacity="0"
        pointerEvents="none"
      />
    </g>
  );
}

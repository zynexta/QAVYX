'use client';

import { useEffect, useState } from 'react';
import { setMotionViewport } from '@/motion/viewport';

/**
 * The one SVG. Fixed, full viewport, and DELIBERATELY WITHOUT A `viewBox`:
 *
 *      1 SVG user unit == 1 CSS pixel
 *
 * That single decision removes every coordinate conversion in the project.
 * e.clientX can be written straight to the cursor's x with no transform, the
 * frame's geometry is computed in plain pixels, and there is no wrapper <g>
 * scale to reconcile — which matters because a scale factor is exactly what
 * would corrupt the frame's stroke width during the expansion.
 *
 * ## DO NOT ADD A `viewBox` BACK. THIS PARAGRAPH IS THE FIX.
 *
 * An outer <svg> with no viewBox establishes user space at the top-left of its
 * RENDERED box, one unit to the CSS pixel, with no scale and no centring — the
 * invariant above, held by construction. `preserveAspectRatio` has no effect
 * without a viewBox, so there is no fallback alignment left to get wrong.
 *
 * This file used to carry `viewBox={`0 0 ${vw} ${vh}`}`, and with a viewBox the
 * invariant holds only while `rendered box == viewBox` — two independently
 * sourced numbers that must agree. They did not:
 *
 *   - `inset: 0` below makes the RENDERED box track the real viewport
 *     unconditionally, every frame, with no JavaScript involved.
 *   - `useViewport` deliberately REFUSES to update on a mobile URL-bar move
 *     (the 120px guard below, and it is right to).
 *
 * So on a phone, every time the bottom bar hid, the box grew to 840 while the
 * viewBox stayed 750; `xMidYMid meet` picked scale 1 and CENTRED 750 units of
 * content in an 840px box. The green frame slid down (840-750)/2 = 45px while
 * the DOM copy inside it — laid out by the browser, never exposed to the stale
 * number — did not move at all. Measured at 390x750 -> 390x840, not theorised.
 *
 * The other direction was never seen because no test ran it, and it is worse.
 * This subtree arrives through `next/dynamic(..., { ssr: false })`, so the first
 * `innerHeight` read happens after hydration plus a chunk fetch rather than at
 * load — a read taken with the bar already hidden gives viewBox 840 in a 750
 * box, `meet` picks 0.893, and the uniform DOWNSCALE corrupts the very stroke
 * width the paragraph above exists to protect.
 *
 * What this does NOT do is reconcile the two viewports. With the guard still
 * filtering `viewport`, the frame stays laid out for the height the bar was
 * covering, so on a bar-hidden phone it sits ~45px above centre rather than
 * sliding to meet the new edge. That is the guard doing its stated job, and the
 * DOM does exactly the same thing — which is the point: both layers are now
 * wrong in the SAME direction by the SAME amount, which is indistinguishable
 * from both being right. Giving the scrubbed segments the filtered height is a
 * separate change.
 *
 * Everything inside is decorative: the accessible content is real DOM text
 * elsewhere, so the whole stage is aria-hidden — and, for the same reason,
 * `pointer-events: none`.
 *
 * THAT IS NOT A TIDINESS FLAG. This element is `position: fixed` and covers the
 * whole viewport for the whole document, not just the hero, so with pointer
 * events enabled it sits on top of every section below the pin and swallows
 * their clicks. It did: the homepage's entire navigation is one of those
 * sections, and not one of its links could be clicked (keyboard still worked,
 * which is why focus tests passed while the mouse did nothing).
 *
 * Nothing here needs the events. Every listener in the hero — `pointermove`,
 * `pointerdown`, `wheel`, `touchstart` — is bound to `window` in
 * `useHeroTimeline` and `usePointerFollow`, and window-level listeners fire
 * whatever the event's target is. The intro is unaffected.
 */

export interface Viewport {
  vw: number;
  vh: number;
}

export function useViewport(): Viewport | null {
  const [vp, setVp] = useState<Viewport | null>(null);

  useEffect(() => {
    /**
     * ONE STATEMENT, TWO CONSUMERS, AND THAT IS THE POINT. React's state and
     * `motion/viewport`'s module value are written together and can therefore
     * never disagree — which is the whole fix for "the frame adjusts on mobile".
     * The guard below swallows a URL-bar move, and until this line existed it
     * swallowed it for REACT ONLY: the scrubbed segments went on reading
     * `window.innerHeight` directly and re-laid the frame out underneath a React
     * tree that had not re-rendered. See the docblock in `motion/viewport.ts`.
     */
    const read = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setMotionViewport(vw, vh);
      setVp({ vw, vh });
    };
    read();

    // The mobile URL bar shows/hides as a height-only change of ~120px or less;
    // reacting to it makes the hero jump on every scroll-direction change (see
    // BUILD-PLAN Phase 10). That is a TOUCH concern only — a desktop window has
    // no such bar, and applying the guard there left a slow vertical drag feeling
    // dead until it crossed 120px. So it is gated to coarse pointers.
    const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;

    let lastW = window.innerWidth;
    let lastH = window.innerHeight;

    const onResize = () => {
      const widthChanged = window.innerWidth !== lastW;
      const heightDelta = Math.abs(window.innerHeight - lastH);
      if (coarse && !widthChanged && heightDelta <= 120) return;

      lastW = window.innerWidth;
      lastH = window.innerHeight;
      // Read straight through so a continuous drag-resize TRACKS the window live,
      // instead of the layout freezing and snapping 150ms after the user lets go
      // (the previous trailing debounce never fired mid-drag). The browser already
      // coalesces `resize` to roughly frame cadence, so no throttle is needed —
      // and the expensive ScrollTrigger.refresh() is debounced in HeroSection.
      read();
    };

    /**
     * `orientationchange`, RE-READ AFTER 300ms — BUILD-PLAN Phase 10, and the
     * 300 is not a debounce.
     *
     * "Reading `window.innerHeight` immediately on `orientationchange`" is on
     * that phase's own list of common mistakes: iOS reports the PRE-ROTATION
     * dimensions for several frames after the event, so a handler that reads
     * straight away lays the hero out for the orientation the device has just
     * left. A `resize` also fires during the rotation and the guard above lets
     * it through (the width changed), so the immediate reading still happens —
     * this is the correction that lands after it, and the last read wins.
     *
     * Deliberately not `screen.orientation.change`, which is the modern event
     * and fires at the same wrong moment: the problem is the value, not the
     * name of the event.
     *
     * The pin's own refresh follows from this on its own. `HeroSection` watches
     * `viewport.vw/vh` and debounces a `ScrollTrigger.refresh()` behind it, so a
     * corrected read here becomes a corrected pin 150ms later with no second
     * listener for one event.
     */
    let rotate: ReturnType<typeof setTimeout> | undefined;
    const onOrientation = () => {
      clearTimeout(rotate);
      rotate = setTimeout(() => {
        lastW = window.innerWidth;
        lastH = window.innerHeight;
        read();
      }, 300);
    };

    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onOrientation, { passive: true });
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onOrientation);
      clearTimeout(rotate);
    };
  }, []);

  return vp;
}

interface HeroStageProps {
  children: React.ReactNode;
  className?: string;
}

export function HeroStage({ children, className }: HeroStageProps) {
  return (
    <svg
      id="qx-stage"
      className={className}
      width="100%"
      height="100%"
      aria-hidden="true"
      focusable="false"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 'var(--qx-z-stage)' as unknown as number,
      }}
    >
      {children}
    </svg>
  );
}

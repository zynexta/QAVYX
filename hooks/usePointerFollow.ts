'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/motion/gsap';
import { EASE } from '@/motion/eases';

/**
 * Drives #qx-cursor-node after the pointer, with a visible lag and ZERO React
 * renders. The whole point of this hook is what it does NOT do: it never writes
 * state.
 *
 * It moves the NODE rather than #qx-cursor because the node is what carries the
 * glyph's position: the body, its green tip and its cord all hang off it, so one
 * pair of setters moves the whole mouse.
 *
 * Position lives in a gsap transform written by two `quickTo` setters created
 * once. A `pointermove` handler calls them and nothing else. Calling gsap.to()
 * per event would allocate a tween on every one of ~120 events/second, each
 * fighting the last for the same property; quickTo reuses one tween and just
 * re-targets it. The 0.35s duration IS the lag — the raw pointer position is
 * never used directly.
 *
 * Because 1 SVG user unit == 1 CSS pixel (the coordinate contract), e.clientX
 * writes straight to `x` with no conversion.
 *
 * Returns a handle ref so the orchestrator can (a) read the live position when
 * building the travel path and (b) `stop()` the follow the instant travel
 * begins — otherwise the MotionPath and the follow fight over x/y and the icon
 * stutters toward the gap.
 */
export interface PointerFollow {
  /** Kill the follow: remove the listener and the quickTo tweens. */
  stop: () => void;
  /** The cursor's current transform position, in stage pixels. */
  position: () => { x: number; y: number };
}

export function usePointerFollow(
  scope: React.RefObject<HTMLElement | null>,
  enabled: boolean,
): React.RefObject<PointerFollow | null> {
  const handle = useRef<PointerFollow | null>(null);

  useGSAP(
    (_context, contextSafe) => {
      if (!enabled || !contextSafe) return;
      // The NODE, not #qx-cursor: it carries the glyph's position, so the body's
      // tip and cord follow the pointer with it as one mouse.
      const target = document.getElementById('qx-cursor-node');
      if (!target) return;

      const xTo = gsap.quickTo(target, 'x', { duration: 0.35, ease: EASE.out });
      const yTo = gsap.quickTo(target, 'y', { duration: 0.35, ease: EASE.out });

      let stopped = false;
      const onMove = contextSafe((event: Event) => {
        if (stopped) return;
        const e = event as PointerEvent;
        xTo(e.clientX);
        yTo(e.clientY);
      });
      window.addEventListener('pointermove', onMove, { passive: true });

      const stop = () => {
        if (stopped) return;
        stopped = true;
        window.removeEventListener('pointermove', onMove);
        gsap.killTweensOf(target, 'x,y');
      };

      handle.current = {
        stop,
        position: () => ({
          x: Number(gsap.getProperty(target, 'x')),
          y: Number(gsap.getProperty(target, 'y')),
        }),
      };

      return () => {
        stop();
        handle.current = null;
      };
    },
    { scope, dependencies: [enabled] },
  );

  return handle;
}

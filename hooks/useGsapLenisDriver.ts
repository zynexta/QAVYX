'use client';

import { useEffect } from 'react';
import { gsap, ScrollTrigger } from '@/motion/gsap';
import { adoptExternalDriver, onLenisReady } from '@/motion/lenis';

/**
 * Drives the shared Lenis instance from `gsap.ticker`, for as long as the
 * calling component is mounted.
 *
 * ## Why this is a hook and not two lines in the hero
 *
 * `motion/lenis` deliberately does not import `motion/gsap` — that module
 * registers ScrollTrigger, MorphSVG, DrawSVG, MotionPath, CustomEase and
 * SplitText, and the runtime is constructed by the root layout, so importing it
 * there would put the whole plugin set in every route's shared bundle to run a
 * scroll on pages that animate nothing. The runtime therefore drives itself with
 * a plain rAF loop, and anywhere GSAP is ALREADY paid for takes that loop over.
 *
 * "Anywhere GSAP is already paid for" turned out to be two places, not one. The
 * hero was the obvious one; `app/(lab)/lab/scroll` is the other, and it is where
 * this was caught — `phase2-motion-runtime.spec.ts` asserts exactly one rAF loop
 * per frame, and that page was running Lenis's internal loop AND GSAP's ticker
 * side by side for two. Written inline in the hero, the rule "GSAP present means
 * the ticker drives" was a fact about one component instead of a rule; here it
 * is one call.
 *
 * ## What the handover buys
 *
 * `gsap.ticker` is meant to be the only animation loop in this app. A second rAF
 * beside it is doubled work and — the part that actually shows — a desync
 * between the scroll position and the scrubbed timelines reading from it, which
 * appears as jitter in the pinned sequence and gets blamed on ScrollTrigger.
 * `adoptExternalDriver` cancels the internal loop and the release restarts it,
 * so exactly one loop drives the scroll at any moment.
 *
 * `ScrollTrigger.update` on every scroll event belongs here for the same reason:
 * it is the half of the integration that only matters where ScrollTrigger
 * exists, and keeping it out of `motion/lenis` is what keeps the plugin set out
 * of the other fourteen routes.
 *
 * ## `onLenisReady`, not a bare `activeLenis()`
 *
 * The caller and the layout's `SmoothScroll` are different subtrees, React runs
 * child effects before parent ones, and `SmoothScroll` waits for
 * `useReducedMotion` to resolve before constructing anything. There is no mount
 * ordering to rely on, so this subscribes rather than assuming. It fires
 * immediately if the instance already exists, so the common case is still one
 * call.
 */
export function useGsapLenisDriver(): void {
  useEffect(() => {
    let release: (() => void) | null = null;
    let detach: (() => void) | null = null;

    const stop = onLenisReady((lenis) => {
      // Defensive against a second emission: the waiter stays subscribed for the
      // lifetime of the effect, so a runtime rebuilt underneath it (StrictMode,
      // a reduced-motion toggle) would otherwise leak the previous ticker
      // callback and the previous adoption.
      detach?.();
      release?.();

      release = adoptExternalDriver();
      const raf = (time: number) => lenis.raf(time * 1000);
      const onScroll = () => ScrollTrigger.update();
      gsap.ticker.add(raf);
      lenis.on('scroll', onScroll);
      detach = () => {
        gsap.ticker.remove(raf);
        lenis.off('scroll', onScroll);
      };
    });

    return () => {
      stop();
      detach?.();
      release?.();
    };
  }, []);
}

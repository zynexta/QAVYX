import Lenis from 'lenis';

/**
 * The site's smooth scroll.
 *
 * ScrollTrigger.scrollerProxy is deliberately NOT used. Lenis here scrolls the
 * WINDOW, so ScrollTrigger already reads window.scrollY natively and the two
 * agree. scrollerProxy is only required when the scroller is a non-window
 * element (a wrapper div). Adding it for a window scroller is the single most
 * common way this integration gets broken, and it fails in a way that looks
 * like a ScrollTrigger bug rather than a configuration mistake.
 *
 * Why Lenis rather than ScrollSmoother, given 3.13 makes both free:
 *   - no wrapper/content DOM requirement, and our pinned section is a direct
 *     child of <main>
 *   - ~3 KB against ScrollSmoother's ~30 KB
 *   - position: fixed children behave normally; ScrollSmoother's transformed
 *     content wrapper breaks them, and the cursor node is fixed
 *
 * ## THIS FILE MUST NOT IMPORT `motion/gsap`, AND THAT IS THE WHOLE REASON IT
 * ## IS SHAPED THIS WAY
 *
 * Smooth scroll used to belong to the hero: `HeroExperience` called `useLenis`,
 * so it existed on the homepage and on no other route. The client asked for it
 * everywhere, which means creating it from the root layout — and `motion/gsap`
 * registers ScrollTrigger, MorphSVG, DrawSVG, MotionPath, CustomEase and
 * SplitText. Importing this module from the layout with that dependency intact
 * would have put the entire GSAP plugin set in the shared bundle of every page
 * on the site, to run a scroll on routes that animate nothing.
 *
 * So the runtime drives itself with a plain rAF loop, and the hero — the one
 * place GSAP is already paid for — TAKES THE DRIVER OVER via
 * `adoptExternalDriver`. One instance either way; see the note there for why the
 * handover matters rather than just leaving two loops running.
 */

export interface LenisRuntime {
  lenis: Lenis;
  /** Stops the loop, drops listeners, and destroys the instance. */
  destroy: () => void;
}

/**
 * The live instance, for callers outside React.
 *
 * A module singleton is honest here rather than a shortcut, because this file's
 * whole contract is that there is ONE instance — `autoRaf: false` and a single
 * driver both depend on it. It is set and cleared in the same two places the
 * loop starts and stops, so it cannot outlive the runtime it points at.
 *
 * Returns null before the runtime exists (SSR, reduced motion, pre-mount), and
 * every caller must handle that — see `motion/paging.ts` for the fallback.
 */
let active: Lenis | null = null;

export function activeLenis(): Lenis | null {
  return active;
}

/**
 * Fires when an instance appears, and immediately if one already has.
 *
 * `HeroExperience` needs this and a bare `activeLenis()` will not do: the hero
 * and the layout's `SmoothScroll` are different subtrees, React runs child
 * effects before parent ones, and `SmoothScroll` waits on `useReducedMotion`
 * resolving before it creates anything. There is no ordering to rely on, so the
 * hero subscribes instead of assuming. Returns its own unsubscribe.
 */
const readyWaiters = new Set<(lenis: Lenis) => void>();

export function onLenisReady(cb: (lenis: Lenis) => void): () => void {
  if (active) cb(active);
  readyWaiters.add(cb);
  return () => {
    readyWaiters.delete(cb);
  };
}

/**
 * Hands the rAF driving to a caller that has its own loop, and gives back a
 * release.
 *
 * The hero drives Lenis from `gsap.ticker`, and that is not a preference. This
 * app's rule is that gsap.ticker is the ONLY animation loop: a second rAF
 * alongside it is doubled work and, worse, a subtle desync in scrubbed
 * timelines that reads as "jitter" and gets misdiagnosed as a ScrollTrigger
 * problem. So the internal loop is CANCELLED here rather than left spinning
 * beside the ticker, and restarted on release if the instance is still alive.
 */
let internalRaf = 0;
let driveInternally: (() => void) | null = null;

export function adoptExternalDriver(): () => void {
  if (internalRaf) cancelAnimationFrame(internalRaf);
  internalRaf = 0;
  return () => {
    if (active && driveInternally) driveInternally();
  };
}

/**
 * How many holders are using the instance.
 *
 * ONE INSTANCE IS THIS FILE'S CONTRACT AND IT IS NOW ENFORCED RATHER THAN
 * ASSUMED. It used to hold by convention — the hero was the only caller — and
 * moving ownership to the root layout made a second caller possible for the
 * first time. `app/(lab)/lab/scroll` is that caller: it constructs its own
 * runtime through `useLenis` to prove the thing builds once under StrictMode,
 * and with `SmoothScroll` above it in the layout that became two instances and
 * two rAF loops. `phase2-motion-runtime.spec.ts` caught it, which is precisely
 * the failure it was written for.
 *
 * The old shape could not fail this way and it is worth saying why: every
 * runtime drove Lenis from `gsap.ticker`, so N runtimes were N callbacks on the
 * ONE loop GSAP already runs. Giving the runtime its own loop — which is what
 * keeps GSAP out of every route's bundle — turned a second instance from
 * wasteful into visible.
 *
 * So a second call SHARES. The extra holder gets the same `lenis` and a
 * `destroy` that only decrements; the real teardown happens when the last
 * holder lets go, which keeps `SmoothScroll` unmounting under StrictMode from
 * pulling the instance out from under anyone else.
 */
let holders = 0;

export function createLenisRuntime(): LenisRuntime {
  if (active) {
    holders += 1;
    const shared = active;
    let released = false;
    return {
      lenis: shared,
      destroy: () => {
        if (released) return;
        released = true;
        holders -= 1;
      },
    };
  }

  const lenis = new Lenis({
    // The loop below is the only one. Leaving autoRaf at its default true starts
    // a rAF inside Lenis as well, which is the same doubled-work and desync
    // problem `adoptExternalDriver` exists to prevent, arrived at from the other
    // direction.
    autoRaf: false,

    // lerp rather than duration: frame-rate independent, and it behaves better
    // with scrubbed timelines than a fixed-duration easing.
    lerp: 0.1,

    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.6,

    // Native scrolling is left alone on touch. Smoothing touch scroll fights
    // the platform and breaks iOS momentum. See BUILD-PLAN Phase 10.
    syncTouch: false,

    // Let Lenis own hash navigation so anchors respect the smooth scroll
    // rather than jumping past a pinned section.
    anchors: true,
  });

  active = lenis;

  // `lenis.raf` expects MILLISECONDS, which is what rAF already supplies — the
  // hero's gsap.ticker path has to multiply by 1000 and this one must not.
  const loop = (time: number) => {
    lenis.raf(time);
    internalRaf = requestAnimationFrame(loop);
  };
  driveInternally = () => {
    if (!internalRaf) internalRaf = requestAnimationFrame(loop);
  };
  driveInternally();
  holders = 1;

  readyWaiters.forEach((cb) => cb(lenis));

  let released = false;
  return {
    lenis,
    destroy: () => {
      if (released) return;
      released = true;
      holders -= 1;
      // The LAST holder tears down. A shared instance outliving one of its
      // owners is the whole point of the count — under StrictMode the layout's
      // effect unmounts and remounts, and destroying on the first release would
      // strand every other holder with a dead Lenis.
      if (holders > 0) return;
      if (internalRaf) cancelAnimationFrame(internalRaf);
      internalRaf = 0;
      driveInternally = null;
      if (active === lenis) active = null;
      lenis.destroy();
    },
  };
}

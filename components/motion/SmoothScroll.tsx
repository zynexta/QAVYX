'use client';

import { useEffect } from 'react';
import { activeLenis, createLenisRuntime } from '@/motion/lenis';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Lenis, on every route.
 *
 * It used to live inside `HeroExperience`, so the smooth scroll existed on the
 * homepage and nowhere else — the fourteen inner routes scrolled natively, and
 * on `/` the feel changed the moment you navigated away. The client asked for it
 * across the whole site, so ownership moves up to the root layout: one instance,
 * created once, surviving every client-side navigation because the layout does
 * not remount between routes.
 *
 * ## Rendered in the layout, not in a page
 *
 * The same reasoning the four boot scripts beside it already use: a component
 * inside `{children}` is re-mounted on every navigation, which would destroy and
 * rebuild the scroll runtime at each route change — visibly, since a mid-flight
 * `lerp` is thrown away with it. Above `{children}` it is constructed once.
 *
 * ## REDUCED MOTION IS A HARD GATE, AND `!== false` IS NOT A TYPO
 *
 * Smoothing scroll is exactly the kind of motion `prefers-reduced-motion` is
 * about — it takes the visitor's own input and animates it, so it is worse than
 * a decorative tween, not better. `useReducedMotion` is three-state on purpose
 * (see its docblock): `null` while the query is still being read. Waiting for a
 * definite `false` means a visitor who asked for no motion never gets an
 * instance constructed at all, rather than getting one for a frame and having it
 * torn down.
 *
 * This mirrors `HeroMount`'s gate exactly, and it has to: those were one
 * decision when Lenis belonged to the hero, and splitting the ownership must not
 * split the accessibility promise with it.
 *
 * ## What this does NOT do
 *
 * It does not touch GSAP. `motion/lenis` is deliberately free of that import so
 * the plugin set stays out of every route's bundle — the long note there
 * explains the handover, and `HeroExperience` is what performs it on `/`.
 */
export function SmoothScroll() {
  const reduced = useReducedMotion();

  useEffect(() => {
    const handlePopState = () => {
      try {
        const isBackToHome = window.location.pathname === '/' || window.location.pathname === '';
        if (isBackToHome) {
          const isHard = sessionStorage.getItem('qx_hard_refresh') === 'true';
          const scrolled =
            sessionStorage.getItem('qx_scrolled_to_problem') === 'true' ||
            sessionStorage.getItem('qx_scrolled_past_hero') === 'true';
          if (!isHard && scrolled) {
            if ('scrollRestoration' in window.history) {
              window.history.scrollRestoration = 'manual';
            }
            document.documentElement.setAttribute('data-qx-restore-problem', '');
            document.documentElement.setAttribute('data-qx-restoring-scroll', '');
            document.documentElement.setAttribute('data-qx-nav-defer', '');
            document.documentElement.setAttribute('data-qx-nav', 'on');

            const alignToProblem = () => {
              const el =
                document.getElementById('the-problem') ||
                document.getElementById('qx-launch-static') ||
                document.getElementById('qx-trust');
              if (el) {
                const y = el.getBoundingClientRect().top + window.scrollY;
                if (y > 0 && Math.abs(window.scrollY - y) > 1) {
                  window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior });
                }
                const l = activeLenis();
                if (l && Math.abs(l.scroll - y) > 1) {
                  l.scrollTo(y, { immediate: true });
                }
                return true;
              }
              return false;
            };

            alignToProblem();
            setTimeout(alignToProblem, 0);
            setTimeout(alignToProblem, 50);
            setTimeout(alignToProblem, 150);
          }
        }
      } catch {}
    };

    window.addEventListener('popstate', handlePopState, { passive: true });
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (reduced !== false) return;
    const runtime = createLenisRuntime();

    // THE MENU'S SCROLL LOCK, AND LENIS HAS TO BE TOLD.
    //
    // `lib/menu.ts` locks with `overflow: hidden` on `<html>` and its docblock
    // said that was enough because "Lenis scrolls by writing window.scrollTo —
    // that write is what the lock stops". Measured on `/growth-marketing` with
    // the panel open: one wheel gesture moved the page 0 -> 796px. It does not
    // stop it. `overflow: hidden` blocks the USER AGENT from scrolling the
    // scrollport; the scrollport still exists while the content overflows, and
    // programmatic scrolling into it is still allowed. Lenis preventDefaults the
    // wheel and scrolls programmatically, so it goes straight through.
    //
    // That was survivable while Lenis was the homepage's, where the panel only
    // exists after the pin. Site-wide it is reachable behind the menu button on
    // all fifteen routes, so the lock has to hold Lenis too.
    //
    // BOTH HALVES ARE LOAD-BEARING — this does not replace the attribute.
    // `syncTouch: false` leaves touch scrolling native by design, so on a phone
    // `overflow: hidden` is the whole lock; `stop()` is the whole lock for a
    // wheel. Removing either one unlocks one input.
    //
    // Reading the attribute rather than owning the state: `lib/menu.ts` is a
    // pre-paint boot script with no reference to a Lenis instance in a lazy
    // chunk, which is exactly why it was written not to need one. It still does
    // not — this observes what it already publishes for `styles/menu.css`.
    const root = document.documentElement;
    const sync = () => {
      if (root.hasAttribute('data-qx-menu')) runtime.lenis.stop();
      else runtime.lenis.start();
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['data-qx-menu'] });

    return () => {
      observer.disconnect();
      runtime.destroy();
    };
  }, [reduced]);

  return null;
}

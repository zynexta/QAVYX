'use client';

import { useEffect, useState } from 'react';

/**
 * `prefers-reduced-motion`, as a THREE-state value. `null` means "not read yet".
 *
 * ## Why not a boolean initialised to `false`
 *
 * BUILD-PLAN Phase 9 prescribes a boolean that "must initialise `false` on the
 * server and update in an effect, or every visitor gets a flash of the static
 * version". The hydration half of that is right and this hook keeps it. The
 * boolean half defeats the phase's own performance criterion, and the reason is
 * worth writing down because it is invisible from the call site.
 *
 * `HeroMount` gates a `next/dynamic(..., { ssr: false })` component. In the App
 * Router that compiles to `React.lazy(() => opts.loader())`
 * (`next/dist/shared/lib/lazy-dynamic/loadable.js`), and React.lazy runs its
 * initializer in the RENDER phase — the loader is the webpack
 * `__webpack_require__.e(...)` call that appends the chunk's `<script>`. Every
 * effect runs after the commit. So a hook that returns `false` first renders
 * `<HeroSection/>` once, fires the chunk request, and only then flips to
 * `reduce` and unmounts it. The ~62 KB of GSAP + Lenis is already in flight, and
 * unmounting does not cancel it: the visitor who asked for no motion pays for
 * all of it. `useSyncExternalStore` with `getServerSnapshot = () => false` has
 * the identical bug — it fixes hydration, not the download.
 *
 * A third state fixes both at once, because `null` renders NEITHER branch:
 *
 *   null   -> render nothing (server, and the hydration render)
 *   false  -> the motion layer, and only now does the chunk load
 *   true   -> the static path, which is already in the HTML
 *
 * Hydration is safe for the same reason it was before: the pending render emits
 * exactly what the server emits for this subtree — nothing. `ssr: false` already
 * bails to CSR and renders a `null` fallback, so there is no new mismatch.
 *
 * The cost is that the motion path's chunk request starts one commit later than
 * it used to. That is free in practice: `HeroSection` returns `null` until
 * `useViewport` resolves in its own effect anyway, so the screen is black for
 * that tick either way.
 *
 * ## It listens, it does not just read
 *
 * Toggling the OS setting with the page open must rebuild the hero — an
 * acceptance criterion of this phase. The `change` listener is what makes
 * motion -> reduce unmount `HeroSection` (and `useGSAP`'s context revert then
 * kills the ScrollTrigger and removes its pin-spacer), and reduce -> motion
 * mount it.
 *
 * This is the same shape as `useViewport` in `components/hero/HeroStage.tsx`,
 * which is the project's existing precedent for "a client-only measurement that
 * must not be guessed on the server".
 */
export function useReducedMotion(): boolean | null {
  const [reduced, setReduced] = useState<boolean | null>(null);

  useEffect(() => {
    // Optional-chained for the same reason useHeroTimeline and useViewport do
    // it: jsdom in the unit suite has no matchMedia unless a test installs one.
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) {
      setReduced(false);
      return;
    }
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  return reduced;
}

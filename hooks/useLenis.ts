'use client';

import { useEffect, useRef } from 'react';
import type Lenis from 'lenis';
import { createLenisRuntime } from '@/motion/lenis';

/**
 * Constructs a Lenis instance scoped to one component's lifetime.
 *
 * NOT THE SITE'S SMOOTH SCROLL ANY MORE. `HeroExperience` used to call this,
 * which is why Lenis existed on `/` and nowhere else; the client asked for it
 * across the whole site, so `components/motion/SmoothScroll.tsx` in the root
 * layout owns the real instance now and the hero adopts its driver.
 *
 * What is left here is the isolated-harness form, and `app/(lab)/lab/scroll`
 * is its one caller — a page that exists to prove the runtime constructs once
 * under StrictMode and leaves no ScrollTrigger behind. It is a `.lab.tsx`, so
 * Next never routes it and the second instance it would create can never meet
 * the layout's one in a real page.
 *
 * DO NOT REACH FOR THIS IN APPLICATION CODE. `motion/lenis`'s contract is that
 * exactly one instance exists; calling this anywhere the layout also runs would
 * point `activeLenis()` at the newer one and strand the older.
 *
 * Created in an effect, not in the component body: under React 19 StrictMode a
 * body-level constructor runs twice and the second instance silently wins,
 * leaving the first one's ticker callback attached forever.
 *
 * Returns a ref rather than state on purpose — nothing should re-render when
 * the instance appears.
 */
export function useLenis(enabled = true): React.RefObject<Lenis | null> {
  const ref = useRef<Lenis | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const runtime = createLenisRuntime();
    ref.current = runtime.lenis;

    return () => {
      runtime.destroy();
      ref.current = null;
    };
  }, [enabled]);

  return ref;
}

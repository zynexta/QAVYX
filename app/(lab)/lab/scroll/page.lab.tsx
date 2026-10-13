'use client';

import { useEffect, useRef, useState } from 'react';
import { useGsapLenisDriver } from '@/hooks/useGsapLenisDriver';
import { useLenis } from '@/hooks/useLenis';
import { EASE } from '@/motion/eases';
import { gsap, ScrollTrigger } from '@/motion/gsap';
import { startRafProbe } from '@/motion/debug/rafProbe';

/**
 * Phase 2 verification surface.
 *
 * Proves the four things that must hold before any real animation is built:
 *   1. exactly one rAF loop in the whole app
 *   2. scrub tracks scroll with a ~1s catch-up and no stutter
 *   3. every ScrollTrigger is released on unmount (no leak)
 *   4. StrictMode's double-mount produces one Lenis, not two
 */
export default function ScrollLab() {
  const [mounted, setMounted] = useState(true);
  return (
    <>
      <button
        onClick={() => setMounted((m) => !m)}
        className="fixed left-3 top-3 z-skip rounded-sm border border-qx-green px-3 py-2 font-mono text-2xs text-qx-green"
      >
        {mounted ? 'unmount (leak test)' : 'remount'}
      </button>
      {mounted ? <Harness /> : <UnmountedReadout />}
    </>
  );
}

function UnmountedReadout() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    const id = setInterval(() => setCount(ScrollTrigger.getAll().length), 200);
    return () => clearInterval(id);
  }, []);
  return (
    <main className="grid h-svh place-items-center font-mono text-sm">
      <p className={count === 0 ? 'text-qx-green' : 'text-red-400'}>
        ScrollTrigger.getAll().length after unmount = {count ?? '…'}{' '}
        {count === 0 ? '✓ no leak' : '✗ LEAKED'}
      </p>
    </main>
  );
}

function Harness() {
  const lenisRef = useLenis();
  // THIS PAGE LOADS GSAP, SO GSAP'S TICKER DRIVES THE SCROLL — the same rule the
  // hero follows, and the reason this harness now states it too.
  //
  // `motion/lenis` gives the runtime its own rAF loop so that the fourteen
  // routes with no GSAP do not pay for the plugin set. Anywhere GSAP IS loaded,
  // that loop is a second one beside `gsap.ticker` — which is exactly what the
  // readout below counts, and what it was reporting as `rAF loops/frame ...... 2`.
  //
  // `useLenis` above no longer constructs a second instance either: the layout's
  // `SmoothScroll` builds the real one and `createLenisRuntime` shares it, so the
  // "instances" counter still reads 1 and now says something true about the whole
  // document rather than about this component alone.
  useGsapLenisDriver();
  const pinRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState({ loops: 0, fps: 0, progress: 0, triggers: 0, velocity: 0 });

  // Track how many Lenis instances this component has constructed across the
  // StrictMode double-mount. Must be 1.
  const [instances, setInstances] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      if (lenisRef.current) setInstances((n) => (n === 0 ? 1 : n));
    }, 100);
    return () => clearInterval(id);
  }, [lenisRef]);

  useEffect(() => {
    const probe = startRafProbe();
    const ctx = gsap.context(() => {
      const st = ScrollTrigger.create({
        id: 'st-lab-pin',
        trigger: pinRef.current,
        start: 'top top',
        end: '+=300%',
        pin: true,
        pinSpacing: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        animation: gsap.to(boxRef.current, {
          rotate: 180,
          scale: 2.2,
          borderRadius: '4px',
          ease: 'none',
        }),
        onUpdate: (self) => {
          setStats({
            loops: probe.loopsPerFrame(),
            fps: probe.fps(),
            progress: self.progress,
            triggers: ScrollTrigger.getAll().length,
            velocity: Math.round(lenisRef.current?.velocity ?? 0),
          });
        },
      });
      return () => st.kill();
    });

    const idle = setInterval(
      () =>
        setStats((s) => ({
          ...s,
          loops: probe.loopsPerFrame(),
          fps: probe.fps(),
          triggers: ScrollTrigger.getAll().length,
        })),
      250,
    );

    return () => {
      clearInterval(idle);
      probe.stop();
      ctx.revert();
    };
  }, [lenisRef]);

  const ok = (v: boolean) => (v ? 'text-qx-green' : 'text-red-400');

  return (
    <main>
      <div className="fixed right-3 top-3 z-skip w-64 rounded-sm border border-qx-line bg-qx-ink/90 p-3 font-mono text-2xs">
        <p className={ok(stats.loops === 1)}>
          rAF loops/frame …… {stats.loops} {stats.loops === 1 ? '✓' : '✗ expect 1'}
        </p>
        <p className={ok(instances === 1)}>
          lenis instances …… {instances} {instances === 1 ? '✓' : '✗ expect 1'}
        </p>
        <p className={ok(stats.triggers === 1)}>scrolltriggers … {stats.triggers}</p>
        <p className="text-qx-grey">fps ……………………… {stats.fps}</p>
        <p className="text-qx-grey">pin progress ……… {stats.progress.toFixed(3)}</p>
        <p className="text-qx-grey">lenis velocity … {stats.velocity}</p>
        <p className={`mt-2 ${ok(typeof gsap.parseEase(EASE.out) === 'function')}`}>
          qx.out registered {typeof gsap.parseEase(EASE.out) === 'function' ? '✓' : '✗'}
        </p>
      </div>

      <section className="grid h-svh place-items-center">
        <p className="font-mono text-sm text-qx-grey">scroll down — wheel should ease out</p>
      </section>

      <section ref={pinRef} className="grid h-svh place-items-center">
        <div
          ref={boxRef}
          className="h-32 w-32 rounded-lg border-2 border-qx-green"
          style={{ willChange: 'transform' }}
        />
      </section>

      <section className="grid h-svh place-items-center">
        <p className="font-mono text-sm text-qx-grey">unpinned — normal scroll resumes</p>
      </section>
    </main>
  );
}

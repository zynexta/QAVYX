'use client';

import { useEffect, useRef, useState } from 'react';
import { useBeat } from '@/hooks/useBeatMachine';
import { gsap } from '@/motion/gsap';

/**
 * Dev-only readout: the live beat (which must match `data-beat` on the hero
 * root), the pin progress, and fps. HeroSection renders it only outside
 * production, so it is tree-shaken from the shipped bundle.
 *
 * HIDDEN BY DEFAULT — press the backtick key (`) to toggle it. It stays a tool
 * for the scroll-driven phases without sitting in every dev screenshot the way
 * it did before. Backtick is safe: the intro's key handler acts only on Escape.
 *
 * fps is sampled off gsap.ticker rather than a private rAF loop — there is only
 * one animation loop in this app and this must not become a second one, so the
 * ticker is added only while the overlay is visible. Progress is read from the
 * `data-*-progress` attributes the pins' onUpdates already write, so the overlay
 * adds no per-frame store writes.
 */

/**
 * Both pins' progress, as `hero / launch`.
 *
 * Phase 8E made "the pin's progress" two numbers, and a HUD that showed only
 * one of them would be worse than showing neither: at any moment one pin is
 * parked at an end and the other is moving, and without both you cannot tell
 * which you are reading. Seeing `1.0000 / 0.0000` is also the fastest way to
 * recognise the between-the-pins state that this phase's cross-paint bug lives
 * in.
 */
function hudProgress(): string {
  const root = document.getElementById('qx-hero-root');
  const read = (attr: string) => root?.getAttribute(attr) ?? '0.0000';
  return `${read('data-progress')} / ${read('data-launch-progress')}`;
}
export function DevOverlay() {
  const beat = useBeat();
  const [show, setShow] = useState(false);
  const [stats, setStats] = useState({ fps: 0, progress: '0.0000' });
  const frames = useRef({ count: 0, last: 0 });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '`') setShow((s) => !s);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!show) return;
    frames.current = { count: 0, last: 0 };
    const tick = () => {
      const f = frames.current;
      f.count += 1;
      const now = performance.now();
      if (f.last === 0) f.last = now;
      const dt = now - f.last;
      if (dt >= 500) {
        setStats({
          fps: Math.round((f.count * 1000) / dt),
          progress:
            // Both pins, because "the pin's progress" stopped being one number
            // in Phase 8E and a HUD showing only one of them is worse than
            // showing neither — you cannot tell which pin you are looking at.
            hudProgress(),
        });
        f.count = 0;
        f.last = now;
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [show]);

  if (!show) return null;

  return (
    <div className="pointer-events-none fixed bottom-3 right-3 z-skip rounded-sm border border-qx-line bg-qx-ink/90 p-2 font-mono text-2xs leading-5 text-qx-grey">
      <p>
        beat ······ <span className="text-qx-green">{beat}</span>
      </p>
      <p>progress {stats.progress}</p>
      <p>fps ······· {stats.fps}</p>
    </div>
  );
}

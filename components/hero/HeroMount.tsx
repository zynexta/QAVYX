'use client';

import dynamic from 'next/dynamic';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * The client boundary that keeps the ~62 KB motion layer (GSAP + plugins + Lenis)
 * out of the initial route bundle.
 */
const HeroSection = dynamic(
  () => import('@/components/hero/HeroSection').then((m) => m.HeroSection),
  { ssr: false },
);

export function HeroMount() {
  const reduced = useReducedMotion();
  if (reduced !== false) return null;

  if (typeof window !== 'undefined') {
    try {
      const isHard = sessionStorage.getItem('qx_hard_refresh') === 'true';
      const scrolled =
        sessionStorage.getItem('qx_scrolled_to_problem') === 'true' ||
        sessionStorage.getItem('qx_scrolled_past_hero') === 'true' ||
        document.documentElement.hasAttribute('data-qx-restore-problem');
      if (!isHard && scrolled) {
        return null;
      }
    } catch {}
  }

  return <HeroSection />;
}

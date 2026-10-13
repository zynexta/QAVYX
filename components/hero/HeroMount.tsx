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
  return <HeroSection />;
}

'use client';

import type { Box } from '@/motion/geometry';
import { CarouselIndicator } from './CarouselIndicator';
import { ServiceTrack } from './ServiceTrack';

/**
 * Engine 3's DOM: the window the track translates inside, clipped to the design
 * frame the Q expanded into.
 *
 * It is `position: fixed` and a SIBLING of the pinned section rather than a
 * child of it — the pin applies a transform to its own element, and anything
 * inside would be dragged by it. Fixed siblings positioned from the same
 * `computeFrameGeometry` box the SVG frame animates to are what keep the
 * content and the frame edge in agreement at every viewport size.
 *
 * `overflow: hidden` is load-bearing: without it the five off-screen panels
 * spill past the frame's edge, and later (Phase 11) tabbing to one of their
 * CTAs scrolls the whole page sideways to reveal it.
 */

interface ServicesCarouselProps {
  /** The design frame at rest, from computeFrameGeometry(). */
  frame: Box;
  /** The frame's stroke width — the track insets by it so text clears the rule. */
  strokeWidth: number;
}

export function ServicesCarousel({ frame, strokeWidth }: ServicesCarouselProps) {
  // Inset by the stroke so a panel's edge never sits under the frame's line.
  const inset = strokeWidth;
  const innerW = frame.w - inset * 2;

  return (
    <div
      id="qx-track-viewport"
      style={{
        position: 'fixed',
        left: frame.x + inset,
        top: frame.y + inset,
        width: innerW,
        height: frame.h - inset * 2,
        overflow: 'hidden',
        // Intro clicks and wheel gestures must reach window; the CTAs opt back
        // in individually (see ServicePanel).
        pointerEvents: 'none',
        zIndex: 'var(--qx-z-copy)' as unknown as number,
      }}
    >
      <section aria-label="Services" className="h-full">
        <ServiceTrack panelWidth={innerW} />
      </section>
      <CarouselIndicator />
    </div>
  );
}

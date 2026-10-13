'use client';

import { useEffect, useRef } from 'react';
import { CAROUSEL_PANELS, PANEL_COUNT } from '@/content/carousel';
import { useHeroStore } from '@/state/heroStore';
import { LaunchpadPanel } from './LaunchpadPanel';
import { ServicePanel } from './ServicePanel';

/**
 * `#qx-track` — the strip the carousel translates. One panel per frame width,
 * laid out left to right; the scrubbed timeline moves it with `transform:
 * translateX` and nothing else. `left`/`margin` would be layout on every frame
 * of a 375vh segment; only `transform` is composited.
 *
 * The list is `CAROUSEL_PANELS`, not `SERVICES` — five pillars and then
 * Launchpad. `content/carousel.ts` has the reasoning for why those are two
 * different lists; the short version is that a sixth `SERVICES` entry would also
 * put Launchpad in the homepage index and in the reduced-motion pillar list,
 * where `content/site.ts` deliberately keeps it out.
 */

interface ServiceTrackProps {
  /** Frame inner width in px — one panel, and the step size for the travel. */
  panelWidth: number;
}

export function ServiceTrack({ panelWidth }: ServiceTrackProps) {
  const ref = useRef<HTMLDivElement>(null);

  // `will-change: transform` ONLY while the carousel is the live segment.
  // Promoting a 5-viewport-wide strip holds a large GPU texture; leaving it on
  // for the whole session costs that memory from first paint to unload, for a
  // segment that occupies about a third of one scroll-through. Subscribing to
  // the store imperatively keeps this out of the render path entirely.
  useEffect(() => {
    const apply = (beat: string) => {
      const el = ref.current;
      if (el) el.style.willChange = beat === 'services' ? 'transform' : 'auto';
    };
    apply(useHeroStore.getState().beat);
    return useHeroStore.subscribe((s, prev) => {
      if (s.beat !== prev.beat) apply(s.beat);
    });
  }, []);

  return (
    <div ref={ref} id="qx-track" className="flex h-full" style={{ width: 'max-content' }}>
      {CAROUSEL_PANELS.map((panel, i) =>
        panel.kind === 'launchpad' ? (
          <LaunchpadPanel
            key={panel.slug}
            content={panel.launchpad}
            index={i}
            total={PANEL_COUNT}
            width={panelWidth}
          />
        ) : (
          <ServicePanel
            key={panel.slug}
            service={panel.service}
            index={i}
            total={PANEL_COUNT}
            width={panelWidth}
          />
        ),
      )}
    </div>
  );
}

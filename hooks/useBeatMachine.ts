'use client';

import { useHeroStore } from '@/state/heroStore';
import type { Beat, BeatEvent } from '@/types/hero';

/**
 * A narrow subscription to the beat machine for components that must re-render
 * on a beat change (DevOverlay, SkipIntroButton). Selecting only `beat` means
 * they never re-render for anything else — and the imperative machinery
 * (usePointerFollow, useHeroTimeline) reads/writes the store WITHOUT this hook,
 * so a pointer move still triggers zero renders.
 */
export function useBeatMachine(): { beat: Beat; send: (event: BeatEvent) => void } {
  const beat = useHeroStore((s) => s.beat);
  const send = useHeroStore((s) => s.send);
  return { beat, send };
}

/** Just the beat, for read-only consumers. */
export function useBeat(): Beat {
  return useHeroStore((s) => s.beat);
}

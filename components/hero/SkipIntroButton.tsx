'use client';

import { useBeatMachine } from '@/hooks/useBeatMachine';
import { ENGINE_1_BEATS } from '@/types/hero';

/**
 * A skip affordance for the intro. Visually hidden until focused, so it never
 * clutters the composition but is the first thing a keyboard user reaches — Tab
 * to it, Enter, and the completed logo appears with no discontinuity (the store
 * routes SKIP through the same finalize path as Escape and a scroll gesture).
 *
 * Rendered only while an Engine-1 beat is active; once the logo is ready there
 * is nothing to skip, so it leaves the DOM. Subscribes to `beat` alone, so it
 * re-renders only on the ~5 intro beat changes, never on pointer or scroll.
 */
export function SkipIntroButton() {
  const { beat, send } = useBeatMachine();
  if (!ENGINE_1_BEATS.includes(beat) || beat === 'boot') return null;

  return (
    <button
      type="button"
      onClick={() => send('SKIP')}
      className="sr-only z-skip rounded-sm border border-qx-green bg-qx-black px-3 py-2 font-mono text-2xs text-qx-green focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
    >
      Skip intro
    </button>
  );
}

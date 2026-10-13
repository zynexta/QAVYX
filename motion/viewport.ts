/**
 * THE ONE VIEWPORT THE MOTION LAYER IS ALLOWED TO READ.
 *
 * ## Why this module exists
 *
 * `useViewport` (components/hero/HeroStage.tsx) deliberately REFUSES to update
 * on a mobile URL-bar move: a height-only resize of 120px or less on a coarse
 * pointer is swallowed, because reacting to it makes the hero jump every time
 * the visitor changes scroll direction. That guard is right and it stays.
 *
 * But it only ever governed REACT. Every scrubbed segment read the window
 * directly, inside callbacks GSAP re-evaluates on its own schedule:
 *
 *   hooks/useHeroTimeline.ts        configNow(), centre()
 *   motion/timelines/expandTimeline `onUpdate`, and the track's `x`
 *   motion/timelines/apertureTimeline `onUpdate`
 *   motion/timelines/launchTimeline `rawPath()`'s cache
 *
 * So the project had TWO viewports that disagreed for exactly as long as the
 * URL bar was hidden — React frozen at the old height, the timelines tracking
 * the live one. Measured on a 390x750 -> 390x840 bar-hide at pin progress 0.085:
 * `#qx-frame` moved 27.4px and grew 35.2px, and `#qx-track`'s transform changed,
 * while React had not re-rendered at all. That is the "frame adjusts on mobile"
 * the client reported, and it is a consistency bug rather than a geometry one —
 * every individual computation was correct, they were just answering different
 * questions.
 *
 * ## What it does NOT change
 *
 * A real resize still propagates everywhere: on a fine pointer the guard never
 * applies, and on a coarse one a width change or a jump over 120px goes
 * straight through. `setMotionViewport` is called from the same `read()` that
 * sets React's state, so the two can no longer drift apart by construction —
 * which is the actual fix. Freezing is what the guard already promised; this is
 * what makes the promise cover the whole layer.
 *
 * ## The fallback is the window, and it is not a default
 *
 * Nothing here guesses. Before `useViewport` has run — a timeline built by a
 * unit-test harness, or any call that beats the first effect — this reads the
 * window, which is exactly what every one of those call sites did before. So
 * the module is inert until the hero mounts and takes ownership.
 */

export interface MotionViewport {
  vw: number;
  vh: number;
}

let current: MotionViewport | null = null;

/**
 * Publish the filtered viewport. Called ONLY by `useViewport`'s `read()`, so
 * there is one writer and it is the same statement that sets React's state.
 */
export function setMotionViewport(vw: number, vh: number): void {
  current = { vw, vh };
}

/**
 * The viewport every timeline must measure against.
 *
 * Returns a fresh object rather than the stored one so a caller cannot mutate
 * the layer's single source of truth by accident — these values end up in
 * geometry functions that are pure by contract.
 */
export function motionViewport(): MotionViewport {
  if (current) return { vw: current.vw, vh: current.vh };
  if (typeof window === 'undefined') return { vw: 0, vh: 0 };
  return { vw: window.innerWidth, vh: window.innerHeight };
}

/**
 * Drop back to the window. For tests that build a timeline after another test
 * has mounted the hero — module state outlives a test file, and a stale
 * viewport leaking between suites is the kind of failure that reads as a
 * geometry regression.
 */
export function resetMotionViewport(): void {
  current = null;
}

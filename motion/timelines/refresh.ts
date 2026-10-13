import type { gsap } from '@/motion/gsap';

/**
 * Force every segment of a scrubbed timeline to re-emit at progress `p`.
 *
 * `invalidateOnRefresh` re-reads a tween's function-based values after a resize,
 * but it does NOT re-fire the `onUpdate` of a segment that is already COMPLETE
 * at the current progress — and in this project the frame's box, the carousel's
 * position and the launch's whole state are written from inside those onUpdates.
 * So a resize during `services` used to leave the frame at its pre-resize box: a
 * collapsed bowl floating over the carousel. Nudging the timeline off its
 * progress and back forces complete and incomplete segments alike to re-emit for
 * the new viewport. Synchronous, so the intermediate progress never paints.
 *
 * It lives here, rather than inline in each `onRefresh`, because Phase 8E gives
 * the homepage TWO pinned triggers and this is the one line whose exact form the
 * cross-paint test depends on. A copy of it in a test would drift from a copy of
 * it in the hook, and the drift would show up as the test quietly no longer
 * reproducing what a refresh actually does.
 *
 * Note the direction. Seeking to the FAR end first is what makes a completed
 * segment re-run; a seek backwards past a `fromTo` renders it at its START
 * state, which is why every timeline's state at its own progress 0 has to be
 * "nothing painted" rather than "whatever was there at build time".
 *
 * ## Why progress 0 is a special case, and not a tidiness one
 *
 * This used to be the single line `tl.progress(p > 0 ? 0 : 1).progress(p)` — at
 * progress 0, seek to the END and come back. With one pin that was harmless
 * arithmetic: progress 0 was the top of the only pin, the visitor was looking at
 * the hero, and the round trip settled back onto the state it started from.
 *
 * With two pins it is destructive. Pin 2 sits at progress 0 for the entire hero
 * — 370vh of rocket — and a resize anywhere in there would seek pin 2's whole
 * timeline to its far end (frame flown out, ink cleared, carousel gone) before
 * returning to 0. Every segment that correctly declines to write at its own t=0,
 * so as to leave the earlier state standing, then leaves that far-end wreckage
 * standing instead. The observed symptom was the ink field going dark
 * underneath a rocket in mid-climb.
 *
 * And the seek to 1 was never buying anything at progress 0: the point of the
 * nudge is to re-run segments that are already COMPLETE, and at progress 0 no
 * segment has completed. All that is needed there is to re-render the segments
 * sitting at position 0 against the new viewport.
 *
 * Hence `render(0, false, true)` rather than a nudge to a hair past zero and
 * back. `force: true` is what makes GSAP re-render a time it is already parked
 * at, which is the whole difficulty — and it renders time 0 exactly, so a
 * segment guarding on `t <= 0` genuinely is not written. A nudge of even 1e-6
 * is not zero: it puts the frame's re-entry fade at t=1.7e-5, which passes the
 * guard and writes an opacity of effectively zero onto the logo. That bug is
 * visible the instant the pin is created, at `ready`, with no resize involved
 * at all — the assembled mark simply disappears.
 */
export function reemitAt(tl: gsap.core.Timeline, p: number): void {
  if (p <= 0) {
    tl.render(0, false, true);
    return;
  }
  tl.progress(0).progress(p);
}

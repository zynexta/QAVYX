import { ScrollTrigger } from '@/motion/gsap';
import { activeLenis } from '@/motion/lenis';
import { progressForIndex } from '@/motion/timelines/carouselTimeline';
import { PIN_ID } from '@/types/hero';

/**
 * Panel index → a real scroll, for the carousel's pagination.
 *
 * The carousel is a SEGMENT of one pinned, scrubbed timeline, not a slider with
 * its own transform to set. So "go to panel 4" cannot move the track directly —
 * doing that would put the strip somewhere the scroll position disagrees with,
 * and the next wheel tick would snap it straight back. The only correct way to
 * change which panel is showing is to change WHERE THE PAGE IS SCROLLED TO, and
 * let the same scrub that handles a wheel gesture carry it.
 *
 * This module is the bridge, and it is deliberately the only place that knows
 * both halves.
 *
 * ## Why the arithmetic reads the trigger rather than computing from vh
 *
 * `PIN_A.totalVh` says the pin is 1015vh, so the scroll distance looks like it
 * should be `1015 / 100 * innerHeight`. It is not, quite: ScrollTrigger resolves
 * `end: '+=1015%'` against the trigger's own size at refresh time, applies
 * `pinSpacing`, and rounds. The instance's own `start`/`end` ARE those resolved
 * pixel values, so reading them is exact by construction and survives a resize
 * (which re-refreshes the trigger) with no recomputation here.
 */

/**
 * Scroll position in px for a BUDGET progress, or null if the pin does not exist.
 *
 * BUDGET progress, not the trigger's own. THEY ARE THE SAME NUMBER ON BOTH
 * DEVICES AGAIN — the launch beat came back to phones on 2026-09-02, so the
 * touch pin is the full 1015vh once more and `cover` below is 1.
 *
 * They were not the same between 2026-08-31 and then: the touch pin stopped
 * short of the launch beat, so its 1.0 was only `PIN_TOUCH_COVERAGE` of the
 * budget and each pagination stop would have landed ~1.46x too far down, paging
 * past the strip entirely. `progressForIndex` speaks the budget, so the
 * conversion belongs here rather than at the call site either way: `goToPanel`
 * should not have to know how long a phone's pin is, and `CarouselIndicator`
 * certainly should not.
 */
export function scrollYForProgress(progress: number): number | null {
  const pin = ScrollTrigger.getById(PIN_ID);
  if (!pin) return null;
  // BOTH DEVICES RUN THE WHOLE BUDGET since the launch beat came back to phones
  // as a frame sequence (2026-09-02), so this is 1 and the arithmetic below is
  // the identity. It was `touch ? PIN_TOUCH_COVERAGE : 1` while the touch pin
  // stopped short of the launch; kept as a named value because this function's
  // whole correctness is "which progress is this number", and a bare 1 would
  // erase the question rather than answer it.
  const cover = 1;
  const asPin = progress / cover;
  const clamped = asPin < 0 ? 0 : asPin > 1 ? 1 : asPin;
  return pin.start + (pin.end - pin.start) * clamped;
}

/**
 * How long the smooth scroll takes, in seconds.
 *
 * Not Lenis's default. A pagination jump can cross five panels — 375vh, most of
 * a screen-height per panel — and at the default the far end of that reads as a
 * page malfunctioning rather than as a control responding. It is also not so
 * fast that it becomes a cut: the point of scrolling rather than jumping is that
 * the visitor sees WHICH WAY they moved through the set, which is the one thing
 * a slider's pagination has to communicate.
 */
const DURATION = 0.9;

/**
 * Send the page to the panel at `index`.
 *
 * Returns false when there is nothing to scroll — no pin (reduced motion, or
 * before `ready`) — so a caller can decide whether that is worth reporting. It
 * is not an error: the control simply is not live yet.
 *
 * THE SNAP IS LEFT ALONE ON PURPOSE. The pinned trigger carries
 * `snap: { snapTo: snapProgress }`, which fires when scrolling stops. This lands
 * on `progressForIndex(index)`, which IS a snap point by construction — the same
 * function `snapProgress` rounds to — so the snap that follows resolves to the
 * position already reached and moves nothing. Suppressing it would be both
 * unnecessary and worse: if the scroll is interrupted mid-flight, the snap is
 * exactly what should tidy up where it stopped.
 */
export function goToPanel(index: number): boolean {
  const y = scrollYForProgress(progressForIndex(index));
  if (y === null) return false;

  const lenis = activeLenis();
  if (lenis) {
    // `lock: true` — a wheel tick landing mid-flight would otherwise fight the
    // tween and stall it somewhere between two panels, which is the one outcome
    // a pagination control must not produce.
    lenis.scrollTo(y, { duration: DURATION, lock: true });
    return true;
  }

  // No Lenis: the smooth-scroll layer failed to construct, or this ran before it
  // did. Native smooth scrolling is the honest fallback rather than a no-op —
  // the pin reads `window.scrollY` either way, so the scrub still follows.
  window.scrollTo({ top: y, behavior: 'smooth' });
  return true;
}

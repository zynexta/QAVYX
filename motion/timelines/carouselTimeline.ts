import { PANEL_COUNT } from '@/content/carousel';
import { PIN_A } from '@/motion/scrollBudget';

/**
 * Engine 3's arithmetic, as pure functions.
 *
 * The carousel is a SEGMENT of the one pinned timeline, not a trigger of its
 * own, so everything here maps between three coordinate spaces:
 *
 *   pin progress   0 .. 1        the whole pin
 *   local          0 .. 1        inside the carousel segment
 *   index          0 .. STEPS    which panel is active
 *
 * Keeping the maths out of the timeline is what lets `tests/unit/scroll-index.test.ts`
 * check the snap and the index without a browser, a scroll, or a frame of time.
 */

/**
 * Segment bounds on the pin, from TDD §7 rows 20–21.
 *
 * Derived from the shared budget, not mirrored from `expandTimeline`'s `P`.
 * These two files have to agree exactly — `snapProgress` guards on
 * `CAROUSEL_END` while the timeline's carousel segment ends at
 * `P.servicesEnd` — and when both were hand-typed decimals, nothing enforced
 * that. A snap guard silently one segment out of step with the tween it guards
 * is not a failure any test was watching for.
 */
export const CAROUSEL_START = PIN_A.startOf('services');
export const CAROUSEL_END = PIN_A.endOf('services');

/** The transitions between the panels: five, for the six of them. */
export const STEPS = PANEL_COUNT - 1;

/** Pin progress → position inside the segment, clamped to its ends. */
export function localProgress(pin: number): number {
  const local = (pin - CAROUSEL_START) / (CAROUSEL_END - CAROUSEL_START);
  return local < 0 ? 0 : local > 1 ? 1 : local;
}

/**
 * Which panel is active at a given position in the segment.
 *
 * `Math.round` (not floor) is deliberate: the active panel is the NEAREST one,
 * so the index flips at the halfway point of each step, which is where the
 * incoming panel has just become the more visible of the two. Floor would flip
 * it a full step late and the indicator would disagree with the eye.
 */
export function scrollIndex(local: number): number {
  const i = Math.round(local * STEPS);
  return i < 0 ? 0 : i > STEPS ? STEPS : i;
}

/**
 * ScrollTrigger's `snapTo`, scoped to the carousel.
 *
 * Outside the segment the value passes through UNCHANGED. Snapping the whole
 * pin would drag the frame expansion to a size the user never asked for — the
 * single most jarring thing this component could do — so the guard is the point
 * of the function, not an edge case in it.
 */
export function snapProgress(pin: number): number {
  if (pin <= CAROUSEL_START || pin >= CAROUSEL_END) return pin;
  const snappedLocal = scrollIndex(localProgress(pin)) / STEPS;
  return CAROUSEL_START + snappedLocal * (CAROUSEL_END - CAROUSEL_START);
}

/** Pin progress at which panel `index` is centred. Used by keyboard paging. */
export function progressForIndex(index: number): number {
  const clamped = index < 0 ? 0 : index > STEPS ? STEPS : index;
  return CAROUSEL_START + (clamped / STEPS) * (CAROUSEL_END - CAROUSEL_START);
}

/**
 * Panel opacity at a given position in the segment: the active panel is 1, the
 * rest sit at 0.25, and each pair cross-fades over the MIDDLE 40% of its step.
 *
 * The flat 30% either side matters — it is what makes a panel look settled when
 * the scroll stops near a snap point rather than perpetually mid-fade. Opacity
 * is the ONLY thing that animates per panel: the horizontal translation already
 * says "navigation", and a title/description/CTA stagger on top of it says
 * nothing new while costing frames (BUILD-PLAN Phase 7's first common mistake).
 */
export const PANEL_DIM = 0.25;
const FADE_BAND = 0.4;

export function panelOpacity(index: number, local: number): number {
  const distance = Math.abs(local * STEPS - index);
  if (distance >= 1) return PANEL_DIM;
  // 0 at the panel's own position, 1 a full step away; remapped so the change
  // happens only across the middle FADE_BAND of the step.
  const edge = (1 - FADE_BAND) / 2; // 0.3
  const t = distance <= edge ? 0 : distance >= 1 - edge ? 1 : (distance - edge) / FADE_BAND;
  return 1 - (1 - PANEL_DIM) * t;
}

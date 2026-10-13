import { PANEL_COUNT } from '@/content/carousel';

/**
 * The pin's scroll budget, in viewport heights, and every progress value derived
 * from it.
 *
 * Before this module the boundaries were hand-typed decimals in two files:
 * `expandTimeline`'s `P` and `carouselTimeline`'s `CAROUSEL_START/END`. They
 * agreed only by convention, so changing the carousel's length meant editing
 * 0.88 in one file and remembering it also gated the snap in the other. There
 * was also a bare `0.94` in the exit with nothing to explain it (it was the
 * midpoint of the 60vh exit — but you had to do the arithmetic to know that).
 *
 * Here the vh allocation is the single source of truth and the decimals fall out
 * of it. `(PANEL_COUNT - 1) * 90` means the carousel's length follows the number
 * of services automatically, which TDD §9's scroll-budget note asks for
 * explicitly: "if the service count changes, this string and the progress
 * boundaries in §7 must change together."
 *
 * Imports `@/content` only — `motion/` is leafward of components and hooks, and
 * `content/` imports nothing outside itself, so there is no cycle.
 */

/** A named stretch of the pin, measured in viewport heights. */
export type Segment<N extends string = string> = readonly [name: N, vh: number];

export interface Span<N extends string = string> {
  readonly name: N;
  readonly vh: number;
  /** Distance in vh from the start of the pin. Kept so `at()` never has to
   *  recover it by multiplying a progress back up — that round-trip is exact for
   *  some tables and not others, and a sub-beat that drifts by one ulp from its
   *  own segment boundary is not a bug anyone finds by reading. */
  readonly startVh: number;
  /** Pin progress at which this segment begins. */
  readonly start: number;
  /** Pin progress at which it ends. */
  readonly end: number;
}

export interface ScrollBudget<N extends string = string> {
  readonly totalVh: number;
  /** Ready for `ScrollTrigger.end`, e.g. `'+=500%'`. */
  readonly end: string;
  readonly spans: readonly Span<N>[];
  /** Pin progress at the start of a segment. */
  startOf(name: N): number;
  /** Pin progress at the end of a segment. */
  endOf(name: N): number;
  /** Pin progress at fraction `f` (0..1) through a segment. */
  at(name: N, f: number): number;
  /** Pin progress at an absolute distance in vh from the start of the pin. */
  mark(vh: number): number;
  /**
   * A length of vh expressed in progress units, for a tween's `duration`.
   *
   * Arithmetically identical to `mark()`, and deliberately a separate name: a
   * position on the pin and a distance along it are different quantities, and
   * `duration: PIN_A.mark(30)` reads as though the tween ends at 30vh rather
   * than lasting for it.
   */
  span(vh: number): number;
}

export function buildBudget<N extends string>(
  segments: readonly Segment<N>[],
): ScrollBudget<N> {
  // Per-segment first, so a bad entry names itself rather than surfacing as the
  // generic total error. `!(vh > 0)` rather than `vh <= 0` to also reject NaN,
  // which would otherwise poison every derived progress silently.
  for (const [name, vh] of segments) {
    if (!(vh > 0)) throw new Error(`scrollBudget: segment "${name}" must be > 0vh`);
  }
  const totalVh = segments.reduce((sum, [, vh]) => sum + vh, 0);
  if (totalVh <= 0) throw new Error('scrollBudget: total must be > 0');

  const spans: Span<N>[] = [];
  let cursor = 0;
  for (const [name, vh] of segments) {
    spans.push({
      name,
      vh,
      startVh: cursor,
      start: cursor / totalVh,
      end: (cursor + vh) / totalVh,
    });
    cursor += vh;
  }

  const find = (name: N): Span<N> => {
    const span = spans.find((s) => s.name === name);
    if (!span) throw new Error(`scrollBudget: no segment named "${name}"`);
    return span;
  };

  return {
    totalVh,
    end: `+=${totalVh}%`,
    spans,
    startOf: (name) => find(name).start,
    endOf: (name) => find(name).end,
    // Reduced to a single division of vh by vh, exactly like `mark()`, so the two
    // are bit-identical at the same absolute position. `lerp(start, end, f)`
    // would not be: it divides twice and then interpolates between the results.
    at: (name, f) => {
      const span = find(name);
      return (span.startVh + span.vh * f) / totalVh;
    },
    mark: (vh) => vh / totalVh,
    span: (vh) => vh / totalVh,
  };
}

/**
 * The one pinned trigger's budget.
 *
 * 1015vh, and every progress value in the project derives from this table.
 * Change the table, never a decimal — and never a progress literal in a test
 * either: the e2e suite derives its targets from `progressForIndex` because the
 * typed ones silently stopped addressing the panels they were named for the last
 * time this table moved.
 *
 * Two of the six segments were bought rather than added. The aperture's 120vh
 * came out of the carousel, whose step went 90vh → 75vh, so everything up to the
 * fly-through fitted in the original 500.
 *
 * THE LAUNCHPAD PANEL IS THE FIRST THING TO LENGTHEN THIS PIN THAT IS NOT A NEW
 * ACT, and it did so on the client's explicit direction after the alternative was
 * put to them. A sixth panel is a fifth step, so `services` goes 300 → 375 and
 * the pin 940 → 1015. The other way to have taken it was a 60vh step, which holds
 * the total at 940 exactly — and pays for the new panel by making all five
 * existing transitions 20% faster, on a step that had already been tuned down
 * once. The step length is the tuned number here; the total is the derived one,
 * and that is the way round this table was built to work.
 *
 * "500vh feels too long" remains a logged standing risk and this is now 1015. If
 * it ever has to come back, the panel count is the honest knob — not the step.
 *
 * `title` at 120vh is a tuning knob, not a measurement. It carries §3.1's
 * positioning line, "Digital Growth Launchpad", and it has to fade in, hold long
 * enough to be read, and be gone before ignition — the card announces the story
 * the rocket then tells, so the two must never be on screen together.
 *
 * IT WAS 60vh AND THAT WAS TOO FAST TO READ. At an 800px viewport a 60vh card is
 * 480px of scroll for the entrance, the hold and the clear together — about five
 * wheel notches for the whole beat, on the one segment whose entire job is to be
 * read. The knob was turned rather than the timings inside it fudged: the
 * proportions in `titleTimeline.ts` were already right, there was simply not
 * enough distance under them. Everything else in the table is untouched, so the
 * card is still the only thing that has ever changed the length of this pin
 * besides the acts that were added to it.
 *
 * The launch keeps its 320vh exactly. `LEGS` in `launchTimeline.ts` maps vh to
 * path fraction, so changing the length here would silently re-time the whole
 * climb, including the near-stall through the break that the piece is built
 * around.
 */
export const PIN_A = buildBudget([
  ['frameScale', 30],
  ['frameExpand', 50],
  ['services', (PANEL_COUNT - 1) * 75],
  ['aperture', 120],
  ['title', 120],
  ['launch', 320],
] as const);

/**
 * THE PIN WITHOUT ITS LAST BEAT, for touch. The launch film is not on a phone.
 *
 * On the client's direction: the scrubbed film was too heavy on a phone in both
 * of the ways a video can be — 1.57 MiB to arrive, and a 1080p decode on every
 * seek to scrub — and after the download and the seek loop were both fixed and
 * measured, the answer was to take the beat off phones rather than keep tuning
 * it. So a phone's pin is 695vh and ends on the title card; §5 The Problem, which
 * `LaunchStatic` renders on the server for every visitor anyway, follows it
 * directly. Nothing is lost from the DOCUMENT — the growth story was always real
 * text below the pin, and the film was an enhancement over it.
 *
 * ## DERIVED, NEVER A SECOND TABLE
 *
 * The budget's own note says to change the table and never a decimal. A parallel
 * table for touch would be exactly the decimal that note forbids, one indirection
 * further out — so both numbers below are read back off `PIN_A`. Retime the
 * launch row and these follow it; delete the row and they stop compiling, which
 * is the correct failure.
 *
 * ## NOTHING BELOW IS CURRENTLY APPLIED — READ THIS FIRST
 *
 * The launch beat came back to phones on 2026-09-02 as a frame sequence
 * (`lib/rocket-frames.ts`), so BOTH devices run the whole 1015vh budget again.
 * `useHeroTimeline` passes `PIN_A.end` and a `COVER` of 1 for everyone, and
 * nothing reads `PIN_TOUCH_VH` or `PIN_TOUCH_END` outside `scroll-budget.test.ts`.
 *
 * They are kept, deliberately, because what they encode is not the cut but the
 * CHEAP WAY TO CUT — and the next beat dropped for a device wants exactly this
 * shape rather than a rediscovery of it. The rest of this docblock describes how
 * it worked while it ran, in the present tense it was written in.
 *
 * ## THE POSITIONS DO NOT MOVE, AND THAT IS WHY THIS IS CHEAP
 *
 * Every tween on the pin is placed at a progress read from `PIN_A` and none of
 * them change. What changes is only where the timeline STOPS: `buildExpandTimeline`
 * anchors its duration at `PIN_TOUCH_COVERAGE` instead of 1, and the trigger runs
 * `PIN_TOUCH_END` instead of `PIN_A.end`. Both scale by the same factor, so a
 * segment placed at progress `p` still lands at `p * 1015`vh of scroll on both
 * devices — the frame still scales over its 30vh, the carousel still steps every
 * 75vh. The alternative was a second budget threaded through five timeline files
 * whose constants are computed at import time, and it would have moved every one
 * of those numbers to do the same job.
 *
 * ## PIN PROGRESS AND BUDGET PROGRESS ARE NOT THE SAME NUMBER ON A CUT PIN
 *
 * This is the one thing to hold on to if the mechanism is ever switched back on.
 * ScrollTrigger's own `progress` is 0..1 over whatever the pin is, so on a cut
 * pin its 1.0 IS `PIN_TOUCH_COVERAGE` of the budget, not 1.0 of it. Anything
 * that interprets a progress against the budget — `beatForProgress`,
 * `snapProgress`, `scrollYForProgress`, the `data-progress` attribute the e2e
 * suite reads — has to be handed budget progress, and `useHeroTimeline` converts
 * once at the boundary rather than every call site remembering to. That
 * conversion is still there and is currently the identity.
 */
const LAUNCH_ROW = PIN_A.spans.find((s) => s.name === 'launch')!;

/** 695vh: the pin with the launch beat cut off the end. Not currently used. */
export const PIN_TOUCH_VH = PIN_A.totalVh - LAUNCH_ROW.vh;

/** Ready for `ScrollTrigger.end`, like `PIN_A.end`. */
export const PIN_TOUCH_END = `+=${PIN_TOUCH_VH}%`;

/**
 * How much of the budget a touch pin covers: `PIN_A.startOf('launch')`, which is
 * also `endOf('title')` by construction. Multiply pin progress by this to get
 * budget progress; divide to go back.
 */
export const PIN_TOUCH_COVERAGE = PIN_A.startOf('launch');

/**
 * How long the pinned timeline takes to catch up with the scroll, in seconds.
 *
 * The pin's other defining property, and it lives beside the budget for the same
 * reason: "how long the pin is" and "how tightly it follows" are one decision
 * about one trigger, and neither should be a literal at the call site.
 *
 * ## THE SAME NUMBER IS NOT THE SAME EXPERIENCE, BECAUSE THE INPUT IS NOT
 *
 * This was `1` for everyone, and on a phone that read as the film lagging behind
 * the finger. The constant was never the problem — what it is applied TO differs
 * completely between the two devices, and that had gone unnoticed:
 *
 *   - On a pointer device, Lenis smooths the wheel with its own lerp, so
 *     ScrollTrigger is handed a scroll position that has ALREADY been eased.
 *     `scrub: 1` is a second, gentle layer on top of a soft input. That is the
 *     silk it was tuned for.
 *   - On touch, `SmoothScroll` sets `syncTouch: false` — deliberately, so that
 *     scrolling stays native — which takes Lenis out of the loop entirely. The
 *     scroll position ScrollTrigger sees is then RAW: it moves at the speed of
 *     the finger and its momentum, with no easing in front of it at all. `scrub:
 *     1` is the only smoothing there is, and a full second of it against a
 *     hard-moving input is not smoothing, it is a trail.
 *
 * So the phone gets a shorter catch-up. Native momentum already supplies the
 * physical continuity that Lenis supplies on a laptop; all the scrub has to do
 * on touch is absorb frame-to-frame jitter, which 0.4s does with room to spare
 * (~24 frames at 60fps).
 *
 * ## THIS IS TUNING, NOT A SECOND EXPERIENCE, AND THE DISTINCTION IS THE CLIENT'S
 *
 * `HeroMount` records their direction that a phone gets the same scrolling
 * experience as a desktop, and Phase 10's attempt to suppress the pin below
 * 768px was reverted for it. That direction is about WHAT a phone gets — the
 * pin, the carousel, the aperture, the launch, all of it — and this changes none
 * of that. It is the other half of the same note: "the work that makes that GOOD
 * on a phone rather than merely present", which already includes `DOT_HOLD_TOUCH`,
 * `CLICK_TIMEOUT_TOUCH` and `LOGO_BUILD_TOUCH`. A touch-specific timing constant
 * is established practice in this codebase, not a departure from it.
 *
 * If the two ever need to converge again, converge them HERE — one edit, and the
 * call site in `useHeroTimeline` does not need to know.
 */
export const PIN_SCRUB = 1;

/** @see PIN_SCRUB — the touch value, and the note there for why it differs. */
export const PIN_SCRUB_TOUCH = 0.4;

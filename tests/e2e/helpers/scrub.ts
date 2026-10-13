import { expect, type Page } from '@playwright/test';
import { PIN_A } from '../../../motion/scrollBudget';
import {
  CAROUSEL_END,
  CAROUSEL_START,
  snapProgress,
} from '../../../motion/timelines/carouselTimeline';

/**
 * Landing the pin on a given progress, shared by every spec that scrolls.
 *
 * This lived as three near-copies, and the same class of failure kept appearing
 * in whichever copy had not been fixed yet. It is one implementation now.
 *
 * The hard part is Lenis. A wheel event does not move `scrollY` — it moves
 * Lenis's TARGET, which is then chased at `lerp: 0.1`. So the obvious loop
 * ("wheel while progress < target") is queuing scroll that has not landed, and
 * it sails well past the mark once it does. That overshoot was tolerable when
 * the segments were a large fraction of a 500vh pin; at 820vh the expansion is
 * under 10% of the pin and a coarse approach can cross a whole segment.
 *
 * Three phases:
 *   1. coarse — get within `FINE_BAND` fast
 *   2. fine   — small ticks, slow enough that Lenis lands most of each
 *   3. correct — close the last of the distance in either direction
 *
 * Phase 3 matters outside the carousel especially: the snap forgives an
 * overshoot inside it by dragging back to a panel, but `snapProgress` passes
 * through everywhere else, so an overshoot there simply stays overshot.
 */

const FINE_BAND = 0.05;

export const pinProgress = async (page: Page) =>
  Number((await page.locator('#qx-hero-root').getAttribute('data-progress')) ?? 0);

/** Poll until the pin's progress stops moving. */
export async function settleProgress(page: Page, tol = 0.0015) {
  let last = Number.NaN;
  await expect
    .poll(
      async () => {
        const p = await pinProgress(page);
        const stable = Math.abs(p - last) < tol;
        last = p;
        return stable;
      },
      { timeout: 12_000, intervals: [140] },
    )
    .toBe(true);
}

export interface ScrubOptions {
  /** How close is close enough, in pin progress. */
  tol?: number;
  /**
   * A numeric reader for the thing the caller is about to assert on, polled to
   * stability after the scroll lands.
   *
   * The pin's `data-progress` is the TRIGGER's instant progress, but everything
   * visible follows the SCRUBBED animation, and `scrub: 1` puts up to a second
   * between them. So "the scroll has arrived" and "the frame has arrived" are
   * different events, and asserting on the second while waiting for the first
   * reads the lag as a wrong value.
   *
   * Which element that is depends on the segment — the frame during the
   * expansion and the aperture, the track during the carousel — so the caller
   * names it rather than the helper guessing.
   */
  settleOn?: () => Promise<number>;
}

/**
 * Poll `read` until it has been stable for several consecutive samples.
 *
 * Several, not two. Both Lenis's lerp and `scrub: 1` approach their target
 * EXPONENTIALLY, so a value six pixels short of where it is heading still moves
 * less than half a pixel between two adjacent samples — it looks settled at any
 * tolerance while being visibly wrong. Requiring a run of stable samples waits
 * out the tail instead of stopping on its first flat-looking step.
 *
 * IT NO LONGER NUDGES, AND THAT SPLIT IS THE POINT — see `wakeTicker`.
 */
const STABLE_RUN = 3;

export async function settleValue(read: () => Promise<number>, tol = 0.5) {
  let last = Number.NaN;
  let run = 0;
  await expect
    .poll(
      async () => {
        const v = await read();
        run = Math.abs(v - last) < tol ? run + 1 : 0;
        last = v;
        return run;
      },
      { timeout: 15_000, intervals: [180] },
    )
    .toBeGreaterThanOrEqual(STABLE_RUN);
}

/**
 * Keep `gsap.ticker` awake for a moment, and ASSERT NOTHING.
 *
 * `gsap.ticker` sleeps when nothing is animating, and a scrubbed tween whose
 * input has stopped changing can freeze a few pixels short of its end value and
 * stay there. A tiny alternating wheel nudge keeps ScrollTrigger updating so the
 * scrub runs to completion; the alternating sign keeps net drift at zero.
 *
 * ## THIS USED TO BE A `settleValue` PARAMETER, AND THAT WAS THE BUG
 *
 * `settleValue(read, tol, page)` nudged BETWEEN its own samples — so it was
 * asked to prove a value had stopped moving while it was itself moving that
 * value. The two jobs are incompatible and the arithmetic says by how much:
 *
 *   - CAROUSEL. 2px of a 1015vh pin is 2.19e-4 of pin progress, and 0.001 of
 *     progress is ~13.3px of track travel, so each nudge moved the track 2.91px
 *     while the stage had to hold it within 0.5px — 5.8x the tolerance, three
 *     consecutive samples running. It could only pass when the alternating
 *     nudges happened to cancel, which is a coin toss, and `playwright.config.ts`
 *     recorded the result as "fails roughly one run in four".
 *   - APERTURE. Worse, and this is what proved it: the frame scales ~30x across
 *     that segment, so the same 2px moved `frameW` by far more than 0.5px and
 *     the poll NEVER reached three stable samples. Two tests timed out at
 *     `STABLE_RUN` 0 of 3 the moment `settleOn` was pointed at the frame.
 *
 * So the nudging moved out here, where it runs a fixed number of times and
 * claims nothing, and `settleValue` measures a genuinely still page. The two
 * used together are "wake the ticker, then prove the value" — which is what the
 * old two-stage call was reaching for and could not express.
 */
export async function wakeTicker(page: Page, samples = 6) {
  let sign = 1;
  for (let i = 0; i < samples; i++) {
    await page.mouse.wheel(0, 2 * sign);
    sign = -sign;
    await page.waitForTimeout(120);
  }
}

export async function scrubTo(page: Page, target: number, options: ScrubOptions = {}) {
  const tol = options.tol ?? 0.004;

  const approach = async (until: number, wheel: number, interval: number) => {
    if (until <= 0) return;
    await expect
      .poll(
        async () => {
          const p = await pinProgress(page);
          if (p < until) await page.mouse.wheel(0, wheel);
          return p;
        },
        { timeout: 25_000, intervals: [interval] },
      )
      .toBeGreaterThanOrEqual(until);
  };

  if (target > FINE_BAND) await approach(target - FINE_BAND, 300, 40);
  await approach(Math.max(0, target - tol), 30, 120);
  await settleProgress(page);

  /**
   * Inside the carousel the SNAP owns the final position, so correct only
   * coarsely — far enough to be in the right step, then hand over.
   *
   * Chasing an exact progress there fights the snap: it pulls toward the nearest
   * panel while the corrector pushes toward the requested value, and the loop
   * exits the moment it is within tolerance, parking the track between two
   * panels. But skipping correction entirely is wrong too, because an overshoot
   * can carry clean out of the carousel, where `snapProgress` passes through and
   * nothing brings it back.
   *
   * A third of a step is the useful middle: near enough that the snap resolves
   * to the intended panel, loose enough that it never argues with it.
   */
  const inCarousel = target > CAROUSEL_START && target < CAROUSEL_END;
  // Aim at where the SNAP wants to be, not at the requested progress. Then the
  // corrector and the snap are pulling the same way instead of arguing, and the
  // final position is the snap point rather than a truce between them.
  const aim = inCarousel ? snapProgress(target) : target;

  // Sized against the pin's REAL length, from the budget. A hard-coded pin
  // height here silently mis-sizes every corrective tick the moment the budget
  // table changes — which is the failure this whole file exists to stop.
  const pinPx = await page.evaluate((vh) => window.innerHeight * vh, PIN_A.totalVh / 100);
  await expect
    .poll(
      async () => {
        const delta = aim - (await pinProgress(page));
        if (Math.abs(delta) > tol) {
          const px = Math.max(8, Math.min(140, Math.abs(delta) * pinPx * 0.3));
          await page.mouse.wheel(0, Math.sign(delta) * px);
        }
        return Math.abs(delta);
      },
      { timeout: 25_000, intervals: [110] },
    )
    .toBeLessThanOrEqual(tol);
  await settleProgress(page);

  // In the carousel, wait for the snap to actually land on the panel.
  //
  // `settleProgress` alone is not enough: the snap has a 50ms delay and runs for
  // up to 400ms, so progress can look stable in the gap before it fires and the
  // helper would return with the track parked mid-step. Waiting on the property
  // that matters — "we are sitting where the snap wants us" — is both the real
  // condition and immune to the timing.
  if (inCarousel) {
    // AND IT NUDGES WHILE IT WAITS, rather than waiting passively.
    //
    // The corrector above exits as soon as it is within `tol` (0.004), on the
    // understanding that the snap closes the last of the distance. Usually it
    // does. But ScrollTrigger snaps once per scroll-stop, and if it has already
    // snapped before the corrector's final tick it will not necessarily fire
    // again for a gap this small — leaving the pin parked a few thousandths out
    // with nothing left to move it, and this poll timing out on a page that is
    // completely still. The observed failure was 0.0019 against a 0.001 bound,
    // held steady for the full 12 seconds.
    //
    // A small wheel toward `aim` is safe here precisely because `aim` IS the
    // snap point (see above): the nudge and the snap pull the same way, so this
    // cannot produce the tug-of-war the corrector is careful to avoid. Ticks are
    // small and capped so they cannot cross into the next step.
    await expect
      .poll(
        async () => {
          const delta = aim - (await pinProgress(page));
          if (Math.abs(delta) >= 0.001) {
            const px = Math.max(2, Math.min(20, Math.abs(delta) * pinPx));
            await page.mouse.wheel(0, Math.sign(delta) * px);
          }
          return Math.abs(delta);
        },
        { timeout: 12_000, intervals: [120] },
      )
      .toBeLessThan(0.001);

    // ...and then for the track to catch up with it. The snap can land while
    // the strip is still visibly sliding.
    //
    // TWO STAGES, and the second one is not belt-and-braces.
    //
    // The first passes `page`, so `settleValue` alternates a ±2px wheel nudge
    // between samples to keep `gsap.ticker` awake — without it a scrubbed tween
    // whose input has stopped changing can freeze short of its end value. But
    // near the carousel those 2px are not nothing: 2px of a 880vh pin is
    // ~7.4e-4 of the carousel span, which is ~3px of track travel — six times
    // the 0.5px tolerance being tested for. So the nudged stage can only ever
    // report "settled" on a sample where the alternating nudges happen to
    // cancel, and what it actually proves is "the ticker is awake and the track
    // is roughly there".
    //
    // The second stage supplies no `page` and therefore no nudges. With the
    // scroll input genuinely still, the scrub runs to completion and the track
    // stops on its true value, which is what a caller asserting flush-ness
    // needs.
    //
    // THIS IS A REAL BUG THIS FILE ONCE HAD, not a hypothetical. The bound the
    // stage above guarantees is the 0.001 progress poll: at 820vh that was
    // ~10.7px of track travel and `phase7-carousel`'s "panel 1 flush" assertion
    // allows 12px, so the suite passed on about a pixel of margin. Taking the
    // pin to 880vh moved the same bound to ~11.5px and the test began failing
    // every run — with nothing wrong in the app, which parks the track at
    // exactly 0.00 a second later.
    //
    // THE PIN IS NOW 1015vh, and that arithmetic moves again. What 0.001 of pin
    // progress is worth in track pixels is `trackTravel x totalVh / servicesVh`,
    // and BOTH factors moved when the Launchpad panel added a sixth panel:
    //
    //     820vh   3928px x 820/300  = ~10.7px   (passed, on a pixel of margin)
    //     880vh   3928px x 880/300  = ~11.5px   (began failing every run)
    //     940vh   3928px x 940/300  = ~12.3px
    //     1015vh  4910px x 1015/375 = ~13.3px
    //
    // The travel grew by a panel width and the ratio shrank, and the product went
    // up regardless — still past the 12px `phase7-carousel` allows. The first
    // stage's bound is therefore no longer sufficient ON ITS OWN, which is
    // precisely why the second one exists and why it must not be "simplified"
    // away. If that assertion ever starts flaking, this is the paragraph to read:
    // the fix is not a looser tolerance, it is that the un-nudged stage has to
    // run.
    const readTrackX = () =>
      page.evaluate(() => {
        const t = document.getElementById('qx-track');
        return t ? new DOMMatrixReadOnly(getComputedStyle(t).transform).m41 : 0;
      });
    await wakeTicker(page);
    await settleValue(readTrackX, 0.25);
  }

  if (options.settleOn) {
    await wakeTicker(page);
    await settleValue(options.settleOn, 0.5);
  }
}

/** Escape straight to `ready`, where the pin exists. */
export async function ready(page: Page) {
  await page.goto('/');
  await expect
    .poll(() => page.locator('#qx-hero-root').getAttribute('data-beat'))
    .toBe('dot-in');
  await page.keyboard.press('Escape');
  await expect
    .poll(() => page.locator('#qx-hero-root').getAttribute('data-beat'), { timeout: 5000 })
    .toBe('ready');
}

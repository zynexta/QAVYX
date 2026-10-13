import { test, expect, type Page } from '@playwright/test';
import {
  pinProgress,
  ready,
  scrubTo,
  settleProgress,
  settleValue,
  wakeTicker,
} from './helpers/scrub';
import { P } from '../../motion/timelines/expandTimeline';
import { TITLE_HELD } from '../../motion/timelines/titleTimeline';
import { PIN_A } from '../../motion/scrollBudget';
import { HERO_COPY } from '../../content/home';

/**
 * Phase 8E acceptance: the title card, and what the pin leaves behind.
 *
 * The card is the phase's one new beat. The camera flies out through the Q's
 * gap onto an empty screen, "Digital Growth Launchpad" names what is about to
 * happen, and then the rocket shows it. Everything else about the sequence is
 * unchanged — the card was inserted between the aperture and the launch, and no
 * segment was re-timed to make room (`tests/unit/scroll-budget.test.ts` holds
 * that against a frozen copy of the old table).
 *
 * The risk it introduces is paint. Every visual the pin drives is a
 * `position: fixed` sibling covering the viewport for the WHOLE document, so a
 * card left up covers §5 The Problem and everything below it — the same root
 * cause as the green trajectory that once ran through the site index.
 */

/** Computed paint state of a fixed layer, by id. */
async function isPainted(page: Page, id: string): Promise<boolean> {
  const { opacity, visibility } = await page.locator(`#${id}`).evaluate((el) => {
    const s = getComputedStyle(el);
    return { opacity: Number(s.opacity), visibility: s.visibility };
  });
  return visibility !== 'hidden' && opacity > 0.01;
}

/**
 * Every fixed layer that could cover the page below the pin.
 *
 * `#qx-frame` is deliberately absent. The aperture does not fade it — it grows
 * the box ~30x and flies the camera through the Q's gap — so at the end of the
 * pin the path is still at opacity 1 with every edge outside the viewport.
 * Painted, but covering nothing. The claim about the frame is geometric, and is
 * asserted as such below.
 */
const FIXED_LAYERS = [
  'qx-copy',
  'qx-wordmark',
  'qx-cursor',
  'qx-track-viewport',
  'qx-launch-title',
  'qx-launch-layer',
  'qx-ink-field',
];

/**
 * Scroll CLEAR of the pin, the way a visitor does — not to its progress 1.
 *
 * `scrubTo` lands within a tolerance of its target, and at the top end that
 * tolerance is the whole problem: the last 0.4% of the pin is ~3.5vh, and the
 * launch layer's handoff finishes inside it. Stopping there leaves it at ~0.1
 * opacity, which is not "still painted" in any sense a visitor would recognise
 * — it is simply not finished yet.
 *
 * The ticker nudge matters here for the usual reason: `gsap.ticker` sleeps when
 * nothing is animating, so a scrub whose input has stopped changing can freeze a
 * hair short of its end. It is `wakeTicker` now rather than a flag on
 * `settleValue` — the nudging and the measuring were one call and could not both
 * be true at once; see the note on `wakeTicker`.
 */
async function scrollPastThePin(page: Page) {
  await scrubTo(page, 1);
  await page.mouse.wheel(0, 900);
  await settleProgress(page);
  await wakeTicker(page);
  await settleValue(
    () =>
      page.locator('#qx-launch-layer').evaluate((el) => Number(getComputedStyle(el).opacity)),
    0.005,
  );
}

test.describe('the title card', () => {
  test('comes up after the fly-through, carrying §3.1’s positioning line', async ({ page }) => {
    await ready(page);
    await scrubTo(page, TITLE_HELD);

    expect(await isPainted(page, 'qx-launch-title')).toBe(true);
    await expect(page.locator('#qx-launch-title')).toContainText(HERO_COPY.eyebrow);
  });

  test('is not on screen during the carousel', async ({ page }) => {
    await ready(page);
    await scrubTo(page, (P.expandEnd + P.servicesEnd) / 2);

    expect(await isPainted(page, 'qx-track-viewport')).toBe(true);
    expect(await isPainted(page, 'qx-launch-title')).toBe(false);
    expect(await isPainted(page, 'qx-launch-layer')).toBe(false);
  });

  /**
   * The ordering claim, and the reason the card has a hold and a clear rather
   * than simply fading out under the rocket: a title and the thing it titles
   * must not share the screen.
   */
  test('is gone by the time the rocket is climbing', async ({ page }) => {
    await ready(page);
    await scrubTo(page, PIN_A.at('launch', 0.4));

    // THE LAUNCH IS `#qx-rocket-film` NOW, NOT `#qx-launch-layer`. The SVG
    // rocket this line used to name is still in the DOM but nothing drives it:
    // `expandTimeline` has `addLaunchSegment` commented out and hands the whole
    // 320vh to `addRocketVideoSegment`, so `#qx-launch-layer` is
    // `visibility: hidden` from `LaunchLayer`'s own markup for the entire pin.
    // Asserting it was painted could therefore never pass again — the beat did
    // not break, it moved, and this assertion was left behind by the move.
    //
    // The SVG is commented rather than deleted on the client's direction, so the
    // element stays and `cross-paint.test.ts` still holds it to being hidden.
    expect(await isPainted(page, 'qx-rocket-film')).toBe(true);
    expect(await isPainted(page, 'qx-launch-title')).toBe(false);
  });

  test('survives a resize while it is on screen', async ({ page }) => {
    await ready(page);
    await scrubTo(page, TITLE_HELD);

    await page.setViewportSize({ width: 1180, height: 820 });
    await page.waitForTimeout(400); // past the 160ms refresh debounce

    // `onRefresh` re-emits every segment of the timeline at the current
    // progress, and a seek backwards past a tween renders it at its START
    // state. The card must come back up, not vanish — and the rocket must not
    // arrive early on the way.
    expect(await isPainted(page, 'qx-launch-title'), 'the card vanished on resize').toBe(true);
    expect(await isPainted(page, 'qx-launch-layer'), 'the rocket arrived early').toBe(false);
  });
});

test.describe('what the pin leaves behind', () => {
  /**
   * The acceptance criterion that matters most. `#qx-stage` and every layer
   * beside it are fixed and cover the viewport for the whole document, so
   * anything still painted when the pin releases sits on top of §5 and
   * everything below it for the rest of the page.
   */
  test('nothing is painted over §5 once the pin releases', async ({ page }) => {
    await ready(page);
    await scrollPastThePin(page);

    for (const id of FIXED_LAYERS) {
      expect(await isPainted(page, id), `${id} is painting over §5`).toBe(false);
    }

    // The frame is not cleared, it is flown out — so the claim about it is that
    // it is bigger than the viewport, not that it is invisible.
    const frameWidth = (await page.locator('#qx-frame').boundingBox())?.width ?? 0;
    expect(frameWidth).toBeGreaterThan(1440);

    // And the content underneath is actually readable rather than merely
    // uncovered by things this test happened to list.
    await expect(page.getByRole('heading', { name: 'The Problem', level: 2 })).toBeVisible();
  });

  test('a resize below the pin paints nothing over the page', async ({ page }) => {
    await ready(page);
    await scrollPastThePin(page);

    await page.setViewportSize({ width: 1180, height: 820 });
    await page.waitForTimeout(400);
    for (const id of FIXED_LAYERS) {
      expect(await isPainted(page, id), `${id} painted after a resize below the pin`).toBe(
        false,
      );
    }

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(400);
    for (const id of FIXED_LAYERS) {
      expect(await isPainted(page, id), `${id} painted after resizing back`).toBe(false);
    }
  });

  /**
   * The reciprocal: a re-emission must not TAKE AWAY what is correctly on
   * screen either. `reemitAt` reaches progress 0 with a forced render at exactly
   * time 0 rather than by seeking to the far end and back — the old nudge ran
   * the entire growth story to its last frame on every resize at the top of the
   * pin, and segments that decline to write at their own t=0 then left that
   * wreckage standing.
   */
  test('a resize at the top of the pin leaves the logo alone', async ({ page }) => {
    await ready(page);
    expect(await pinProgress(page)).toBe(0);

    await page.setViewportSize({ width: 1180, height: 820 });
    await page.waitForTimeout(400);

    expect(await isPainted(page, 'qx-wordmark'), 'the wordmark vanished at rest').toBe(true);
    expect(await isPainted(page, 'qx-launch-layer'), 'the rocket ran at rest').toBe(false);
    expect(await isPainted(page, 'qx-launch-title'), 'the card ran at rest').toBe(false);
    // The frame is still the bowl, not the aperture's flown-out box.
    const frameWidth = (await page.locator('#qx-frame').boundingBox())?.width ?? 0;
    expect(frameWidth).toBeLessThan(400);
  });
});

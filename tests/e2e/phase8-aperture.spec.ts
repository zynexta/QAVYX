import { test, expect, type Page } from '@playwright/test';
import { ready, scrubTo } from './helpers/scrub';
import { computeFrameGeometry, frameOpenFraction, restGapProfile } from '../../motion/geometry';
import { PIN_A } from '../../motion/scrollBudget';
import { apertureBox } from '../../motion/timelines/apertureTimeline';

/**
 * Phase 8 acceptance: the frame never closes, and the camera flies out through
 * the gap that was always there.
 *
 * The Q's bottom-right gap is open from `boot` — through the expansion, through
 * the carousel, and through this segment — so after the last service the panels
 * clear and the camera passes through it. The claim worth testing in
 * a real browser, rather than in the unit arithmetic which already proves it
 * algebraically, is that the gap holds STILL on screen while everything around
 * it accelerates outward. That fixed point is what makes the move read as a
 * camera passing through an opening instead of a rectangle growing.
 */

const progress = async (page: Page) =>
  Number((await page.locator('#qx-hero-root').getAttribute('data-progress')) ?? 0);

const APERTURE_START = PIN_A.startOf('aperture');

/**
 * The frame's box, read from the path's geometry bbox (which excludes the
 * stroke, so it is exactly the box the timeline wrote), plus the gap point
 * derived from it with the same ratios the path is built from.
 */
async function frameState(page: Page, bar: number, stub: number) {
  return page.evaluate(
    ([barF, stubF]) => {
      const el = document.getElementById('qx-frame') as SVGPathElement | null;
      if (!el) return null;
      const b = el.getBBox();
      const dash = el.getAttribute('stroke-dasharray') ?? '';
      return {
        x: b.x,
        y: b.y,
        w: b.width,
        h: b.height,
        gapX: b.x + (b.width * (1 + barF!)) / 2,
        gapY: b.y + (b.height * (1 + stubF!)) / 2,
        drawn: Number(dash.split(' ')[0] ?? 0),
        fillOpacity: Number(
          el.getAttribute('fill-opacity') ?? (el.getAttribute('fill') === 'none' ? 0 : 1),
        ),
      };
    },
    [bar, stub] as const,
  );
}

// The FROZEN profile the segment uses — the design frame's, not the bowl's
// constants. Reading the gap point with the wrong profile would report drift
// that is not there (or hide drift that is).
const GAP = restGapProfile(1440, 900);
const state = (page: Page) => frameState(page, GAP.bar, GAP.stub);

/**
 * The frame's box width — and the reader every `scrubTo` in this file hands to
 * `settleOn`.
 *
 * WITHOUT IT THESE TESTS ASSERT ON A VALUE THAT IS STILL MOVING. `scrubTo`
 * lands the pin's `data-progress`, which is the TRIGGER's instant progress; the
 * frame follows the SCRUBBED animation, and `scrub: 1` puts up to a second
 * between the two. Every assertion below reads the frame's geometry, so waiting
 * for the scroll and asserting on the frame reads the lag as a wrong number.
 *
 * Measured, not theorised: "holds the gap still on screen" failed 1 run in 6
 * this way — `after.w / before.w` came out 1.7355 against a 1.7373 bound, short
 * by 0.1%, because the sample was taken a frame before the dolly finished. The
 * helper's own docblock names the frame as the right reader "during the
 * expansion and the aperture"; this file simply never passed one.
 */
const frameW = (page: Page) => state(page).then((s) => s?.w ?? 0);

const inkOpacity = (page: Page) =>
  page.locator('#qx-ink-field').evaluate((el) => Number(getComputedStyle(el).opacity));

test.describe('the aperture', () => {
  test('keeps the stage inside its node budget', async ({ page }) => {
    // TDD §12 caps the stage at 60 nodes. It is a shared budget — the launch
    // layer has to fit in what is left — so it is asserted here rather than
    // counted by hand whenever something is added.
    await page.goto('/');
    const nodes = await page
      .locator('#qx-stage')
      .evaluate((el) => el.querySelectorAll('*').length + 1);
    expect(nodes).toBeLessThanOrEqual(60);
  });

  test('never closes the Q’s gap — it is open before, during and after', async ({ page }) => {
    await ready(page);

    // The design frame's own open fraction, ~93.3 — not the bowl's measured
    // 89.4. The notch is sized from the stroke and grows far slower than the box.
    const open = frameOpenFraction(computeFrameGeometry(1440, 900), GAP) * 100;

    // Open through the carousel. This is the assertion that inverted: the frame
    // used to arrive here as a complete rounded rect and get cut back open.
    await scrubTo(page, APERTURE_START - 0.05, { settleOn: () => frameW(page) });
    expect((await state(page))!.drawn).toBeCloseTo(open, 1);

    // Still open once the panels have cleared and the dolly is under way.
    await scrubTo(page, APERTURE_START + PIN_A.span(55), { settleOn: () => frameW(page) });
    expect((await state(page))!.drawn).toBeCloseTo(open, 1);

    // And still open deep into the fly-through, where the box has grown past the
    // viewport. The dash is a percentage of pathLength, so this is really the
    // check that the dolly is a homothety — a non-uniform scale would change the
    // aspect and walk the caps off their terminals as the camera closed in.
    await scrubTo(page, APERTURE_START + PIN_A.span(100), { settleOn: () => frameW(page) });
    expect((await state(page))!.drawn).toBeCloseTo(open, 1);
  });

  test('holds the gap still on screen while the frame flies past the camera', async ({
    page,
  }) => {
    await ready(page);
    await scrubTo(page, APERTURE_START + PIN_A.span(55), { settleOn: () => frameW(page) });
    const before = (await state(page))!;

    await scrubTo(page, APERTURE_START + PIN_A.span(100), { settleOn: () => frameW(page) });
    const after = (await state(page))!;

    // The frame has grown a long way — by the factor the dolly actually calls
    // for at these two positions, not by a typed one.
    //
    // This assertion used to read `> before.w * 2`, which was a literal chosen
    // against a 19.5x dolly. It is the kind of number that silently stops
    // meaning what it says: widening the notch moved the gap point away from the
    // near edge, the scale needed to cover the viewport fell to 6.8x, the growth
    // between these samples became 1.96x, and a real and correct frame failed a
    // test named for something it was still doing.
    const predicted = apertureBox(100 / 120, 1440, 900).w / apertureBox(55 / 120, 1440, 900).w;
    expect(after.w / before.w).toBeGreaterThan(predicted * 0.9);
    expect(after.w).toBeGreaterThan(1440);

    // ...and the gap has not moved. The tolerance is a couple of pixels for the
    // scrub's sub-pixel settle, against a box that grew by thousands.
    expect(Math.abs(after.gapX - before.gapX)).toBeLessThan(3);
    expect(Math.abs(after.gapY - before.gapY)).toBeLessThan(3);
  });

  test('hands the interior to the ink field only once it is fully covered', async ({
    page,
  }) => {
    await ready(page);

    // Mid-dolly: the frame still paints its own interior, the field is clear.
    await scrubTo(page, APERTURE_START + PIN_A.span(70), { settleOn: () => frameW(page) });
    expect((await state(page))!.fillOpacity).toBe(1);
    expect(await inkOpacity(page)).toBe(0);

    // Past the handoff: the field has taken over and the frame's fill is gone.
    // Both are --qx-ink, so the swap is invisible — the test is the only way to
    // see it happened at all.
    //
    // Tight tolerance here, unlike everywhere else in this file. The window in
    // which the field is fully opaque runs from the handoff (~99.5vh into the
    // aperture) to the start of the clear-out (105vh), which is narrower than
    // this spec's default scrub tolerance — so the default would straddle it
    // and report a flake as a failure.
    await scrubTo(page, APERTURE_START + PIN_A.span(102), {
      tol: 0.002,
      settleOn: () => frameW(page),
    });
    expect(await inkOpacity(page)).toBe(1);
    expect((await state(page))!.fillOpacity).toBe(0);
  });

  test('gives the frame back to the expansion when scrolled above it', async ({ page }) => {
    // Regression: the aperture's onUpdate fires at t=0 whenever the pin
    // refreshes, because a backwards seek renders a tween at its start state.
    // Since it is later in timeline order, writing the frame there beat the
    // expansion's own writes and pinned the frame at its rest box for the whole
    // of Engine 2 — a bowl that never grew, on every refresh.
    await ready(page);
    await scrubTo(page, APERTURE_START + PIN_A.span(100), { settleOn: () => frameW(page) });
    expect((await state(page))!.w).toBeGreaterThan(1440);

    // Back up into the middle of the expansion.
    await expect
      .poll(
        async () => {
          if ((await progress(page)) > 0.08) await page.mouse.wheel(0, -200);
          return progress(page);
        },
        { timeout: 25_000, intervals: [60] },
      )
      .toBeLessThanOrEqual(0.08);

    await expect.poll(async () => (await state(page))!.w, { timeout: 8000 }).toBeLessThan(1000);
    // ...and the dash is the mid-expansion box's own open fraction, exactly as
    // the expansion left it — not this segment's, which is the rest frame's.
    await expect.poll(async () => (await state(page))!.drawn).toBeLessThan(100);
    expect(await inkOpacity(page)).toBe(0);
  });
});

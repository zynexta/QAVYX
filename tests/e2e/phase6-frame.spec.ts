import { test, expect, type Page } from '@playwright/test';
import { ready, scrubTo as scrub } from './helpers/scrub';
import { P } from '../../motion/timelines/expandTimeline';
import { computeFrameGeometry, frameOpenFraction, restGapProfile } from '../../motion/geometry';

/**
 * Targets derived from the segment map, never typed as decimals.
 *
 * This spec used to carry literals (0.05, 0.11, 0.15...) chosen against a 500vh
 * pin. They stopped meaning what they were named the moment the pin grew to
 * 820vh — 0.05 became mid-expansion instead of before it, and 0.11 became past
 * the end instead of the middle — and every failure read as a broken expansion
 * rather than as a stale target.
 */
const between = (a: number, b: number) => (a + b) / 2;

/**
 * Every assertion in this spec reads the FRAME, so every scrub settles on it.
 * The frame follows the scrubbed timeline, which lags the trigger progress the
 * helper waits on by up to a second.
 */
const scrubTo = (page: Page, target: number) =>
  scrub(page, target, {
    settleOn: async () => (await page.locator('#qx-frame').boundingBox())?.width ?? 0,
  });
/**
 * Comfortably past a boundary, not a hair past it.
 *
 * `scrub: 1` means the frame trails the trigger's progress, and both Lenis and
 * the scrub approach their targets exponentially — so a probe placed just past
 * the end of the expansion reads a frame that is still a few pixels short of
 * full size, forever. "After the expansion" honestly means "somewhere in the
 * segment that follows it", and there the lag cannot matter.
 */
const after = (mark: number) => mark + (P.servicesEnd - mark) * 0.15;

/**
 * Phase 6 acceptance: the Q's bowl becomes the 70% design frame, measured rather
 * than eyeballed.
 *
 * The viewport is 1440x900 (playwright.config), so:
 *   bowl        140.8 x 96.9 px      frame  1008 x 630 px (70vw x 70vh)
 *   pin range   500% of 900px        = 4500px of scroll, so p 0.01 = 45px
 *
 * We never wait on wall-clock for an animation. `scrubTo` wheels until the pin's
 * TRIGGER progress passes a target, then `settle` polls until the scrubbed
 * animation has caught up with it — so scrub:1's lag is the thing under test
 * rather than a source of flake.
 */

/** Geometry (getBBox, stroke excluded) and paint state of the one frame path. */
const frameState = (page: Page) =>
  page.locator('#qx-frame').evaluate((el) => {
    const path = el as SVGPathElement;
    const bbox = path.getBBox(); // user units, geometry only — no stroke
    const style = getComputedStyle(path);
    // User units -> CSS pixels. The stage is authored 1:1, so this is 1 — but
    // reading it is the point: a `scale` anywhere above the path (or a viewBox
    // that stopped matching the viewport) shows up here and nowhere else, and it
    // is exactly what would multiply the stroke while leaving its attribute
    // untouched. `getBoundingClientRect` cannot see it: for SVG it reports the
    // geometry box, stroke excluded.
    const ctm = path.getScreenCTM()!;
    const scale = Math.sqrt(Math.abs(ctm.a * ctm.d - ctm.b * ctm.c));
    const strokeWidth = Number(path.getAttribute('stroke-width'));
    return {
      geomW: bbox.width * scale, // on-screen size, in CSS pixels
      geomH: bbox.height * scale,
      /** What the stroke actually measures on screen. */
      screenStroke: strokeWidth * scale,
      scale,
      strokeWidth,
      stroke: style.stroke,
      fillAttr: path.getAttribute('fill'),
      fillOpacityAttr: path.getAttribute('fill-opacity'),
      dash: path.getAttribute('stroke-dasharray'),
      // Nothing may animate this element via inline styles or a transform.
      inlineStroke: path.style.stroke,
      inlineFill: path.style.fill,
      transform: style.transform,
    };
  });

const progress = async (page: Page) =>
  Number((await page.locator('#qx-hero-root').getAttribute('data-progress')) ?? 0);

/** Poll until the scrubbed frame stops moving (two reads within 0.25px). */
async function settle(page: Page) {
  let last = Number.NaN;
  await expect
    .poll(
      async () => {
        const { geomW } = await frameState(page);
        const stable = Math.abs(geomW - last) < 0.25;
        last = geomW;
        return stable;
      },
      { timeout: 10_000, intervals: [120] },
    )
    .toBe(true);
}



test.describe('engine 2: frame expansion', () => {
  test('lands on exactly 70vw x 70vh with the stroke it started with', async ({ page }) => {
    await ready(page);
    const rest = await frameState(page);
    expect(rest.geomW).toBeCloseTo(140.8, 0); // the Q bowl

    // Sample the stroke mid-expansion, where a scale transform would have
    // thickened it, and again at the end.
    await scrubTo(page, between(P.scaleEnd, P.expandEnd));
    const mid = await frameState(page);
    expect(mid.geomW).toBeGreaterThan(400);
    expect(mid.geomW).toBeLessThan(900);

    await scrubTo(page, after(P.expandEnd));
    const end = await frameState(page);

    // 70% of the viewport, exactly, on both axes.
    expect(end.geomW).toBeCloseTo(1008, 0);
    expect(end.geomH).toBeCloseTo(630, 0);

    // The stroke measures the same number of CSS pixels at the bowl, mid-flight
    // and at full viewport, while the geometry grew 7.2x. A scale transform —
    // the obvious way to write this expansion, and the wrong one — would have
    // taken the stroke from 12.9px to 92px.
    expect(rest.screenStroke).toBeCloseTo(12.95, 1);
    expect(mid.screenStroke).toBeCloseTo(rest.screenStroke, 2);
    expect(end.screenStroke).toBeCloseTo(rest.screenStroke, 2);
    expect(end.geomW / rest.geomW).toBeCloseTo(7.16, 1);
    expect(end.scale).toBeCloseTo(1, 3); // 1 user unit is still 1 CSS pixel
    expect(end.transform).toBe('none');

    // The gap has NOT drawn shut. The expanded workspace is still the Q — the
    // mark carries all the way out rather than becoming an anonymous rectangle
    // at the size it is most visible.
    //
    // Derived, never typed. It is ~98.6 here, not the bowl's 89.4: the notch is
    // sized in stroke widths, so it does not grow with the box, and by the
    // workspace it is ~28px on a perimeter of ~3240.
    const open = frameOpenFraction(computeFrameGeometry(1440, 900), restGapProfile(1440, 900)) * 100;
    expect(Number(end.dash!.split(' ')[0])).toBeCloseTo(open, 1);
    expect(Number(end.dash!.split(' ')[0])).toBeLessThan(99);
  });

  test('the cursor is gone before the frame can overlap it', async ({ page }) => {
    await ready(page);
    // p 0.05: past the cursor's fade, before the box moves at the end of the
    // `frameScale` segment. Both derived — this pin's boundaries moved from /820
    // to /500 when Phase 8E split the growth story off onto its own trigger, and
    // literals here would have silently stopped addressing the segment they were
    // named for.
    await scrubTo(page, between(P.cursorOut, P.scaleEnd));
    await expect(page.locator('#qx-cursor')).toHaveCSS('opacity', '0');
    const { geomW } = await frameState(page);
    expect(geomW).toBeCloseTo(140.8, 0); // still bowl-sized — nothing to overlap
  });

  test('the stroke greens as the mark becomes a container', async ({ page }) => {
    await ready(page);
    // At rest the path is the logo's Q, so it is the wordmark's white.
    expect((await frameState(page)).stroke).toBe('rgb(242, 245, 243)');

    await scrubTo(page, between(P.scaleEnd, P.fillStart)); // ramp completes at scaleEnd
    expect((await frameState(page)).stroke).toBe('rgb(26, 122, 14)'); // --qx-green-dim
  });

  test('the interior stays unfilled until the last 40% of the expansion', async ({ page }) => {
    await ready(page);
    const rest = await frameState(page);
    expect(rest.fillAttr).toBe('none');
    expect(rest.fillOpacityAttr).toBeNull();

    // p 0.075 — the frame is visibly growing but the fill has not started. A
    // filled full-viewport path is the expensive part of this segment, so it
    // must not be paid for during the widest part of the move.
    // Between the box starting to grow and the fill starting to appear — the
    // widest part of the move, which is exactly what must not be paid for.
    await scrubTo(page, between(P.scaleEnd, P.fillStart));
    const early = await frameState(page);
    expect(early.geomW).toBeGreaterThan(200); // genuinely mid-expansion
    expect(early.geomW).toBeLessThan(600);
    expect(early.fillAttr).toBe('none');
    expect(early.fillOpacityAttr).toBeNull();

    await scrubTo(page, between(P.fillEnd, P.expandEnd));
    const filled = await frameState(page);
    expect(filled.fillAttr).toBe('var(--qx-ink)');
    expect(Number(filled.fillOpacityAttr)).toBeGreaterThan(0);
  });

  test('scrolling back up leaves no residue', async ({ page }) => {
    await ready(page);
    await scrubTo(page, after(P.expandEnd));
    expect((await frameState(page)).geomW).toBeCloseTo(1008, 0);

    // All the way back to the top.
    await expect
      .poll(
        async () => {
          const p = await progress(page);
          if (p > 0) await page.mouse.wheel(0, -600);
          return p;
        },
        { timeout: 20_000, intervals: [40] },
      )
      .toBeLessThanOrEqual(0.0005);
    await settle(page);

    const back = await frameState(page);
    expect(back.geomW).toBeCloseTo(140.8, 0); // the bowl again
    expect(back.fillAttr).toBe('none');
    expect(back.fillOpacityAttr).toBeNull();
    expect(back.stroke).toBe('rgb(242, 245, 243)');
    expect(Number(back.dash!.split(' ')[0])).toBeCloseTo(89.4, 1); // open Q
    // The frame is driven by presentation attributes only — an inline style
    // left behind here would win over the token forever after.
    expect(back.inlineStroke).toBe('');
    expect(back.inlineFill).toBe('');
    expect(back.transform).toBe('none');

    // And the mark is back: wordmark and cursor faded in again. The wordmark
    // fades over the very last slice (p0-0.06), so with scrub:1 it is the last
    // thing to finish easing up — and `settle` above watches the (stationary)
    // frame, not this. Keep nudging scroll-up while polling: at the top the
    // wheel does not move the page but it keeps ScrollTrigger updating, so the
    // scrub tween runs to completion instead of freezing a hair short when
    // GSAP's ticker sleeps. (That freeze used to be hidden by the dev overlay's
    // permanent ticker tick; in production the overlay never renders, so this
    // is the real settle path.) The exact "no residue" guarantees are the
    // attribute/inline-style checks above.
    const opacityOf = (id: string) =>
      page.locator(id).evaluate((el) => Number(getComputedStyle(el).opacity));
    await expect
      .poll(
        async () => {
          await page.mouse.wheel(0, -200);
          const [w, c] = await Promise.all([
            opacityOf('#qx-wordmark'),
            opacityOf('#qx-cursor'),
          ]);
          return Math.min(w, c);
        },
        { timeout: 8000, intervals: [100] },
      )
      .toBeGreaterThan(0.999);
  });

  test('a FAST flick expands the frame monotonically — it never zooms twice', async ({
    page,
  }) => {
    await ready(page);

    // Sample the frame's rendered width every animation frame while a hard flick
    // drives the expansion.
    await page.evaluate(() => {
      const w = window as unknown as { __w: number[]; __raf: number };
      w.__w = [];
      const f = document.getElementById('qx-frame')!;
      const tick = () => {
        w.__w.push(f.getBoundingClientRect().width);
        w.__raf = requestAnimationFrame(tick);
      };
      tick();
    });

    for (let i = 0; i < 3; i++) {
      await page.mouse.wheel(0, 900);
      await page.waitForTimeout(12);
    }
    await page.waitForTimeout(2500);

    const widths = await page.evaluate(() => {
      const w = window as unknown as { __w: number[]; __raf: number };
      cancelAnimationFrame(w.__raf);
      return w.__w;
    });

    // The expansion must only ever GROW. It used to jump straight to full size
    // (the beat, taken from the trigger's instant progress, ran ahead of the
    // scrubbed animation and React painted the expanded box), then shrink back by
    // ~400px as GSAP's lagging update overwrote it, then grow again — read on
    // screen as the frame zooming two or three times on one fast scroll.
    let peak = 0;
    let worstDip = 0;
    for (const v of widths) {
      if (v > peak) peak = v;
      if (peak > 200 && peak - v > worstDip) worstDip = peak - v;
    }
    expect(worstDip).toBeLessThan(8); // sub-pixel/rounding only, never a re-zoom
    expect(Math.max(...widths)).toBeCloseTo(1008, 0);
  });
});

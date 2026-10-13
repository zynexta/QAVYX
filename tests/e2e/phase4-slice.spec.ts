import { test, expect, type Page } from '@playwright/test';
import { scrubTo } from './helpers/scrub';
import { P } from '../../motion/timelines/expandTimeline';

/**
 * Phase 4 acceptance: the whole spine, end to end, in a real browser.
 *
 * Per playwright.config's doctrine we never wait on wall-clock time for an
 * animation — we drive the input (move, click, wheel) and POLL the resulting
 * DOM state, so a scrub:1 lag is the behaviour under test rather than a flake.
 */

const beat = (page: Page) =>
  page.locator('#qx-hero-root').getAttribute('data-beat');

/** Centre of an element's rendered box, or null if it has none. */
async function centre(page: Page, selector: string) {
  const box = await page.locator(selector).boundingBox();
  return box ? { x: box.x + box.width / 2, y: box.y + box.height / 2 } : null;
}

test.describe('vertical slice', () => {
  test('renders exactly one of each single-node element', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#qx-stage')).toHaveCount(1);
    await expect(page.locator('#qx-cursor')).toHaveCount(1);
    await expect(page.locator('#qx-frame')).toHaveCount(1);
    // The stage carries no information; it is aria-hidden.
    await expect(page.locator('#qx-stage')).toHaveAttribute('aria-hidden', 'true');
    // The accessible name is real DOM text, present from the start.
    await expect(page.getByRole('heading', { level: 1, name: 'Qavyx' })).toBeAttached();
  });

  test('the dot follows the pointer', async ({ page }) => {
    await page.goto('/');
    await expect.poll(() => beat(page)).toBe('dot-in');

    // The dot starts at viewport centre (720). Moving to 500 must drag it left.
    await page.mouse.move(500, 400);
    await expect
      .poll(async () => (await centre(page, '#qx-cursor'))?.x ?? 999, { timeout: 4000 })
      .toBeLessThan(560);

    // Then on toward 1000 — it follows, it does not teleport.
    await page.mouse.move(1000, 650);
    await expect
      .poll(async () => (await centre(page, '#qx-cursor'))?.x ?? -1, { timeout: 4000 })
      .toBeGreaterThan(900);
  });

  test('the dot morphs into the mouse icon in place', async ({ page }) => {
    await page.goto('/');
    await expect.poll(() => beat(page)).toBe('dot-in');

    // Moving the pointer wakes the intro; after dot-in the dot morphs (even when
    // the move lands mid-dot-in — the regression this guards).
    await page.mouse.move(880, 520);
    await expect
      .poll(
        async () => {
          const b = await page.locator('#qx-cursor').boundingBox();
          return b ? Math.max(b.width, b.height) : 0;
        },
        { timeout: 5000 },
      )
      .toBeGreaterThan(18); // grew from the 12px dot into the mouse glyph

    // The morph happened in place: the glyph is still under the pointer, not
    // translated toward the Q's gap.
    const c = await centre(page, '#qx-cursor');
    expect(Math.abs((c?.x ?? 0) - 880)).toBeLessThan(45);
    expect(Math.abs((c?.y ?? 0) - 520)).toBeLessThan(45);
    await expect.poll(() => beat(page), { timeout: 5000 }).toBe('click');
  });

  test('click builds the logo and reaches ready', async ({ page }) => {
    await page.goto('/');
    await expect.poll(() => beat(page)).toBe('dot-in');

    await page.mouse.move(600, 450);
    await page.mouse.click(600, 450);

    // travel + draw + reveal, then the handoff to scroll.
    await expect.poll(() => beat(page), { timeout: 8000 }).toBe('ready');

    // The green tip landed in the Q's gap.
    await expect(page.locator('#qx-mouse-tip')).toHaveCSS('opacity', '1');

    // The cursor travelled to the gap and landed ON the tip (not merely near the
    // Q) — the tip is authored at the anchor, so their centres must coincide.
    const cursor = await centre(page, '#qx-cursor');
    const tip = await centre(page, '#qx-mouse-tip');
    expect(cursor && tip).toBeTruthy();
    expect(Math.hypot(cursor!.x - tip!.x, cursor!.y - tip!.y)).toBeLessThan(20);
  });

  test('pin, expansion with constant stroke, translate, and clean unpin', async ({ page }) => {
    await page.goto('/');
    await expect.poll(() => beat(page)).toBe('dot-in');
    await page.mouse.move(600, 450);
    await page.mouse.click(600, 450);
    await expect.poll(() => beat(page), { timeout: 8000 }).toBe('ready');

    // The TWO pinned triggers reserve 500vh + 380vh between them, so the
    // document is now many screens tall (it was ~2 during the locked intro).
    const scrollH = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(scrollH).toBeGreaterThan(4000);

    const frameWidth = async () => (await page.locator('#qx-frame').boundingBox())?.width ?? 0;
    const strokeAttr = () => page.locator('#qx-frame').getAttribute('stroke-width');

    // At rest the Q bowl is small.
    expect(await frameWidth()).toBeLessThan(400);
    const strokeAtStart = await strokeAttr();

    // Scroll into the expansion. Driven by `scrubTo` rather than a raw wheel
    // distance: the helper wheels until the pin's own progress says it has
    // arrived, which is the same claim expressed in terms that survive a change
    // to the scroll budget.
    await scrubTo(page, P.expandEnd, { settleOn: frameWidth });
    expect(await frameWidth()).toBeGreaterThan(900); // -> ~70vw (1008)

    // Stroke width must NOT change during the expansion (d animates, not scale).
    expect(await strokeAttr()).toBe(strokeAtStart);

    // Drive through the carousel segment: the track translates left.
    const trackX = () =>
      page.evaluate(() => {
        const t = document.getElementById('qx-track');
        return t ? new DOMMatrixReadOnly(getComputedStyle(t).transform).m41 : 0;
      });
    await scrubTo(page, (P.expandEnd + P.servicesEnd) / 2, { settleOn: trackX });
    await expect.poll(trackX, { timeout: 8000 }).toBeLessThan(-200); // moved left

    // Scroll to the end. The frame does NOT fade out — it reopens the Q's gap
    // and flies past the camera, so the acceptance is that it grew past the
    // viewport with its opening restored, not that the stage went to opacity 0.
    await scrubTo(page, (P.servicesEnd + P.apertureEnd) / 2);
    await expect.poll(() => beat(page), { timeout: 8000 }).toMatch(/aperture|done/);

    // The frame is now wider than the viewport.
    await expect
      .poll(async () => (await page.locator('#qx-frame').boundingBox())?.width ?? 0, {
        timeout: 8000,
      })
      .toBeGreaterThan(1440);

    // ...and the gap is still open: the dash's first value never reached 100.
    const drawn = Number(
      ((await page.locator('#qx-frame').getAttribute('stroke-dasharray')) ?? '100').split(' ')[0],
    );
    // ~93.3 at this viewport. Bounded well clear of 100 (the closed rectangle)
    // and of the bowl's 89.4 (which would mean the notch had gone back to
    // scaling with the box); the exact figure follows GAP_GROWTH.
    expect(drawn).toBeGreaterThan(91);
    expect(drawn).toBeLessThan(99);

    // The carousel is cleared, and the stage is still painted — it is the ink
    // field that carries the interior from here.
    expect(
      await page.locator('#qx-track-viewport').evaluate((el) => getComputedStyle(el).visibility),
    ).toBe('hidden');
    expect(await page.locator('#qx-stage').evaluate((el) => getComputedStyle(el).opacity)).toBe(
      '1',
    );

    // The page scrolls on to the growth story, which is real server-rendered
    // content rather than the Phase-4 placeholder it replaced.
    await expect(page.getByRole('heading', { name: 'The Problem', level: 2 })).toBeVisible();
  });

  test('resize mid-experience recovers without a pin jump', async ({ page }) => {
    await page.goto('/');
    await expect.poll(() => beat(page)).toBe('dot-in');
    await page.mouse.move(600, 450);
    await page.mouse.click(600, 450);
    await expect.poll(() => beat(page), { timeout: 8000 }).toBe('ready');

    // Enter the expansion.
    await scrubTo(page, P.expandEnd, {
      settleOn: async () => (await page.locator('#qx-frame').boundingBox())?.width ?? 0,
    });
    await expect
      .poll(async () => (await page.locator('#qx-frame').boundingBox())?.width ?? 0, {
        timeout: 8000,
      })
      .toBeGreaterThan(900);

    // Resize down, then back up. The frame must re-read the viewport and still
    // occupy ~70vw, and the pin must not throw the scroll position.
    await page.setViewportSize({ width: 1000, height: 800 });
    await expect
      .poll(async () => (await page.locator('#qx-frame').boundingBox())?.width ?? 0, {
        timeout: 8000,
      })
      .toBeGreaterThan(600); // ~84vw at tablet width (840)

    await page.setViewportSize({ width: 1440, height: 900 });
    await expect
      .poll(async () => (await page.locator('#qx-frame').boundingBox())?.width ?? 0, {
        timeout: 8000,
      })
      .toBeGreaterThan(900); // back to ~70vw (1008)

    // Still interactive: no crash, beat is still a scroll beat.
    await expect.poll(() => beat(page)).toMatch(/frame-|services|aperture|ready/);
  });
});

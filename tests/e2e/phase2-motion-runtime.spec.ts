import { test, expect } from '@playwright/test';

/**
 * Phase 2 acceptance. These four facts must hold before any real animation is
 * built on top of the runtime — each one is a bug class that is very hard to
 * diagnose later:
 *
 *   one rAF loop      -> two loops desync scrubbed timelines from Lenis
 *   one Lenis         -> StrictMode double-mount leaves an orphaned ticker cb
 *   no trigger leak   -> App Router navigation accumulates stale triggers
 *   eases registered  -> a missing CustomEase silently falls back to power1
 */

test.describe('motion runtime', () => {
  test('runs exactly one rAF loop with one Lenis and one ScrollTrigger', async ({ page }) => {
    await page.goto('/lab/scroll');

    const readout = page.locator('.fixed.right-3');
    await expect(readout).toBeVisible();

    // Let the probe observe a few frames before sampling.
    await expect(readout).toContainText('rAF loops/frame …… 1 ✓', { timeout: 10_000 });
    await expect(readout).toContainText('lenis instances …… 1 ✓');
    await expect(readout).toContainText('scrolltriggers … 1');
    await expect(readout).toContainText('qx.out registered ✓');
  });

  test('scrub tracks scroll and the pin holds for its full distance', async ({ page }) => {
    await page.goto('/lab/scroll');
    await expect(page.locator('.fixed.right-3')).toContainText('scrolltriggers … 1');

    const progressNow = async () => {
      const text = (await page.locator('.fixed.right-3').innerText()) ?? '';
      return Number(/pin progress ……… ([\d.]+)/.exec(text)?.[1] ?? '-1');
    };

    await page.mouse.wheel(0, 1200);
    // scrub:1 means the timeline lags the scroll by ~1s, so poll rather than
    // asserting immediately — this is the behaviour under test, not a flake.
    await expect.poll(progressNow, { timeout: 8_000 }).toBeGreaterThan(0.05);

    await page.mouse.wheel(0, 4000);
    await expect.poll(progressNow, { timeout: 8_000 }).toBeGreaterThan(0.6);

    // Scrolling back up must reverse it — the segment is a pure scrub with no
    // side effects.
    await page.mouse.wheel(0, -5000);
    await expect.poll(progressNow, { timeout: 8_000 }).toBeLessThan(0.1);
  });

  test('releases every ScrollTrigger on unmount', async ({ page }) => {
    await page.goto('/lab/scroll');
    await expect(page.locator('.fixed.right-3')).toContainText('scrolltriggers … 1');

    await page.getByRole('button', { name: 'unmount (leak test)' }).click();

    await expect(page.getByText(/ScrollTrigger\.getAll\(\)\.length after unmount/)).toContainText(
      '= 0 ✓ no leak',
      { timeout: 5_000 },
    );
  });

  test('smooth scroll eases out rather than jumping', async ({ page }) => {
    await page.goto('/lab/scroll');
    await page.waitForTimeout(500);

    const y = () => page.evaluate(() => window.scrollY);
    expect(await y()).toBe(0);

    await page.mouse.wheel(0, 600);

    // One frame after the wheel, a smoothed scroller has NOT arrived yet.
    await page.waitForTimeout(50);
    const early = await y();

    await page.waitForTimeout(1200);
    const settled = await y();

    expect(settled).toBeGreaterThan(0);
    expect(early).toBeLessThan(settled); // interpolating, not teleporting
  });
});

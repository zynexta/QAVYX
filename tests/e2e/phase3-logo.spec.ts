import { test, expect } from '@playwright/test';

/**
 * Phase 3 acceptance: the authored SVG matches the source mark.
 *
 * The lab overlays public/reference/logo-trace.png (source recoloured red)
 * under the authored white SVG. We screenshot the stage at several widths for
 * visual inspection, and separately assert the geometry readouts so a wrong
 * number fails without a human in the loop.
 */

const WIDTHS = [375, 768, 1024, 1440, 1920];

test.describe('logo geometry', () => {
  for (const w of WIDTHS) {
    test(`renders correctly at ${w}px`, async ({ page }) => {
      await page.goto('/lab/logo');
      await page.evaluate((width) => {
        const input = document.querySelector<HTMLInputElement>('input[type=range]');
        if (!input) throw new Error('slider missing');
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value',
        )!.set!;
        setter.call(input, String(width));
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }, w);

      const stage = page.locator('div.relative.overflow-hidden').first();
      await expect(stage).toBeVisible();
      await page.waitForTimeout(100);
      await expect(stage).toHaveScreenshot(`logo-${w}.png`, { maxDiffPixelRatio: 0.02 });
    });
  }

  test('bowl ratio stays constant across widths', async ({ page }) => {
    await page.goto('/lab/logo');
    const ratios: number[] = [];
    for (const w of WIDTHS) {
      await page.evaluate((width) => {
        const input = document.querySelector<HTMLInputElement>('input[type=range]')!;
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value',
        )!.set!;
        setter.call(input, String(width));
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }, w);
      const text = await page.locator('dl').innerText();
      ratios.push(Number(/frame ratio\s+([\d.]+)/.exec(text)?.[1] ?? '0'));
    }
    for (const r of ratios) expect(r).toBeCloseTo(1.452, 2);
  });
});

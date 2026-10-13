import { test, expect, type Page } from '@playwright/test';

/**
 * Phase 5 acceptance: the full Engine-1 intro — breathing loop, the three skip
 * routes, the fallback timeout, the session flag, and the dev HUD.
 *
 * We drive input and poll DOM state (never wait on wall-clock for an animation),
 * except the one test that is specifically about a wall-clock timeout.
 */

const beat = (page: Page) => page.locator('#qx-hero-root').getAttribute('data-beat');

const frameVisible = (page: Page) =>
  page.locator('#qx-frame').evaluate((el) => getComputedStyle(el).opacity);

test.describe('engine 1 intro', () => {
  test('the dot breathes before the pointer wakes it', async ({ page }) => {
    await page.goto('/');
    // Do NOT move the mouse. After dot-in the 12px dot pulses to scale 1.12
    // (~13.4px). Its bounding box must exceed the resting size at some point.
    await expect
      .poll(
        async () => {
          const b = await page.locator('#qx-cursor').boundingBox();
          return b ? Math.max(b.width, b.height) : 0;
        },
        { timeout: 4000, intervals: [100] },
      )
      .toBeGreaterThan(12.8);
  });

  test('Escape skips straight to the finished logo', async ({ page }) => {
    await page.goto('/');
    await expect.poll(() => beat(page)).toBe('dot-in');
    await page.keyboard.press('Escape');
    await expect.poll(() => beat(page), { timeout: 4000 }).toBe('ready');
    // The logo was finalized, not left half-built.
    expect(await frameVisible(page)).toBe('1');
    await expect(page.locator('#qx-wordmark')).toHaveCSS('opacity', '1');
    // Escape lands mid-`dot-in`, so the cursor's 300ms fade-in AND its 600ms
    // scale-up were both killed partway. The build must start from a whole
    // cursor or whatever they left behind sticks for the session: a leftover
    // opacity 0.888 becomes the value the scroll expansion reverses back to
    // (caught by the Phase 6 residue test), and a leftover scale leaves the
    // body at two-thirds size while the tip and cord — plain React nodes —
    // stay full size, so the glyph comes apart.
    await expect(page.locator('#qx-cursor')).toHaveCSS('opacity', '1');
    const scale = await page.locator('#qx-cursor').evaluate((el) => {
      const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
      return Math.hypot(m.a, m.b);
    });
    expect(scale).toBeCloseTo(1, 2);
  });

  test('the COMPLETE mouse follows the pointer, before any click', async ({ page }) => {
    await page.goto('/');
    await expect.poll(() => beat(page)).toBe('dot-in');

    // Wake and morph, but never click.
    await page.mouse.move(600, 300);
    await page.mouse.move(1000, 600);
    await expect.poll(() => beat(page), { timeout: 6000 }).toBe('click');

    // The glyph under the pointer is the whole mouse — body, green tip AND cord
    // — not the bare white capsule it used to be until the click landed it.
    for (const id of ['#qx-cursor-live-tip', '#qx-cursor-live-cord']) {
      await expect(page.locator(id)).toHaveCSS('opacity', '1');
    }
    // The landed pair belongs to the mark and must still be hidden here.
    await expect(page.locator('#qx-mouse-tip')).toHaveCSS('opacity', '0');

    // Tip and body are ONE object: co-located, and out at the pointer rather
    // than back at the Q's gap.
    const box = (el: string) => page.locator(el).boundingBox();
    const bodyBox = (await box('#qx-cursor'))!;
    const tipBox = (await box('#qx-cursor-live-tip'))!;
    expect(Math.abs(bodyBox.x - tipBox.x)).toBeLessThan(12);
    expect(Math.abs(bodyBox.y - tipBox.y)).toBeLessThan(12);
    expect(bodyBox.x).toBeGreaterThan(800); // followed the pointer to ~1000
  });

  test('the landed glyph is one mouse: white body, green tip, cord', async ({ page }) => {
    await page.goto('/');
    await expect.poll(() => beat(page)).toBe('dot-in');
    await page.keyboard.press('Escape');
    await expect.poll(() => beat(page), { timeout: 4000 }).toBe('ready');

    // The dot is the brand's green; the MOUSE is the mark's white ink with a
    // green tip. Leaving the body green gave two unrelated green blobs.
    await expect(page.locator('#qx-cursor')).toHaveCSS('fill', 'rgb(242, 245, 243)');
    await expect(page.locator('#qx-mouse-tip')).toHaveCSS('fill', 'rgb(42, 189, 0)');
    await expect(page.locator('#qx-mouse-cord')).toHaveCSS('stroke', 'rgb(242, 245, 243)');
    for (const id of ['#qx-mouse-tip', '#qx-mouse-cord']) {
      await expect(page.locator(id)).toHaveCSS('opacity', '1');
    }

    // The body lies along the mark's 40.5° axis, so its bounding box is wider
    // than it is tall — the check that catches the body being built square-on
    // to its own long axis (capsulePath's `w` is the extent ALONG the rotation).
    const box = (await page.locator('#qx-mouse-body').boundingBox())!;
    expect(box.width).toBeGreaterThan(box.height * 0.9);
    // And the tip sits down-right of the body centre, where the source has it.
    const body = (await page.locator('#qx-cursor').boundingBox())!;
    const tip = (await page.locator('#qx-mouse-tip').boundingBox())!;
    expect(tip.x + tip.width / 2).toBeGreaterThan(body.x + body.width / 2 - 1);
  });

  test('a scroll gesture during the lock skips the intro', async ({ page }) => {
    await page.goto('/');
    await expect.poll(() => beat(page)).toBe('dot-in');
    await page.mouse.wheel(0, 400);
    await expect.poll(() => beat(page), { timeout: 4000 }).toMatch(/ready|frame-/);
  });

  test('the skip button (keyboard) finishes the intro', async ({ page }) => {
    await page.goto('/');
    await expect.poll(() => beat(page)).toBe('dot-in');
    const skip = page.getByRole('button', { name: 'Skip intro' });
    await skip.focus(); // sr-only → focus reveals it
    await skip.click();
    await expect.poll(() => beat(page), { timeout: 4000 }).toBe('ready');
  });

  test('no pointer for 6s auto-builds the logo (fallback timeout)', async ({ page }) => {
    await page.goto('/');
    await expect.poll(() => beat(page)).toBe('dot-in');
    // Never touch the pointer; the dot-in timeout must advance on its own.
    await expect.poll(() => beat(page), { timeout: 12_000 }).toBe('ready');
    expect(await frameVisible(page)).toBe('1');
  });

  test('a return visit within the session skips the intro', async ({ page }) => {
    await page.goto('/');
    await expect.poll(() => beat(page)).toBe('dot-in');
    await page.keyboard.press('Escape'); // reach ready → sets the session flag
    await expect.poll(() => beat(page), { timeout: 4000 }).toBe('ready');

    await page.reload();
    // The intro must NOT replay: ready is reached without any interaction. If it
    // replayed it would sit at dot-in awaiting a pointer.
    await expect.poll(() => beat(page), { timeout: 3000 }).toBe('ready');

    // ...and scroll must actually WORK after the refresh. The skip path reaches
    // `ready` inside a layout effect before Lenis exists, so a naive lenis.start()
    // there no-ops and the page stays locked — regression guard for exactly that.
    await page.mouse.wheel(0, 1400);
    await expect
      .poll(async () => (await page.locator('#qx-frame').boundingBox())?.width ?? 0, {
        timeout: 8000,
      })
      .toBeGreaterThan(900); // the pin engaged and the frame expanded
  });

  test('the dev overlay is hidden until toggled, then reports the live beat', async ({
    page,
  }) => {
    await page.goto('/');
    const overlay = page.locator('div', { hasText: /^beat/ }).last();
    await expect.poll(() => beat(page)).toBe('dot-in');
    // Hidden by default now — off every screenshot until asked for.
    await expect(overlay).toHaveCount(0);
    // Backtick toggles it, and must NOT count as a skip gesture (that is Escape).
    await page.keyboard.press('`');
    await expect(overlay).toContainText('dot-in');
    expect(await beat(page)).toBe('dot-in'); // still in the intro
    await page.keyboard.press('Escape');
    await expect.poll(() => beat(page), { timeout: 4000 }).toBe('ready');
    await expect(overlay).toContainText('ready');
    // And it toggles back off.
    await page.keyboard.press('`');
    await expect(overlay).toHaveCount(0);
  });
});

/**
 * The click affordance. Its whole job is to say "press the left button" during
 * the `click` beat and then leave no trace — so these tests are about when it is
 * visible, whether it moves with the glyph, and that every route out clears it.
 */
test.describe('the click affordance', () => {
  const reachClickBeat = async (page: Page) => {
    await page.goto('/');
    await expect.poll(() => beat(page)).toBe('dot-in');
    await page.mouse.move(600, 300);
    await page.mouse.move(1000, 600);
    // Tight intervals, because the fallback test times FROM here: expect.poll's
    // default backoff (100→250→500→1000ms) can notice the beat over a second
    // after it actually changed, which reads as a timeout that fires early.
    await expect.poll(() => beat(page), { timeout: 6000, intervals: [50] }).toBe('click');
  };

  const opacity = (page: Page, sel: string) =>
    page.locator(sel).evaluate((el) => Number(getComputedStyle(el).opacity));

  test('the left button lights up only once the glyph is a mouse', async ({ page }) => {
    await page.goto('/');
    await expect.poll(() => beat(page)).toBe('dot-in');
    // The dot is a bare dot: no button, no rings.
    expect(await opacity(page, '#qx-click-btn')).toBe(0);

    await page.mouse.move(600, 300);
    await page.mouse.move(1000, 600);
    await expect.poll(() => beat(page), { timeout: 6000 }).toBe('click');
    // It fills over 400ms and then holds — an affordance that is readable at a
    // glance rather than one that only exists at the bottom of a pulse.
    await expect.poll(() => opacity(page, '#qx-click-btn'), { timeout: 2000 }).toBeGreaterThan(
      0.4,
    );
  });

  test('the ripple opens from the glyph, concentric with it', async ({ page }) => {
    await reachClickBeat(page);
    const ring = page.locator('#qx-click-ring-1');
    // The ring grows: `r` is animated, not a scale, so it opens about its own
    // centre. Poll for it having got past the body's half-width.
    await expect
      .poll(() => ring.evaluate((el) => Number(el.getAttribute('r'))), { timeout: 3000 })
      .toBeGreaterThan(14);

    // Concentric with the mouse. The regression this guards: scaled with a
    // transformOrigin GSAP resolves against the BOUNDING BOX, the ring crawled
    // further from the glyph on every repeat.
    const centre = async (sel: string) => {
      const b = (await page.locator(sel).boundingBox())!;
      return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    };
    const body = await centre('#qx-cursor');
    const r = await centre('#qx-click-ring-1');
    expect(Math.abs(body.x - r.x)).toBeLessThan(2);
    expect(Math.abs(body.y - r.y)).toBeLessThan(2);
  });

  test('the whole glyph presses as one — the button never detaches', async ({ page }) => {
    await reachClickBeat(page);
    // The press scales #qx-cursor-press, so body, tip, cord and button share one
    // transform. Scaling the body alone (what it used to do) left the tip and
    // cord behind at their authored size and the glyph came apart.
    const boxes = async () => ({
      body: (await page.locator('#qx-cursor').boundingBox())!,
      tip: (await page.locator('#qx-cursor-live-tip').boundingBox())!,
    });
    for (let i = 0; i < 6; i++) {
      const { body, tip } = await boxes();
      expect(Math.abs(body.x - tip.x)).toBeLessThan(2);
      expect(Math.abs(body.y - tip.y)).toBeLessThan(2);
      await page.waitForTimeout(120);
    }
  });

  test('nothing green rides into the Q — every route out clears the hint', async ({
    page,
  }) => {
    // The click route: press, travel, land.
    await reachClickBeat(page);
    await page.mouse.click(1000, 600);
    await expect.poll(() => beat(page), { timeout: 6000 }).toBe('ready');

    const hint = await page
      .locator('.qx-click-hint')
      .evaluateAll((els) => els.map((el) => Number(getComputedStyle(el).opacity)));
    // The button, both rings, and — since Phase 10 — the touch path's "Tap to
    // build" label. FOUR, and the label belongs in this set rather than beside
    // it: `.qx-click-hint` exists precisely so ONE `set` clears the whole
    // affordance from every route out of the beat (a press, the timeout,
    // Escape, a scroll gesture), and a label cleared by its own line somewhere
    // else is the exact bug the class was introduced to prevent. It is in the
    // DOM on both paths — hidden from init on a pointer device — so the count
    // does not depend on which intro ran.
    expect(hint).toHaveLength(4);
    expect(Math.max(...hint)).toBe(0);

    // And the press scale is back to 1, or the landed mouse sits in the Q's gap
    // 6% oversized for the rest of the session — nothing downstream resets it.
    const scale = await page.locator('#qx-cursor-press').evaluate((el) => {
      const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
      return Math.hypot(m.a, m.b);
    });
    expect(scale).toBeCloseTo(1, 2);
  });

  test('the fallback waits for three demonstrations, then presses the button itself', async ({
    page,
  }) => {
    await reachClickBeat(page);
    const t0 = Date.now();
    // Never click. The beat's fallback must take it to logo-build on its own —
    // and it must land in the silence AFTER the third demonstration (6.94s), not
    // on top of the second (the flat 5s this replaced).
    await expect.poll(() => beat(page), { timeout: 12_000, intervals: [50] }).not.toBe('click');
    const waited = (Date.now() - t0) / 1000;
    expect(waited).toBeGreaterThan(6.4); // the third demonstration finished
    expect(waited).toBeLessThan(7.5); // and the fourth never started

    await expect.poll(() => beat(page), { timeout: 6000 }).toBe('ready');
  });

  test('Escape out of the click beat leaves no affordance behind', async ({ page }) => {
    await reachClickBeat(page);
    await page.keyboard.press('Escape');
    await expect.poll(() => beat(page), { timeout: 4000 }).toBe('ready');
    const hint = await page
      .locator('.qx-click-hint')
      .evaluateAll((els) => els.map((el) => Number(getComputedStyle(el).opacity)));
    expect(Math.max(...hint)).toBe(0);
  });
});

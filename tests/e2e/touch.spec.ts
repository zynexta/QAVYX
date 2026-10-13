import { expect, test, type Browser, type Page } from '@playwright/test';
import { SERVICES } from '../../content/services';
import { PANEL_COUNT } from '../../content/carousel';

/**
 * Phase 10 — touch and responsive. Engine 1's touch beats, the low-tier
 * removals, and the viewport policy.
 *
 * ## What this spec asserts is NOT what BUILD-PLAN Phase 10 asked for
 *
 * The plan's re-pointing says "below 768 px no pin is created, the carousel is
 * native scroll-snap". That was built and then REVERTED ON THE CLIENT'S
 * DIRECTION: a phone gets the same scrolling experience as a desktop. So the
 * first describe block below asserts the opposite of the plan — the pin IS
 * created on a phone — and it does so deliberately and by name, because a test
 * that quietly contradicts the document it cites is worse than no test.
 *
 * What survived the revert is everything that makes the pinned hero good on a
 * phone rather than merely present, and that is the rest of this file.
 *
 * ## Read `reduced-motion.spec.ts` first; this spec inherits both of its traps
 *
 * 1. **`test.use()` does not work in this setup**, for `reducedMotion` and — the
 *    same mechanism — for viewport and touch emulation combined with it. Every
 *    context here is built explicitly with `browser.newContext()`.
 *
 * 2. **Every negative assertion races the lazy mount.** `#qx-hero-root` arrives
 *    only after `next/dynamic` fetches the motion chunk, so `toHaveCount(0)` is
 *    TRUE for the first few hundred milliseconds on the motion path as well.
 *    That is how a whole phase's worth of reduced-motion tests once passed
 *    vacuously. The rule that came out of it: an absence is only evidence if
 *    something else proves you were looking at the right page.
 *
 * ## And it adds one of its own: THE POINTER EMULATION IS THE WHOLE TEST
 *
 * Playwright has no `emulateMedia({ pointer })`. `any-pointer: coarse` comes
 * from `hasTouch: true` on the context and from nothing else — measured, not
 * assumed. Two things follow:
 *
 *   - `isMobile: true` is NOT used. It switches Chrome into mobile-viewport
 *     emulation, which overrides the requested viewport with a 980px layout
 *     width on any page without a `width=device-width` meta — so a spec that
 *     reached for the obvious `devices['iPhone 13']` would be testing 980px
 *     while its name said 390. `hasTouch` alone gives the coarse pointer AND
 *     the exact viewport asked for.
 *   - Every touch-path test asserts `any-pointer: fine` is false before it
 *     asserts anything about a beat. If the emulation ever stops working, that
 *     line fails first and by name, rather than the POINTER table passing
 *     under a touch test's title.
 */

/** Real device classes, at their CSS-pixel sizes. */
const PHONE = { width: 390, height: 844 }; // iPhone 14/15 portrait
const TABLET = { width: 820, height: 1180 }; // iPad Air portrait
const TABLET_LANDSCAPE = { width: 1180, height: 820 };

/**
 * A page at a given size, with or without a real pointer, motion enabled.
 *
 * `no-preference` explicitly on every context: this whole spec is about the
 * motion path on small and coarse devices, so a context that quietly inherited
 * `reduce` would pass several of these tests by rendering nothing at all.
 */
async function open(
  browser: Browser,
  viewport: { width: number; height: number },
  opts: { hasTouch?: boolean } = {},
) {
  const context = await browser.newContext({
    viewport,
    hasTouch: opts.hasTouch ?? false,
    reducedMotion: 'no-preference',
  });
  const page = await context.newPage();
  await page.goto('/');
  return { context, page };
}

/** What the page itself thinks it is. Every discriminator reads from here. */
const probe = (page: Page) =>
  page.evaluate(() => ({
    fine: matchMedia('(any-pointer: fine)').matches,
    vw: window.innerWidth,
    vh: window.innerHeight,
    reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
  }));

const beatOf = (page: Page) => page.locator('#qx-hero-root').getAttribute('data-beat');

/**
 * A phone is on the PINNED path — the client's direction, and the reversal of
 * BUILD-PLAN Phase 10's re-pointing.
 *
 * These are positive assertions on purpose. "No pin below 768" was the thing
 * that was built and removed, so what needs guarding is its return: a phone that
 * silently stopped mounting the motion layer would look, from the outside, like
 * a page that had merely got simpler.
 */
test.describe('a phone gets the same scrolling setup as a desktop', () => {
  test('mounts the motion layer and creates the pin', async ({ browser }) => {
    const { context, page } = await open(browser, PHONE, { hasTouch: true });
    await expect(page.locator('#qx-hero-root')).toHaveCount(1);
    // The static hero is hidden here for exactly the reason it is on a desktop:
    // the motion preference, and nothing about the size of the screen.
    await expect(page.locator('#qx-hero-static')).toBeHidden();

    // The pin is created at `ready`, not at mount — so wait for the beat rather
    // than for a spacer that has not been asked for yet.
    await expect.poll(() => beatOf(page), { timeout: 20_000 }).toBe('ready');
    await expect(page.locator('.pin-spacer')).toHaveCount(1);
    await context.close();
  });

  test('lays the carousel out inside a frame that fits a phone', async ({ browser }) => {
    // `FRAME_FRACTIONS`' phone row is 0.92 x 0.78 and its note says 0.78 is
    // "what makes the tallest panel fit at 360x740, the narrowest viewport this
    // supports". That tuning is only worth anything if a phone reaches it, which
    // is the whole argument for the revert — so this asserts it does.
    const { context, page } = await open(browser, PHONE, { hasTouch: true });
    await expect.poll(() => beatOf(page), { timeout: 20_000 }).toBe('ready');

    const box = await page
      .locator('#qx-track-viewport')
      .evaluate((el) => el.getBoundingClientRect());
    // 0.92 of the viewport, less the frame's stroke on both sides.
    expect(box.width).toBeGreaterThan(PHONE.width * 0.85);
    expect(box.width).toBeLessThan(PHONE.width);
    // 0.78 of the height, and comfortably past the ~536px the tallest panel
    // needs. A frame shorter than that is the failure the fraction was tuned to
    // avoid, and it is what a landscape phone still hits (see geometry.ts).
    expect(box.height).toBeGreaterThan(560);

    // Every panel, one frame wide each — the same track a desktop gets.
    await expect(page.locator('#qx-track .qx-panel')).toHaveCount(PANEL_COUNT);
    await context.close();
  });

  test('hydrates without warnings on a phone', async ({ browser }) => {
    const errors: string[] = [];
    const context = await browser.newContext({
      viewport: PHONE,
      hasTouch: true,
      reducedMotion: 'no-preference',
    });
    const page = await context.newPage();
    page.on('console', (msg) => {
      const text = msg.text();
      if (/hydrat|did not match|server (?:HTML|rendered)/i.test(text)) errors.push(text);
    });
    page.on('pageerror', (err) => {
      if (/hydrat/i.test(err.message)) errors.push(err.message);
    });
    await page.goto('/');
    await expect(page.locator('#qx-hero-root')).toHaveCount(1);
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
    await context.close();
  });
});

/**
 * Engine 1's touch redesign — BUILD-PLAN Phase 10's beat table, which the
 * revert left entirely intact and made MORE relevant, since phones now reach it.
 */
test.describe('Engine 1 on touch', () => {
  async function openTouch(browser: Browser, viewport = PHONE) {
    const { context, page } = await open(browser, viewport, { hasTouch: true });
    // TWO discriminators, because two things could be silently wrong. The
    // motion layer really mounted...
    await expect(page.locator('#qx-hero-root')).toHaveCount(1);
    // ...and this really is a coarse-pointer context. Without the second line
    // every test below would pass on the POINTER table under a touch title,
    // which is this suite's signature failure mode.
    const seen = await probe(page);
    expect(seen.fine, 'hasTouch did not produce a coarse pointer').toBe(false);
    return { context, page };
  }

  test('reaches `click` with no input at all, skipping pointer-wake', async ({ browser }) => {
    const { context, page } = await openTouch(browser);
    // `pointer-wake` is skipped and the dot morphs on its own after
    // DOT_HOLD_TOUCH — so the sequence advances with the visitor doing nothing,
    // which on the pointer path it never does. No pointer is moved here.
    await expect.poll(() => beatOf(page), { timeout: 15_000 }).toBe('click');
    await context.close();
  });

  test('shows the tap cue, which the pointer path never renders', async ({ browser }) => {
    const { context, page } = await openTouch(browser);
    await expect.poll(() => beatOf(page), { timeout: 15_000 }).toBe('click');
    // The label IS the beat on touch — the looping press demonstration it
    // replaces is a mouse miming a click at someone who has no mouse.
    await expect(page.locator('#qx-tap-label')).toBeVisible();
    await context.close();
  });

  test('any tap commits, and the cue is gone once it does', async ({ browser }) => {
    const { context, page } = await openTouch(browser);
    await expect.poll(() => beatOf(page), { timeout: 15_000 }).toBe('click');

    // "Any tap" — in the corner, nowhere near the glyph. The listener is on
    // `window` precisely so the visitor does not have to find a 60px target.
    await page.touchscreen.tap(60, 60);
    await expect.poll(() => beatOf(page), { timeout: 15_000 }).toMatch(/logo-build|ready/);
    // Nothing green rides into the Q: the label wears `.qx-click-hint`, which
    // `buildLogoBuild` clears from every route out of the beat.
    await expect(page.locator('#qx-tap-label')).toBeHidden();
    await context.close();
  });

  test('completes to `ready` in both orientations', async ({ browser }) => {
    for (const viewport of [TABLET, TABLET_LANDSCAPE]) {
      const { context, page } = await openTouch(browser, viewport);
      await expect.poll(() => beatOf(page), { timeout: 25_000 }).toBe('ready');
      await expect(page.locator('.pin-spacer')).toHaveCount(1);
      await context.close();
    }
  });

  test('a touchscreen LAPTOP keeps the pointer experience', async ({ browser }) => {
    // `any-pointer: fine` is true when a precise pointer exists at all, even
    // beside a touchscreen — BUILD-PLAN lists "assuming `hover: hover` means
    // desktop" as one of this phase's common mistakes, and `pointer: fine`
    // would be wrong the other way round. Playwright cannot emulate "both", so
    // this asserts the half it can: a fine pointer WAITS for a real move and
    // does not advance on its own the way the touch path just did.
    const { context, page } = await open(browser, TABLET_LANDSCAPE, { hasTouch: false });
    await expect(page.locator('#qx-hero-root')).toHaveCount(1);
    expect((await probe(page)).fine).toBe(true);
    await expect.poll(() => beatOf(page), { timeout: 15_000 }).toBe('dot-in');
    await page.mouse.move(400, 400);
    await expect
      .poll(() => beatOf(page), { timeout: 15_000 })
      .toMatch(/pointer-wake|cursor-morph|click/);
    await context.close();
  });
});

/**
 * The viewport policy — `svh`, and crossing a resize mid-experience.
 */
test.describe('resize and the viewport', () => {
  test('the hero is measured in svh, never vh', async ({ browser }) => {
    // BUILD-PLAN Phase 10's first common mistake: with `100vh` the hero is
    // taller than the visible viewport on mobile Safari and resizes as the URL
    // bar moves, so the pin jumps on every scroll-direction change. Asserted
    // against the two boxes that carry the height — the pin trigger itself, and
    // the reservation that stands in for it before the motion layer arrives.
    //
    // THE RESERVATION IS READ AT `DOMContentLoaded`, AND THAT IS THE WHOLE
    // CORRECTION. It used to be read here, beside the hero, after
    // `#qx-hero-root` had appeared — and it passed only because the rule was
    // unconditional. `app/globals.css` now scopes it to the phase it was always
    // FOR: the window where neither hero is on screen. Once the motion layer
    // paints, the reservation stands down and its `min-height` is `0px`, which
    // is correct and which this test was reporting as a regression.
    //
    // At `DOMContentLoaded` the pre-paint script has set `data-qx-hero-boot`,
    // the 2s `-slow` timer has not fired and the hero has not mounted, so phase
    // 1 is exactly the state in force. Reading it there asserts the same
    // property the original did — the reservation is a full small viewport —
    // against the moment it actually applies.
    const context = await browser.newContext({
      viewport: PHONE,
      hasTouch: true,
      reducedMotion: 'no-preference',
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const el = document.getElementById('qx-hero-reserve');
        (window as unknown as { __qxReserveAtBoot?: string | null }).__qxReserveAtBoot = el
          ? getComputedStyle(el).minHeight
          : null;
      });
    });
    await page.goto('/');
    await expect(page.locator('#qx-hero-root')).toHaveCount(1);
    const heights = await page.evaluate(() => {
      const hero = document.getElementById('qx-hero');
      return {
        hero: hero && getComputedStyle(hero).height,
        reserve: (window as unknown as { __qxReserveAtBoot?: string | null })
          .__qxReserveAtBoot,
        svh: CSS.supports('height', '100svh'),
      };
    });
    expect(heights.svh).toBe(true);
    // Resolved values, so this is "equals the small viewport height" rather than
    // a string match on a declaration. What it catches is a hero that stopped
    // being a full screen at all; the `svh`-vs-`vh` distinction itself is
    // invisible in a browser with no URL bar and is locked by review.
    expect(Math.round(parseFloat(heights.hero!))).toBe(PHONE.height);
    expect(Math.round(parseFloat(heights.reserve!))).toBe(PHONE.height);
    await context.close();
  });

  /**
   * Resizing across a breakpoint mid-experience — the phase's last QA item.
   *
   * The pin survives rather than rebuilding, which is the point: `HeroMount`
   * gates on the motion preference alone, so a width change is a
   * `ScrollTrigger.refresh()` and not an unmount. What would show up here is a
   * pin that got LOST (count 0) or DOUBLED — the two failure modes of a trigger
   * whose `invalidateOnRefresh` values were cached at the wrong size.
   */
  test('keeps exactly one pin across a phone/tablet resize', async ({ browser }) => {
    const { context, page } = await open(browser, TABLET, { hasTouch: true });
    await expect.poll(() => beatOf(page), { timeout: 25_000 }).toBe('ready');
    await expect(page.locator('.pin-spacer')).toHaveCount(1);

    await page.setViewportSize(PHONE);
    await expect(page.locator('.pin-spacer')).toHaveCount(1);
    await expect(page.locator('#qx-hero-root')).toHaveCount(1);

    // The carousel followed the frame to the new width rather than keeping the
    // old one — `ServicesCarousel` is positioned from live geometry and the
    // refresh re-reads it.
    const width = await page
      .locator('#qx-track-viewport')
      .evaluate((el) => el.getBoundingClientRect().width);
    expect(width).toBeLessThan(PHONE.width);

    await page.setViewportSize(TABLET);
    await expect(page.locator('.pin-spacer')).toHaveCount(1);
    await context.close();
  });

  /**
   * Toggling reduced motion is still the ONE thing that unmounts the hero.
   *
   * It duplicates a line of `reduced-motion.spec.ts` on purpose: that spec runs
   * at 1440x900, and this asserts the same gate is the only gate on a phone —
   * which is exactly the claim the revert makes.
   */
  test('reduced motion is the only thing that takes the hero away', async ({ browser }) => {
    const { context, page } = await open(browser, PHONE, { hasTouch: true });
    await expect(page.locator('#qx-hero-root')).toHaveCount(1);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('#qx-hero-root')).toHaveCount(0);
    await expect(page.locator('.pin-spacer')).toHaveCount(0);
    await expect(page.locator('#qx-hero-static')).toBeVisible();
    // The vertical list, not a rail: stacked strictly downward.
    const rows = page.locator('#qx-hero-static .qx-service-row');
    await expect(rows).toHaveCount(SERVICES.length);
    const tops = await rows.evaluateAll((els) =>
      els.map((el) => el.getBoundingClientRect().top),
    );
    for (let i = 1; i < tops.length; i++) expect(tops[i]!).toBeGreaterThan(tops[i - 1]!);

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(page.locator('#qx-hero-root')).toHaveCount(1);
    await expect(page.locator('#qx-hero-static')).toBeHidden();
    await context.close();
  });
});

/**
 * The short-viewport panel — `styles/short-viewport.css`.
 *
 * ## What broke, and why no existing test saw it
 *
 * At 844 x 390 the design frame is 343px tall (the 0.88 clamp; `FRAME_H_MIN`'s
 * 620 can never apply on a 390px screen) against a two-column panel needing
 * ~536. `#qx-track-viewport` carries `overflow: hidden`, so the overrun was not
 * visible mess — it was SILENT TRUNCATION of the chip list, the CTA and the
 * indicator. The card looked deliberate. Nothing in the suite ran at a short
 * viewport, so nothing noticed.
 *
 * ## These assert the CONSEQUENCE, not the mechanism
 *
 * Deliberately not "is it one column" or "is the title 34px" — those are the
 * current means and a future fix may legitimately choose others. What must stay
 * true is that the panel FITS: its content ends above the indicator's reserved
 * strip, and the CTA is inside the clipped box. A rule that stops working fails
 * these; a rule that is replaced by a better one does not.
 *
 * The heights are chosen from a sweep rather than from the device list. 640-700
 * is the band the first attempt at this MISSED — it fixed landscape phones with
 * a 620px threshold and left every width from 768 to 1024 clipping at 640, 660
 * and 680. Two of the three sizes below are there to keep that from recurring.
 */
test.describe('the service panel fits its frame on a short viewport', () => {
  const SHORT = [
    { name: 'landscape phone', width: 844, height: 390 },
    { name: 'the band the 620px threshold missed', width: 768, height: 640 },
    { name: 'just under the bound', width: 1024, height: 700 },
    { name: 'just over the bound', width: 1024, height: 720 },
  ];

  for (const size of SHORT) {
    test(`${size.name} — ${size.width}x${size.height}`, async ({ browser }) => {
      const { context, page } = await open(
        browser,
        { width: size.width, height: size.height },
        { hasTouch: true },
      );
      await expect.poll(() => beatOf(page), { timeout: 25_000 }).toBe('ready');

      const worst = await page.evaluate(() => {
        const vp = document.getElementById('qx-track-viewport')!;
        const frame = vp.getBoundingClientRect();
        let over = -Infinity;
        let ctaOver = -Infinity;
        for (const panel of document.querySelectorAll('#qx-track .qx-panel')) {
          const copy = panel.querySelector('.qx-panel-copy')!;
          const cta = panel.querySelector('.qx-panel-cta')!;
          const cs = getComputedStyle(panel);
          // The panel's real requirement: its content plus its own padding. The
          // BOTTOM padding is the indicator strip's reservation (`py-5` is
          // 2.5rem, exactly `CarouselIndicator`'s `h-5`), so content that pushes
          // this past the frame is content running under the indicator.
          const need =
            copy.getBoundingClientRect().height +
            parseFloat(cs.paddingTop) +
            parseFloat(cs.paddingBottom);
          over = Math.max(over, need - frame.height);
          ctaOver = Math.max(ctaOver, cta.getBoundingClientRect().bottom - frame.bottom);
        }
        return { over: Math.round(over), ctaOver: Math.round(ctaOver) };
      });

      // The CTA is the only route from the carousel into a pillar page. Clipped,
      // it does not exist — which is what made this worse than a cosmetic bug.
      expect(worst.ctaOver, 'the CTA is clipped by the frame').toBeLessThan(0);
      expect(worst.over, 'panel content runs under the indicator strip').toBeLessThanOrEqual(0);
      await context.close();
    });
  }
});

/**
 * The two-column slide has real headroom, not merely non-overlap.
 *
 * ## Why this is a separate test with a margin instead of another `<= 0`
 *
 * The block above asserts the panel FITS. This asserts it fits BY ENOUGH, and
 * the distinction is the whole finding: at 768 the worst panel used to clear its
 * frame by 7px — passing any "does it fit" check while being the bug. Two things
 * fire at `md` together, and they fight: the panel takes its second column
 * (copy column at its narrowest anywhere, 255px) while the title promotes 34 ->
 * 48px. A tablet was giving the copy less measure than a 390px phone does.
 *
 * A media query cannot know how many lines a string wraps to on a real device's
 * fonts, and iOS metrics are not Chrome's — so a 7px margin measured in headless
 * Chrome is not a margin at all. 20px is the floor this asserts; the sweep that
 * set it measures 39px at 768 and 33px at 1024, the two tightest points.
 *
 * 1024 IS THE OTHER DOUBLE-FIRE and it is deliberately included. There the frame
 * narrows (`FRAME_FRACTIONS` 0.84 -> 0.70) at the same width the title reaches
 * `text-2xl`, so it is the same collision one breakpoint up. It sits at 33px and
 * has always done; it is watched here rather than tuned.
 */
test.describe('the two-column slide keeps headroom', () => {
  const MIN_SLACK = 20;

  for (const size of [
    { name: 'the md breakpoint — narrowest copy column in the design', width: 768, height: 800 },
    { name: 'the lg breakpoint — frame narrows as the title grows', width: 1024, height: 800 },
    { name: 'desktop', width: 1440, height: 900 },
  ]) {
    test(`${size.name} — ${size.width}x${size.height}`, async ({ browser }) => {
      const { context, page } = await open(browser, {
        width: size.width,
        height: size.height,
      });
      await expect.poll(() => beatOf(page), { timeout: 25_000 }).toBe('ready');

      const slack = await page.evaluate(() => {
        const frame = document.getElementById('qx-track-viewport')!.getBoundingClientRect();
        let worst = Infinity;
        for (const panel of document.querySelectorAll('#qx-track .qx-panel')) {
          const copy = panel.querySelector('.qx-panel-copy')!;
          const cs = getComputedStyle(panel);
          const need =
            copy.getBoundingClientRect().height +
            parseFloat(cs.paddingTop) +
            parseFloat(cs.paddingBottom);
          worst = Math.min(worst, frame.height - need);
        }
        return Math.round(worst);
      });

      expect(slack, `only ${slack}px of headroom in the frame`).toBeGreaterThanOrEqual(
        MIN_SLACK,
      );
      await context.close();
    });
  }
});

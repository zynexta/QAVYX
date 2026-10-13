import { expect, test, type Page } from '@playwright/test';
import { HERO_COPY, TRUST } from '../../content/home';
import { SERVICES } from '../../content/services';
import { PANEL_COUNT } from '../../content/carousel';

/**
 * Phase 9 — the reduced-motion, no-JS and crawler path. ONE fallback, not three.
 *
 * ## Two traps that both make this spec pass while testing nothing
 *
 * 1. **`test.use({ reducedMotion: 'reduce' })` DOES NOT WORK HERE.** It is the
 *    idiomatic form and it is inert in this setup, at file scope and at describe
 *    scope alike: the page still reports
 *    `matchMedia('(prefers-reduced-motion: reduce)').matches === false`, renders
 *    the full motion layer, and downloads GSAP. Measured, not assumed —
 *    `newContext({ reducedMotion })` and `page.emulateMedia({ reducedMotion })`
 *    both work, `test.use` does not. So every test below emulates explicitly.
 *    If you "tidy" this into `test.use`, all ten tests keep passing and six of
 *    them start asserting the opposite of their names.
 *
 * 2. **Every negative assertion here races the lazy mount.** `#qx-hero-root`,
 *    `.qx-panel` and the rest arrive only after `next/dynamic` fetches the motion
 *    chunk, so `toHaveCount(0)` is TRUE for the first few hundred milliseconds on
 *    the motion path too, and Playwright resolves it immediately. That is exactly
 *    how trap 1 hid: four tests failed honestly and four passed vacuously.
 *
 *    `openReduced()` is the fix for both. It asserts a DISCRIMINATOR — the static
 *    hero being visible, which is true under `reduce` and false under
 *    `no-preference`, where CSS hides it — before any test gets to assert an
 *    absence. If the emulation ever stops working, that line fails first and by
 *    name, instead of ten green tests describing a page nobody rendered.
 *
 * NONE OF `helpers/scrub.ts` APPLIES, and importing it would be the clearest
 * sign this spec had drifted: `ready()` polls `data-beat` and `scrubTo` steers by
 * `data-progress`, both written onto `#qx-hero-root`, which does not exist here.
 * Same doctrine as `phase8d-pillars.spec.ts` — goto and assert.
 */

/** Everything the motion layer puts in the DOM, and nothing the static path does. */
const MOTION_ONLY_IDS = [
  'qx-hero-root', // the client hero's root
  'qx-hero', // the 100svh pin trigger
  'qx-stage', // the one fixed <svg>
  'qx-track-viewport', // the carousel's clipped window
  'qx-track',
  'qx-ink-field', // the aperture's hand-off surface
  'qx-launch-title', // the title card
  'qx-copy', // the scroll cue
];

/**
 * Load `/` as a visitor who asked for no motion, and prove it landed.
 *
 * `networkidle` matters as much as the emulation: it is what gives the motion
 * chunk time to arrive if the branch were wrong, so an absence asserted after it
 * is an absence rather than a head start.
 */
async function openReduced(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  // THE DISCRIMINATOR. Visible only under `reduce`; `display: none` otherwise.
  await expect(page.locator('#qx-hero-static')).toBeVisible();
  await page.waitForLoadState('networkidle');
}

/** Console messages that mean React re-rendered the server's HTML differently. */
function collectHydrationErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    const text = msg.text();
    if (/hydrat|did not match|server (?:HTML|rendered)/i.test(text)) errors.push(text);
  });
  page.on('pageerror', (err) => {
    if (/hydrat/i.test(err.message)) errors.push(err.message);
  });
  return errors;
}

test.describe('prefers-reduced-motion: reduce', () => {
  /**
   * The performance criterion, and the ONLY place it can be checked.
   *
   * `scripts/check-bundle.mjs` reads `app-build-manifest.json`'s entry for
   * `/page`, and the motion layer is a lazily-loaded chunk that never appears
   * there — so the 165 KB gate is structurally blind to whether this path
   * downloads GSAP, and would stay green if every reduced-motion visitor pulled
   * the whole thing.
   *
   * This is also the test that fails if someone "simplifies" `useReducedMotion`
   * back to `useState(false)`: React.lazy runs its loader in the RENDER phase,
   * so the request goes out on the hydration render and no later effect can
   * recall it.
   */
  test('never downloads the motion layer', async ({ page }) => {
    const scripts: string[] = [];
    page.on('request', (req) => {
      if (req.resourceType() === 'script') scripts.push(req.url());
    });

    await openReduced(page);

    const motion = scripts.filter((url) => /HeroSection|gsap|lenis/i.test(url));
    expect(motion, `motion chunks were fetched: ${motion.join(', ')}`).toEqual([]);
    // Guard against the assertion passing because nothing loaded at all.
    expect(scripts.length).toBeGreaterThan(0);
  });

  test('renders none of the motion layer’s DOM', async ({ page }) => {
    await openReduced(page);
    for (const id of MOTION_ONLY_IDS) {
      await expect(page.locator(`#${id}`), `#${id} should not exist`).toHaveCount(0);
    }
    // The cursor glyph specifically — the acceptance criterion names it.
    await expect(page.locator('#qx-cursor, #qx-cursor-node')).toHaveCount(0);
  });

  /**
   * "No pin created", asserted against the two things a pin actually does here.
   *
   * ScrollTrigger pins with `pinSpacing: true`, so a pin ALWAYS injects a
   * `.pin-spacer`. That line is the direct assertion and it stays.
   *
   * THE SECOND LINE USED TO BE A WHOLE-DOCUMENT HEIGHT CEILING WEARING THIS
   * TEST'S NAME: `scrollHeight / innerHeight < PIN_A.totalVh / 100`. It went red
   * on CONTENT, not on a pin — measured at 1440x900 under `reduce`, the document
   * is 8511px against an 8460px ceiling, and `#qx-hero-static` is only 2628 of
   * it; §4's trust strip and a since-removed Launchpad note were added to the
   * page after that test last ran. The threshold was derived from the budget and
   * rotted anyway, because what rotted was the PREMISE — that the natural reduced-motion
   * document is much shorter than the pin (940vh then, 1015 now) — and no amount
   * of deriving fixes a premise. Do not restore it. A page-height budget is a
   * separate criterion and deserves its own name and its own number.
   *
   * It also discriminated nothing. `createPin` is deferred behind the intro and
   * the visitor's first move, so at load the MOTION path measures `.pin-spacer`
   * count 0 and ratio 7.54 — both inside the old assertion.
   *
   * `#qx-hero-reserve` is the replacement, and it now measures 0 on BOTH paths.
   * It used to carry `min-height: 100svh` under `(prefers-reduced-motion:
   * no-preference)` — 900px there, 0 under `reduce` — which made its height a
   * discriminator for free. That reservation has been removed (see the note in
   * `app/globals.css`: it could only ever hold open a screen of nothing, and the
   * static hero now stays until the motion layer paints), so the height is no
   * longer evidence of which path the visitor is on.
   *
   * IT IS STILL THE RIGHT ASSERTION HERE, because what this test is actually
   * about is the PIN: this is the wrapper the pin target renders inside, so a
   * pin that ever did get created would inflate it by the pin's whole length —
   * 1015vh, not 100. Zero still means "no pin", which is the criterion. The
   * `.pin-spacer` count above is the direct form of the same claim.
   */
  test('creates no pin, and reserves none of its scroll', async ({ page }) => {
    await openReduced(page);
    await expect(page.locator('.pin-spacer')).toHaveCount(0);

    // Count first: `locator.evaluate()` on a missing element waits out the 90s
    // timeout rather than throwing, so if `#qx-hero-reserve` is ever dropped from
    // `app/page.tsx` this fails in a second and by name.
    await expect(page.locator('#qx-hero-reserve')).toHaveCount(1);
    const reserved = await page
      .locator('#qx-hero-reserve')
      .evaluate((el) => el.getBoundingClientRect().height);
    expect(reserved).toBe(0);
  });

  test('never hides the native cursor', async ({ page }) => {
    await openReduced(page);
    const hidden = await page.evaluate(() =>
      [document.documentElement, document.body, ...document.querySelectorAll('main *')]
        .filter((el) => getComputedStyle(el).cursor === 'none')
        .map((el) => (el as HTMLElement).id || el.tagName),
    );
    expect(hidden).toEqual([]);
  });

  test('draws the mark as the open Q, at logo size', async ({ page }) => {
    await openReduced(page);
    const mark = page.locator('#qx-hero-static svg path[stroke-dasharray]').first();
    await expect(mark).toBeVisible();

    const dash = await mark.getAttribute('stroke-dasharray');
    // A closed rectangle would be `100 …`. The Q is open at every size and on
    // every path — that is the brand mark, not a state of it.
    expect(Number(dash!.split(' ')[0])).toBeLessThan(100);

    // Logo size, not the frame's 70%. BUILD-PLAN Phase 9 says both; the aperture
    // re-pointing is the newer statement and the one this path follows — see
    // `HeroStatic`. A 70%-of-viewport frame would be ~630px tall here.
    const box = (await mark.boundingBox())!;
    expect(box.height).toBeLessThan(page.viewportSize()!.height * 0.5);
  });

  test('shows §3.1’s positioning line, which the pin otherwise owns', async ({ page }) => {
    await openReduced(page);
    await expect(page.locator('#qx-hero-static')).toContainText(HERO_COPY.eyebrow);
  });

  test('lists all five services in normal flow, stacked', async ({ page }) => {
    await openReduced(page);
    const rows = page.locator('#qx-hero-static .qx-service-row');
    await expect(rows).toHaveCount(SERVICES.length);

    // In FLOW: not a fixed, clipped, translated track.
    //
    // `static` OR `relative`, and the difference is not slack. This asserted
    // `static` alone until the stacked rows took the card frame — `.qx-frame`
    // needs `position: relative` for the `::before` that draws its border, so
    // the test failed on a deliberate design change while the thing it exists
    // to catch (a horizontal track) was never in question. `relative` is still
    // normal flow; `fixed` and `absolute` are the two that would mean the
    // carousel had leaked into the static path, and those are what this refuses.
    const positions = await rows.evaluateAll((els) =>
      els.map((el) => getComputedStyle(el).position),
    );
    for (const position of positions) expect(['static', 'relative']).toContain(position);

    // Stacked: each row strictly below the last. A horizontal track would have
    // them all at the same y, which is the regression this catches.
    const tops: number[] = [];
    for (let i = 0; i < SERVICES.length; i++) {
      tops.push((await rows.nth(i).boundingBox())!.y);
    }
    for (let i = 1; i < tops.length; i++) expect(tops[i]!).toBeGreaterThan(tops[i - 1]!);

    for (const service of SERVICES) {
      await expect(rows.filter({ hasText: service.title })).toHaveCount(1);
    }
  });

  test('every service CTA is a real, working link', async ({ page }) => {
    await openReduced(page);
    for (const service of SERVICES) {
      const cta = page.locator(`#qx-hero-static a[href="${service.cta.href}"]`);
      await expect(cta).toHaveCount(1);
      await expect(cta).toBeVisible();
    }

    // Actually navigate one: `visible` is not `clickable`, and the carousel's own
    // CTAs need `pointer-events-auto` to opt back in past a `pointer-events:
    // none` ancestor. Nothing suppresses events on this path, and this proves it
    // rather than assuming it.
    const first = SERVICES[0]!;
    await page.locator(`#qx-hero-static a[href="${first.cta.href}"]`).click();
    await page.waitForURL(`**${first.cta.href}`);
    expect(new URL(page.url()).pathname).toBe(first.cta.href);
  });

  test('renders no carousel chrome', async ({ page }) => {
    await openReduced(page);
    // The `03 / 06` read head and its segmented rule describe a snapped
    // carousel. There is no read head in a list where everything is on screen —
    // and on this path the list is the five pillars, with no sixth panel and no
    // Launchpad announcement anywhere in the body. The product is reached from
    // the global footer instead; `phase8c-shell.spec.ts` owns that assertion.
    await expect(page.locator('.qx-indicator')).toHaveCount(0);
    await expect(page.locator('.qx-panel')).toHaveCount(0);
    await expect(page.locator('[aria-roledescription="slide"]')).toHaveCount(0);
  });

  test('hydrates without warnings', async ({ page }) => {
    const errors = collectHydrationErrors(page);
    await openReduced(page);
    expect(errors).toEqual([]);
  });

  /**
   * The phase's headline criterion: ONE fallback, not two.
   *
   * Scoped to `#qx-hero-static`'s subtree, not the whole document, and that is a
   * deliberate weakening of BUILD-PLAN's "diff the two HTML outputs". A byte
   * diff of two full documents can never pass — Next injects `<script>` tags,
   * flight data and Suspense comment markers into the JS-enabled one no matter
   * what any of this code does. The rendered content is the part the criterion
   * is actually about, and the part that can rot.
   */
  test('serves the same hero with JavaScript disabled', async ({ page, browser }) => {
    await openReduced(page);
    const withJs = await page.locator('#qx-hero-static').evaluate((el) => el.outerHTML);

    const noJsContext = await browser.newContext({
      javaScriptEnabled: false,
      reducedMotion: 'reduce',
    });
    const noJsPage = await noJsContext.newPage();
    await noJsPage.goto('/');

    const withoutJs = await noJsPage.locator('#qx-hero-static').evaluate((el) => el.outerHTML);
    expect(withoutJs).toBe(withJs);

    // And it is not merely identical — it is complete and visible. Two identical
    // empty strings would pass the line above.
    await expect(noJsPage.locator('#qx-hero-static')).toBeVisible();
    await expect(noJsPage.locator('#qx-hero-static')).toContainText(HERO_COPY.eyebrow);
    for (const service of SERVICES) {
      await expect(
        noJsPage.locator(`#qx-hero-static a[href="${service.cta.href}"]`),
      ).toHaveCount(1);
    }
    await noJsContext.close();
  });

  /**
   * Scripting off AND ordinary motion settings — the case the old CSS rule got
   * wrong on its own, and which `app/page.tsx` used to carve back out with a
   * `<noscript>` override.
   *
   * THAT OVERRIDE IS GONE AND THIS TEST IS WHY IT IS SAFE. The rule is now
   * `html[data-qx-hero='live'] #qx-hero-static { display: none }`, and the
   * attribute is written by `HeroExperience` on its first paint. With no
   * scripting nothing writes it, so the fallback is never hidden — the no-JS
   * path is the DEFAULT now rather than an exception, and this asserts the
   * default is the right one.
   */
  test('keeps the static hero for a no-JS visitor with no motion preference', async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      javaScriptEnabled: false,
      reducedMotion: 'no-preference',
    });
    const p = await ctx.newPage();
    await p.goto('/');
    await expect(p.locator('#qx-hero-static')).toBeVisible();
    await expect(p.locator('#qx-hero-static')).toContainText(HERO_COPY.eyebrow);
    await expect(p.locator('#qx-hero-static .qx-service-row')).toHaveCount(SERVICES.length);
    await ctx.close();
  });
});

/**
 * The motion path, asserted explicitly rather than inherited.
 *
 * Every other spec in this suite has always run here, at the platform default.
 * These are the regression guard for the static path leaking into it: the hero
 * must not be visibly duplicated, and the carousel's own selectors must still
 * address exactly five panels now that five more `ServicePanel`s ship in every
 * response.
 */
test.describe('prefers-reduced-motion: no-preference', () => {
  async function openMotion(page: Page) {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    // Discriminator in the other direction: the motion layer really mounted.
    await expect(page.locator('#qx-hero-root')).toHaveCount(1);
  }

  test('hides the static hero without removing it from the document', async ({ page }) => {
    await openMotion(page);
    await expect(page.locator('#qx-hero-static')).toHaveCount(1);
    // Hidden by a CSS rule and not by an inline style — but the rule's selector
    // is `html[data-qx-hero='live']`, so the hiding is now GATED ON the motion
    // layer having painted rather than on a media query alone.
    //
    // The old comment here read "that is what stops a full-motion visitor seeing
    // a flash of it before hydration", and that intent is deliberately inverted:
    // a visitor seeing the static hero before the motion layer arrives is the
    // POINT. Hidden on the media query alone, the space was neither hero for
    // 1.2-6.3s depending on device, which is what the client reported as the
    // rocket section being blank on a phone.
    //
    // `openMotion` waits for `#qx-hero-root`, which only `HeroExperience`
    // renders and which is the same commit that writes the attribute — so by the
    // time this reads `display`, the swap has happened and `none` is correct.
    const display = await page
      .locator('#qx-hero-static')
      .evaluate((el) => getComputedStyle(el).display);
    expect(display).toBe('none');
  });

  test('leaves the carousel addressing exactly its own panels', async ({ page }) => {
    await openMotion(page);
    // Unscoped, exactly as phase7-carousel.spec.ts counts them. Eleven would mean
    // the stacked variant is wearing the carousel's classes — which would also
    // have `expandTimeline` driving opacity on a list nobody can see.
    //
    // `PANEL_COUNT` (six), not `SERVICES.length` (five): the slider carries the
    // Launchpad panel and the stacked list does not. That difference is the whole
    // point of the two lists, so counting the wrong one here would report the
    // leak this test exists to catch as a pass.
    await expect(page.locator('.qx-panel')).toHaveCount(PANEL_COUNT);
    await expect(page.locator('.qx-panel-cta')).toHaveCount(PANEL_COUNT);
  });

  test('hydrates without warnings', async ({ page }) => {
    const errors = collectHydrationErrors(page);
    await openMotion(page);
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });
});

/**
 * §4's band, and the trap that makes "we respect reduced motion" a lie.
 *
 * `app/globals.css` sets `animation-duration: 0.01ms !important` on everything
 * under `reduce`. For a fade that is a fade removed; for a marquee it is the
 * animation RUNNING TO COMPLETION instantly and parking at `translate3d(-50%)` —
 * a band permanently scrolled to its halfway point, with the first three sectors
 * off-screen to the left and no way to reach them. It looks like a layout bug,
 * it is a motion bug, and it passes any test that only asserts "nothing is
 * animating". So this asserts the TRANSFORM, which is the thing that was wrong.
 */
test.describe('the trust strip under reduce', () => {
  test('is a static, centred list — not a band parked mid-loop', async ({ page }) => {
    await openReduced(page);
    await page.locator('#qx-trust').scrollIntoViewIfNeeded();

    const track = await page.evaluate(() => {
      const el = document.querySelector('.qx-marquee__track');
      if (!el) return null;
      const s = getComputedStyle(el);
      return { name: s.animationName, transform: s.transform, wrap: s.flexWrap };
    });
    expect(track?.name).toBe('none');
    // `none` or the identity matrix — never a translated one.
    expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(track?.transform);
    expect(track?.wrap).toBe('wrap');

    // The loop's second copy is real DOM. Wrapped and static it would be the
    // six sectors listed twice, which reads as a content error.
    const visible = await page.locator('.qx-marquee__item:visible').count();
    expect(visible).toBe(TRUST.sectors.length);
  });
});

/**
 * Toggling the OS setting with the page open must rebuild the hero — an
 * acceptance criterion, and the one that exercises `useGSAP`'s context revert.
 *
 * Unmounting `HeroSection` has to take the ScrollTrigger AND its injected
 * `.pin-spacer` with it. A leaked spacer is the interesting failure: the page
 * would keep ~880vh of empty scroll below a static hero, and nothing else would
 * look wrong.
 */
test.describe('toggling the OS setting live', () => {
  test('rebuilds in both directions, leaving no pin behind', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    await expect(page.locator('#qx-hero-root')).toHaveCount(1);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('#qx-hero-root')).toHaveCount(0);
    await expect(page.locator('.pin-spacer')).toHaveCount(0);
    await expect(page.locator('#qx-hero-static')).toBeVisible();

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(page.locator('#qx-hero-root')).toHaveCount(1);
    await expect(page.locator('#qx-hero-static')).toBeHidden();
  });
});

import { expect, test } from '@playwright/test';
import { WHY_QAVYX, WHO_WE_SERVE, HOME_COPY, TRUST, TRUST_STRIP } from '../../content/home';
import { CONTACT, FOOTER_NAV, LEGAL_LINKS, SITE_INDEX, WHATSAPP } from '../../content/site';

/**
 * Phase 8C — the global shell.
 *
 * THIS SITE HAS NO NAVBAR. Navigation is a section of the homepage, so the
 * navigation tests live under "the site index" and the last of them asserts that
 * no navbar has crept back in.
 *
 * Everything here is server-rendered and asserted against `content/`, never
 * against a string typed into this file. A test that hard-codes the copy is a
 * second source of truth for the copy.
 */

/**
 * The site index is this site's navigation, so these are navigation tests, not
 * content tests: every route reachable, one landmark, keyboard-operable, and the
 * frame's opening actually open.
 */
test.describe('the site index', () => {
  /**
   * The LIVE destinations — `SITE_INDEX.pillars` plus `SITE_INDEX.pages`, counted
   * from the content rather than typed, because the number has been wrong in this
   * file's prose before.
   *
   * Launchpad is deliberately not among them. §2 omits it from the primary
   * navigation and §63 lists it in the FOOTER only, so the index must not carry
   * it — and the test below asserts the other half, that the footer still does.
   * The pair is what keeps the split honest: put the link back in here and this
   * fails; drop it from the footer and the other one does.
   *
   * IT USED TO NAME `#qx-launchpad-note` as the place Launchpad lived instead.
   * That section has been removed, so the sentence that promised it would be
   * "announced under the hero" is gone with it rather than left to rot.
   */
  /**
   * THE FIVE PILLARS, AND NOTHING ELSE. This asserted `pillars` PLUS `pages` —
   * the five company-page tiles at the foot of the section — and the client
   * removed those; the header's menu and the footer carry those routes now.
   *
   * `SITE_INDEX.pages` still exists as a content table and is still checked as
   * one by `site-content.test.ts`, which is what guarantees no destination lives
   * in the footer and nowhere else. It simply is not rendered here any more —
   * the same standing as `SITE_INDEX.launchpad`, which that file already
   * documents at length. The strict count below is what keeps them out.
   */
  test('is the five pillars, and links nothing else', async ({ page }) => {
    await page.goto('/');
    const index = page.locator('#qx-index');
    for (const item of SITE_INDEX.pillars) {
      await expect(index.locator(`a[href="${item.href}"]`)).toContainText(item.label);
    }
    // An index on the homepage must not link to the homepage.
    await expect(index.locator('a[href="/"]')).toHaveCount(0);
    await expect(index.locator(`a[href="${SITE_INDEX.launchpad.href}"]`)).toHaveCount(0);
    for (const item of SITE_INDEX.pages) {
      await expect(index.locator(`a[href="${item.href}"]`)).toHaveCount(0);
    }
    await expect(index.locator('a')).toHaveCount(SITE_INDEX.pillars.length);
  });

  test('is a single named navigation landmark', async ({ page }) => {
    await page.goto('/');
    const named = page.getByRole('navigation', { name: HOME_COPY.indexHeading });
    await expect(named).toHaveCount(1);
  });

  /**
   * The whole point of the section. `.qx-open-frame` masks the bottom-right
   * corner out of the border, so the frame reads as the Q rather than as a
   * rectangle. If the mask fails to apply — a token renamed, a slab collapsed —
   * the border simply closes and nothing else breaks, which is exactly the kind
   * of silent regression a test has to catch.
   *
   * The mask is the UNION of two slabs, one short of the bottom by the gap's
   * height and one short of the right by its width — NOT the old
   * `mask-composite: exclude` subtraction. Exclude left a faint green seam of
   * the subtracted border inside the gap on every DOM frame (the client's
   * "small tiny green part"); see the docblock in `styles/frame.css`.
   *
   * FOUR PROPERTIES CARRY THE UNION, and this test reads all four, because three
   * of the four fail SILENTLY — the frame still renders, just not as the mark:
   *
   * - `mask-size`   — the two slabs. Falls back to `auto` if a token dies, and
   *                   `auto` on a gradient is the full box: corner closes.
   * - `mask-repeat` — STRICTLY REQUIRED and its correct value is not the initial
   *                   one. Each slab is smaller than the box on one axis, so
   *                   under `repeat` either slab alone tiles to cover the whole
   *                   box and the opening vanishes. Under the OLD construction
   *                   this property was nearly inert (layer 1 was `100% 100%`),
   *                   which is why it was never asserted before and must be now.
   * - `mask-position` — both slabs anchor at `0 0`. Leave the old rule's
   *                   `100% 100%` on layer 2 and the opening moves to the
   *                   BOTTOM-LEFT: the mark drawn wrong-handed, site-wide.
   * - `mask-composite` — must be `add`. See the note at the assertion.
   */
  test('wears the mark: the frame is open at the bottom-right', async ({ page }) => {
    await page.goto('/');
    const mask = await page.evaluate(() => {
      const el = document.querySelector('#qx-index .qx-open-frame');
      if (!el) return null;
      const s = getComputedStyle(el, '::before');
      /**
       * Split on the commas BETWEEN mask layers, not on the ones inside
       * `min(19.8%, 240px)`. A plain `.split(',')` reports four layers for two
       * and passes or fails for the wrong reason.
       */
      const layers = (value: string) => {
        const out: string[] = [];
        let depth = 0;
        let current = '';
        for (const ch of value) {
          if (ch === '(') depth++;
          else if (ch === ')') depth--;
          if (ch === ',' && depth === 0) {
            out.push(current.trim());
            current = '';
          } else current += ch;
        }
        if (current.trim()) out.push(current.trim());
        return out;
      };
      return {
        composite: layers(s.maskComposite || s.webkitMaskComposite),
        sizes: layers(s.maskSize || s.webkitMaskSize),
        repeat: layers(s.maskRepeat || s.webkitMaskRepeat),
        position: layers(s.maskPosition || s.webkitMaskPosition),
        radius: s.borderRadius,
        width: s.borderTopWidth,
      };
    });

    expect(mask).not.toBeNull();
    // Two slabs, each full on one axis and short of the other by the gap —
    // their union is the box minus the bottom-right rectangle. Anchored on the
    // AXIS each slab is full on, so a construction that put the width's cut on
    // the height's slab cannot satisfy both.
    expect(mask!.sizes).toHaveLength(2);
    expect(mask!.sizes[0]).toMatch(/^100% calc\(100% - .+\)$/);
    expect(mask!.sizes[1]).toMatch(/^calc\(100% - .+\) 100%$/);

    // Neither slab may tile. `repeat` is the INITIAL value, so losing these two
    // declarations is a plausible tidy-up, and either slab tiling alone closes
    // the corner with every other assertion here still green.
    expect(mask!.repeat).toEqual(['no-repeat', 'no-repeat']);

    // Both slabs anchor top-left. Layer 2 at `100% 100%` — the value the old
    // construction used — mirrors the opening onto the bottom-left corner.
    expect(mask!.position).toEqual(['0px 0px', '0px 0px']);

    // POSITIVE, not `not.toMatch(/exclude|xor/)`. A negative only rules out the
    // two values that were here before: `intersect` leaves just the slabs'
    // overlap (the top-left rectangle), deleting the whole right and bottom
    // edges, and sails through a negative assertion. Union is the invariant, so
    // union is what gets asserted.
    expect(mask!.composite.length).toBeGreaterThan(0);
    for (const layer of mask!.composite) expect(layer).toBe('add');

    // A real border, not a background trick, and a real corner radius.
    expect(parseFloat(mask!.width)).toBeGreaterThan(0);
    expect(parseFloat(mask!.radius)).toBeGreaterThan(0);
  });

  /**
   * The opening is sized from the mark's own measured proportions.
   *
   * This asserts the CSS RESOLVES the tokens — a dead `var()` makes the whole
   * `calc()` invalid, `mask-size` falls back to `auto`, the slab covers the full
   * box and the corner silently closes into an ordinary rounded rectangle. It
   * does not re-check the numbers against `motion/geometry.ts`;
   * `tests/unit/frame-path.test.ts` owns that, and Chrome reports `min()`
   * unevaluated in computed style anyway, so there is no resolved pixel value to
   * read here.
   */
  test('sizes the opening from the mark, not from nothing', async ({ page }) => {
    await page.goto('/');
    const slabs = await page.evaluate(() => {
      const el = document.querySelector('#qx-index .qx-open-frame')!;
      const size = getComputedStyle(el, '::before').maskSize;
      // Split on the commas BETWEEN layers, not the ones inside `min(...)`.
      const out: string[] = [];
      let depth = 0;
      let current = '';
      for (const ch of size) {
        if (ch === '(') depth++;
        else if (ch === ')') depth--;
        if (ch === ',' && depth === 0) {
          out.push(current.trim());
          current = '';
        } else current += ch;
      }
      if (current.trim()) out.push(current.trim());
      return out;
    });
    expect(slabs).toHaveLength(2);
    for (const slab of slabs) {
      // The gap token resolved inside the calc — not `auto`, not a full box.
      expect(slab).toMatch(/calc\(100% - min\(/);
      expect(slab).not.toContain('auto');
      // A slab that covers 100% of BOTH axes has lost its cut and closes the
      // corner on that side.
      expect(slab).not.toBe('100% 100%');
    }
  });

  /**
   * A MOUSE test, and it is not redundant with the keyboard one below.
   *
   * `#qx-stage` is `position: fixed` across the whole viewport for the whole
   * document, so before it was given `pointer-events: none` it sat on top of
   * every section under the pin and ate their clicks. Keyboard focus and
   * `toBeVisible()` both passed the entire time — focus does not hit-test, and
   * the links really were visible, just underneath something. Only an actual
   * click finds it, which is why this test exists as well as that one.
   */
  test('every row can be clicked, not merely focused', async ({ page }) => {
    await page.goto('/');
    const first = SITE_INDEX.pillars[0]!;
    await page.locator(`#qx-index a[href="${first.href}"]`).click();
    await page.waitForURL(`**${first.href}`);
    expect(new URL(page.url()).pathname).toBe(first.href);
  });

  test('nothing fixed covers the sections below the pin', async ({ page }) => {
    await page.goto('/');
    const blocking = await page.evaluate(() =>
      ['qx-stage', 'qx-ink-field']
        .map((id) => document.getElementById(id))
        .filter((el): el is HTMLElement => !!el)
        .filter((el) => getComputedStyle(el).pointerEvents !== 'none')
        .map((el) => el.id),
    );
    expect(blocking).toEqual([]);
  });

  test('every row is reachable and operable by keyboard', async ({ page }) => {
    await page.goto('/');
    const first = page.locator('#qx-index a').first();
    await first.focus();
    await expect(first).toBeFocused();
    const outline = await first.evaluate((el) => getComputedStyle(el).outlineColor);
    expect(outline).toBeTruthy();
  });

  /**
   * Launchpad left the index, and this is the assertion that stops it becoming
   * unreachable on the way out. It is the surviving half of a pair.
   *
   * IT USED TO ASSERT `#qx-launchpad-note`, the centred "LAUNCHPAD — Coming Soon"
   * line under the hero. That section was removed on the client's direction, and
   * with it the only /launchpad link in the homepage BODY on the served HTML —
   * the site index gave its own up to that note (see `SiteIndex`'s decision 3)
   * and never took it back.
   *
   * So this test moved to the route that actually survives, which is §63's own
   * answer: Launchpad is in the FOOTER nav, and the footer is in the root layout,
   * so it is in the initial HTML of every page for every visitor — reduced-motion,
   * JS-disabled and crawler alike. §2 omits Launchpad from the primary navigation
   * and §63 lists it in the footer only; the page now does exactly that.
   *
   * DELETING THIS TEST RATHER THAN MOVING IT WOULD HAVE BEEN THE DANGEROUS EDIT.
   * The index test above asserts /launchpad has count 0 there, and on its own
   * that locks the homepage into never linking the product while nothing checks
   * it is linked anywhere. The pair has to stay a pair.
   */
  test('keeps Launchpad reachable from the footer, not the index', async ({
    page,
    request,
  }) => {
    await page.goto('/');
    const link = page.locator(`#qx-footer nav a[href="${SITE_INDEX.launchpad.href}"]`);
    await expect(link).toHaveCount(1);
    await expect(link).toHaveText(SITE_INDEX.launchpad.label);

    // And exactly once in the SERVED HTML — the other half of the split, checked
    // from this side too so neither test can drift alone.
    //
    // Raw markup rather than a `main a[href=...]` locator, and the reason is not
    // fussiness: on the motion path the carousel's sixth panel is also a
    // /launchpad link and it IS inside <main> (`HeroMount` at `#qx-hero-reserve`).
    // A DOM count would therefore race the lazy motion mount — 0 before it lands,
    // 1 after — and pass or fail on timing. The served HTML has no carousel in it
    // at all, so it is the one view where "the body does not link Launchpad" is a
    // stable fact, and it is also precisely the view a reduced-motion, JS-disabled
    // or crawling visitor gets.
    const raw = await (await request.get('/')).text();
    const hrefs = raw.match(new RegExp(`href="${SITE_INDEX.launchpad.href}"`, 'g')) ?? [];
    expect(hrefs, 'served HTML must link /launchpad exactly once, in the footer').toHaveLength(
      1,
    );
  });

  /**
   * THIS TEST USED TO ASSERT `#qx-nav` DID NOT EXIST, and the header that now
   * exists is why it does not any more. What it was protecting is intact and is
   * what it asserts instead: no LINK LIST above the fold.
   *
   * The distinction is the whole point of the header's design. It carries three
   * controls — the mark (home), WhatsApp, and a button — and the eleven routes
   * are behind the button, so the homepage's site index is still the only place
   * a visitor reads the site's navigation as a list. A `<nav>` appearing inside
   * `#qx-nav`, or a third link, is the old navbar coming back and fails here.
   *
   * The panel's own `<nav>` is not inside `#qx-nav`: it is a sibling, because a
   * `backdrop-filter` on the bar makes it a containing block for the fixed panel.
   * Scoping this to `#qx-nav` is therefore doing real work rather than being
   * incidentally narrow.
   */
  test('puts controls above the fold and no link list', async ({ page }) => {
    await page.goto('/');
    const bar = page.locator('#qx-nav');
    await expect(bar).toHaveCount(1);
    // TWO anchors on the HOMEPAGE, and NEITHER is a route. One leaves for
    // WhatsApp, the other is the no-JS opener pointing at the panel's own
    // fragment — see `lib/menu.ts`. A third, or any href that is a route, is the
    // navigation bar coming back.
    //
    // THE MARK IS NOT A LINK HERE, on the client's direction. It linked to `/`
    // from every route including this one, where clicking it threw the reader
    // ~10,500px backwards into the pinned intro with no transition — reported as
    // the page jumping and looking broken. It is still a link everywhere else,
    // which the test below this one asserts; `SiteHeader` has the reasoning.
    await expect(bar.locator('a')).toHaveCount(2);
    await expect(bar.locator('a[href="/"]')).toHaveCount(0);
    await expect(bar.locator('a[href^="https://wa.me/"]')).toHaveCount(1);
    await expect(bar.locator('a[href="#qx-menu-panel"]')).toHaveCount(1);
    await expect(bar.locator('nav')).toHaveCount(0);
    await expect(bar.locator('#qx-menu-toggle')).toHaveCount(1);
    // With scripting the fallback opener is off and the button is on. Exactly
    // one control on screen, and never the wrong one.
    //
    // ASSERTED AS `display`, NOT `toBeVisible()`, BECAUSE OF THE DEFERRED BAR.
    // On `/` the header starts above the top edge with `visibility: hidden`
    // (`qx-header--deferred` + `data-qx-nav-defer`, see `lib/nav-reveal.ts`):
    // the bar arrives as the logo hands off, rather than being painted under the
    // hero from the first frame. `toBeVisible()` therefore fails for BOTH
    // openers here, which says nothing about the thing this test is named for.
    //
    // The claim is which of the two controls is ENABLED — `.qx-menu-nojs` off
    // and `.qx-menu-js` on, switched by `data-qx-menu-js` in `styles/menu.css`
    // — and `display` is exactly that claim, independent of whether the bar it
    // sits in has been revealed yet. `nav-reveal` owns the reveal and
    // `site-header.test.ts` covers it.
    const display = (sel: string) =>
      bar.locator(sel).evaluate((el) => getComputedStyle(el).display);
    expect(await display('#qx-menu-open')).toBe('none');
    expect(await display('#qx-menu-toggle')).not.toBe('none');
  });

  /**
   * THE OTHER HALF OF THE RULE, and the reason the count above is not simply a
   * loosened assertion.
   *
   * The mark is inert on `/` because you are already there. Everywhere else it
   * is the way home, and that is the half a careless "fix" to the homepage count
   * would silently take with it — an inert logo on a pillar page is a dead
   * control on every route but one.
   */
  test('keeps the mark a link to home on every route but the homepage', async ({ page }) => {
    for (const path of ['/who-we-are', '/faq', '/launchpad', '/growth-marketing']) {
      await page.goto(path);
      const bar = page.locator('#qx-nav');
      await expect(bar.locator('a[href="/"]'), `${path} should link home`).toHaveCount(1);
      await expect(bar.locator('a'), `${path}`).toHaveCount(3);
    }
  });

  /**
   * AND ON THE HOMEPAGE IT DOES NOT EXIST YET, which is the client's own wording
   * for it ("the pin ends, the nav appears").
   *
   * Document position gets most of the way — `app/page.tsx` renders it after
   * `#qx-hero-reserve`, so a sticky bar would not stick until 1015vh in. That
   * was the first implementation and it was wrong in a way only a browser shows:
   * a sticky element SCROLLS UP THROUGH THE VIEWPORT before it sticks, so for
   * ~800px a full-width bordered row floated in the middle of an empty black
   * screen. `deferred` holds it above the top edge instead.
   *
   * `visibility`, not a pixel assertion: the bar is `position: fixed` now, so it
   * is at y = -77 rather than 8700 down, and "off the top" and "at the top" are
   * a transform apart. Visibility is the state that is actually being claimed —
   * and it is also what keeps the hidden bar out of the tab order.
   */
  test('holds the header hidden until the pin is over', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('#qx-nav');
    await expect(nav).toHaveCount(1);
    await expect(page.locator('#qx-nav-sentinel')).toHaveCount(1);
    expect(await nav.evaluate((el) => getComputedStyle(el).visibility)).toBe('hidden');
    expect(await nav.evaluate((el) => getComputedStyle(el).position)).toBe('fixed');
  });

  /**
   * Closed means out of the tab order and out of the accessibility tree, and
   * `visibility: hidden` is the half of that which needs no script — it is the
   * ONLY half a visitor without JavaScript gets, because `inert` and
   * `aria-hidden` are deliberately not in the served markup (serving them left
   * the `:target` fallback opening a panel nothing could click).
   *
   * So the computed style is asserted first, and the two attributes after, as
   * what the boot script adds on top of it.
   */
  test('serves the menu panel closed', async ({ page }) => {
    await page.goto('/');
    const panel = page.locator('#qx-menu-panel');
    expect(await panel.evaluate((el) => getComputedStyle(el).visibility)).toBe('hidden');
    await expect(panel).toHaveAttribute('aria-hidden', 'true');
    await expect(panel).toHaveAttribute('inert', '');
    await expect(page.locator('#qx-menu-toggle')).toHaveAttribute('aria-expanded', 'false');
  });
});

test.describe('the footer', () => {
  test('carries the eleven footer routes', async ({ page }) => {
    await page.goto('/');
    // Scoped to the footer's <nav>, not the whole footer: the logo is also a
    // link to `/`, so an unscoped `a[href="/"]` matches two elements and trips
    // strict mode. That is the locator being right, not the markup being wrong.
    const nav = page.locator('#qx-footer nav');
    await expect(nav.locator('a')).toHaveCount(FOOTER_NAV.length);
    for (const item of FOOTER_NAV) {
      await expect(nav.locator(`a[href="${item.href}"]`)).toHaveText(item.label);
    }
  });

  test('links the email and the phone number', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator(`#qx-footer a[href="mailto:${CONTACT.email}"]`)).toBeVisible();
    await expect(page.locator('#qx-footer a[href^="tel:"]')).toHaveText(CONTACT.whatsapp);
  });

  /**
   * §2 lists both under Global Elements and §64 gives them routes, so they are
   * linked like every other unbuilt page. They were plain text while the DOCX
   * was the source, which named them but supplied neither content nor a route.
   */
  test('links Privacy Policy and Terms of Service at their documented routes', async ({
    page,
  }) => {
    await page.goto('/');
    for (const link of LEGAL_LINKS) {
      await expect(page.locator(`#qx-footer a[href="${link.href}"]`)).toHaveText(link.label);
    }
  });
});

test.describe('the WhatsApp button', () => {
  test('opens the right chat with the right message', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('a.qx-whatsapp');
    await expect(link).toBeVisible();
    const href = (await link.getAttribute('href')) ?? '';
    expect(href).toBe(
      `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(WHATSAPP.message)}`,
    );
    // Decodes back to the client's own line — catches a double-encode, which is
    // otherwise invisible until someone opens WhatsApp and reads %F0%9F%9A%80.
    expect(decodeURIComponent(new URL(href).searchParams.get('text') ?? '')).toBe(
      WHATSAPP.message,
    );
    await expect(link).toHaveAttribute('aria-label', WHATSAPP.label);
  });

  /**
   * The draft's own behaviour note: "should not obstruct the mobile CTA button
   * or footer content". The footer reserves the strip; this checks the two
   * rectangles actually miss each other at the bottom of the page.
   */
  test('does not sit on top of the footer text', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => document.getElementById('qx-footer')?.scrollIntoView(false));
    const clash = await page.evaluate(() => {
      const btn = document.querySelector('a.qx-whatsapp')?.getBoundingClientRect();
      const legal = document
        .querySelector('#qx-footer p:last-of-type')
        ?.getBoundingClientRect();
      if (!btn || !legal) return 'missing';
      const overlaps =
        btn.left < legal.right &&
        btn.right > legal.left &&
        btn.top < legal.bottom &&
        btn.bottom > legal.top;
      return overlaps;
    });
    expect(clash).toBe(false);
  });
});

/**
 * §4, and the one thing about it that is not a content assertion: WHERE it is.
 *
 * The draft runs hero → trust strip → The Problem, and the strip spent eight
 * phases built and unrendered because "directly below the hero" is a position
 * inside a 940vh pin. It is in normal flow now, and the only way that decision
 * regresses quietly is by drifting past §5 — so the order is what this asserts,
 * not the copy (`home-content.test.ts` owns the copy, `trust-strip.test.ts` owns
 * the markup).
 */
test.describe('the trust strip', () => {
  test('is the first thing after the hero, and above The Problem', async ({ page }) => {
    await page.goto('/');
    const strip = page.locator('#qx-trust');
    await expect(strip).toHaveCount(1);
    await expect(strip).toContainText(TRUST_STRIP);

    // `compareDocumentPosition`, not bounding boxes: the hero is pinned, so at
    // scroll 0 the strip's box is a screen-height of pin below the viewport and
    // every visual above it is `position: fixed` at 0. Only the DOM order is a
    // stable statement about the document's order.
    const order = await page.evaluate(() => {
      const trust = document.querySelector('#qx-trust');
      const problem = document.querySelector('#qx-launch-static');
      if (!trust || !problem) return null;
      return trust.compareDocumentPosition(problem) & Node.DOCUMENT_POSITION_FOLLOWING ? 1 : -1;
    });
    expect(order, '§4 must precede §5 in the document').toBe(1);
  });

  /**
   * The band is 200% of its container by construction and clipped by it. If the
   * clip ever fails — `overflow` dropped, the track escaping its wrapper — the
   * symptom is not a broken marquee, it is a horizontal scrollbar on the whole
   * homepage and a viewport the reader can drag sideways on a phone.
   */
  test('never makes the page scroll sideways', async ({ page }) => {
    await page.goto('/');
    await page.locator('#qx-trust').scrollIntoViewIfNeeded();
    const overflow = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(overflow.scroll).toBeLessThanOrEqual(overflow.client);
  });

  /**
   * The loop translates -50%, so "two copies of the six" is arithmetic and not
   * decoration: one copy scrolls off and leaves an empty band, three wrap a
   * third of the way through. `trust-strip.test.ts` locks the count in the
   * markup; this locks that the CSS the count depends on actually arrived.
   */
  test('runs as a seamless two-copy band', async ({ page }) => {
    await page.goto('/');
    await page.locator('#qx-trust').scrollIntoViewIfNeeded();
    await expect(page.locator('.qx-marquee__item')).toHaveCount(TRUST.sectors.length * 2);

    const track = await page.evaluate(() => {
      const el = document.querySelector('.qx-marquee__track');
      if (!el) return null;
      const s = getComputedStyle(el);
      return {
        name: s.animationName,
        timing: s.animationTimingFunction,
        mode: s.animationIterationCount,
      };
    });
    expect(track?.name).toBe('qx-marquee-run');
    expect(track?.mode).toBe('infinite');
    expect(track?.timing).toBe('linear');
  });

  /**
   * It is not the overlay it used to be. A full-viewport fixed layer sits on top
   * of every section below the pin and eats their clicks — the failure the site
   * index once had, which `toBeVisible()` and keyboard focus both pass.
   */
  test('does not cover the page below it', async ({ page }) => {
    await page.goto('/');
    const boxed = await page.evaluate(() => {
      const el = document.querySelector('#qx-trust');
      if (!el) return null;
      const s = getComputedStyle(el);
      return {
        position: s.position,
        height: el.getBoundingClientRect().height,
        viewport: window.innerHeight,
      };
    });
    expect(boxed?.position).toBe('static');
    expect(boxed!.height).toBeLessThan(boxed!.viewport);
  });
});

test.describe('the homepage closing acts', () => {
  test('renders Why QAVYX in full', async ({ page }) => {
    await page.goto('/');
    const section = page.locator('#qx-why');
    await expect(section.locator('dt')).toHaveCount(WHY_QAVYX.length);
    for (const reason of WHY_QAVYX) await expect(section).toContainText(reason.label);
  });

  test('renders all seven industries', async ({ page }) => {
    await page.goto('/');
    const section = page.locator('#qx-serve');
    await expect(section.locator('li')).toHaveCount(WHO_WE_SERVE.length);
    for (const industry of WHO_WE_SERVE) await expect(section).toContainText(industry);
  });

  test('closes on the client CTA, and never on the draft section label', async ({ page }) => {
    await page.goto('/');
    const section = page.locator('#qx-final-cta');
    await expect(section.locator('h2')).toHaveText(HOME_COPY.ctaHeading);
    await expect(section.locator('a.qx-whatsapp, a[href^="https://wa.me/"]')).toHaveCount(1);
    await expect(page.locator('body')).not.toContainText('CTA BUTTON');
    await expect(page.locator('body')).not.toContainText('Dev/Content note');
  });

  /**
   * All three acts are server-rendered. If any of them ever moves behind the
   * client boundary this fails, which is the early warning for a bundle
   * regression rather than a rendering one.
   */
  test('is in the initial HTML, with no JavaScript involved', async ({ request }) => {
    const raw = await (await request.get('/')).text();
    // Half of this copy contains `&` ("Clinics & Healthcare Brands", "Social &
    // Content"), which React serialises as `&amp;`. Comparing the source strings
    // against raw markup therefore fails on the ampersand and nothing else —
    // which reads as "the section is missing" and is not.
    const html = raw.replaceAll('&amp;', '&');
    expect(html).toContain(HOME_COPY.ctaHeading);
    for (const reason of WHY_QAVYX) expect(html).toContain(reason.label);
    for (const industry of WHO_WE_SERVE) expect(html).toContain(industry);
    expect(html).toContain('id="qx-index"');
    expect(html).toContain('id="qx-footer"');
  });
});

/**
 * WHICH PAGE YOU ARE ON, in both navigations.
 *
 * `lib/route-mark.ts` writes `aria-current="page"` on the entry the visitor is
 * reading; `styles/menu.css` and `app/globals.css` draw it. The rule itself —
 * longest match, on a segment boundary, one winner across both lists — is
 * asserted by running the script in `tests/unit/nav-current.test.ts`, which does
 * not need a browser. What needs one is everything the script is wired INTO, and
 * none of it is visible from the markup:
 *
 *   - a hard load, where the script runs above both navigations and has to wait
 *     for them,
 *   - a client-side navigation, which fires no event and is seen only because
 *     the script wraps `pushState` — the one thing here that depends on how Next
 *     itself moves between routes,
 *   - the Back button,
 *   - and hydration, because the mark is on the anchor before React reaches it.
 *     That is a warning per page load, not a broken page, so nothing fails
 *     without a test that reads the console.
 */
test.describe('the current-page mark', () => {
  const marks = (page: import('@playwright/test').Page) =>
    page.evaluate(() => ({
      menu: [...document.querySelectorAll('#qx-menu-panel [aria-current="page"]')].map((a) =>
        a.getAttribute('href'),
      ),
      footer: [...document.querySelectorAll('#qx-footer [aria-current="page"]')].map((a) =>
        a.getAttribute('href'),
      ),
    }));

  test('lights one entry in each list on a hard load', async ({ page }) => {
    await page.goto('/services');
    expect(await marks(page)).toEqual({ menu: ['/services'], footer: ['/services'] });
  });

  /**
   * The footer carries `/launchpad` and the menu's shortlist does not, so this
   * is the case that proves the winner is one match applied to both lists rather
   * than each list picking its own nearest entry. It is also the segment-boundary
   * case: `/launchpad` begins with `/launch`, which is a different page.
   */
  test('lights a route only where it is actually offered', async ({ page }) => {
    await page.goto('/launchpad');
    expect(await marks(page)).toEqual({ menu: [], footer: ['/launchpad'] });
  });

  /**
   * THE ONE THAT DEPENDS ON NEXT. A soft navigation changes `location` without
   * firing an event, and the footer is on screen throughout — so a mark that
   * only ran on load would leave the previous page lit under the visitor's eyes.
   */
  test('follows a client-side navigation, and the Back button', async ({ page }) => {
    await page.goto('/faq');
    expect(await marks(page)).toEqual({ menu: ['/faq'], footer: ['/faq'] });

    await page.locator('#qx-menu-toggle').click();
    await page.locator('#qx-menu-panel a[href="/who-we-are"]').click();
    await page.waitForURL('**/who-we-are');
    await expect.poll(async () => (await marks(page)).footer).toEqual(['/who-we-are']);
    expect((await marks(page)).menu).toEqual(['/who-we-are']);

    await page.goBack();
    await page.waitForURL('**/faq');
    await expect.poll(async () => (await marks(page)).footer).toEqual(['/faq']);
  });

  /**
   * The mark lands before React hydrates — DOMContentLoaded beats the client
   * bundle — so every marked anchor carries `suppressHydrationWarning`. Without
   * it React reports an attribute the server did not render, on every page load,
   * and the page still works, which is exactly why nothing else would catch it.
   */
  test('hydrates without complaining about the attribute it added', async ({ page }) => {
    const noise: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error' || m.type() === 'warning') noise.push(m.text());
    });
    page.on('pageerror', (e) => noise.push(e.message));
    await page.goto('/who-we-are');
    await expect.poll(async () => (await marks(page)).footer).toEqual(['/who-we-are']);
    expect(noise.join('\n')).toBe('');
  });
});

/**
 * ONE CONTROL OPENS AND CLOSES THE MENU.
 *
 * The button has animated Menu→Close and +→× since it was built, and for
 * several phases that was a lie: `styles/menu.css` gave the panel the full
 * viewport height, so it covered the bar and the toggle under it. A second close
 * control had to be drawn inside the sheet, a few pixels from the X nothing
 * could click, and the client saw both.
 *
 * The panel starts at `--qx-nav-h` now. These are the measurements that hold
 * that down — every one of them needs a real viewport and none is visible from
 * the markup.
 */
test.describe('the menu toggle, opening and closing', () => {
  /**
   * THE MEASUREMENT THAT CREATED THE SECOND CLOSE BUTTON, inverted.
   *
   * `elementFromPoint` over the button returned the sheet at 390px and at
   * 1440px — the panel is the whole screen on one and a right-hand column
   * sitting exactly under the toggle on the other, because the header's row is
   * `max-w-[var(--qx-shell)]` and the panel is pinned to the same right edge.
   * Both widths are asserted; passing one and failing the other is the state
   * this shipped in.
   */
  for (const [width, height] of [
    [390, 844],
    [1440, 900],
  ] as const) {
    test(`leaves the toggle hit-testable over the open panel at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/services');
      await page.locator('#qx-menu-toggle').click();
      await expect(page.locator('#qx-menu-panel')).toHaveAttribute('aria-hidden', 'false');

      const onTop = await page.evaluate(() => {
        const t = document.getElementById('qx-menu-toggle')!;
        const r = t.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return !!hit?.closest('#qx-menu-toggle');
      });
      expect(onTop, 'the open panel must not cover the control that closes it').toBe(true);

      // And the click itself, which is the thing a visitor does.
      await page.locator('#qx-menu-toggle').click();
      await expect(page.locator('#qx-menu-panel')).toHaveAttribute('aria-hidden', 'true');
      await expect(page.locator('#qx-menu-toggle')).toHaveAttribute('aria-expanded', 'false');
    });
  }

  /**
   * The panel's top edge meets the bar's bottom. Asserted as a relationship
   * rather than as a number, because `--qx-nav-h` is derived from the control's
   * own target size and the assertion has to survive that changing.
   *
   * The tolerance is the bar's own hairline: `--qx-nav-h` measures the row
   * inside the border, so the panel starts one stroke above the header's outer
   * edge and the rule draws over it. That is deliberate — a gap would show the
   * locked page through it.
   */
  test('hangs the panel from the header rather than over it', async ({ page }) => {
    await page.goto('/services');
    await page.locator('#qx-menu-toggle').click();
    const gap = await page.evaluate(() => {
      const nav = document.getElementById('qx-nav')!.getBoundingClientRect();
      const panel = document.getElementById('qx-menu-panel')!.getBoundingClientRect();
      return { delta: panel.top - nav.bottom, panelBottom: panel.bottom, vh: innerHeight };
    });
    expect(gap.delta).toBeLessThanOrEqual(0);
    expect(gap.delta).toBeGreaterThan(-4);
    // Still full-height below the bar.
    expect(Math.round(gap.panelBottom)).toBe(Math.round(gap.vh));
  });

  /**
   * The in-panel close control is the `:target` path's only exit and nobody
   * else's, so with scripting it must not be on screen — that is the whole of
   * what the client asked for. `display: none` and not removed: one markup, two
   * worlds, no second component.
   */
  test('shows no second close control to a visitor with scripting', async ({ page }) => {
    await page.goto('/services');
    await page.locator('#qx-menu-toggle').click();
    const close = page.locator('#qx-menu-close');
    await expect(close).toHaveCount(1);
    await expect(close).toBeHidden();
    // One X on screen, and it is the toggle's.
    await expect(page.locator('#qx-menu-panel .qx-menu-toggle__bar:visible')).toHaveCount(0);
  });
});

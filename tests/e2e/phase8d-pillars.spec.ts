import { expect, test } from '@playwright/test';
import { PENDING_CALENDLY, PILLAR_PAGES, sectionAnchor } from '../../content/pillars';
import { SERVICES } from '../../content/services';
import { CONTACT, FOOTER_NAV, ORGANISATION } from '../../content/site';

/**
 * Phase 8D — the five pillar pages.
 *
 * Everything is asserted against `content/pillars.ts`, never against a string
 * typed into this file. A test that hard-codes the copy is a second source of
 * truth for the copy, and these five pages are almost entirely copy.
 *
 * These routes are static server components with no pin, no Lenis and no
 * scrubbed timeline, so none of the scroll machinery in the other specs applies
 * — `goto` and assert. If a test here ever needs `scrubTo`, something has been
 * built on the wrong page.
 */

/**
 * §1's Important Implementation Rule, plus the cover block above it. Kept in step
 * with the list in `tests/unit/pillar-content.test.ts`, which checks the same
 * vocabulary against the content module; this one checks what actually rendered,
 * which also covers anything a component hard-codes.
 */
const FORBIDDEN = [
  'dev/content note',
  'development note',
  'content note',
  'cta button',
  'document purpose',
  'website content',
  'design handoff',
  'handoff',
  'external link',
  'to be provided',
  'calendly',
];

for (const pillar of PILLAR_PAGES) {
  test.describe(`/${pillar.slug}`, () => {
    test("renders the client's copy, in the document's order", async ({ page }) => {
      const response = await page.goto(`/${pillar.slug}`);
      expect(response?.status()).toBe(200);

      // The <h1> is the client's page title, not the pillar's name — the name is
      // the eyebrow above it (and on Build & Scale, where §30's title IS the
      // name, there is no eyebrow rather than the words twice).
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveText(pillar.pageTitle);

      // The sections, in order, as real headings.
      await expect(page.locator('article h2')).toHaveText(
        pillar.sections.map((section) => section.name),
      );

      // `innerText`, not `textContent`: it is the RENDERED text, so a string
      // present in the DOM but hidden fails here. The cost is that it also
      // applies `text-transform`, which is why the list labels — the only
      // CSS-uppercased strings on the page — are compared case-insensitively.
      // Everything else is asserted exactly.
      const text = await page.locator('article').innerText();
      for (const paragraph of pillar.intro) expect(text).toContain(paragraph);
      for (const section of pillar.sections) {
        if (section.headline) expect(text).toContain(section.headline);
        expect(text).toContain(section.description);
        for (const list of section.lists) {
          expect(text.toLowerCase()).toContain(list.label.toLowerCase());
          for (const item of list.items) expect(text).toContain(item);
        }
      }
    });

    test('carries its own metadata, OG card and structured data', async ({ page }) => {
      await page.goto(`/${pillar.slug}`);
      const description = pillar.intro.join(' ');
      const fullTitle = `${pillar.label} — ${ORGANISATION.name}`;
      const url = `https://qavyx.com/${pillar.slug}`;

      await expect(page).toHaveTitle(fullTitle);
      const content = (selector: string) =>
        page.locator(selector).first().getAttribute('content');
      expect(await content('meta[name="description"]')).toBe(description);
      expect(await content('meta[property="og:title"]')).toBe(fullTitle);
      expect(await content('meta[property="og:description"]')).toBe(description);
      // Relative in `lib/seo.ts`; absolute here only because `metadataBase` is
      // set. Drop that and Next silently omits og:url.
      expect(await content('meta[property="og:url"]')).toBe(url);
      expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe(url);

      const graph = await page
        .locator('script[type="application/ld+json"]')
        .first()
        .textContent();
      const parsed = JSON.parse(graph ?? '') as { '@graph': Array<Record<string, unknown>> };
      // Two nodes. The `BreadcrumbList` left with the visible breadcrumb.
      expect(parsed['@graph'].map((node) => node['@type'])).toEqual([
        'Organization',
        'Service',
      ]);
      const service = parsed['@graph'][1] as {
        url: string;
        hasOfferCatalog: { itemListElement: Array<{ itemOffered: { name: string } }> };
      };
      expect(service.url).toBe(url);
      expect(service.hasOfferCatalog.itemListElement.map((o) => o.itemOffered.name)).toEqual(
        pillar.sections.map((section) => section.name),
      );
    });
  });
}

test.describe('the pillar pages as a set', () => {
  /**
   * The acceptance criterion this phase exists for. The five panel CTAs pointed
   * at `/services/<slug>` and 404'd for the whole of Phases 7–8C; `content/`
   * repointed them, and this is what proves the destinations are now real.
   */
  test('every carousel CTA resolves to a real page', async ({ page }) => {
    for (const service of SERVICES) {
      const response = await page.goto(service.cta.href);
      expect(response?.status(), `${service.cta.href} should exist`).toBe(200);
      // …and to the RIGHT page, not merely to some page.
      await expect(page.locator('h1')).toHaveText(
        PILLAR_PAGES.find((p) => p.slug === service.slug)!.pageTitle,
      );
    }
  });

  test('gives each of the five a distinct title and description', async ({ page }) => {
    const titles = new Set<string>();
    const descriptions = new Set<string>();
    for (const pillar of PILLAR_PAGES) {
      await page.goto(`/${pillar.slug}`);
      titles.add(await page.title());
      descriptions.add(
        (await page.locator('meta[name="description"]').first().getAttribute('content')) ?? '',
      );
    }
    expect(titles.size).toBe(PILLAR_PAGES.length);
    expect(descriptions.size).toBe(PILLAR_PAGES.length);
  });

  /**
   * §1: `Dev/Content Note`, `Development Note`, `CTA BUTTON` and `Content Note`
   * "must not appear as visible website copy". The cover block is the same
   * hazard — "Website Content & Development Handoff" describes the document and
   * reads like a footer line.
   */
  test('shows the visitor nothing that was addressed to the build team', async ({ page }) => {
    for (const pillar of PILLAR_PAGES) {
      await page.goto(`/${pillar.slug}`);
      const body = (await page.locator('body').innerText()).toLowerCase();
      for (const banned of FORBIDDEN) {
        expect(body, `/${pillar.slug} should not show "${banned}"`).not.toContain(banned);
      }
    }
  });

  /**
   * The two Calendly bookings §17 and §40 specify have no URL — §69 lists it
   * among the assets still required. They are filtered out at render rather than
   * shipped as a dead link or a disabled button. If a URL arrives and the kind
   * flips to `route`, this test is the one to delete.
   */
  test('ships no CTA that goes nowhere, and leaks no note about why', async ({ page }) => {
    const pending = PILLAR_PAGES.flatMap((p) => p.ctas).filter((c) => c.kind === 'pending');
    expect(pending.length).toBeGreaterThan(0);

    for (const pillar of PILLAR_PAGES) {
      await page.goto(`/${pillar.slug}`);
      const html = await page.content();
      expect(html).not.toContain(PENDING_CALENDLY);
      const body = await page.locator('body').innerText();
      for (const cta of pending) expect(body).not.toContain(cta.label);
      // No dead links anywhere on the page either.
      await expect(page.locator('a[href="#"], a[href=""]')).toHaveCount(0);
    }
  });

  /**
   * Every page must keep one working way to make contact. §40 gives the Launch
   * page only the fundraising booking, so that page carries `CTA_LABEL`
   * alongside it — §65's site-wide primary, applied rather than invented, and
   * flagged for the client in `content/pillars.ts`.
   */
  test('keeps one working conversion path on every page', async ({ page }) => {
    for (const pillar of PILLAR_PAGES) {
      await page.goto(`/${pillar.slug}`);
      const chat = page.locator(`article a[href^="https://wa.me/${CONTACT.whatsappNumber}"]`);
      await expect(chat, `/${pillar.slug} needs a working CTA`).toHaveCount(1);
    }
  });

  /**
   * §13–§17 are "Step 01".."Step 05". The other four pages are menus, where a
   * number would assert a sequence the client did not write.
   */
  test('numbers Growth Marketing as a process and the rest as menus', async ({ page }) => {
    await page.goto('/growth-marketing');
    await expect(page.locator('article > ol')).toHaveCount(1);
    await expect(page.locator('article > ol > li').first()).toContainText('01');

    for (const pillar of PILLAR_PAGES.filter((p) => !p.ordered)) {
      await page.goto(`/${pillar.slug}`);
      await expect(page.locator('article > ol')).toHaveCount(0);
      await expect(page.locator('article > ul > li')).toHaveCount(pillar.sections.length);
    }
  });

  /** Every labelled list must actually resolve its label, or it has no name. */
  test('names every service list for a screen reader', async ({ page }) => {
    for (const pillar of PILLAR_PAGES) {
      await page.goto(`/${pillar.slug}`);
      const expected = pillar.sections.reduce((n, section) => n + section.lists.length, 0);
      const dangling = await page.evaluate(() =>
        [...document.querySelectorAll('[aria-labelledby]')]
          .map((el) => el.getAttribute('aria-labelledby')!)
          .filter((id) => !document.getElementById(id)),
      );
      expect(dangling, `/${pillar.slug} has unresolved aria-labelledby`).toEqual([]);
      await expect(page.locator('article ul[aria-labelledby]')).toHaveCount(expected);
    }
  });
});

/**
 * THERE IS A HEADER NOW, and this block used to assert there was not.
 *
 * What it was guarding — that an inner route does not grow a bar of navigation
 * links — still holds and is still asserted, one level in: the header is a
 * banner carrying two links and a button, and the routes are behind the button.
 * The footer still carries the full eleven and is still the way out with no
 * JavaScript, which is what makes the menu an enhancement rather than the only
 * exit.
 *
 * The breadcrumb is unchanged and was never the thing at issue: normal flow, not
 * fixed, one route named.
 */
test.describe('navigating an inner route', () => {
  test('has a banner of controls, not a bar of links', async ({ page }) => {
    await page.goto('/growth-marketing');
    const bar = page.locator('#qx-nav');
    await expect(bar).toHaveCount(1);
    // Two links and the no-JS opener; see `phase8c-shell.spec.ts` for the count.
    await expect(bar.locator('a')).toHaveCount(3);
    await expect(bar.locator('a[href="#qx-menu-panel"]')).toHaveCount(1);
    await expect(bar.locator('nav')).toHaveCount(0);
    // The banner IS the header now. The title block inside `<article>` is still
    // not one — per the HTML spec a sectioned `<header>` is a generic element —
    // so this staying at exactly 1 is what says the two have not been confused.
    await expect(page.getByRole('banner')).toHaveCount(1);
    const fixed = await page.evaluate(() =>
      [...document.querySelectorAll('body *')]
        .filter((el) => getComputedStyle(el).position === 'fixed')
        .map((el) => el.id || el.className || el.tagName),
    );
    // The floating WhatsApp button, and the menu panel. The panel is fixed at
    // rest and hidden by `visibility`, which is the pairing that keeps it out of
    // the tab order and out of the way of clicks while it is closed — the fault
    // `#qx-stage` once had on the homepage.
    expect(fixed).toHaveLength(2);
    expect(fixed).toContain('qx-menu-panel');
    expect(fixed.some((f) => f.includes('qx-whatsapp'))).toBe(true);
  });

  /**
   * STICKY AT EVERY WIDTH, on the client's later direction — it was sticky below
   * `md` and static from it for one round. Asserted by scrolling and re-reading
   * the box rather than by the computed `position`, because `position: sticky`
   * on an element whose ancestor clips or scrolls is a sticky element that never
   * sticks, and the computed value says `sticky` either way.
   */
  test('keeps the header pinned to the top at desktop width', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/growth-marketing');
    const header = page.locator('#qx-nav');
    expect((await header.boundingBox())!.y).toBe(0);
    await page.evaluate(() => window.scrollTo(0, 1400));
    expect((await header.boundingBox())!.y).toBe(0);
  });

  /**
   * WHAT A STICKY BAR BREAKS, and the one line that answers it.
   *
   * Every fragment landing on this site — the twenty-four carousel chips, any
   * `#section` a visitor pastes — puts the section's top edge at the viewport's
   * top edge, which is now underneath the header. `app/globals.css` sets
   * `scroll-padding-top` from `--qx-nav-h`; this asserts the consequence rather
   * than the declaration, because the declaration being present proves nothing
   * about whether the arithmetic is right.
   */
  test('lands an anchored section below the header, not behind it', async ({ page }) => {
    const [pillar] = PILLAR_PAGES;
    const anchor = sectionAnchor(pillar!.sections[0]!.name);
    await page.goto(`/${pillar!.slug}#${anchor}`);
    // `lib/anchor-scroll.ts` waits for fonts and two frames, then travels.
    await page.waitForTimeout(2500);
    const clears = await page.evaluate((id) => {
      const section = document.getElementById(id)!.getBoundingClientRect();
      const nav = document.getElementById('qx-nav')!.getBoundingClientRect();
      return { sectionTop: section.top, navBottom: nav.bottom };
    }, anchor);
    expect(clears.sectionTop).toBeGreaterThanOrEqual(clears.navBottom);
  });

  /**
   * A real click, not a focus check. `#qx-stage` is not rendered on these routes
   * at all — but the trap it caused on the homepage (a full-viewport fixed layer
   * eating every click while `toBeVisible()` and keyboard focus both passed) is
   * cheap enough to guard against here too.
   *
   * THIS USED TO WALK HOME FROM THE BREADCRUMB. The client removed it, and the
   * way back moved to the header's mark before it went — so the same journey is
   * asserted through the control that owns it now. What is being protected is
   * that an inner route has a working exit that is not the footer, and it still
   * does; if the header's logo ever stops being a link, this fails.
   */
  test('walks home from the header mark', async ({ page }) => {
    await page.goto('/ai-automation');
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toHaveCount(0);
    await page.locator('#qx-nav a[href="/"]').click();
    await page.waitForURL('**/');
    expect(new URL(page.url()).pathname).toBe('/');
  });

  test('carries the global shell on every pillar route', async ({ page }) => {
    for (const pillar of PILLAR_PAGES) {
      await page.goto(`/${pillar.slug}`);
      await expect(page.locator('#qx-footer nav a')).toHaveCount(FOOTER_NAV.length);
      await expect(page.locator('a.qx-whatsapp')).toBeVisible();
    }
  });

  /** §23's secondary CTA names its own destination: "Destination: Our Projects". */
  test('sends View Our Work to /projects', async ({ page }) => {
    await page.goto('/social-content');
    await expect(page.locator('article a[href="/projects"]')).toHaveText('View Our Work');
  });
});

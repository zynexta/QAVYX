import { expect, test } from '@playwright/test';
import {
  ABOUT,
  CONTACT_FORM_FIELDS,
  CONTACT_FORM_SUBMIT,
  CONTACT_PAGE,
  MISSION,
  TEAM,
  TEAM_HEADING,
  VISION,
  WHO_WE_ARE,
  WHY_CHOOSE,
} from '../../content/company';
import { FAQS } from '../../content/faq';
import { FORM_NOTICE, OPTIONAL_MARKER, REQUIRED_MARKER } from '../../content/forms';
import { HOME_COPY } from '../../content/home';
import {
  EARLY_ACCESS,
  LAUNCHPAD,
  WAITLIST_FIELDS,
  WAITLIST_SUBMIT,
  WAITLIST_SUCCESS,
  WHATS_COMING,
} from '../../content/launchpad';
import { LEGAL_PAGES } from '../../content/legal';
import {
  COMING_SOON,
  INDUSTRIES,
  INDUSTRY_FILTERS,
  PROJECTS,
  PROJECTS_CTA,
  SERVICE_FILTERS,
  TESTIMONIALS_HEADING,
} from '../../content/projects';
import { SERVICES } from '../../content/services';
import {
  ALL_ROUTES,
  CONTACT,
  CONTACT_NAV,
  FOOTER_NAV,
  LEGAL_LINKS,
  SITE_INDEX,
} from '../../content/site';

/**
 * Phase 8D — the routes that are not the homepage and not a pillar.
 *
 * `phase8d-pillars.spec.ts` covers the five that shipped first; this covers the
 * rest. Same doctrine: everything is asserted against `content/`, never against
 * a string typed into this file, because these pages are almost entirely copy
 * and a hard-coded assertion is a second source of truth for it.
 *
 * IT WAS "THE TEN", AND THE COUNTS HAVE BEEN TAKEN OUT OF THE PROSE. §64's
 * sixteen are fourteen: the client folded `/who-we-are/about` and
 * `/who-we-are/team` into their parent. `NEW_ROUTES` below is derived from
 * `ALL_ROUTES` and was always right; the numbers written into these headings
 * were the half that went stale, so they are gone rather than re-typed.
 *
 * All of them are static server components with no pin, no Lenis and no scrubbed
 * timeline — `goto` and assert. Two mount one client island each (the forms),
 * and those tests drive real input rather than inspecting props.
 */

/**
 * §1's Important Implementation Rule and the cover block above it, kept in step
 * with the same list in `phase8d-pillars.spec.ts` and the content tests.
 *
 * "development note" is the one that would actually have shipped: §50 and §56
 * both carry one, and both are on routes this phase built.
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
  'suggested team profile fields',
  'placeholder',
];

/**
 * A control, found by the `name` the content module gives it.
 *
 * NOT `getByLabel`. §52 has both "Name" and "Business Name", so a substring
 * match resolves to two elements and a strict-mode match resolves to none — the
 * accessible name is "Name Required", label text plus the visible marker, which
 * is deliberate. Going in through `name` is unambiguous and, as a bonus, this is
 * the assertion that actually proves the `label for` → `input id` wiring rather
 * than assuming it.
 */
function controlFor(page: import('@playwright/test').Page, field: { id: string }) {
  return page.locator(`form [name="${field.id}"]`);
}

/** The `<label>` bound to a field's control, via its real `for` attribute. */
async function labelFor(page: import('@playwright/test').Page, field: { id: string }) {
  const id = await controlFor(page, field).getAttribute('id');
  expect(id, `${field.id} has no id for its label to point at`).toBeTruthy();
  const label = page.locator(`form label[for="${id}"]`);
  await expect(label, `${field.id} has no label`).toHaveCount(1);
  return label;
}

/** What this phase built — every route in the table except home and the five pillars. */
const NEW_ROUTES = ALL_ROUTES.map((r) => r.path).filter(
  (path) => path !== '/' && !SERVICES.some((service) => service.cta.href === path),
);

test.describe('every route exists', () => {
  test('every route in the table returns 200', async ({ page }) => {
    for (const route of ALL_ROUTES) {
      const response = await page.goto(route.path);
      expect(response?.status(), `${route.path} should exist`).toBe(200);
    }
  });

  /**
   * The acceptance criterion the phase exists for. Nothing in `content/site.ts`
   * may 404 — and only once that holds does `prefetch={false}` come off, which
   * it now has, in one commit rather than one link at a time.
   */
  test('nothing either navigation offers is a dead link', async ({ page }) => {
    await page.goto('/');
    const hrefs = await page.evaluate(() =>
      [...document.querySelectorAll('a[href^="/"]')].map((a) => a.getAttribute('href')!),
    );
    expect(hrefs.length).toBeGreaterThan(FOOTER_NAV.length);
    // THE FRAGMENT IS STRIPPED BEFORE THE REQUEST, and without it this test
    // reports a false 404. `page.goto()` returns `null` — not a response — when
    // the target differs from the current URL only by its hash, because no
    // navigation happens. `response?.status()` is then `undefined`, and the
    // failure prints as "/growth-marketing#weak-system-found should exist",
    // which reads as a missing route and is nothing of the kind: the chips on
    // the carousel link to sections of a pillar page, so the moment two of them
    // point into the same page one of the pair had no navigation to report.
    //
    // What this test is for is that no ROUTE 404s, so the route is what it asks
    // about. Whether the anchors resolve to real sections is a separate claim,
    // and `phase7-carousel.spec.ts` already makes it against the live DOM.
    const routes = new Set([...hrefs].map((href) => href.split('#')[0]!).filter(Boolean));
    for (const href of routes) {
      const response = await page.goto(href);
      expect(response?.status(), `${href} is linked from / and should exist`).toBe(200);
    }
  });

  test('no link on the site prefetches as though its route were missing', async ({ page }) => {
    for (const path of ['/', '/growth-marketing', '/who-we-are']) {
      await page.goto(path);
      // Next renders `prefetch={false}` as no prefetch at all; what this really
      // guards is the opposite mistake — a stray literal left in the markup.
      await expect(page.locator('a[prefetch]')).toHaveCount(0);
    }
  });
});

test.describe('the set', () => {
  test('each carries its own title, description and canonical', async ({ page }) => {
    const titles = new Set<string>();
    const descriptions = new Set<string>();

    for (const path of NEW_ROUTES) {
      await page.goto(path);
      const title = await page.title();
      const description =
        (await page.locator('meta[name="description"]').first().getAttribute('content')) ?? '';
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');

      expect(title, `${path} needs a title`).toContain('QAVYX');
      expect(description.length, `${path} needs a description`).toBeGreaterThan(0);
      expect(canonical).toBe(`https://qavyx.com${path}`);
      titles.add(title);
      descriptions.add(description);
    }

    // Every one distinct: two routes sharing a description is two routes
    // competing for the same search result.
    expect(titles.size).toBe(NEW_ROUTES.length);
    expect(descriptions.size).toBe(NEW_ROUTES.length);
  });

  test('each emits an OG card and a JSON-LD graph with a matching trail', async ({ page }) => {
    for (const path of NEW_ROUTES) {
      await page.goto(path);
      const og = await page.locator('meta[property="og:url"]').first().getAttribute('content');
      expect(og, `${path} og:url`).toBe(`https://qavyx.com${path}`);

      const raw = await page
        .locator('script[type="application/ld+json"]')
        .first()
        .textContent();
      const graph = (JSON.parse(raw ?? '') as { '@graph': Array<Record<string, unknown>> })[
        '@graph'
      ];
      expect(graph[0]?.['@type']).toBe('Organization');

      // THE TRAIL IS GONE FROM BOTH HALVES, and this test used to hold them
      // together: it read the `BreadcrumbList` and compared it, case-insensitively,
      // against the crumbs the page rendered, because structured data describing
      // a trail a visitor never sees is a claim a crawler believes anyway.
      //
      // The client removed the visible breadcrumb, so the rule now points the
      // other way and the assertion is that neither half exists.
      expect(graph.map((node) => node['@type'])).not.toContain('BreadcrumbList');
      await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toHaveCount(0);
    }
  });

  test('shows the visitor nothing that was addressed to the build team', async ({ page }) => {
    for (const path of NEW_ROUTES) {
      await page.goto(path);
      const body = (await page.locator('body').innerText()).toLowerCase();
      for (const banned of FORBIDDEN) {
        expect(body, `${path} should not show "${banned}"`).not.toContain(banned);
      }
    }
  });

  /**
   * "ADDS NO HEADER" MEANS THE PAGE ADDS NONE OF ITS OWN — not that there is no
   * header on screen. This asserted zero `banner`s and zero `body > header`s,
   * which stopped being satisfiable when the shell moved into
   * `app/(site)/layout.tsx`: it renders `<SiteHeader/>` for every route in this
   * set, as a `<header id="qx-nav">` that is a direct child of `<body>` and
   * therefore exactly one `banner`. The bar is how a visitor navigates away
   * from these pages, so its presence is the shell working.
   *
   * The claim worth keeping is that the page underneath contributes no SECOND
   * banner — a per-page masthead competing with the global bar is the mistake
   * this test was written to catch, and it is still caught below.
   */
  test('adds no header, and keeps the shell on every one', async ({ page }) => {
    for (const path of NEW_ROUTES) {
      await page.goto(path);
      await expect(page.getByRole('banner'), `${path}`).toHaveCount(1);
      await expect(page.locator('body > header'), `${path}`).toHaveCount(1);
      await expect(page.locator('body > header'), `${path}`).toHaveAttribute('id', 'qx-nav');
      await expect(page.locator('#qx-footer nav a')).toHaveCount(FOOTER_NAV.length);
      await expect(page.locator('a.qx-whatsapp')).toBeVisible();
    }
  });

  test('gives every page exactly one h1 and no dangling aria references', async ({ page }) => {
    for (const path of NEW_ROUTES) {
      await page.goto(path);
      await expect(page.locator('h1'), `${path}`).toHaveCount(1);
      const dangling = await page.evaluate(() =>
        [...document.querySelectorAll('[aria-labelledby], [aria-describedby]')]
          .flatMap((el) => [
            ...(el.getAttribute('aria-labelledby')?.split(/\s+/) ?? []),
            ...(el.getAttribute('aria-describedby')?.split(/\s+/) ?? []),
          ])
          .filter((id) => id && !document.getElementById(id)),
      );
      expect(dangling, `${path} has unresolved aria references`).toEqual([]);
    }
  });

  test('ships no dead links anywhere', async ({ page }) => {
    for (const path of NEW_ROUTES) {
      await page.goto(path);
      await expect(page.locator('a[href="#"], a[href=""]'), `${path}`).toHaveCount(0);
    }
  });
});

/**
 * `/who-we-are` — §46–§49, and it was a hub in front of them until the client
 * removed the hop.
 *
 * The route used to carry §46's heading and first paragraph over an index of two
 * rows, with the content one click down at `/who-we-are/about`. These tests
 * moved up with the content rather than being deleted, because what they assert
 * — the document's order, §49 unnumbered, the graph — is about §46–§49 and not
 * about which URL they sit at. What is genuinely gone is the hub's own index,
 * and the redirect below is what remains of the child route.
 */
test.describe('/who-we-are', () => {
  test('renders §46 through §49, in the document’s order', async ({ page }) => {
    await page.goto('/who-we-are');
    // The client's line, not the route's name. `WHO_WE_ARE.heading` is what the
    // navigations and the <title> say — asserted in the metadata test above.
    await expect(page.locator('h1')).toHaveText(ABOUT.heading);

    const text = await page.locator('article').innerText();
    for (const paragraph of ABOUT.description) expect(text).toContain(paragraph);
    expect(text).toContain(MISSION.copy);
    expect(text).toContain(VISION.copy);
    for (const reason of WHY_CHOOSE) {
      expect(text).toContain(reason.label);
      expect(text).toContain(reason.body);
    }
  });

  /**
   * THE HUB'S INDEX IS GONE, and both of its rows are asserted absent for
   * different reasons.
   *
   * About was the page you are now standing on, so a link to it would be a link
   * to itself. Contact Us is in the menu, the footer and the homepage's site
   * index already — an index of one, in front of the content, is what the
   * client's direction was about.
   *
   * Team is the third row that was never there: the page is built, switched off
   * and unlinked, and the loss worth recording is that this hub was where its
   * link would have gone when §50's profiles arrive.
   */
  test('carries no section index in front of the content', async ({ page }) => {
    await page.goto('/who-we-are');
    await expect(page.locator('a[href="/who-we-are/about"]')).toHaveCount(0);
    await expect(page.locator(`article a[href="${CONTACT_NAV.href}"]`)).toHaveCount(0);
    await expect(page.locator('a[href="/who-we-are/team"]')).toHaveCount(0);
  });

  /**
   * THE OLD URL WAS INDEXED, so deleting it would have stranded every search
   * result and bookmark pointing at it. 308, not 302: a temporary redirect tells
   * a crawler to keep the old URL and keep checking it.
   */
  test('redirects the old About URL, permanently', async ({ page }) => {
    const response = await page.goto('/who-we-are/about');
    expect(new URL(page.url()).pathname).toBe('/who-we-are');
    expect(response?.status()).toBe(200);
    const chain = response?.request().redirectedFrom();
    expect(chain, '/who-we-are/about should redirect rather than render').not.toBeNull();
    expect((await chain?.response())?.status()).toBe(308);
  });

  /**
   * §49 is five reasons, not five steps. The one numbered list on this site is
   * Growth Marketing's five "Step 01".."Step 05".
   */
  test('does not number §49’s reasons', async ({ page }) => {
    await page.goto('/who-we-are');
    // `article > ol`, a DIRECT child: the breadcrumb is an <ol> too, and it is
    // inside the article. A bare `article ol` matches it and is always 1.
    await expect(page.locator('article > ol')).toHaveCount(0);
    await expect(page.locator('article h3')).toHaveCount(WHY_CHOOSE.length);
  });

  /**
   * STILL AN `AboutPage`, AND NOW AT THE SECTION'S OWN URL. The type followed
   * the content up: §46–§49 is what an `AboutPage` describes, and a graph that
   * called this route a plain `WebPage` because it used to be a hub would be
   * describing the version of the site that no longer exists.
   *
   * Two nodes and no third. This block asserted a `BreadcrumbList` at `graph[2]`
   * while the child route existed, which the trail's removal had already made
   * untrue — the set-wide test twenty lines up asserts no `BreadcrumbList`
   * anywhere in any graph, and these two could not both hold.
   */
  test('is an AboutPage at its own URL, with no trail behind it', async ({ page }) => {
    await page.goto('/who-we-are');
    const raw = await page.locator('script[type="application/ld+json"]').first().textContent();
    const graph = (JSON.parse(raw ?? '') as { '@graph': Array<Record<string, unknown>> })[
      '@graph'
    ];
    expect(graph).toHaveLength(2);
    expect(graph[1]?.['@type']).toBe('AboutPage');
    expect(graph[1]?.['name']).toBe(WHO_WE_ARE.heading);
    expect(graph[1]?.['url']).toBe('https://qavyx.com/who-we-are');
    expect(graph.map((node) => node['@type'])).not.toContain('BreadcrumbList');
  });

  /**
   * WHAT THE BREADCRUMB'S REMOVAL COST, asserted rather than assumed — and it is
   * the menu that pays it back. This used to walk down to About and return
   * through the menu because the child had no link to its own parent; there is
   * no child now, and the return journey is still the thing worth failing on. A
   * page that cannot be left except by the browser's Back button is the fault.
   */
  test('is reachable and re-reachable through the menu', async ({ page }) => {
    await page.goto('/faq');
    await page.locator('#qx-menu-toggle').click();
    await page.locator('#qx-menu-panel a[href="/who-we-are"]').click();
    await page.waitForURL('**/who-we-are');
    expect(new URL(page.url()).pathname).toBe('/who-we-are');
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toHaveCount(0);
  });
});

/**
 * §50 MEET THE TEAM, WHICH IS NOT A PAGE ANY MORE.
 *
 * It was `/who-we-are/team`: built, unlinked and `indexed: false`, with three
 * switches these tests held down together. The client's direction is that the
 * team shows on the about page, so §50 is the closing section of `/who-we-are`
 * and the route is a permanent redirect.
 *
 * What survives is the assertion that actually protected something — no invented
 * people, ever (§66 Rule 05) — plus the redirect and the sitemap, which are the
 * two places a deleted route leaves a mark.
 */
test.describe('§50, on the about page', () => {
  /**
   * `section[aria-labelledby=...]` and not `#qx-team`. `Section` in
   * `components/inner/InnerPage.tsx` spends its `id` prop on the HEADING and on
   * the `aria-labelledby` pointing at it — the `<section>` itself carries no id
   * — so `#qx-team` matches nothing, which is a locator that times out rather
   * than a section that is missing. Measured, not assumed.
   */
  test('renders §50’s real copy and no profiles', async ({ page }) => {
    await page.goto('/who-we-are');
    const team = page.locator('section[aria-labelledby="qx-team-heading"]');
    await expect(team).toHaveCount(1);
    await expect(team.locator('h2')).toHaveText(TEAM_HEADING);
    await expect(team).toContainText(TEAM.heading);
    await expect(team).toContainText(TEAM.description);
    // No grid, no cards, no images — nothing that could be read as a person.
    await expect(team.locator('img')).toHaveCount(0);
    await expect(team.locator('ul')).toHaveCount(0);
  });

  /**
   * A tagline is not a heading. §50's line sits inside the section as copy, so
   * the page's `<h3>`s stay exactly §49's five reasons — which the test in the
   * `/who-we-are` block counts.
   */
  test('adds no heading level of its own', async ({ page }) => {
    await page.goto('/who-we-are');
    await expect(page.locator('section[aria-labelledby="qx-team-heading"] h3')).toHaveCount(0);
  });

  test('redirects its old URL, permanently', async ({ page }) => {
    const response = await page.goto('/who-we-are/team');
    expect(new URL(page.url()).pathname).toBe('/who-we-are');
    const chain = response?.request().redirectedFrom();
    expect(chain, '/who-we-are/team should redirect rather than render').not.toBeNull();
    expect((await chain?.response())?.status()).toBe(308);
  });

  /**
   * NOTHING IS HELD BACK FROM SEARCH ANY MORE, and the sitemap is where that
   * shows. `/who-we-are/team` was the one `indexed: false` route; merging §50
   * into a page that has already earned the claim is what removed the need for
   * it, rather than a decision to start submitting a thin page.
   */
  test('lists every route and neither merged child in the sitemap', async ({ page }) => {
    const sitemap = await page.goto('/sitemap.xml');
    const xml = (await sitemap?.text()) ?? '';
    expect(xml).not.toContain('/who-we-are/team');
    expect(xml).not.toContain('/who-we-are/about');
    expect(ALL_ROUTES.filter((r) => !r.indexed)).toHaveLength(0);
    for (const route of ALL_ROUTES) {
      expect(xml, `${route.path} should be in the sitemap`).toContain(
        `https://qavyx.com${route.path}<`,
      );
    }
  });

  /**
   * `noindex` rather than `Disallow`, which is why this file never needed
   * touching when the one held-back route went away. A `Disallow`ed page is
   * never fetched, so the crawler never reads the `noindex` — and a linked-to
   * disallowed page can still appear as a bare URL. The two look interchangeable
   * and are close to opposites.
   */
  test('robots.txt allows everything and points at the sitemap', async ({ page }) => {
    const response = await page.goto('/robots.txt');
    const body = (await response?.text()) ?? '';
    expect(body).toContain('Allow: /');
    expect(body).toContain('https://qavyx.com/sitemap.xml');
    expect(body).not.toContain('Disallow:');
  });
});

test.describe('/who-we-are/contact', () => {
  test('puts the working channels before the form', async ({ page }) => {
    await page.goto('/who-we-are/contact');
    await expect(page.locator('h1')).toHaveText(CONTACT_PAGE.heading);

    // The channels live in `ContactRail` now, as a `<ul>` — see the note there
    // for why a `<dl>` was the wrong shape once the whole row became a link.
    const details = page.locator('section[aria-labelledby="qx-contact-heading"] ul');
    await expect(details).toContainText(CONTACT.email);
    await expect(details).toContainText(CONTACT.whatsapp);
    await expect(details).toContainText(CONTACT.locations);

    // ORDER MATTERS, AND IT IS DOCUMENT ORDER, NOT A y-COORDINATE.
    //
    // This asserted `detailsY < formY` while the two were stacked cards. They
    // are one two-column section now: at `xl` and above the rail sits BESIDE the
    // form, both in `row-start-1`, so both boxes share a `y` and the old
    // comparison could only ever fail. The property the page actually
    // guarantees — and the one its docblock argues for — is that the channels
    // come FIRST IN THE SOURCE, which is what a screen reader follows and what
    // every viewport under 1280px renders as vertical order.
    const railComesFirst = await page.evaluate(() => {
      const rail = document.querySelector('section[aria-labelledby="qx-contact-heading"] ul');
      const form = document.querySelector('article form');
      if (!rail || !form) return false;
      return Boolean(rail.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(railComesFirst, 'the channels must precede the form in the document').toBe(true);
  });

  test('renders §52’s six fields with real labels and both markers', async ({ page }) => {
    await page.goto('/who-we-are/contact');
    for (const field of CONTACT_FORM_FIELDS) {
      const label = await labelFor(page, field);
      await expect(label, `${field.label} needs a real label`).toContainText(field.label);
      await expect(label).toContainText(field.required ? REQUIRED_MARKER : OPTIONAL_MARKER);
    }
  });

  test('offers §52’s six options and an unanswered state', async ({ page }) => {
    await page.goto('/who-we-are/contact');
    const select = page.locator('form select');
    const options = await select.locator('option').allTextContents();
    const interest = CONTACT_FORM_FIELDS.find((f) => f.kind === 'select');
    // The placeholder plus the document's six.
    expect(options).toHaveLength((interest?.options?.length ?? 0) + 1);
    expect(await select.inputValue()).toBe('');
  });
});

/**
 * Both forms, driven for real. This is the half of §68 that actually runs in
 * production, so it is tested by typing rather than by reading props.
 */
for (const form of [
  {
    path: '/who-we-are/contact',
    submit: CONTACT_FORM_SUBMIT,
    firstField: CONTACT_FORM_FIELDS[0]!,
    emailField: CONTACT_FORM_FIELDS.find((f) => f.kind === 'email')!,
  },
  {
    path: '/launchpad',
    submit: WAITLIST_SUBMIT,
    firstField: WAITLIST_FIELDS[0]!,
    emailField: WAITLIST_FIELDS.find((f) => f.kind === 'email')!,
  },
]) {
  test.describe(`the form on ${form.path}`, () => {
    test('says it is not connected, above the fields', async ({ page }) => {
      await page.goto(form.path);
      const notice = page.locator('form').getByText(FORM_NOTICE.label);
      await expect(notice).toBeVisible();

      const noticeY = (await notice.boundingBox())?.y ?? Infinity;
      const fieldY = (await controlFor(page, form.firstField).boundingBox())?.y ?? 0;
      expect(noticeY, 'the notice must come before the fields').toBeLessThan(fieldY);
    });

    test('disables submit and explains why to a screen reader', async ({ page }) => {
      await page.goto(form.path);
      const button = page.getByRole('button', { name: form.submit });
      await expect(button).toBeDisabled();

      const describedBy = await button.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      await expect(page.locator(`#${describedBy}`)).toContainText(FORM_NOTICE.label);
    });

    test('validates on blur, and clears when corrected', async ({ page }) => {
      await page.goto(form.path);
      const email = controlFor(page, form.emailField);

      // Nothing is shown before the field has been touched.
      await expect(page.locator('form').getByText('does not look like')).toHaveCount(0);

      await email.fill('not-an-address');
      await email.blur();
      await expect(page.locator('form').getByText('does not look like')).toBeVisible();
      await expect(email).toHaveAttribute('aria-invalid', 'true');

      await email.fill('someone@example.com');
      await expect(page.locator('form').getByText('does not look like')).toHaveCount(0);
      await expect(email).not.toHaveAttribute('aria-invalid', 'true');
    });

    /**
     * The form must not navigate. It has no `action`, so a submit would GET the
     * current URL and take a filled form with it.
     */
    test('cannot be submitted by pressing Enter in a field', async ({ page }) => {
      await page.goto(form.path);
      const field = controlFor(page, form.firstField);
      await field.fill('Ada Lovelace');
      await field.press('Enter');
      await page.waitForTimeout(200);
      expect(new URL(page.url()).search).toBe('');
      expect(new URL(page.url()).pathname).toBe(form.path);
      await expect(field).toHaveValue('Ada Lovelace');
    });
  });
}

test.describe('/projects', () => {
  test('renders §53, §57 and §58 — and the Coming Soon state', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.locator('h1')).toHaveText(PROJECTS.heading);

    const text = await page.locator('article').innerText();
    expect(text).toContain(PROJECTS.intro);
    expect(text).toContain(COMING_SOON.line);
    expect(text).toContain(INDUSTRIES.lead);
    for (const industry of INDUSTRIES.items) expect(text).toContain(industry);
    expect(text).toContain(PROJECTS_CTA.heading);
    expect(text).toContain(PROJECTS_CTA.copy);
  });

  /**
   * §54, §55 and §56 are BUILT and switched off — the components exist and
   * return `null` while their lists are empty, the same way `/who-we-are/team`
   * handles its profile grid.
   *
   * This is the half of that pattern the unit tests cannot see: that none of it
   * reaches the page. A filter row over an empty set is a broken control, and
   * §56 forbids presenting its own testimonial as verified.
   */
  test('renders none of the three switched-off sections', async ({ page }) => {
    await page.goto('/projects');
    const text = await page.locator('article').innerText();

    // The filter rows, which are links rather than buttons — so a control count
    // would miss them entirely.
    expect(text).not.toContain(INDUSTRY_FILTERS.heading);
    expect(text).not.toContain(SERVICE_FILTERS.heading);
    await expect(page.locator('article a[href^="?"]')).toHaveCount(0);
    await expect(page.locator('article button, article select, article input')).toHaveCount(0);

    // §55's taxonomy is not §57's, so its distinctive members are the tell that
    // a filter row leaked. §54's nine are §57's nine and legitimately on the
    // page as content.
    for (const service of SERVICE_FILTERS.items) {
      expect(text, `${service} is a filter facet and must not render`).not.toContain(service);
    }

    // §56.
    expect(text).not.toContain(TESTIMONIALS_HEADING);
    expect(text).not.toContain('Working with QAVYX helped us');
    expect(text).not.toContain('⭐');
  });

  /** §59's state is in the filters' place, and goes when they arrive. */
  test('shows the Coming Soon state while there are no case studies', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.getByText(COMING_SOON.label, { exact: true })).toBeVisible();
    await expect(page.getByText(COMING_SOON.line)).toBeVisible();
  });

  /** §59 and §66 Rule 05: nothing on this page may read as a result. */
  test('shows no number a visitor could read as a result', async ({ page }) => {
    await page.goto('/projects');
    const text = await page.locator('article').innerText();
    expect(text).not.toMatch(/\d+\s*%/);
    expect(text).not.toMatch(/[₹$€]\s*\d/);
    expect(text).not.toMatch(/\bROAS\b/i);
  });

  test('keeps one working conversion path', async ({ page }) => {
    await page.goto('/projects');
    await expect(
      page.locator(`article a[href^="https://wa.me/${CONTACT.whatsappNumber}"]`),
    ).toHaveCount(1);
  });
});

test.describe('/services', () => {
  test('indexes the five pillars, each to its own page', async ({ page }) => {
    await page.goto('/services');
    await expect(page.locator('h1')).toHaveText(HOME_COPY.indexHeading);
    for (const service of SERVICES) {
      const link = page.locator(`article a[href="${service.cta.href}"]`);
      await expect(link).toHaveCount(1);
      await expect(link).toContainText(service.title);
      // The row's hook is the pillar's own §8 line, not copy written for it.
      await expect(link).toContainText(service.description);
    }
  });

  /**
   * §72: "The website should not feel like a list of unrelated agency services."
   * Twenty-four names on one page is exactly that; five pillars is the system.
   */
  test('does not flatten into the twenty-four service areas', async ({ page }) => {
    await page.goto('/services');
    // The index's own list. Not `article a[href^="/"]`, which also counts the
    // breadcrumb's link home.
    await expect(page.locator('article ul a')).toHaveCount(SERVICES.length);
  });

  test('describes itself as a collection of the five', async ({ page }) => {
    await page.goto('/services');
    const raw = await page.locator('script[type="application/ld+json"]').first().textContent();
    const graph = (JSON.parse(raw ?? '') as { '@graph': Array<Record<string, unknown>> })[
      '@graph'
    ];
    expect(graph[1]?.['@type']).toBe('CollectionPage');
    const list = (graph[1] as { mainEntity: { itemListElement: Array<{ item: string }> } })
      .mainEntity;
    expect(list.itemListElement.map((i) => i.item)).toEqual(
      SERVICES.map((s) => `https://qavyx.com/${s.slug}#service`),
    );
  });
});

test.describe('/faq', () => {
  test('renders all fourteen questions and answers, in the client’s order', async ({
    page,
  }) => {
    await page.goto('/faq');
    await expect(page.locator('h1')).toHaveText(FAQS[0]!.question);

    // `textContent`, not `innerText`: thirteen of the answers are inside closed
    // <details>, so they are in the DOM and deliberately not rendered.
    const html = (await page.locator('article').textContent()) ?? '';
    for (const faq of FAQS) {
      expect(html, faq.question).toContain(faq.question);
      expect(html, `answer to ${faq.question}`).toContain(faq.answer);
    }

    // The marker used to be two glyphs, `+` and `−`, both present in every
    // summary's textContent with CSS showing one off `[open]`. It is now one
    // empty `aria-hidden` span drawn as two bars (`.qx-plus`), so a summary's
    // text is the question and nothing else. The strip is kept rather than
    // removed: it is what would catch a marker regressing to a text glyph, and
    // it is a no-op against the markup that ships.
    const summaries = await page.locator('article summary').allTextContents();
    expect(summaries.map((s) => s.replace(/[+−\s]+$/, ''))).toEqual(
      FAQS.slice(1).map((f) => f.question),
    );
  });

  /** A `<details>` accordion, so the page ships no client JavaScript for it. */
  test('opens and closes without any JavaScript of ours', async ({ page }) => {
    await page.goto('/faq');
    const second = page.locator('article details').first();
    await expect(second).not.toHaveAttribute('open', '');
    await second.locator('summary').click();
    await expect(second).toHaveAttribute('open', '');
  });

  test('emits all fourteen as a FAQPage', async ({ page }) => {
    await page.goto('/faq');
    const raw = await page.locator('script[type="application/ld+json"]').first().textContent();
    const graph = (JSON.parse(raw ?? '') as { '@graph': Array<Record<string, unknown>> })[
      '@graph'
    ];
    expect(graph[1]?.['@type']).toBe('FAQPage');
    const entity = (graph[1] as { mainEntity: Array<{ name: string }> }).mainEntity;
    expect(entity.map((q) => q.name)).toEqual(FAQS.map((f) => f.question));
  });
});

test.describe('/launchpad', () => {
  test('renders §41 through §43, with the status above the headline', async ({ page }) => {
    await page.goto('/launchpad');
    await expect(page.locator('h1')).toHaveText(LAUNCHPAD.heading);

    const text = await page.locator('article').innerText();
    for (const paragraph of LAUNCHPAD.description) expect(text).toContain(paragraph);
    for (const item of WHATS_COMING.items) expect(text).toContain(item.label);
    for (const paragraph of EARLY_ACCESS.copy) expect(text).toContain(paragraph);
    expect(text).toContain(WHATS_COMING.note);
  });

  /**
   * §42's asterisk without its note is a typo on the most attractive item in the
   * list. The note is joined to the item with `aria-describedby`, so it is
   * announced with it rather than stranded at the bottom.
   */
  test('wires §42’s footnote to the item it qualifies', async ({ page }) => {
    await page.goto('/launchpad');
    const footnoted = WHATS_COMING.items.find((i) => i.footnoted)!;
    const item = page.locator('li', { hasText: footnoted.label }).last();
    const describedBy = await item.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    await expect(page.locator(`#${describedBy}`)).toContainText(WHATS_COMING.note);
  });

  /** §43's CTA has no destination in the document; the form is on this page. */
  test('sends Join the Waitlist to the form on this page', async ({ page }) => {
    await page.goto('/launchpad');
    const cta = page.locator('article a', { hasText: EARLY_ACCESS.cta }).first();
    const href = await cta.getAttribute('href');
    expect(href).toMatch(/^#/);
    await expect(page.locator(href!)).toBeVisible();
  });

  /**
   * §44's success message is in `content/launchpad.ts` and must never reach the
   * page while the form cannot submit — a success state on a form that cannot
   * succeed is the one lie a visitor has no way to detect.
   */
  test('never shows §44’s success message', async ({ page }) => {
    await page.goto('/launchpad');
    const html = await page.content();
    expect(html).not.toContain(WAITLIST_SUCCESS.heading);
    for (const paragraph of WAITLIST_SUCCESS.copy) expect(html).not.toContain(paragraph);
  });

  test('renders §44’s five fields, three required and two optional', async ({ page }) => {
    await page.goto('/launchpad');
    for (const field of WAITLIST_FIELDS) {
      const marker = field.required ? REQUIRED_MARKER : OPTIONAL_MARKER;
      await expect(page.locator('form label', { hasText: field.label })).toContainText(marker);
    }
  });
});

test.describe('the two legal stubs', () => {
  for (const legal of LEGAL_PAGES) {
    test(`/${legal.slug} resolves the footer link with an honest page`, async ({ page }) => {
      const response = await page.goto(`/${legal.slug}`);
      expect(response?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveText(legal.title);

      const text = await page.locator('main').innerText();
      expect(text).toContain(CONTACT.email);
      // The status is stated, not implied by an empty page.
      expect(text.toLowerCase()).toContain('being prepared');
      // And no policy text was invented to fill it.
      expect(text.toLowerCase()).not.toContain('we collect');
      expect(text.toLowerCase()).not.toContain('third party');
    });
  }

  test('are linked from the footer of every page, not printed as plain text', async ({
    page,
  }) => {
    await page.goto('/');
    for (const link of LEGAL_LINKS) {
      expect(link.href).toBeTruthy();
      await expect(page.locator(`#qx-footer a[href="${link.href}"]`)).toHaveText(link.label);
    }
  });
});

/** The one navigation addition, on every page rather than only the homepage. */
test.describe('the global Contact link', () => {
  test('is in the footer everywhere and in the site index', async ({ page }) => {
    await page.goto('/');
    // CHECKED AS A CONTENT TABLE, NOT AS A RENDERED LINK IN `#qx-index`.
    // `SiteIndex` prints the five pillars and nothing else, on purpose — its own
    // comment spells out why: the company pages are one tap away in the header's
    // menu and the footer carries all eleven, so printing them in the index too
    // would be the same destinations twice on the page that indexes them.
    // `SITE_INDEX.pages` stays as a table precisely so it can be checked here
    // (see `site-content.test.ts`, which makes the same distinction), and this
    // asserted against the DOM instead until the index was pared back.
    expect(SITE_INDEX.pages.map((p) => p.href)).toContain(CONTACT_NAV.href);
    expect(SITE_INDEX.pages.find((p) => p.href === CONTACT_NAV.href)?.label).toBe(
      CONTACT_NAV.label,
    );

    for (const path of ['/', '/faq', '/launchpad', '/growth-marketing']) {
      await page.goto(path);
      await expect(
        page.locator(`#qx-footer a[href="${CONTACT_NAV.href}"]`),
        `${path} footer`,
      ).toHaveCount(1);
    }
  });
});
